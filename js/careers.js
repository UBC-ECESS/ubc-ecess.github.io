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

const STATIC_LOGOS = window.matchMedia(
  "(max-width: 1130px), (prefers-reduced-motion: reduce)",
);

function logoItem(company, hidden) {
  return (
    `<div class="alumni-logo"${hidden ? ' aria-hidden="true"' : ""}>` +
    `<img src="${company.logo}" alt="${hidden ? "" : company.name}"></div>`
  );
}

function makeAlumniLogos() {
  const root = document.getElementById("alumni-logos");
  if (!root) return;

  if (STATIC_LOGOS.matches) {
    root.className = "alumni-logo-grid";
    root.innerHTML = MARQUEE_COMPANIES.map((c) => logoItem(c, false)).join("");
    return;
  }

  root.className = "marquee-outer";
  root.innerHTML =
    `<div class="marquee-track">` +
    MARQUEE_COMPANIES.map((c) => logoItem(c, false)).join("") +
    MARQUEE_COMPANIES.map((c) => logoItem(c, true)).join("") +
    `</div>`;
}

// SPONSORS

function makeSponsors() {
  document
    .getElementById("package")
    .setAttribute(
      "src",
      driveUrlToPreview(
        "https://drive.google.com/file/d/1Qh8cBZtHoSJyGFZhL7a6ypQCqCeue9Qi/view?usp=sharing",
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
  document.getElementById("form-key").setAttribute("value", key?.trim() ?? "");

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
  if (STATIC_LOGOS.addEventListener) {
    STATIC_LOGOS.addEventListener("change", makeAlumniLogos);
  }
  fetchSheet("socials", makeSocials);
  fetchSheets(["contacts", "positions", "sponsors"], makeSponsors);
});
