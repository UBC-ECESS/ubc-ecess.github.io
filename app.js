export const QUERY = encodeURIComponent("Select *");

export const DATABASE_DOC = "17CjfpnlwCs6aKsXiT2DS-d8jX6Hk9tSPYcHhPP2nL2A";
export const GAMES_LOG_DOC = "1u-wBWNxd7jEW2euJwzaiinHMNy8S_QvJgzh0G9xjU98";

// ! UPDATE THESE IF COLUMNS ARE REORDERED, SHEET TAB IS RENAMED, OR IS MOVED TO ANOTHER DOC
export const SHEETS = {
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
  courses: {
    SHEET: "Courses",
    DOC: DATABASE_DOC,
    COLS: ["code", "name", "show"],
  },
  course_resources: {
    SHEET: "Course_Resources",
    DOC: DATABASE_DOC,
    COLS: ["code", "link", "type", "show"],
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

// SITE CONFIGs
export const CONFIG = {
  siteNameFull: "UBC ECESS",
  author: "UBC ECESS",
  formFromName: "UBC ECESS Website",
  ogImage: "https://ubc-ecess.github.io/media/logos/ece-og.png", // ToDo: Update to New Domain
  ogImageAlt: "UBC ECESS logo",
  ogImageType: "image/png",
};

export const NAV_LINKS = [
  { label: "Home", href: "." },
  { label: "Events", href: "./events" },
  { label: "Council", href: "./council" },
  { label: "Courses", href: "./courses" },
  { label: "Sponsors", href: "./sponsors" },
  { label: "Contact", href: "./contact" },
  { label: "Merch", href: "./merch" },
  { label: "Lockers", href: "./lockers" },
  { label: "Leaderboard", href: "./leaderboard" },
];

export let data = {};
fixNullData();

export let councilYears = [];
export let galleryYears = [];

export let playerRatings = {};
export let playerNames;

// CONSTANTS

// general
export const MONTHS = [
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
export const POP_IN_DELAY = 75; // ms
export const POP_IN_VARIANCE = 200; // ms
export const NAV_DELAY = (POP_IN_DELAY * 2) / 3;

// reloading
export const PULL_HEIGHT = 150; // px
export const RELOAD_TIME = 400; // ms

// GENERAL

export const body = document.querySelector("body");
let fetchedSheets = new Set();

/*
 * Builds the site navigation header and prepends it to the HTML body.
 * Contains the logo, a toggle button, nav links, (optional) social links, and a hamburger button to toggle the navigation.
 */
export function injectNavHeader() {
  const header = document.createElement("header");
  header.innerHTML = `
    <div class="logo desktop">
      <img src="media/logos/ece-white.png">
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

/*
 * Appends shared meta tags to document head that are identical across all pages.
 */
export function injectMetaTags() {
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

/*
 * Common initialisation shared by every page.
 * Call this from each page module's DOMContentLoaded handler.
 * Pass `injectNav: false` for pages that don't use the standard nav (e.g. leaderboard).
 */
export function commonInit({ injectNav = true } = {}) {
  injectMetaTags();
  if (injectNav) injectNavHeader();
  document.querySelectorAll('input[name="from_name"]').forEach((el) => {
    el.value = CONFIG.formFromName;
  });
  setNavDelays();
  addButtonEvents();
  window.addEventListener("resize", function () {
    document.querySelectorAll(":has(>.tooltip)").forEach((el) => {
      handleTooltips(el);
    });
  });
}

export function handleAllTooltips() {
  document.querySelectorAll(":has(>.tooltip)").forEach((el) => {
    handleTooltips(el);
  });
}

export function addButtonEvents() {
  document.querySelectorAll(".button:has(i)").forEach((el) => {
    el.addEventListener("click", buttonClick(el));
    el.addEventListener("mouseleave", buttonMouseLeave(el));
  });
}

export function buttonClick(el) {
  return function () {
    el.classList.add("animating", "mouseover");
    setTimeout(() => {
      el.classList.remove("animating");
    }, 500);
  };
}

export function buttonMouseLeave(el) {
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

export function fixNullData() {
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

export function makeSheetUrl(sheet) {
  return `https://docs.google.com/spreadsheets/d/${SHEETS[sheet].DOC}/gviz/tq?&sheet=${SHEETS[sheet].SHEET}&tq=${QUERY}`;
}

export async function fetchSheet(sheet, func = () => {}, afterFetchFunc = () => {}) {
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

export async function afterFetch(sheet, func = () => {}, afterFetchFunc = () => {}) {
  let prefetchedData = JSON.parse(localStorage.prefetchedData);
  if (JSON.stringify(data[sheet]) != JSON.stringify(prefetchedData[sheet])) {
    prefetchedData[sheet] = data[sheet];
    localStorage.prefetchedData = JSON.stringify(prefetchedData);
    func();
  }
  afterFetchFunc();
}

export async function fetchSheets(sheets, func = () => {}) {
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

export function getCell(sheet, row, col, formattedString = false) {
  if (data[sheet][row].c[SHEETS[sheet].COLS.indexOf(col)] != null) {
    if (formattedString == true) {
      return data[sheet][row].c[SHEETS[sheet].COLS.indexOf(col)].f;
    } else {
      return data[sheet][row].c[SHEETS[sheet].COLS.indexOf(col)].v;
    }
  }
  return null;
}

export function anyCellNull(sheet, row, cols) {
  for (let i = 0; i < cols.length; i++) {
    if (getCell(sheet, row, cols[i]) == null) {
      return true;
    }
  }
  return false;
}

export function anyCellFilled(sheet, row, cols) {
  for (let i = 0; i < cols.length; i++) {
    if (getCell(sheet, row, cols[i]) != null) {
      return true;
    }
  }
  return false;
}

export function splitDate(date) {
  return date.split("(")[1].split(")")[0].split(",");
}

export function dateToUTC(date, isSplit = false) {
  let dateArr = date;
  if (isSplit == false) {
    dateArr = splitDate(date);
  }

  if (dateArr.length > 3) {
    return Date.UTC(dateArr[0], dateArr[1], dateArr[2], dateArr[3], dateArr[4]);
  }
  return Date.UTC(dateArr[0], dateArr[1], dateArr[2]);
}

export function dateToString(date, isSplit = false) {
  let dateArr = date;
  if (isSplit == false) {
    dateArr = splitDate(date);
  }

  return `${dateArr[2]} ${MONTHS[dateArr[1]]} ${dateArr[0]}`;
}

export function replaceOrdinals(string) {
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

export function toggleNav() {
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


export function setNavDelays(reverse = false) {
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

export function handleTooltips(el) {
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

export function driveUrlToThumb(url) {
  url = String(url);
  return `https://drive.google.com/thumbnail?id=${url.substring(url.indexOf("/d/") + 3, url.indexOf("/view"))}&sz=w1080`;
}

export function driveUrlToPreview(url) {
  url = String(url);
  return `https://drive.google.com/file${url.substring(url.indexOf("/d/"), url.indexOf("/view"))}/preview`;
}

// RELOADING

let startY;
let mouseStartY;
let canReload;
let reloading = false;
let wasAtTop;

export function ease(x, dir, type) {
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

export function endReload(delay) {
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

export function makeSocials() {
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
