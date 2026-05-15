const QUERY = encodeURIComponent("Select *");

const DATABASE_DOC = "15aAzBnPpvBR3ntpgvbLN9WE5ftH6mSTPElIBsFxefk0";
const GAMES_LOG_DOC = "1r8BtslMkYsPrT3gRfWNOGKM8-QjrsfuN8ts8N5JqZXQ";

// ! UPDATE THESE IF COLUMNS ARE REORDERED, SHEET TAB IS RENAMED, OR IS MOVED TO ANOTHER DOC
const SHEETS = {
  events: {
    SHEET: "Events",
    DOC: DATABASE_DOC,
    COLS: [
      "date",
      "start",
      "end",
      "name",
      "location",
      "contacts",
      "rsvp",
      "calendar",
      "instagram",
      "image",
      "show",
    ],
  },
  links: {
    SHEET: "Links",
    DOC: DATABASE_DOC,
    COLS: ["name", "icon_pack", "icon", "link", "show"],
  },
  socials: {
    SHEET: "Socials",
    DOC: DATABASE_DOC,
    COLS: ["link", "icon", "show"],
  },
  gallery: {
    SHEET: "Gallery",
    DOC: DATABASE_DOC,
    COLS: ["collection", "image", "caption", "show"],
  },
  collections: {
    SHEET: "Collections",
    DOC: DATABASE_DOC,
    COLS: ["name", "show"],
  },
  council: {
    SHEET: "Council",
    DOC: DATABASE_DOC,
    COLS: ["year", "name", "position", "photo"],
  },
  positions: {
    SHEET: "Positions",
    DOC: DATABASE_DOC,
    COLS: ["position", "type", "email", "key", "responsibilities", "open"],
  },
  merch: {
    SHEET: "Merch",
    DOC: DATABASE_DOC,
    COLS: ["item", "price", "category", "sizes", "stock", "image", "show"],
  },
  categories: {
    SHEET: "Categories",
    DOC: DATABASE_DOC,
    COLS: ["name", "icon", "show"],
  },
  contacts: {
    SHEET: "Contacts",
    DOC: DATABASE_DOC,
    COLS: ["option", "email", "override", "show"],
  },
  sponsors: {
    SHEET: "Sponsors",
    DOC: DATABASE_DOC,
    COLS: ["name", "link", "logo", "tier", "show"],
  },
  lockers: {
    SHEET: "Lockers",
    DOC: DATABASE_DOC,
    COLS: ["set", "number", "taken"],
  },
  sets: {
    SHEET: "Sets",
    DOC: DATABASE_DOC,
    COLS: [
      "name",
      "location",
      "numbers",
      "size",
      "cost",
      "period",
      "lock",
      "unavailable",
      "direction",
      "count",
      "offset",
      "image",
      "show",
    ],
  },
  matches: {
    SHEET: "Matches",
    DOC: GAMES_LOG_DOC,
    COLS: [
      "timestamp",
      "game",
      "p1_id",
      "p2_id",
      "p3_id",
      "p4_id",
      "winner",
      "p1_points",
      "p2_points",
      "p3_points",
      "p4_points",
      "time",
    ],
  },
  players: {
    SHEET: "Players",
    DOC: GAMES_LOG_DOC,
    COLS: ["id", "name"],
  },
  games: {
    SHEET: "Games",
    DOC: GAMES_LOG_DOC,
    COLS: ["name", "icon", "system", "rounding", "starts", "show"],
  },
  parameters: {
    SHEET: "Parameters",
    DOC: GAMES_LOG_DOC,
    COLS: [
      "game",
      "init_rating",
      "base",
      "divisor",
      "k",
      "interpolation",
      "starts",
    ],
  },
};

// SITE CONFIG — change these to rebrand
const CONFIG = {
  siteNameFull: "UBC ECESS",
  author: "UBC ECESS",
  formFromName: "UBC ECESS Website",
  ogImage: "https://ubcclubmech.ca/media/logos/mech-og.jpg",
  ogImageAlt: "UBC ECESS logo",
  ogImageType: "image/jpeg",
};

const NAV_LINKS = [
  { label: "Home", href: "." },
  { label: "Events", href: "./events" },
  { label: "Council", href: "./council" },
  { label: "Sponsors", href: "./sponsors" },
  { label: "Contact", href: "./contact" },
  { label: "Merch", href: "./merch" },
  { label: "Lockers", href: "./lockers" },
  { label: "Leaderboard", href: "./leaderboard" },
];

let data = {};
fixNullData();

let councilYears = [];
let galleryYears = [];

let playerRatings = {};
let playerNames;

// CONSTANTS

// general
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// animation
const POP_IN_DELAY = 75; // ms
const POP_IN_VARIANCE = 200; // ms
const NAV_DELAY = (POP_IN_DELAY * 2) / 3;

// reloading
const PULL_HEIGHT = 150; // px
const RELOAD_TIME = 400; // ms

// GENERAL

const body = document.querySelector("body");
let fetchedSheets = new Set();

function injectHeader() {
  const header = document.createElement("header");
  header.innerHTML = `
    <div class="logo desktop">
      <img src="media/logos/white.png">
    </div>
    <button class="button icon square" id="open-nav"><i class="fa-solid fa-bars"></i></button>
    <nav id="nav" class="hidden">
      ${NAV_LINKS.map(({ label, href }) => `<a class="button nav" href="${href}">${label}</a>`).join("\n      ")}
    </nav>
    <div id="socials"></div>
  `;
  body.insertBefore(header, body.firstChild);
  header.querySelector("#open-nav").addEventListener("click", toggleNav);
}

function injectMetaTags() {
  const description = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
  const metas = [
    { name: "author", content: CONFIG.author },
    { property: "og:title", content: document.title },
    { property: "og:site_name", content: CONFIG.siteNameFull },
    { property: "og:type", content: "website" },
    { property: "og:description", content: description },
    { property: "og:image", content: CONFIG.ogImage },
    { property: "og:image:alt", content: CONFIG.ogImageAlt },
    { property: "og:image:type", content: CONFIG.ogImageType },
  ];
  for (const attrs of metas) {
    const meta = document.createElement("meta");
    for (const [key, value] of Object.entries(attrs)) meta.setAttribute(key, value);
    document.head.appendChild(meta);
  }
}

