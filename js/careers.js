import {
  data,
  fetchSheet,
  fetchSheets,
  getCell,
  anyCellNull,
  driveUrlToThumb,
  driveUrlToPreview,
  makeSocials,
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
 * Renders the Alumni Logo Grid from MARQUEE_COMPANIES
 */
function makeAlumniLogos() {
  const root = document.getElementById("alumni-logos");
  if (!root) return;
  root.className = "alumni-logo-grid";
  root.innerHTML = MARQUEE_COMPANIES.map(logoItem).join("");
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
  fetchSheets(["contacts", "positions", "sponsors"], makeSponsors);
});
