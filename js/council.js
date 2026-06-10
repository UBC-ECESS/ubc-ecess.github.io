import {
  data,
  POP_IN_VARIANCE,
  fetchSheet,
  fetchSheets,
  getCell,
  anyCellNull,
  driveUrlToThumb,
  replaceOrdinals,
  makeSocials,
  handleAllTooltips,
  commonInit,
} from "../app.js";

// COUNCIL

let councilYears = [];

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

window.addEventListener("DOMContentLoaded", () => {
  commonInit();
  fetchSheet("socials", makeSocials);
  fetchSheets(["council", "positions"], () => {
    makeYearSelect();
    makeCouncilGrid();
    handleAllTooltips();
  });

  document.querySelectorAll("#council-year").forEach((el) => {
    el.addEventListener("input", makeCouncilGrid);
  });
});