async function init() {
  let page = body.getAttribute("id");
  injectMetaTags();
  if (page !== "leaderboard-page") injectHeader();
  document.querySelectorAll('input[name="from_name"]').forEach((el) => {
    el.value = CONFIG.formFromName;
  });
  switch (page) {
    case "home-page":
      fetchSheet("socials", makeSocials);
      fetchSheet("links", makeLinks);
      fetchSheet("positions", () => {
        makeOpenings();
        handleAllTooltips();
      });
      // fetchSheet('sponsors', makeSponsors);
      fetchSheets(["events", "positions"], () => {
        makeEvents(4);
      });
      fetchSheets(["collections", "gallery"], makeGallery);
      break;
    case "events-page":
      fetchSheet("socials", makeSocials);
      fetchSheets(["events", "positions"], () => {
        makeEvents(Number.POSITIVE_INFINITY);
      });
      break;
    case "council-page":
      fetchSheet("socials", makeSocials);
      fetchSheets(["council", "positions"], () => {
        makeYearSelect();
        makeCouncilGrid();
        handleAllTooltips();
      });
      break;
    case "sponsors-page":
      fetchSheet("socials", makeSocials);
      fetchSheets(["contacts", "positions", "sponsors"], makeSponsors);
      break;
    case "merch-page":
      fetchSheet("socials", makeSocials);
      fetchSheets(["merch", "categories"], () => {
        makeMerchCategories();
        makeMerch();
      });
      break;
    case "lockers-page":
      fetchSheet("socials", makeSocials);
      fetchSheets(["lockers", "sets"], makeLockers);
      break;
    case "contact-page":
      fetchSheet("socials", makeSocials);
      fetchSheets(["contacts", "positions"], makeContactOptions);
      break;
    case "leaderboard-page":
      fetchSheets(["games", "players", "matches", "parameters"], () => {
        makeLeaderboardGames();
        setPlayerNames();
        calculatePlayerRatings();
        let currentBoard =
          localStorage.currentBoard != null
            ? localStorage.currentBoard
            : getCell("games", 0, "name");
        try {
          changeLeaderboard(currentBoard);
        } catch (error) {
          changeLeaderboard(getCell("games", 0, "name"));
        }
      });
      break;
    default:
      break;
  }

  setNavDelays();
  addButtonEvents();

  window.addEventListener("resize", function () {
    document.querySelectorAll(":has(>.tooltip)").forEach((el) => {
      handleTooltips(el);
    });
  });
}
window.addEventListener("DOMContentLoaded", init);

function handleAllTooltips() {
  document.querySelectorAll(":has(>.tooltip)").forEach((el) => {
    handleTooltips(el);
  });
}

function addButtonEvents() {
  document.querySelectorAll(".button:has(i)").forEach((el) => {
    el.addEventListener("click", buttonClick(el));
    el.addEventListener("mouseleave", buttonMouseLeave(el));
  });
}

function buttonClick(el) {
  return function () {
    el.classList.add("animating", "mouseover");
    setTimeout(() => {
      el.classList.remove("animating");
    }, 500);
  };
}

function buttonMouseLeave(el) {
  return function () {
    if (el.classList.contains("animating")) {
      setTimeout(() => {
        el.classList.remove("mouseover");
      }, 500);
    } else {
      el.classList.remove("mouseover");
    }
  };
}

function fixNullData() {
  let prefetchedData = {};
  if (localStorage.prefetchedData != null) {
    try {
      prefetchedData = JSON.parse(localStorage.prefetchedData);
    } catch (error) {
      prefetchedData = {};
    }
  }

  Object.keys(SHEETS).forEach((key) => {
    data[key] = [];
  });

  localStorage.prefetchedData = JSON.stringify(prefetchedData);
}

function makeSheetUrl(sheet) {
  return `https://docs.google.com/spreadsheets/d/${SHEETS[sheet].DOC}/gviz/tq?&sheet=${SHEETS[sheet].SHEET}&tq=${QUERY}`;
}

async function fetchSheet(sheet, func = () => {}, afterFetchFunc = () => {}) {
  let prefetchedData = JSON.parse(localStorage.prefetchedData);

  if (prefetchedData[sheet] != null) {
    data[sheet] = prefetchedData[sheet];
    try {
      func();
    } catch {
      // if data is corrupt, fetch
    }
    fetch(makeSheetUrl(sheet))
      .then((res) => res.text())
      .then((rep) => {
        data[sheet] = JSON.parse(rep.substring(47).slice(0, -2)).table.rows;
        afterFetch(sheet, func, afterFetchFunc);
      });
  } else {
    await fetch(makeSheetUrl(sheet))
      .then((res) => res.text())
      .then((rep) => {
        data[sheet] = JSON.parse(rep.substring(47).slice(0, -2)).table.rows;
        afterFetch(sheet, func, afterFetchFunc);
      });
  }
}

async function afterFetch(sheet, func = () => {}, afterFetchFunc = () => {}) {
  let prefetchedData = JSON.parse(localStorage.prefetchedData);
  if (JSON.stringify(data[sheet]) != JSON.stringify(prefetchedData[sheet])) {
    prefetchedData[sheet] = data[sheet];
    localStorage.prefetchedData = JSON.stringify(prefetchedData);
    func();
  }
  afterFetchFunc();
}

async function fetchSheets(sheets, func = () => {}) {
  let promises = [];
  let haveData = new Set();
  let fetched = new Set();

  let firstCall = true;
  let needReCall = false;

  for (let i = 0; i < sheets.length; i++) {
    promises.push(
      fetchSheet(
        sheets[i],
        () => {
          // before fetch
          if (haveData.has(sheets[i])) {
            // if re-call is needed
            needReCall = true;
          }
          haveData.add(sheets[i]);
          if (firstCall && haveData.size == sheets.length) {
            firstCall = false;
            func();
          }
        },
        () => {
          // after fetch
          fetched.add(sheets[i]);

          if ((needReCall || firstCall) && fetched.size == sheets.length) {
            func();
          }
        },
      ),
    );
  }
}

function getCell(sheet, row, col, formattedString = false) {
  if (data[sheet][row].c[SHEETS[sheet].COLS.indexOf(col)] != null) {
    if (formattedString == true) {
      return data[sheet][row].c[SHEETS[sheet].COLS.indexOf(col)].f;
    } else {
      return data[sheet][row].c[SHEETS[sheet].COLS.indexOf(col)].v;
    }
  }
  return null;
}

function anyCellNull(sheet, row, cols) {
  for (let i = 0; i < cols.length; i++) {
    if (getCell(sheet, row, cols[i]) == null) {
      return true;
    }
  }
  return false;
}

function anyCellFilled(sheet, row, cols) {
  for (let i = 0; i < cols.length; i++) {
    if (getCell(sheet, row, cols[i]) != null) {
      return true;
    }
  }
  return false;
}

function splitDate(date) {
  return date.split("(")[1].split(")")[0].split(",");
}

function dateToUTC(date, isSplit = false) {
  let dateArr = date;
  if (isSplit == false) {
    dateArr = splitDate(date);
  }

  if (dateArr.length > 3) {
    return Date.UTC(dateArr[0], dateArr[1], dateArr[2], dateArr[3], dateArr[4]);
  }
  return Date.UTC(dateArr[0], dateArr[1], dateArr[2]);
}

function dateToString(date, isSplit = false) {
  let dateArr = date;
  if (isSplit == false) {
    dateArr = splitDate(date);
  }

  return `${dateArr[2]} ${MONTHS[dateArr[1]]} ${dateArr[0]}`;
}

function replaceOrdinals(string) {
  let output = string;
  let ords = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "0th",
  ];
  for (let i = 0; i < ords.length; i++) {
    let j = output.indexOf(ords[i]);
    if (j > -1) {
      output = `${output.substring(0, j + 1)}<sup>${ords[i].substring(1)}</sup>${output.substring(j + 3)}`;
      i--;
    }
  }
  return output;
}

// let navOpen = false;
// let closingNav = false;

let togglingNav = false;
let navDelay;

