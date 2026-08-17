import {
  data,
  fetchSheet,
  fetchSheets,
  getCell,
  anyCellNull,
  driveUrlToThumb,
  makeSocials,
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
 * Builds a 2-High Grid for One Number Range.
 * Top Row Is Evens Descending; Bottom Row Is Odds Descending.
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
  html += `<h3>${start}–${end}</h3>`;
  html += `<div class="locker-grid" style="grid-template-columns: repeat(${columns}, minmax(0, 1fr));">`;

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
  document.getElementById("locker-detail").style.display = "";
  document.getElementById("locker-detail").scrollIntoView({ behavior: "smooth", block: "start" });
}

/*
 * Returns to the Floor Overview Cards.
 */
function closeFloorLayout() {
  document.getElementById("locker-detail").style.display = "none";
  document.getElementById("lockers").style.display = "";
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
  html += `<button type="button" class="button" id="locker-back"><i class="fa-solid fa-arrow-left"></i>Back</button>`;
  html += `<div class="floor-switcher">`;
  html += `<button type="button" class="button icon" id="floor-prev" aria-label="Previous floor"${currentFloorIdx == 0 ? " disabled" : ""}><i class="fa-solid fa-chevron-left"></i></button>`;
  html += `<h2>${name} <span>/ ${visibleFloors.length}</span></h2>`;
  html += `<button type="button" class="button icon" id="floor-next" aria-label="Next floor"${currentFloorIdx == visibleFloors.length - 1 ? " disabled" : ""}><i class="fa-solid fa-chevron-right"></i></button>`;
  html += `</div>`;
  html += `<span class="availability${freeCount == 0 ? " none-left" : freeCount < 5 ? " running-low" : ""}">${freeCount} Available</span>`;
  html += `</div>`;

  html += `<div class="locker-sections">`;
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
    if (
      anyCellNull("links", i, ["name", "link"]) == true ||
      getCell("links", i, "show") == false ||
      String(getCell("links", i, "name")).trim() != "Locker Form"
    ) {
      continue;
    }

    let formUrl = getCell("links", i, "link");
    if (formUrl.indexOf("/viewform") > -1) {
      formUrl = formUrl.split("?")[0] + "?embedded=true";
    }

    document.getElementById("locker-form-frame").src = formUrl;
    document.getElementById("locker-form").style.display = "";
    break;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  commonInit();
  fetchSheet("socials", makeSocials);
  fetchSheet("links", makeLockerForm);
  fetchSheets(["lockers", "sets"], makeLockers);
});
