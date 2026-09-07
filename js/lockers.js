import {
  data,
  fetchSheet,
  getCell,
  anyCellNull,
  driveUrlToThumb,
  makeSocials,
  makeSheetUrl,
  commonInit,
} from "../app.js";

// LOCKERS

// Physical MCLD Banks: 2 Rows, Evens on Top, Odds on Bottom, Higher Numbers on the Left
const LOCKER_SECTIONS = {
  "Floor 1": [
    { start: 100, end: 115 },
    { start: 116, end: 131 },
  ],
  "Floor 2": [
    { start: 200, end: 211 },
    { start: 212, end: 233 },
    { start: 234, end: 249 },
    { start: 250, end: 261 },
    { start: 262, end: 271 },
    { start: 272, end: 279 },
  ],
  "Floor 3": [
    { start: 300, end: 315 },
    { start: 316, end: 337 },
    { start: 338, end: 347 },
  ],
  "Floor 4": [
    { start: 400, end: 415 },
    { start: 416, end: 431 },
    { start: 432, end: 445 },
  ],
};

let visibleFloors = [];
let currentFloorIdx = 0;
let lockerFormTemplate = "";
let lockersReady = false;
let availabilityTimer = null;
let lockerResizeBound = false;
let currentMaxCols = 11;
const AVAILABILITY_POLL_MS = 60000;
const LOCKER_CELL_MAX = 100;

/*
 * Redraws Cards / Floor Grid after Availability Data Changes.
 */
function renderLockers() {
  if (!lockersReady || !data.sets || data.sets.length == 0) return;

  makeLockers();
  if (document.getElementById("locker-detail").style.display != "none") {
    renderFloorLayout();
  }
}

/*
 * Parses a Google Sheets gviz Response into Rows.
 */
function rowsFromGviz(text) {
  return JSON.parse(text.substring(47).slice(0, -2)).table.rows;
}

/*
 * Loads Fresh Taken/Free Data from the Public Lockers Sheet.
 * Bypasses the localStorage Cache and Browser Cache so Assignments Show Up Quickly.
 */
function refreshLockerAvailability() {
  const url = makeSheetUrl("lockers") + "&t=" + Date.now();

  return fetch(url, { cache: "no-store" })
    .then((res) => res.text())
    .then((text) => {
      data.lockers = rowsFromGviz(text);
      lockersReady = true;
      renderLockers();
    })
    .catch((error) => {
      console.error(error);
    });
}

/*
 * Re-Checks Availability So Taken Lockers Update Live.
 */
function startAvailabilityPolling() {
  if (availabilityTimer) clearInterval(availabilityTimer);
  availabilityTimer = setInterval(refreshLockerAvailability, AVAILABILITY_POLL_MS);
}

/*
 * Returns Taken Status for One Locker Number in a Set.
 */
function getLockerTaken(setName, number) {
  for (let i = 0; i < data.lockers.length; i++) {
    if (
      getCell("lockers", i, "set") == setName &&
      Number(getCell("lockers", i, "number")) == number
    ) {
      return getCell("lockers", i, "taken") == true;
    }
  }
  return null;
}

/*
 * Counts Free Lockers in a Set.
 */
function countFreeLockers(setName) {
  let freeCount = 0;
  for (let i = 0; i < data.lockers.length; i++) {
    if (
      getCell("lockers", i, "set") == setName &&
      getCell("lockers", i, "number") != null &&
      getCell("lockers", i, "taken") == false
    ) {
      freeCount++;
    }
  }
  return freeCount;
}

/*
 * Counts How Many Columns a Section Needs (Half the Numbers, Rounded Up).
 */
function sectionColumnCount(start, end) {
  return Math.ceil((end - start + 1) / 2);
}

/*
 * Gap Between Locker Cells. Tighter on Small Screens.
 */
function lockerGapPx() {
  if (window.matchMedia("(max-width: 600px)").matches) return 3;
  if (window.matchMedia("(max-width: 1130px)").matches) return 4;
  return 8;
}

/*
 * Sets a Pixel Cell Size so the Widest Section Fills the Detail Width.
 * Phones Use the Full Fit. Desktop Caps at LOCKER_CELL_MAX so Tiles
 * Stay Large but Do Not Become Huge on Ultrawide Screens.
 */