function toggleNav() {
  let nav = document.getElementById("nav");
  // let classes = nav.classList;

  if (togglingNav) {
    return;
  }

  togglingNav = true;

  if (nav.classList.contains("hidden")) {
    setNavDelays();
    nav.classList.remove("hidden");
    document.querySelectorAll("header nav .button.nav").forEach((el) => {
      el.style.display = "none";
    });
    setTimeout(() => {
      document.querySelectorAll("header nav .button.nav").forEach((el) => {
        el.style.display = "";
      });
    }, 1);
    setTimeout(() => {
      togglingNav = false;
    }, navDelay);
  } else {
    setNavDelays(true);
    document.querySelectorAll("header nav .button.nav").forEach((el) => {
      el.style.display = "block";
    });
    setTimeout(() => {
      togglingNav = false;
      document.querySelectorAll("header nav .button.nav").forEach((el) => {
        el.style.display = "";
      });
    }, navDelay + 200);
    nav.classList.add("hidden");
  }
}


function setNavDelays(reverse = false) {
  let buttons = document.querySelectorAll("header nav .button.nav");
  navDelay = buttons.length * NAV_DELAY;
  document.querySelectorAll("header nav").forEach((el) => {
    el.setAttribute("dur", `${navDelay}`);
  });

  for (let i = 0; i < buttons.length; i++) {
    let animIndex = i + 2;
    if (reverse) {
      animIndex = buttons.length - 1 - i;
    }

    buttons[i].style = `animation-delay: ${animIndex * NAV_DELAY}ms;`;
  }
}

function handleTooltips(el) {
  let ibound = el.getBoundingClientRect();
  let tooltip = el.children[0];
  // let ttbound = tooltip.getBoundingClientRect();

  tooltip.classList.remove("left", "right");
  if (ibound.x + ibound.width / 2 <= window.outerWidth / 2) {
    tooltip.classList.add("right");
  } else {
    tooltip.classList.add("left");
  }
}

function driveUrlToThumb(url) {
  url = String(url);
  return `https://drive.google.com/thumbnail?id=${url.substring(url.indexOf("/d/") + 3, url.indexOf("/view"))}&sz=w1080`;
}

function driveUrlToPreview(url) {
  url = String(url);
  return `https://drive.google.com/file${url.substring(url.indexOf("/d/"), url.indexOf("/view"))}/preview`;
}

// RELOADING

let startY;
let mouseStartY;
let canReload;
let reloading = false;
let wasAtTop;

function ease(x, dir, type) {
  switch (dir) {
    case "in":
      switch (type) {
        case "poly2":
          return x * x;
        case "poly3":
          return x * x * x;
        case "exp":
          return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
        default:
          break;
      }
    case "out":
      switch (type) {
        case "poly2":
          return 1 - (1 - x) * (1 - x);
        case "poly3":
          return 1 - Math.pow(1 - x, 3);
        case "poly4":
          return 1 - Math.pow(1 - x, 4);
        case "exp":
          return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
        case "bounce":
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        default:
          break;
      }
    default:
      break;
  }
  return 0;
}

const indicator = document.querySelector("#reload-indicator");
indicator.innerHTML = '<i class="fa-solid fa-arrow-rotate-right"></i>';
const transformOnReload = document.querySelectorAll(
  "#content, .section-header > :not(#reload-indicator):not(img)",
);

body.addEventListener(
  "touchstart",
  (event) => {
    wasAtTop = false;
    canReload = true;
    reloading = false;
    startY = event.touches[0].pageY;
    mouseStartY = event.touches[0].clientY;

    let nav = document.querySelector("header nav");
    let navBound = nav.getBoundingClientRect();
    if (
      mouseStartY > navBound.y + navBound.height &&
      !nav.classList.contains("hidden")
    ) {
      toggleNav();
    }
  },
  { passive: true },
);

body.addEventListener(
  "touchmove",
  (event) => {
    const y = event.touches[0].pageY;
    const mouseY = event.touches[0].clientY;
    if (mouseY < mouseStartY) {
      if (wasAtTop && mouseStartY > mouseY + 20) {
        canReload = false;
        endReload(0);
      }
    } else {
      mouseStartY = mouseY;
    }
    if (document.scrollingElement.scrollTop === 0 && canReload == true) {
      wasAtTop = true;
      let pullEase = ease(
        Math.min((y - startY) / ((PULL_HEIGHT * 7) / 8), 1),
        "out",
        "poly2",
      );
      let scaleEase = ease(
        Math.min((y - startY) / ((PULL_HEIGHT * 7) / 8), 1),
        "in",
        "poly3",
      );
      let indicatorStyle = `filter: opacity(${Math.min(1, pullEase + 0.1)}); transform: translateY(calc((25px + 0.25 * var(--navbar-height)) * ${pullEase} + var(--section-header-height) / 6 * ${pullEase})) scale(${1 + 0.2 * scaleEase})`;

      indicator.style = "transition-duration: 0s; " + indicatorStyle + ";";

      transformOnReload.forEach((el) => {
        el.style = `transition-duration: 0s; transform: translateY(${3 * pullEase}vw)`;
        // filter: blur(${0.5 * pullEase}vw);
      });
      if (y > startY + PULL_HEIGHT) {
        reloading = true;
        // body.style = 'overflow: hidden;'
        indicator.style =
          indicatorStyle +
          ` rotate(360deg); transition-duration: ${RELOAD_TIME}ms;`;
        setTimeout(function () {
          indicator.style = `transition-duration: 0.1s; transform: translateY(0px) rotate(360deg);`;
        }, RELOAD_TIME);
        location.reload();
      }
    }
  },
  { passive: true },
);

function endReload(delay) {
  setTimeout(function () {
    indicator.style = "transition-duration: 0.1s;";
    transformOnReload.forEach((el) => {
      el.style = "transition-duration: 0.1s; transform: translateY(0);";
    });
  }, delay);
}

body.addEventListener("touchend", (event) => {
  endReload(reloading == true ? RELOAD_TIME : 0);
});

// HOME

function makeOpenings() {
  let execIdx = 0;
  let exoIdx = 1;

  let execHTML = "";
  let exoHTML = "";

  let posCount = 0;
  for (let i = 0; i < data.positions.length; i++) {
    if (
      anyCellNull("positions", i, ["position", "type", "responsibilities"]) ==
        true ||
      getCell("positions", i, "open") == false
    ) {
      continue;
    } // skip blank entries
    posCount++;
    if (getCell("positions", i, "type") == "Executive") {
      execHTML += `<li style="animation-delay: ${execIdx * POP_IN_DELAY}ms;"><div>${replaceOrdinals(getCell("positions", i, "position"))}</div><i class="fa-solid fa-circle-info"><div class="tooltip">${getCell("positions", i, "responsibilities")}</div></i></li>`;
      execIdx++;
    } else {
      exoHTML += `<li style="animation-delay: ${exoIdx * POP_IN_DELAY}ms;"><div>${replaceOrdinals(getCell("positions", i, "position"))}</div><i class="fa-solid fa-circle-info"><div class="tooltip">${getCell("positions", i, "responsibilities")}</div></i></li>`;
      exoIdx++;
    }
  }

  if (posCount == 0) {
    execHTML = `<li><div class="no-entries">No openings right now. Check back later!</div></li>`;
  }

  document.getElementById("exec-openings").innerHTML = execHTML;
  document.getElementById("exo-openings").innerHTML = exoHTML;
}

