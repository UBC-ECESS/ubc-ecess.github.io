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
 * - Use https://cdn.simpleicons.org/{slug} for Companies on simpleicons.org
 * - Use Direct Image URLs for Companies not on simpleicons.org (e.g. Microsoft, Synopsys)
 */
const MARQUEE_COMPANIES = [
  { name: "Microsoft", logo: "https://www.vectorlogo.zone/logos/microsoft/microsoft-ar21.svg" },
  { name: "Tesla",     logo: "https://cdn.simpleicons.org/tesla"                              },
  { name: "AMD",       logo: "https://cdn.simpleicons.org/amd"                                },
  { name: "Synopsys",  logo: "media/logos/synopsys.svg"                                       },
  { name: "Motorola",  logo: "https://cdn.simpleicons.org/motorola"                           },
];

function makeMarquee() {
  const track = document.getElementById("marquee-track");
  if (!track) return;
  const renderItem = (company, hidden) =>
    `<div class="marquee-logo"${hidden ? ' aria-hidden="true"' : ''}>` +
    `<img src="${company.logo}" alt="${hidden ? '' : company.name}"></div>`;
  track.innerHTML =
    MARQUEE_COMPANIES.map(c => renderItem(c, false)).join("") +
    MARQUEE_COMPANIES.map(c => renderItem(c, true)).join("");
}

// SPONSORS

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
  makeMarquee();
  fetchSheet("socials", makeSocials);
  fetchSheets(["contacts", "positions", "sponsors"], makeSponsors);
});