function fitLockerGrids() {
  const detail = document.getElementById("locker-detail");
  const root = document.querySelector(".locker-sections");
  if (!detail || !root || detail.style.display == "none") return;
  const cols = currentMaxCols;
  const gap = lockerGapPx();
  const styles = getComputedStyle(detail);
  const pad =
    (parseFloat(styles.paddingLeft) || 0) +
    (parseFloat(styles.paddingRight) || 0);
  const width = detail.clientWidth - pad;
  if (width < 20) return;
  const fitted = Math.floor((width - (cols - 1) * gap) / cols);
  const size = window.matchMedia("(max-width: 1130px)").matches
    ? fitted
    : Math.min(LOCKER_CELL_MAX, fitted);
  if (size < 1) return;
  root.style.setProperty("--locker-cols", String(cols));
  root.style.setProperty("--locker-gap", gap + "px");
  root.style.setProperty("--locker-cell-size", size + "px");
}

/*
 * Scrolls the Floor View to Sit Just Below the Fixed Navbar.
 */
function scrollToLockerDetail() {
  const detail = document.getElementById("locker-detail");
  if (!detail) return;
  const header = document.querySelector("header");
  const navH = header ? header.offsetHeight : 65;
  const top =
    window.scrollY + detail.getBoundingClientRect().top - navH - 12;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

/*
 * Re-Fits Grids after Rotate / Resize.
 */
function watchLockerResize() {
  if (lockerResizeBound) return;
  lockerResizeBound = true;
  window.addEventListener("resize", fitLockerGrids);
}

/*
 * Builds a 2-High Grid for One Number Range.
 * Top Row Is Evens Descending; Bottom Row Is Odds Descending.
 * Cells Use a Shared Size so Short Sections Do Not Stretch Wider.
 */
function makeSectionGrid(setName, start, end, floorUnavailable) {
  const evens = [];
  const odds = [];
  for (let n = end; n >= start; n--) {
    if (n % 2 == 0) evens.push(n);
    else odds.push(n);
  }

  const columns = Math.max(evens.length, odds.length);
  let html = `<section class="locker-section">`;
  html += `<h3>Section ${start}–${end}</h3>`;
  html += `<div class="locker-grid" style="--section-cols: ${columns};">`;

  const rows = [evens, odds];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < columns; c++) {
      const number = rows[r][c];
      if (number == null) {
        html += `<div class="locker-cell empty"></div>`;
        continue;
      }

      const taken = getLockerTaken(setName, number);
      let status = "available";
      if (floorUnavailable || taken == null || taken == true) status = "taken";

      html += `<div class="locker-cell ${status}">${number}</div>`;
    }
  }

  html += `</div></section>`;
  return html;
}

/*
 * Renders Floor Overview Cards from the Sets Sheet.
 */
function makeLockers() {
  visibleFloors = [];
  let html = "";

  for (let i = 0; i < data.sets.length; i++) {
    if (
      getCell("sets", i, "name") == null ||
      getCell("sets", i, "show") == false
    ) {
      continue;
    }

    visibleFloors.push(i);
    const name = getCell("sets", i, "name");
    const freeCount = countFreeLockers(name);

    html += `<li class="locker">`;
    html += `<button type="button" class="locker-open" data-set-index="${i}" aria-label="View ${name} lockers">`;

    if (getCell("sets", i, "image") != null) {
      html += `<img class="locker-map" src="${driveUrlToThumb(getCell("sets", i, "image"))}" alt="${name} map">`;
    }

    html += `<h2>${name}</h2>`;
    html += `<div class="locker-card-meta">`;
    if (getCell("sets", i, "location") != null) {
      html += `<span class="info"><i class="fa-solid fa-location-dot"></i>${getCell("sets", i, "location")}</span>`;
    }
    html += `<span class="availability${freeCount == 0 ? " none-left" : freeCount < 5 ? " running-low" : ""}">${freeCount} Available</span>`;
    html += `</div>`;
    html += `<span class="locker-card-cta"><i class="fa-solid fa-table-cells"></i>View Lockers</span>`;
    html += `</button>`;

    if (getCell("sets", i, "unavailable") == true) {
      html += `<div class="unavailable"><i class="fa-solid fa-circle-xmark"></i>Temporarily Unavailable</div>`;
    }

    html += `</li>`;
  }

  document.getElementById("lockers").innerHTML = html;
  bindLockerCards();
}

/*
 * Opens the Numbered Locker Layout for One Floor.
 */
function openFloorLayout(setIndex) {
  currentFloorIdx = visibleFloors.indexOf(setIndex);
  if (currentFloorIdx < 0) currentFloorIdx = 0;
  renderFloorLayout();
  document.getElementById("lockers").style.display = "none";
  const intro = document.querySelector("#lockers-page .below-header");
  if (intro) intro.style.display = "none";
  document.getElementById("locker-detail").style.display = "";
  requestAnimationFrame(() => {
    fitLockerGrids();
    scrollToLockerDetail();
  });
}

/*
 * Returns to the Floor Overview Cards.
 */