function makeSocials() {
  let html = "";
  for (let i = 0; i < data.socials.length; i++) {
    if (
      anyCellNull("socials", i, ["link", "icon"]) == true ||
      getCell("socials", i, "show") == false
    ) {
      continue;
    }

    html += `<a class="button icon" href="${getCell("socials", i, "link")}" target="_blank"><i class="fa-brands fa-${getCell("socials", i, "icon")}"></i></a>`;
  }

  document.getElementById("socials").innerHTML = html;
  addButtonEvents();
}

function makeLinks() {
  let html = "";
  let linkIdx = 0;
  for (let i = 0; i < data.links.length; i++) {
    if (
      anyCellNull("links", i, ["name", "link"]) == true ||
      getCell("links", i, "show") == false
    ) {
      continue;
    } // skip blank entries
    let icon =
      anyCellNull("links", i, ["icon_pack", "icon"]) == false
        ? `<i class="fa-${getCell("links", i, "icon_pack")} fa-${getCell("links", i, "icon")}"></i>`
        : "";
    html += `<li style="animation-delay: ${linkIdx * POP_IN_DELAY}ms;"><a class="button link" href="${getCell("links", i, "link")}" target="_blank">${icon + getCell("links", i, "name")}</a></li>`;
    linkIdx++;
  }
  document.getElementById("links").innerHTML = html;
  addButtonEvents();
}

function makeSponsors() {
  document
    .getElementById("package")
    .setAttribute(
      "src",
      driveUrlToPreview(
        "https://drive.google.com/file/d/1JFjuADqjNiTIVkD6PpZ6IxTFT3zMWaru/view?usp=drive_link",
      ),
    );

  let key = "";
  for (let i = 0; i < data.contacts.length; i++) {
    if (getCell("contacts", i, "option") == "Sponsorship") {
      let searchEmail =
        getCell("contacts", i, "override") != null
          ? getCell("contacts", i, "override")
          : getCell("contacts", i, "email") != null
            ? getCell("contacts", i, "email")
            : getCell("contacts", 0, "email");
      for (let j = 0; j < data.positions.length; j++) {
        if (getCell("positions", j, "email") == searchEmail) {
          key =
            getCell("positions", j, "key") != null
              ? getCell("positions", j, "key")
              : getCell("positions", 0, "key");
          break;
        }
      }
      break;
    }
  }
  document.getElementById("form-key").setAttribute("value", key);

  let html = "";
  let tiers = ["Titanium", "Steel", "Iron", "Aluminum"];
  for (let i = 0; i < tiers.length; i++) {
    html += `<li class=${tiers[i].toLowerCase()}><h3>${tiers[i]}</h3><ul class="sponsors">`;
    let count = 0;
    for (let j = 0; j < data.sponsors.length; j++) {
      if (
        getCell("sponsors", j, "tier") != tiers[i] ||
        anyCellNull("sponsors", j, ["name", "logo"]) == true ||
        getCell("sponsors", j, "show") == false
      ) {
        continue;
      }
      html += "<li>";
      let link = getCell("sponsors", j, "link");
      if (link != null) {
        html += `<a href="${link}" target="_blank">`;
      }

      html += `<figure><img src=${driveUrlToThumb(getCell("sponsors", j, "logo"))}><figcaption>${getCell("sponsors", j, "name")}</figcaption></figure>`;

      if (link != null) {
        html += "</a></li>";
      }
      count++;
    }
    if (count == 0) {
      html += '<li class="no-entries">No sponsors in this tier</li>';
    }
    html += "</ul></li>";
  }

  document.getElementById("tiers").innerHTML = html;
}

function makeGallery() {
  let yearsSet = new Set();
  for (let i = 0; i < data.collections.length; i++) {
    // loops through collections entries and gets the most recent year
    if (
      getCell("collections", i, "name") == null ||
      getCell("collections", i, "show") == false
    ) {
      continue;
    }
    let currYear = Number(
      getCell("collections", i, "name").split(" ")[0].split("/")[0],
    );
    yearsSet.add(currYear);
  }

  galleryYears = [];
  for (let el of yearsSet) {
    galleryYears.push(el);
  }

  galleryYears = galleryYears.sort().reverse();

  let html = "";

  for (let i = 0; i < galleryYears.length; i++) {
    html += `<h3>${galleryYears[i]}–${galleryYears[i] + 1}</h3>`;
    for (let j = data.collections.length - 1; j >= 0; j--) {
      if (
        getCell("collections", j, "name") == null ||
        getCell("collections", j, "show") == false
      ) {
        continue;
      }
      let currYear = Number(
        getCell("collections", j, "name").split(" ")[0].split("/")[0],
      );
      if (galleryYears[i] != currYear) {
        continue;
      }
      let collectionName = getCell("collections", j, "name");
      html += `<h4>${collectionName.substring(collectionName.indexOf(" ") + 1)}</h4>`;
      html += '<ul class="collection">';

      for (let k = 0; k < data.gallery.length; k++) {
        if (
          anyCellNull("gallery", k, ["image", "collection"]) == true ||
          getCell("gallery", k, "show") == false
        ) {
          continue;
        }
        if (
          getCell("gallery", k, "collection") !=
          getCell("collections", j, "name")
        ) {
          continue;
        }
        let imgSrc = driveUrlToThumb(getCell("gallery", k, "image"));
        html += `<li style="animation-delay: ${Math.random() * POP_IN_VARIANCE}ms;"><figure><img src="${imgSrc}">`;
        if (getCell("gallery", k, "caption") != null) {
          html += `<figcaption>${getCell("gallery", k, "caption")}</figcaption>`;
        }
        html += "</figure></li>";
      }
      html += "</ul>";
    }
  }

  document.getElementById("gallery").innerHTML = html;
}

// EVENTS

