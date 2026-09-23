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
import { startContactForm } from "./contact.js?version=10";

function latestCouncilYear() {
  let latest = null;
  for (let i = 0; i < rows("council").length; i++) {
    if (field(rows("council")[i], "year") == null) break;
    const currYear = Number(field(rows("council")[i], "year").split("/")[0]);
    if (Number.isNaN(currYear)) continue;
    if (latest == null || currYear > latest) latest = currYear;
  }
  return latest;
}

function makeCouncilGrid() {
  const selectedYear = latestCouncilYear();

  let html = "";
  for (let p = 0; p < rows("positions").length; p++) {
    // looping through the positions sheet allows for heirarchical ordering even if the 'Council' sheet entries are out of order
    for (let i = 0; i < rows("council").length; i++) {
      if (field(rows("council")[i], "year") == null) {
        break;
      } // skip blank entries
      let currYear = Number(field(rows("council")[i], "year").split("/")[0]); // current year
      if (isNaN(currYear) == true) {
        continue;
      }
      let currPositions = field(rows("council")[i], "position").split(", "); // creates an array of positions held by the member
      if (
        currYear == selectedYear &&
        currPositions[0] == field(rows("positions")[p], "position")
      ) {
        // heirarchical ordering done by *first* position in list
        html += `<li class="council-member visible">`;

        if (field(rows("council")[i], "photo") != null) {
          html += `<img src="${photo(field(rows("council")[i], "photo"))}" alt="${field(rows("council")[i], "name")}">`; // photo
        } else {
          html += '<i class="fa-solid fa-user"></i>';
        }

        html += `<h2>${ordinal(field(rows("council")[i], "name"))}</h2>`;
        html += "<h3>";
        for (let j = 0; j < currPositions.length; j++) {
          for (let k = 0; k < rows("positions").length; k++) {
            if (currPositions[j] == field(rows("positions")[k], "position")) {
              html += `<span>${ordinal(currPositions[j])}<i class="fa-solid fa-circle-info"><div class="tooltip">${ordinal(field(rows("positions")[k], "responsibilities"))}</div></i></span>`;
              break;
            }
          }
          if (j + 1 < currPositions.length) {
            // add comma if more than one position, and not at last one
            html += ", ";
          }
        }
        html += "</h3>";
        if (currYear == selectedYear) {
          let firstEmail = true; // in the event of no emails, we dont want to create empty lists
          for (let j = 0; j < currPositions.length; j++) {
            for (let k = 0; k < rows("positions").length; k++) {
              if (currPositions[j] == field(rows("positions")[k], "position")) {
                if (field(rows("positions")[k], "email") != null) {
                  if (firstEmail == true) {
                    html += "<ul>";
                    firstEmail = false;
                  }
                  html += "<li>";
                  html += `<a class="button link" href="mailto:${field(rows("positions")[k], "email")}">${field(rows("positions")[k], "email")}</a>`;
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

function makeOpenings() {
  let execHTML = "";
  let exoHTML = "";
  let posCount = 0;
  for (let i = 0; i < rows("positions").length; i++) {
    if (
      lacks(rows("positions")[i], ["position", "type", "responsibilities"]) == true ||
      field(rows("positions")[i], "open") == false
    ) {
      continue;
    }
    posCount++;
    const item = `<li><div>${ordinal(field(rows("positions")[i], "position"))}</div><i class="fa-solid fa-circle-info"><div class="tooltip">${field(rows("positions")[i], "responsibilities")}</div></i></li>`;
    if (field(rows("positions")[i], "type") == "Executive") execHTML += item;
    else exoHTML += item;
  }
  if (posCount == 0) {
    execHTML = `<li><div class="no-entries">No openings right now. Check back later!</div></li>`;
  }
  document.getElementById("exec-openings").innerHTML = execHTML;
  document.getElementById("exo-openings").innerHTML = exoHTML;
}

window.addEventListener("DOMContentLoaded", () => {
  boot();
  load("socials").then(paintIcons);
  load(["council", "positions"]).then(() => {
    makeCouncilGrid();
    makeOpenings();
    startContactForm();
    placeTips();
  });

});
