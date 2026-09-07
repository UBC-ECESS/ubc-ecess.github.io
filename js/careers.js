import {
  data,
  POP_IN_VARIANCE,
  fetchSheet,
  fetchSheets,
  getCell,
  anyCellNull,
  dateToUTC,
  dateToString,
  driveUrlToThumb,
  driveUrlToPreview,
  makeSocials,
  addButtonEvents,
  commonInit,
} from "../app.js";

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
 * Returns the Contacts Row Index for a Named Option, or -1 if Missing
 */
function findContactIndex(option) {
  for (let i = 0; i < data.contacts.length; i++) {
    if (getCell("contacts", i, "option") == option) {
      return i;
    }
  }
  return -1;
}

/*
 * Looks Up the Web3Forms Access Key for a Contacts Row
 * Prefers Override Email, Then Regular Email, Then the First Contact
 */
function getContactKey(contactIdx) {
  if (contactIdx < 0) {
    return "";
  }
  let searchEmail =
    getCell("contacts", contactIdx, "override") != null
      ? getCell("contacts", contactIdx, "override")
      : getCell("contacts", contactIdx, "email") != null
        ? getCell("contacts", contactIdx, "email")
        : getCell("contacts", 0, "email"); // Prefer Override, Then Regular Email, Then First Contact
  for (let j = 0; j < data.positions.length; j++) {
    if (getCell("positions", j, "email") == searchEmail) {
      let key =
        getCell("positions", j, "key") != null
          ? getCell("positions", j, "key")
          : getCell("positions", 0, "key"); // Fall Back to First Position Key
      return key?.trim() ?? "";
    }
  }
  return "";
}

/*
 * Parses a Sheet Date Cell to UTC ms, or null if Blank / Unreadable
 */
function sheetDateUTC(value) {
  if (value == null || value === "") return null;
  try {
    if (String(value).indexOf("Date(") != -1) {
      return dateToUTC(value);
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
      return dateToString(value);
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
  const rows = [];
  for (let i = 0; i < data.external.length; i++) {
    if (
      getCell("external", i, "show") == false ||
      getCell("external", i, "name") == null
    ) {
      continue;
    }
    const expiryUtc = sheetDateUTC(getCell("external", i, "expiry"));
    if (expiryUtc != null && expiryUtc < today) {
      continue;
    }
    rows.push(i);
  }

  rows.sort((a, b) => {
    const da = sheetDateUTC(getCell("external", a, "date")) || 0;
    const db = sheetDateUTC(getCell("external", b, "date")) || 0;
    return db - da;
  });

  if (rows.length == 0) {
    list.innerHTML =
      '<li><div class="no-entries">No postings right now. Check back later!</div></li>';
    return;
  }

  let html = "";
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = getCell("external", row, "name");
    const description = getCell("external", row, "description");
    const location = getCell("external", row, "location");
    const dateLabel = sheetDateLabel(getCell("external", row, "date"));
    const image = getCell("external", row, "image");
    const link = getValidUrl(getCell("external", row, "link"));

    html += `<li class="post-it" style="animation-delay: ${Math.random() * POP_IN_VARIANCE}ms;">`;
    if (image != null) {
      html += `<img src="${driveUrlToThumb(image)}" alt="${name}" referrerpolicy="no-referrer">`;
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
  addButtonEvents();
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

// SPONSORS

/*
 * Fills the Sponsorship Package, Contact Form Key, and Sponsor Tiers
 */
function makeSponsors() {
  document
    .getElementById("package")
    .setAttribute(
      "src",
      driveUrlToPreview(
        "https://drive.google.com/file/d/1Qh8cBZtHoSJyGFZhL7a6ypQCqCeue9Qi/view?usp=sharing",
      ),
    );

  // Use Sponsorship If Present, Otherwise General
  let contactIdx = findContactIndex("Sponsorship");
  if (contactIdx < 0) {
    contactIdx = findContactIndex("General");
  }
  document
    .getElementById("form-key")
    .setAttribute("value", getContactKey(contactIdx));

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

window.addEventListener("DOMContentLoaded", () => {
  commonInit();
  makeAlumniLogos();
  fetchSheet("socials", makeSocials);
  fetchSheet("external", makePostIts);
  fetchSheets(["contacts", "positions", "sponsors"], makeSponsors);
});