function makeEvents(num) {
  let upcoming = new Map();
  let today = Date.now() - 1000 * 60 * 60 * 24;
  for (let i = 0; i < data.events.length; i++) {
    if (
      getCell("events", i, "show") == false ||
      anyCellNull("events", i, ["date", "name"]) == true
    ) {
      continue;
    } // skip blank entries
    let utc = dateToUTC(getCell("events", i, "date"));
    if (utc < today) {
      continue;
    }
    upcoming.set(i, utc);
  }

  if (upcoming.size == 0) {
    let html = `<li><div class="no-entries">No upcoming events. See you next term!</div></li>`;
    document.getElementById("events").innerHTML = html;
    addButtonEvents();
    return;
  }

  let sorted = Array.from(upcoming)
    .sort((a, b) => a[1] - b[1])
    .slice(0, Math.min(num, Array.from(upcoming).length));

  let html = "";
  for (let i = 0; i < sorted.length; i++) {
    let currEvent = sorted[i][0];
    html += `<li class="event" style="animation-delay: ${Math.random() * POP_IN_VARIANCE}ms;">`;

    html += "<div>";
    if (getCell("events", currEvent, "image") != null) {
      html += `<img src="${driveUrlToThumb(getCell("events", currEvent, "image"))}" alt="${getCell("events", currEvent, "name")}">`;
    } else {
      html += '<i class="fa-solid fa-gear"></i>';
    }

    if (getCell("events", currEvent, "instagram") != null) {
      html += `<a class="button link icon" href="${getCell("events", currEvent, "instagram")}" target="_blank"><i class="fa-brands fa-instagram" style="transform: scale(1.25);"></i></a>`;
      // style="margin-right: 0.65em;"
    }
    html += "</div>";

    html += `<h2>${getCell("events", currEvent, "name")}</h2>`;
    html += '<ul class="event-dtl">';
    html += `<li><i class="fa-solid fa-calendar"></i>${dateToString(getCell("events", currEvent, "date"))}</li>`;
    let eventTime =
      getCell("events", currEvent, "start", true) == null
        ? "TBD"
        : getCell("events", currEvent, "start", true) +
          (getCell("events", currEvent, "end", true) == null
            ? ""
            : `–${getCell("events", currEvent, "end", true)}`);
    html += `<li><i class="fa-solid fa-clock"></i>${eventTime}</li>`;
    html += `<li><i class="fa-solid fa-location-dot"></i>${getCell("events", currEvent, "location") != null ? getCell("events", currEvent, "location") : "TBD"}</li>`;
    html += "</ul>";
    if (anyCellFilled("events", currEvent, ["contacts", "rsvp", "calendar"])) {
      html += '<ul class="event-links">';

      html +=
        getCell("events", currEvent, "rsvp") != null
          ? `<li><a class="button link" href="${getCell("events", currEvent, "rsvp")}" target="_blank"><i class="fa-solid fa-reply"></i>RSVP</a></li>`
          : "";

      html +=
        getCell("events", currEvent, "calendar") != null
          ? `<li><a class="button link" href="${getCell("events", currEvent, "calendar")}" target="_blank"><i class="fa-brands fa-google"></i>Add to Calendar</a></li>`
          : "";

      if (getCell("events", currEvent, "contacts") != null) {
        let eventContacts = getCell("events", currEvent, "contacts").split(
          ", ",
        );

        let href = "mailto:";
        for (let i = 0; i < eventContacts.length; i++) {
          if (i > 0) {
            href += ",";
          }
          for (let j = 0; j < data.positions.length; j++) {
            if (eventContacts[i] == getCell("positions", j, "position")) {
              href += getCell("positions", j, "email");
            }
          }
        }
        href += `?subject=${CONFIG.siteNameFull} ${getCell("events", currEvent, "name")}`;

        html += `<li><a class="button link" href="${href}" target="_blank"><i class="fa-solid fa-envelope"></i>Contact Organizers</a></li>`;
      }

      html += "</ul>";
    }
    html += "</li>";
  }
  document.getElementById("events").innerHTML = html;
  addButtonEvents();
}

// COUNCIL

function makeYearSelect() {
  let yearsSet = new Set();
  for (let i = 0; i < data.council.length; i++) {
    // loops through council entries and gets the most recent year
    if (getCell("council", i, "year") == null) {
      break;
    } // skip blank entries
    let currYear = Number(getCell("council", i, "year").split("/")[0]);
    if (isNaN(currYear) == true) {
      continue;
    } //! FOR SOME REASON, HEADER IS GETTING FETCHED TOO
    yearsSet.add(currYear);
  }

  councilYears = [];
  for (let el of yearsSet) {
    councilYears.push(el);
  }

  councilYears = councilYears.sort().reverse();

  let selectHTML = "";
  for (let i = 0; i < councilYears.length; i++) {
    selectHTML += `<option value="${councilYears[i]}">${councilYears[i]}–${councilYears[i] + 1}</option>`;
  }
  document.getElementById("council-year").innerHTML = selectHTML;
}

function makeCouncilGrid() {
  let selectObj = document.getElementById("council-year");
  let selectedYear = selectObj.options[selectObj.selectedIndex].value;

  let html = "";
  for (let p = 0; p < data.positions.length; p++) {
    // looping through the positions sheet allows for heirarchical ordering even if the 'Council' sheet entries are out of order
    for (let i = 0; i < data.council.length; i++) {
      if (getCell("council", i, "year") == null) {
        break;
      } // skip blank entries
      let currYear = Number(getCell("council", i, "year").split("/")[0]); // current year
      if (isNaN(currYear) == true) {
        continue;
      }
      let currPositions = getCell("council", i, "position").split(", "); // creates an array of positions held by the member
      if (
        currYear == selectedYear &&
        currPositions[0] == getCell("positions", p, "position")
      ) {
        // heirarchical ordering done by *first* position in list
        html += `<li class="council-member visible" style="animation-delay: ${Math.random() * POP_IN_VARIANCE}ms;">`;

        if (getCell("council", i, "photo") != null) {
          html += `<img src="${driveUrlToThumb(getCell("council", i, "photo"))}" alt="${getCell("council", i, "name")}">`; // photo
        } else {
          html += '<i class="fa-solid fa-user"></i>';
        }

        html += `<h2>${replaceOrdinals(getCell("council", i, "name"))}</h2>`;
        html += "<h3>";
        for (let j = 0; j < currPositions.length; j++) {
          for (let k = 0; k < data.positions.length; k++) {
            if (currPositions[j] == getCell("positions", k, "position")) {
              html += `<span>${replaceOrdinals(currPositions[j])}<i class="fa-solid fa-circle-info"><div class="tooltip">${replaceOrdinals(getCell("positions", k, "responsibilities"))}</div></i></span>`;
              break;
            }
          }
          if (j + 1 < currPositions.length) {
            // add comma if more than one position, and not at last one
            html += ", ";
          }
        }
        html += "</h3>";
        if (currYear == councilYears[0]) {
          // only list emails for current council
          let firstEmail = true; // in the event of no emails, we dont want to create empty lists
          for (let j = 0; j < currPositions.length; j++) {
            for (let k = 0; k < data.positions.length; k++) {
              if (currPositions[j] == getCell("positions", k, "position")) {
                if (getCell("positions", k, "email") != null) {
                  if (firstEmail == true) {
                    html += "<ul>";
                    firstEmail = false;
                  }
                  html += "<li>";
                  html += `<a class="button link" href="mailto:${getCell("positions", k, "email")}">${getCell("positions", k, "email")}</a>`;
                  html += "</li>";
                }
                break;
              }
            }
          }
          if (firstEmail == false) {
            html += "</ul>";
          }
        }
        html += "</li>";
      }
    }
  }
  document.getElementById("council-grid").innerHTML = html;
}
document.querySelectorAll("#council-year").forEach((el) => {
  el.addEventListener("input", makeCouncilGrid);
});

// MERCH

function makeMerchCategories() {
  let html = "";

  let firstCategory = true;
  for (let i = 0; i < data.categories.length; i++) {
    if (
      getCell("categories", i, "name") == null ||
      getCell("categories", i, "show") == false
    ) {
      continue;
    }

    html += '<li><button class="button';

    if (firstCategory == true) {
      firstCategory = false;
      html += " selected";
    }

    html += `" id="${getCell("categories", i, "name")}-button">`;

    if (getCell("categories", i, "icon") != null) {
      html += `<i class="fa-solid fa-${getCell("categories", i, "icon")}"></i>`;
    }

    html += `${getCell("categories", i, "name")}</button></li>`;
  }

  document.getElementById("merch-categories").innerHTML = html;

  document.querySelectorAll("#merch-categories button").forEach((el) => {
    el.addEventListener("click", (event) => {
      filterMerch(el.getAttribute("id").split("-")[0]);
    });
  });
}

