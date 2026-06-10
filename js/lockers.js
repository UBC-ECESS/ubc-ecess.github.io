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

window.addEventListener("DOMContentLoaded", () => {
  commonInit();
  fetchSheet("socials", makeSocials);
  fetchSheets(["lockers", "sets"], makeLockers);
});
