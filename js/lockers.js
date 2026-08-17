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

const MAP_PREVIEW_TIMEOUT = 2000;
let mapPreviewTimer;

/*
 * Renders Locker Set Cards from Sets and Lockers Sheets.
 * Each Card Shows Map, Name, Location, and Free Count.
 */
function makeLockers() {
  let html = "";
  for (let i = 0; i < data.sets.length; i++) {
    if (
      getCell("sets", i, "name") == null ||
      getCell("sets", i, "show") == false
    ) {
      continue;
    } // skip blank entries

    html += '<li class="locker">';

    if (getCell("sets", i, "image") != null) {
      const mapUrl = driveUrlToThumb(getCell("sets", i, "image"));
      html += `<button type="button" class="locker-map" aria-label="View ${getCell("sets", i, "name")} map">`;
      html += `<img src="${mapUrl}" alt="${getCell("sets", i, "name")} map">`;
      html += `<span class="locker-map-preview"><img src="${mapUrl}" alt=""></span>`;
      html += `</button>`;
    }

    html += `<h2>${getCell("sets", i, "name")}</h2>`;
    html += "<div>";
    html += '<ul class="info">';

    if (getCell("sets", i, "location") != null) {
      html += `<li><i class="fa-solid fa-location-dot"></i>${getCell("sets", i, "location")}</li>`;
    }
    html += "</ul>";

    let freeCount = 0;
    for (let j = 0; j < data.lockers.length; j++) {
      if (
        getCell("lockers", j, "set") != getCell("sets", i, "name") ||
        getCell("lockers", j, "number") == null
      ) {
        continue;
      } // skip blank entries and lockers in other sets

      if (getCell("lockers", j, "taken") == false) {
        freeCount++;
      }
    }

    html += `<div class="availability${freeCount == 0 ? " none-left" : freeCount < 5 ? " running-low" : ""}">${freeCount} Available</div>`;
    html += "</div>";

    if (getCell("sets", i, "unavailable") == true) {
      html +=
        '<div class="unavailable"><i class="fa-solid fa-circle-xmark"></i>Temporarily Unavailable</div>';
    }

    html += "</li>";
  }

  document.getElementById("lockers").innerHTML = html;
  bindLockerMapPreviews();
}

/*
 * Closes Any Open Map Preview and Clears the Auto-Close Timer.
 */
function closeLockerMapPreviews() {
  clearTimeout(mapPreviewTimer);
  document.querySelectorAll(".locker-map.open").forEach((el) => {
    el.classList.remove("open");
    el.blur();
  });
}

/*
 * Opens a Map Preview and Closes It After MAP_PREVIEW_TIMEOUT.
 */
function openLockerMapPreview(mapButton) {
  closeLockerMapPreviews();
  mapButton.classList.add("open");
  mapPreviewTimer = setTimeout(closeLockerMapPreviews, MAP_PREVIEW_TIMEOUT);
}

/*
 * Binds Map Preview Handlers.
 * Desktop Uses Hover. Mobile Uses Click.
 */
function bindLockerMapPreviews() {
  const hoverEnabled = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.querySelectorAll(".locker-map").forEach((mapButton) => {
    if (hoverEnabled) {
      mapButton.addEventListener("mouseenter", () => {
        openLockerMapPreview(mapButton);
      });
    }

    mapButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (mapButton.classList.contains("open")) {
        closeLockerMapPreviews();
      } else {
        openLockerMapPreview(mapButton);
      }
    });
  });
}

/*
 * Embeds the Locker Form from the Links Sheet Row Named "Locker Form".
 */
function makeLockerForm() {
  // Iterate Through Links and Find Locker Form
  for (let i = 0; i < data.links.length; i++) {
    if (
      anyCellNull("links", i, ["name", "link"]) == true ||
      getCell("links", i, "show") == false ||
      String(getCell("links", i, "name")).trim() != "Locker Form"
    ) {
      continue;
    }

    // Convert Form URL to Embedded Form URL
    let formUrl = getCell("links", i, "link");
    if (formUrl.indexOf("/viewform") > -1) {
      formUrl = formUrl.split("?")[0] + "?embedded=true";
    }

    // Set Form URL and Display Form
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