function makeMerch() {
  let html = "";

  for (let i = 0; i < data.merch.length; i++) {
    if (
      anyCellNull("merch", i, ["item", "price", "category"]) == true ||
      getCell("merch", i, "show") == false
    ) {
      continue;
    } // skip blank entries

    html += `<li class="merch-item ${getCell("merch", i, "category")}" style="animation-delay: ${Math.random() * POP_IN_VARIANCE}ms;">`;

    if (getCell("merch", i, "image") != null) {
      html += `<img src="${driveUrlToThumb(getCell("merch", i, "image"))}">`;
    } else {
      let catIcon = "gear";
      for (let j = 0; j < data.categories.length; j++) {
        if (
          getCell("categories", j, "name") == getCell("merch", i, "category")
        ) {
          catIcon = getCell("categories", j, "icon");
        }
      }
      html += `<i class="fa-solid fa-${catIcon}"></i>`;
    }

    html += `<h2>${replaceOrdinals(getCell("merch", i, "item"))}</h2>`;
    html += `<div><div class="price">$${Number(getCell("merch", i, "price")).toFixed(2)}</div>`;

    let stock =
      getCell("merch", i, "stock") == null
        ? ""
        : getCell("merch", i, "stock").replaceAll(" ", "").split(",");
    if (getCell("merch", i, "sizes") != null) {
      let sizes = getCell("merch", i, "sizes").split(", ");

      html += '<ul class="sizes">';
      for (let j = 0; j < sizes.length; j++) {
        html += `<li${stock[j] == "0" || stock[j] == "" ? ' class="out-of-stock">' : Number(stock[j]) < 11 ? ` class="running-low"><div class="counter">${stock[j]}</div>` : ">"}${sizes[j]}</li>`;
      }
      html += "</ul>";
    } else {
      if (stock[0] == "0" || stock[0] == "") {
        html += '<div class="status out-of-stock">Out of stock</div>';
      } else if (Number(stock[0]) < 11) {
        html += `<div class="status running-low">Only ${stock[0]} left!</div>`;
      } else {
        html += '<div class="status in-stock">In stock</div>';
      }
    }
    html += "</div>";
    html += "</li>";
  }

  document.getElementById("merch-grid").innerHTML = html;
}

function filterMerch(category) {
  let merchItems = document.querySelectorAll(".merch-item");

  let defaultCategory;
  for (let i = 0; i < data.categories.length; i++) {
    if (
      getCell("categories", i, "name") == null ||
      getCell("categories", i, "show") == false
    ) {
      continue;
    }
    defaultCategory = getCell("categories", i, "name");
    break;
  }

  let merchGrid = document.querySelector("#merch-grid");
  merchGrid.style = `min-height: ${merchGrid.getBoundingClientRect().height}px`;
  setTimeout(() => {
    merchGrid.style = "";
  }, 1);

  for (let i = 0; i < merchItems.length; i++) {
    merchItems[i].style = "";
    merchItems[i].style.display = "none";

    setTimeout(() => {
      if (
        category == defaultCategory ||
        merchItems[i].classList.contains(category)
      ) {
        merchItems[i].style =
          `animation-delay: ${Math.random() * POP_IN_VARIANCE}ms;`;
        merchItems[i].style.display = "";
      }
    }, 1);
  }

  let categoryButtons = document.querySelectorAll("#merch-categories button");
  for (let i = 0; i < categoryButtons.length; i++) {
    categoryButtons[i].classList.remove("selected");
    if (categoryButtons[i].id.split("-")[0] == category) {
      categoryButtons[i].classList.add("selected");
    }
  }
}
document.querySelectorAll("#merch-categories").forEach((el) => {
  el.addEventListener("input", filterMerch);
});

// LOCKERS

function makeLockers() {
  let html = "";
  for (let i = 0; i < data.sets.length; i++) {
    if (
      anyCellNull("sets", i, ["name", "location", "period", "size", "cost"]) ==
        true ||
      getCell("sets", i, "show") == false
    ) {
      continue;
    } // skip blank entries

    html += '<li class="locker">';

    if (getCell("sets", i, "image") != null) {
      html += `<img src="${driveUrlToThumb(getCell("sets", i, "image"))}">`;
    }

    html += `<h2>${getCell("sets", i, "name")}</h2>`;
    // html += `<div class="price">$${getCell('sets', i, 'cost')}</div>`;
    html += "<div>";
    html += '<ul class="info">';

    html += `<li><i class="fa-solid fa-location-dot"></i>${getCell("sets", i, "location")}</li>`;
    html += `<li><i class="fa-solid fa-${getCell("sets", i, "period") == "Year-round" ? "calendar" : "calendar-week"}"></i>${getCell("sets", i, "period")}</li>`;
    let numRange = getCell("sets", i, "numbers").split("-");
    html += `<li><i class="fa-solid fa-hashtag"></i>${numRange[0]}–${numRange[1]}</li>`;
    html += `<li><i class="fa-solid fa-ruler-combined"></i>${getCell("sets", i, "size")}</li>`;
    if (getCell("sets", i, "lock") == true) {
      html += `<li><i class="fa-solid fa-lock"></i>Lock included</li>`;
    } else {
      html += `<li><i class="fa-solid fa-lock-open"></i>Lock not included</li>`;
    }
    html += `<li><i class="fa-solid fa-money-bill-wave"></i>$${getCell("sets", i, "cost")}/term</li>`;
    html += "</ul>";

    let dir = getCell("sets", i, "direction").toLowerCase();
    let isWeave = dir.indexOf("weave") > -1;

    let availability = [];
    for (let j = 0; j < getCell("sets", i, "count"); j++) {
      availability.push(0);
    }

    let isOddCol = false;
    let lockerIdx = 0;
    for (let j = 0; j < data.lockers.length; j++) {
      if (
        getCell("lockers", j, "set") != getCell("sets", i, "name") ||
        getCell("lockers", j, "number") == null
      ) {
        continue;
      } // skip blank entries and lockers in other sets

      if (
        (lockerIdx + Number(getCell("sets", i, "offset"))) %
          getCell("sets", i, "count") ==
        0
      ) {
        isOddCol = !isOddCol;
      }

      let rowIdx =
        (lockerIdx + Number(getCell("sets", i, "offset"))) %
        getCell("sets", i, "count");
      if (isWeave && !isOddCol) {
        rowIdx = getCell("sets", i, "count") - 1 - rowIdx;
      }

      if (getCell("lockers", j, "taken") == false) {
        availability[rowIdx] += 1;
      }

      lockerIdx++;
    }

    html += '<ul class="availability">';
    for (let j = 0; j < availability.length; j++) {
      html += `<li${availability[j] == 0 ? ' class="none-left"' : availability[j] < 5 ? ' class="running-low"' : ""}><i class="fa-solid fa-${j == 0 ? "arrow-up" : j == availability.length - 1 ? "arrow-down" : "minus"}"></i>${availability[j]} </li>`;
    }
    html += "</ul>";
    html += "</div>";

    if (getCell("sets", i, "unavailable") == true) {
      html +=
        '<div class="unavailable"><i class="fa-solid fa-circle-xmark"></i>Temporarily unavailable</div>';
    }

    html += "</li>";
  }

  document.getElementById("lockers").innerHTML = html;
}

// CONTACT