function closeFloorLayout() {
  document.getElementById("locker-detail").style.display = "none";
  document.getElementById("lockers").style.display = "";
  const intro = document.querySelector("#lockers-page .below-header");
  if (intro) intro.style.display = "";
}

/*
 * Renders the Active Floor: Section Grids and Floor Switcher.
 */
function renderFloorLayout() {
  const setIndex = visibleFloors[currentFloorIdx];
  const name = getCell("sets", setIndex, "name");
  const floorUnavailable = getCell("sets", setIndex, "unavailable") == true;
  const sections = LOCKER_SECTIONS[name] || [];
  const freeCount = countFreeLockers(name);

  let html = `<div class="locker-detail-bar">`;
  html += `<div class="locker-detail-nav">`;
  html += `<button type="button" class="button" id="locker-back"><i class="fa-solid fa-arrow-left"></i>Back</button>`;
  html += `<div class="floor-switcher">`;
  html += `<button type="button" class="button icon" id="floor-prev" aria-label="Previous floor"${currentFloorIdx == 0 ? " disabled" : ""}><i class="fa-solid fa-chevron-left"></i></button>`;
  html += `<h2>${name} <span>/ ${visibleFloors.length}</span></h2>`;
  html += `<button type="button" class="button icon" id="floor-next" aria-label="Next floor"${currentFloorIdx == visibleFloors.length - 1 ? " disabled" : ""}><i class="fa-solid fa-chevron-right"></i></button>`;
  html += `</div>`;
  html += `</div>`;
  html += `<div class="locker-detail-status">`;
  html += `<span class="availability${freeCount == 0 ? " none-left" : freeCount < 5 ? " running-low" : ""}">${freeCount} Available</span>`;
  html += `</div>`;
  html += `</div>`;

  currentMaxCols = 1;
  for (let i = 0; i < sections.length; i++) {
    const cols = sectionColumnCount(sections[i].start, sections[i].end);
    if (cols > currentMaxCols) currentMaxCols = cols;
  }

  html += `<div class="locker-sections" style="--locker-cols: ${currentMaxCols};">`;
  for (let i = 0; i < sections.length; i++) {
    html += makeSectionGrid(name, sections[i].start, sections[i].end, floorUnavailable);
  }
  html += `</div>`;

  html += `<ul class="locker-legend">`;
  html += `<li><span class="locker-cell available"></span>Available</li>`;
  html += `<li><span class="locker-cell taken"></span>Taken</li>`;
  html += `</ul>`;

  document.getElementById("locker-detail").innerHTML = html;
  bindFloorLayout();
  requestAnimationFrame(fitLockerGrids);
}

/*
 * Binds Click Handlers for Overview Cards.
 */
function bindLockerCards() {
  document.querySelectorAll(".locker-open").forEach((button) => {
    button.addEventListener("click", () => {
      openFloorLayout(Number(button.getAttribute("data-set-index")));
    });
  });
}

/*
 * Binds Back and Floor Switch Clicks on the Detail View.
 */
function bindFloorLayout() {
  document.getElementById("locker-back").addEventListener("click", closeFloorLayout);

  document.getElementById("floor-prev").addEventListener("click", () => {
    if (currentFloorIdx > 0) {
      currentFloorIdx--;
      renderFloorLayout();
    }
  });

  document.getElementById("floor-next").addEventListener("click", () => {
    if (currentFloorIdx < visibleFloors.length - 1) {
      currentFloorIdx++;
      renderFloorLayout();
    }
  });
}

/*
 * Embeds the Locker Form from the Links Sheet Row Named "Locker Form".
 */
function makeLockerForm() {
  for (let i = 0; i < data.links.length; i++) {
    if (anyCellNull("links", i, ["name", "link"]) == true || getCell("links", i, "show") == false) {
      continue;
    }
    const name = String(getCell("links", i, "name")).trim();
    const link = String(getCell("links", i, "link")).trim();
    if (name == "Locker Form") {
      lockerFormTemplate = link;
    }
  }

  if (!lockerFormTemplate) return;
  const frame = document.getElementById("locker-form-frame");
  if (!frame) return;
  let next = lockerFormTemplate;
  if (next.indexOf("/viewform") > -1 && next.indexOf("embedded=") < 0) {
    next += (next.indexOf("?") >= 0 ? "&" : "?") + "embedded=true";
  }
  frame.src = next;
  document.getElementById("locker-form").style.display = "";
}

window.addEventListener("DOMContentLoaded", () => {
  commonInit();
  watchLockerResize();
  fetchSheet("socials", makeSocials);
  fetchSheet("links", () => {
    makeLockerForm();
    refreshLockerAvailability().then(startAvailabilityPolling);
  });
  fetchSheet("sets", renderLockers);
});
