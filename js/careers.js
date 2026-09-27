import {
  load,
  reload,
  rows,
  field,
  lacks,
  present,
  photo,
  embed,
  endpoint,
  ingest,
  sheetUtc,
  writtenDate,
  ordinal,
  paintIcons,
  placeTips,
  wireIcons,
  boot,
  CONFIG,
} from "../app.js?version=7";

/*
 * Add/Remove Entries to Update Alumni Marquee
 * Logos Live in media/logos so They Load Reliably on Mobile
 */
const MARQUEE_COMPANIES = [
  { name: "Microsoft", logo: "media/logos/microsoft.svg" },
  { name: "Amazon", logo: "media/logos/amazon.svg" },
  { name: "Tesla", logo: "media/logos/tesla.svg" },
  { name: "NVIDIA", logo: "media/logos/nvidia.svg" },
  { name: "AMD", logo: "media/logos/amd.svg" },
  { name: "Synopsys", logo: "media/logos/synopsys.svg" },
  { name: "Motorola", logo: "media/logos/motorola.svg" },
  { name: "Sanctuary AI", logo: "media/logos/sanctuary-ai.svg" },
];

let alumniResizeBound = false;
let alumniResizeTimer = null;

/*
 * Builds One Alumni Logo Cell
 */
function logoItem(company) {
  return (
    `<div class="alumni-logo">` +
    `<img src="${company.logo}" alt="${company.name}"></div>`
  );
}

/*
 * Renders a Continuous Alumni Logo Wheel.
 * Duplicates the Set so translateX(-50%) Loops with No Jump
 */
function makeAlumniLogos() {
  const root = document.getElementById("alumni-logos");
  if (!root) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.className = "alumni-logo-grid";
    root.innerHTML = MARQUEE_COMPANIES.map(logoItem).join("");
    return;
  }

  const items = MARQUEE_COMPANIES.map(logoItem).join("");
  root.className = "alumni-logo-track";

  const strip = document.createElement("div");
  strip.className = "alumni-logo-strip";

  const group = document.createElement("div");
  group.className = "alumni-logo-group";
  group.innerHTML = items;
  strip.appendChild(group);
  root.replaceChildren(strip);

  let copies = 0;
  while (group.scrollWidth < root.clientWidth && copies < 8) {
    group.insertAdjacentHTML("beforeend", items);
    copies++;
  }

  const clone = group.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  strip.appendChild(clone);

  strip.style.animationDuration = group.scrollWidth / 45 + "s";

  if (!alumniResizeBound) {
    alumniResizeBound = true;
    window.addEventListener("resize", () => {
      clearTimeout(alumniResizeTimer);
      alumniResizeTimer = setTimeout(makeAlumniLogos, 150);
    });
  }
}

/*
 * Parses a Sheet Date Cell to UTC ms, or null if Blank / Unreadable
 */
function sheetDateUTC(value) {
  if (value == null || value === "") return null;
  try {
    if (String(value).indexOf("Date(") != -1) {
      return sheetUtc(value);
    }
    const parsed = Date.parse(value);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

/*
 * Formats a Sheet Date Cell for Display
 */
function sheetDateLabel(value) {
  if (value == null || value === "") return null;
  try {
    if (String(value).indexOf("Date(") != -1) {
      return writtenDate(value);
    }
  } catch {
    // Fall Through to Raw String
  }
  return String(value);
}

/*
 * Returns an http(s) URL, or "" if the Cell is Not a Usable Link
 */
function getValidUrl(url) {
  const value = String(url || "").trim();
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return "";
}

/*
 * Renders External Tab Rows as Post-Its
 * Skips Hidden, Unnamed, and Expired Rows
 */
function makePostIts() {
  const list = document.getElementById("post-its");
  if (!list) return;

  const today = Date.now() - 1000 * 60 * 60 * 24;
  const notes = [];
  for (let i = 0; i < rows("external").length; i++) {
    if (
      field(rows("external")[i], "show") == false ||
      field(rows("external")[i], "name") == null
    ) {
      continue;
    }
    const expiryUtc = sheetDateUTC(field(rows("external")[i], "expiry"));
    if (expiryUtc != null && expiryUtc < today) {
      continue;
    }
    notes.push(i);
  }

  notes.sort((a, b) => {
    const da = sheetDateUTC(field(rows("external")[a], "date")) || 0;
    const db = sheetDateUTC(field(rows("external")[b], "date")) || 0;
    return db - da;
  });

  if (notes.length == 0) {
    list.innerHTML =
      '<li><div class="empty-note">No postings right now. Check back later!</div></li>';
    return;
  }

  let html = "";
  for (let i = 0; i < notes.length; i++) {
    const row = notes[i];
    const name = field(rows("external")[row], "name");
    const description = field(rows("external")[row], "description");
    const location = field(rows("external")[row], "location");
    const dateLabel = sheetDateLabel(field(rows("external")[row], "date"));
    const image = field(rows("external")[row], "image");
    const link = getValidUrl(field(rows("external")[row], "link"));

    html += `<li class="post-it">`;
    if (image != null) {
      html += `<img src="${photo(image)}" alt="${name}" referrerpolicy="no-referrer">`;
    }
    html += `<h3>${name}</h3>`;
    if (description != null) {
      html += `<p class="post-it-desc">${description}</p>`;
      html += `<button type="button" class="post-it-expand" hidden aria-expanded="false"><i class="fa-solid fa-chevron-down"></i>Read More</button>`;
    }
    if (dateLabel != null || location != null) {
      html += '<ul class="post-it-meta">';
      if (dateLabel != null) {
        html += `<li><i class="fa-solid fa-calendar"></i>${dateLabel}</li>`;
      }
      if (location != null) {
        html += `<li><i class="fa-solid fa-location-dot"></i>${location}</li>`;
      }
      html += "</ul>";
    }
    if (link) {
      html += `<a class="button link" href="${link}" target="_blank"><i class="fa-solid fa-link"></i>Learn More</a>`;
    }
    html += "</li>";
  }

  list.innerHTML = html;
  bindPostItExpands();
  wireIcons();
}

/*
 * Shows Read More Only When the Description Is Clamped
 */
function bindPostItExpands() {
  requestAnimationFrame(() => {
    document.querySelectorAll(".post-it").forEach((note) => {
      const desc = note.querySelector(".post-it-desc");
      const btn = note.querySelector(".post-it-expand");
      if (!desc || !btn) return;
      if (!descriptionOverflows(desc)) return;

      btn.hidden = false;
      btn.addEventListener("click", () => {
        const open = note.classList.toggle("expanded");
        btn.setAttribute("aria-expanded", open);
        btn.innerHTML = open
          ? '<i class="fa-solid fa-chevron-up"></i>Show less'
          : '<i class="fa-solid fa-chevron-down"></i>Read more';
      });
    });
  });
}

/*
 * Compares Clamped Height to Full Text Height
 */
function descriptionOverflows(el) {
  const clone = el.cloneNode(true);
  clone.classList.add("post-it-desc-measure");
  clone.style.width = el.clientWidth + "px";
  el.parentNode.appendChild(clone);
  const overflows = clone.scrollHeight > el.clientHeight + 2;
  clone.remove();
  return overflows;
}

window.addEventListener("DOMContentLoaded", () => {
  boot();
  makeAlumniLogos();
  const pkg = document.getElementById("package");
  if (pkg) {
    pkg.src = embed(
      "https://drive.google.com/file/d/1Qh8cBZtHoSJyGFZhL7a6ypQCqCeue9Qi/view?usp=sharing",
    );
  }
  load("socials").then(paintIcons);
  load("external").then(makePostIts);
});