function makeContactOptions() {
  let html = "";
  for (let i = 0; i < data.contacts.length; i++) {
    if (
      getCell("contacts", i, "option") == null ||
      getCell("contacts", i, "show") == false
    ) {
      continue;
    } // skip blank entries
    html += `<option value="${getCell("contacts", i, "option")}">${getCell("contacts", i, "option")}</option>`;
  }

  let key;
  for (let i = 0; i < data.positions.length; i++) {
    if (
      getCell("positions", i, "email") != null &&
      getCell("contacts", 0, "email") == getCell("positions", i, "email")
    ) {
      key = getCell("positions", i, "key");
      break;
    }
  }

  document.getElementById("form-key").setAttribute("value", key);
  document
    .getElementById("form-subject")
    .setAttribute(
      "value",
      `Website Contact Message (${getCell("contacts", 0, "option")})`,
    );

  document.getElementById("form-type").innerHTML = html;
}

function updateContactForm() {
  let selectObj = document.getElementById("form-type");
  let type = selectObj.options[selectObj.selectedIndex].value;

  let key;
  for (let i = 0; i < data.contacts.length; i++) {
    if (
      getCell("contacts", i, "option") == null ||
      getCell("contacts", i, "show") == false
    ) {
      continue;
    } // skip blank entries
    if (getCell("contacts", i, "option") == type) {
      let searchEmail =
        getCell("contacts", i, "override") != null
          ? getCell("contacts", i, "override")
          : getCell("contacts", i, "email") != null
            ? getCell("contacts", i, "email")
            : getCell("contacts", 0, "email"); // take preference for override, otherwise use regular email, if both blank, default to first entry
      for (let j = 0; j < data.positions.length; j++) {
        if (
          getCell("positions", j, "email") != null &&
          getCell("positions", j, "email") == searchEmail
        ) {
          key =
            getCell("positions", j, "key") != null
              ? getCell("positions", j, "key")
              : getCell("positions", 0, "key"); // lowermost default to president
          break;
        }
      }
    }
  }
  let subject = `Website Contact Message (${type})`;

  document.getElementById("form-key").setAttribute("value", key);
  document.getElementById("form-subject").setAttribute("value", subject);
}
document.querySelectorAll("#form-type").forEach((el) => {
  el.addEventListener("input", updateContactForm);
});

// LEADERBOARD

function getParamsAtDate(game, date) {
  let searchUtc = dateToUTC(date);

  let latestIndex = -1;
  let firstOfGame = true;

  for (let i = 0; i < data.parameters.length; i++) {
    if (
      anyCellNull("parameters", i, ["game", "starts"]) == true ||
      getCell("parameters", i, "game") != game
    ) {
      continue;
    }

    let paramUtc = dateToUTC(getCell("parameters", i, "starts"));

    if (firstOfGame == true) {
      firstOfGame = false;
      latestIndex = i;
    } else if (searchUtc >= paramUtc) {
      latestIndex = i;
    }
  }

  return latestIndex;
}

function setPlayerNames() {
  playerNames = new Map();
  for (let i = 0; i < data.players.length; i++) {
    if (anyCellNull("players", i, ["id", "name"]) == true) {
      continue;
    }
    playerNames.set(getCell("players", i, "id"), getCell("players", i, "name"));
  }
}

function minMaxLerp(a, b, t) {
  return (
    Math.max(0, Math.min(1, t)) * (Math.max(a, b) - Math.min(a, b)) +
    Math.min(a, b)
  );
}

function getPlayerRating(game, id, timestamp) {
  if (playerRatings[game].has(id) == false) {
    let latestInitRating = getCell(
      "parameters",
      getParamsAtDate(game, timestamp),
      "init_rating",
    );
    playerRatings[game].set(id, latestInitRating);
  }
  return playerRatings[game].get(id);
}

function setPlayerRating(game, id, rating) {
  playerRatings[game].set(id, rating);
}

function calculatePlayerRatings() {
  for (let i = 0; i < data.games.length; i++) {
    if (
      anyCellNull("games", i, ["name", "system", "starts"]) == true ||
      dateToUTC(getCell("games", i, "starts")) > Date.now() ||
      getCell("games", i, "show") == false
    ) {
      continue;
    }
    playerRatings[getCell("games", i, "name")] = new Map();
  }

  for (let r = 0; r < data.matches.length; r++) {
    if (getCell("matches", r, "timestamp") == null) {
      continue;
    }
    // get game
    let game = getCell("matches", r, "game");
    let timestamp = getCell("matches", r, "timestamp");

    let system = "";
    for (let i = 0; i < data.games.length; i++) {
      if (
        getCell("games", i, "name") != null &&
        getCell("games", i, "name") == game &&
        getCell("games", i, "show") == true &&
        getCell("games", i, "system") != null &&
        getCell("games", i, "starts") != null &&
        dateToUTC(getCell("games", i, "starts")) <= dateToUTC(timestamp)
      ) {
        system = getCell("games", i, "system");
        break;
      }
    }
    if (system == "") {
      continue;
    } // if no game record being tracked, don't bother

    // get player ids
    let ids = [];
    // team A
    ids[0] = Number(getCell("matches", r, "p1_id")); // P1
    ids[1] =
      getCell("matches", r, "p2_id") != null
        ? Number(getCell("matches", r, "p2_id"))
        : 0; // P2
    // team B
    ids[2] =
      getCell("matches", r, "p3_id") != null
        ? Number(getCell("matches", r, "p3_id"))
        : 0; // P3
    ids[3] =
      getCell("matches", r, "p4_id") != null
        ? Number(getCell("matches", r, "p4_id"))
        : 0; // P4

    // get player ratings (or set to init value if new)
    let Rs = []; // prior ratings
    let playerCount = 0;
    for (let i = 0; i < 4; i++) {
      if (ids[i] != 0) {
        Rs[i] = getPlayerRating(game, ids[i], timestamp);
        playerCount++;
      } else {
        Rs[i] = Rs[Math.max(i - 1, 0)];
      }
    }

    let gameParams = getParamsAtDate(game, timestamp);

    if (system == "Best Time") {
      let time = getCell("matches", r, "time");
      if (time < Rs[0]) {
        setPlayerRating(game, ids[0], time);
      }
    } else if (system == "Elo FFA") {
      let Qs = []; // q values
      for (let i = 0; i < playerCount; i++) {
        Qs[i] = Math.pow(
          getCell("parameters", gameParams, "base"),
          Rs[i] / getCell("parameters", gameParams, "divisor"),
        );
      }

      let Es = [
        new Array(playerCount),
        new Array(playerCount),
        new Array(playerCount),
        new Array(playerCount),
      ]; // estimated scores
      for (let i = 0; i < playerCount; i++) {
        for (let j = 0; j < playerCount; j++) {
          Es[i][j] = Qs[i] / (Qs[i] + Qs[j]); // player i playing against player j
        }
      }

      let Ss = [
        getCell("matches", r, "p1_points") != null
          ? Number(getCell("matches", r, "p1_points"))
          : 0,
        getCell("matches", r, "p2_points") != null
          ? Number(getCell("matches", r, "p2_points"))
          : 0,
        getCell("matches", r, "p3_points") != null
          ? Number(getCell("matches", r, "p3_points"))
          : 0,
        getCell("matches", r, "p4_points") != null
          ? Number(getCell("matches", r, "p4_points"))
          : 0,
      ]; // actual scores

      for (let i = 0; i < playerCount; i++) {
        let mult = 0;
        for (let j = 0; j < playerCount; j++) {
          if (i == j) {
            continue;
          }
          let wld = Ss[i] > Ss[j] ? 1 : Ss[i] < Ss[j] ? 0 : 0.5; // win-lose-draw
          mult += wld - Es[i][j];
        }
        setPlayerRating(
          game,
          ids[i],
          Rs[i] +
            (getCell("parameters", gameParams, "k") / (playerCount - 1)) * mult,
        );
      }
    } else if (system == "Elo Teams") {
      let Rt = [
        minMaxLerp(
          Rs[0],
          Rs[1],
          getCell("parameters", gameParams, "interpolation"),
        ),
        minMaxLerp(
          Rs[2],
          Rs[3],
          getCell("parameters", gameParams, "interpolation"),
        ),
      ]; // ratings for team A and B
      let Qs = [
        Math.pow(
          getCell("parameters", gameParams, "base"),
          Rt[0] / getCell("parameters", gameParams, "divisor"),
        ),
        Math.pow(
          getCell("parameters", gameParams, "base"),
          Rt[1] / getCell("parameters", gameParams, "divisor"),
        ),
      ];
      let Es = [Qs[0] / (Qs[0] + Qs[1]), Qs[1] / (Qs[0] + Qs[1])]; // estimated scores for team A and B
      let Ss = [
        getCell("matches", r, "winner") == "Team A" ? 1 : 0,
        getCell("matches", r, "winner") == "Team B" ? 1 : 0,
      ]; // actual scores for team A and B

      for (let i = 0; i < 4; i++) {
        if (ids[i] == 0) {
          continue;
        }
        setPlayerRating(
          game,
          ids[i],
          Rs[i] +
            getCell("parameters", gameParams, "k") *
              (Ss[Math.floor(i / 2)] - Es[Math.floor(i / 2)]),
        );
      }
    }
  }

  refreshLeaderboard();
}

function refreshLeaderboard() {
  for (let i = 0; i < data.games.length; i++) {
    if (
      anyCellNull("games", i, ["name", "system", "starts"]) == true ||
      dateToUTC(getCell("games", i, "starts")) > Date.now() ||
      getCell("games", i, "show") == false
    ) {
      continue;
    }

    let game = getCell("games", i, "name");
    let system = getCell("games", i, "system");
    let rounding =
      getCell("games", i, "rounding") != null
        ? Math.round(getCell("games", i, "rounding"))
        : 0;
    let rankedMap;

    if (system == "Best Time") {
      rankedMap = new Map(
        Array.from(playerRatings[game]).sort((a, b) => a[1] - b[1]),
      );
    } else {
      rankedMap = new Map(
        Array.from(playerRatings[game]).sort((b, a) => a[1] - b[1]),
      );
    }
    document.getElementById(game + "-board").innerHTML = makeLeaderboardHTML(
      Array.from(rankedMap.values()),
      Array.from(rankedMap.keys()),
      rounding,
    );
  }
}

let shownGames = [];

function makeLeaderboardGames() {
  let buttonsHTML = "";
  let boardsHTML = "";
  for (let i = 0; i < data.games.length; i++) {
    if (
      anyCellNull("games", i, ["name", "system", "starts"]) == true ||
      getCell("games", i, "show") == false
    ) {
      continue;
    }

    shownGames.push(getCell("games", i, "name"));

    buttonsHTML += `<li><button class="button" id="${getCell("games", i, "name")}-button">`;
    if (getCell("games", i, "icon") != null) {
      buttonsHTML += `<i class="fa-solid fa-${getCell("games", i, "icon")}"></i>`;
    }
    buttonsHTML += `${getCell("games", i, "name")}</button></li>`;

    boardsHTML += `<ul class="leaderboard-container" id="${getCell("games", i, "name")}-board" style="display: none;">`;

    if (dateToUTC(getCell("games", i, "starts")) > Date.now()) {
      boardsHTML += `<li class="player-card message"><div>This leaderboard starts on ${dateToString(getCell("games", i, "starts"))}!</div></li>`;

      // for (let x = 1; x <= 20; x ++) {
      //   boardsHTML += `<li class="player-card" style="animation-delay: ${(x - 1) * POP_IN_DELAY}ms;"><div class="rank r${x}">${x}</div><div class="name">Player ${x}</div><div class="rating">${1000 - 10 * x}</div></li>`;
      // }
    }

    boardsHTML += `</ul>`;
  }
  document.getElementById("leaderboard-games").innerHTML = buttonsHTML;
  document.getElementById("leaderboards").innerHTML = boardsHTML;

  document
    .querySelectorAll("#leaderboard-page :not(nav) .button")
    .forEach((el) => {
      el.addEventListener("click", (event) => {
        changeLeaderboard(el.getAttribute("id").split("-")[0]);
      });
    });

  addButtonEvents();
}

function makeLeaderboardHTML(values, keys, round) {
  let html = "";

  if (keys.length == 0) {
    return `<li class="player-card message"><div>No contenders yet. Be the first!</div></li>`;
  }

  for (let i = 0; i < keys.length; i++) {
    let playerName = playerNames.get(keys[i])
      ? playerNames.get(keys[i])
      : "Anonymous";

    let rating =
      Math.round(values[i] * Math.pow(10, -round)) / Math.pow(10, -round);

    let tieCount = 0;
    while (
      i > 0 &&
      rating ==
        Math.round(values[i - 1] * Math.pow(10, -round)) / Math.pow(10, -round)
    ) {
      i--;
      tieCount++;
    }

    html += `<li class="player-card" style="animation-delay: ${i * POP_IN_DELAY}ms;"><div class="rank r${i + 1}">${i + 1}</div><div class="name">${playerName}</div><div class="rating">${rating.toFixed(Math.max(-round, 0))}</div></li>`;

    i += tieCount;
  }

  return html;
}

function changeLeaderboard(id) {
  document.querySelectorAll(".leaderboard-container").forEach((el) => {
    el.style.display = "none";
  });
  document
    .querySelectorAll("#leaderboard-page :not(nav) .button")
    .forEach((el) => {
      el.classList.remove("selected");
    });
  document.getElementById(id + "-board").style.display = "";
  document.getElementById(id + "-button").classList.add("selected");

  localStorage.currentBoard = id;
}

function filterSearch() {
  let input = document.getElementById("leaderboard-search").value.toUpperCase();
  let boards = document.querySelectorAll(".leaderboard-container");
  for (let i = 0; i < boards.length; i++) {
    let cards = boards[i].querySelectorAll(".player-card");
    let cardIdx = 0;

    for (let i = 0; i < cards.length; i++) {
      let nameObj = cards[i].querySelector(".name");
      if (nameObj == null) {
        continue;
      }
      cards[i].style = ``;
      cards[i].style.display = "none";
      setTimeout(() => {
        let name = nameObj.innerHTML;
        if (name.toUpperCase().indexOf(input) > -1) {
          cards[i].style.display = "";
          cards[i].style = `animation-delay: ${cardIdx * POP_IN_DELAY}ms`;
          cardIdx++;
        }
      }, 1);

      // else {
      //   cards[i].style.display = 'none';
      // }
    }
  }
}
document.querySelectorAll("#leaderboard-search").forEach((el) => {
  el.addEventListener("keyup", filterSearch);
});
