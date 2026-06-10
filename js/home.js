import {
  data,
  CONFIG,
  POP_IN_DELAY,
  POP_IN_VARIANCE,
  fetchSheet,
  fetchSheets,
  getCell,
  anyCellNull,
  driveUrlToThumb,
  replaceOrdinals,
  makeSocials,
  handleAllTooltips,
  addButtonEvents,
  commonInit,
} from "../app.js";
import { makeEvents } from "./events.js";

// HOME

function makeOpenings() {
  let execIdx = 0;
  let exoIdx = 1;

  let execHTML = "";
  let exoHTML = "";

  let posCount = 0;
  for (let i = 0; i < data.positions.length; i++) {
    if (
      anyCellNull("positions", i, ["position", "type", "responsibilities"]) ==
        true ||
      getCell("positions", i, "open") == false
    ) {
      continue;
    } // skip blank entries
    posCount++;
    if (getCell("positions", i, "type") == "Executive") {
      execHTML += `<li style="animation-delay: ${execIdx * POP_IN_DELAY}ms;"><div>${replaceOrdinals(getCell("positions", i, "position"))}</div><i class="fa-solid fa-circle-info"><div class="tooltip">${getCell("positions", i, "responsibilities")}</div></i></li>`;
      execIdx++;
    } else {
      exoHTML += `<li style="animation-delay: ${exoIdx * POP_IN_DELAY}ms;"><div>${replaceOrdinals(getCell("positions", i, "position"))}</div><i class="fa-solid fa-circle-info"><div class="tooltip">${getCell("positions", i, "responsibilities")}</div></i></li>`;
      exoIdx++;
    }
  }

  if (posCount == 0) {
    execHTML = `<li><div class="no-entries">No openings right now. Check back later!</div></li>`;
  }

  document.getElementById("exec-openings").innerHTML = execHTML;
  document.getElementById("exo-openings").innerHTML = exoHTML;
}

function makeLinks() {
  let html = "";
  let linkIdx = 0;
  for (let i = 0; i < data.links.length; i++) {
    if (
      anyCellNull("links", i, ["name", "link"]) == true ||
      getCell("links", i, "show") == false
    ) {
      continue;
    } // skip blank entries
    let icon =
      anyCellNull("links", i, ["icon_pack", "icon"]) == false
        ? `<i class="fa-${getCell("links", i, "icon_pack")} fa-${getCell("links", i, "icon")}"></i>`
        : "";
    html += `<li style="animation-delay: ${linkIdx * POP_IN_DELAY}ms;"><a class="button link" href="${getCell("links", i, "link")}" target="_blank">${icon + getCell("links", i, "name")}</a></li>`;
    linkIdx++;
  }
  document.getElementById("links").innerHTML = html;
  addButtonEvents();
}

function makeGallery() {
  let yearsSet = new Set();
  for (let i = 0; i < data.collections.length; i++) {
    // loops through collections entries and gets the most recent year
    if (
      getCell("collections", i, "name") == null ||
      getCell("collections", i, "show") == false
    ) {
      continue;
    }
    let currYear = Number(
      getCell("collections", i, "name").split(" ")[0].split("/")[0],
    );
    yearsSet.add(currYear);
  }

  let galleryYears = [];
  for (let el of yearsSet) {
    galleryYears.push(el);
  }

  galleryYears = galleryYears.sort().reverse();

  let html = "";

  for (let i = 0; i < galleryYears.length; i++) {
    html += `<h3>${galleryYears[i]}–${galleryYears[i] + 1}</h3>`;
    for (let j = data.collections.length - 1; j >= 0; j--) {
      if (
        getCell("collections", j, "name") == null ||
        getCell("collections", j, "show") == false
      ) {
        continue;
      }
      let currYear = Number(
        getCell("collections", j, "name").split(" ")[0].split("/")[0],
      );
      if (galleryYears[i] != currYear) {
        continue;
      }
      let collectionName = getCell("collections", j, "name");
      html += `<h4>${collectionName.substring(collectionName.indexOf(" ") + 1)}</h4>`;
      html += '<ul class="collection">';

      for (let k = 0; k < data.gallery.length; k++) {
        if (
          anyCellNull("gallery", k, ["image", "collection"]) == true ||
          getCell("gallery", k, "show") == false
        ) {
          continue;
        }
        if (
          getCell("gallery", k, "collection") !=
          getCell("collections", j, "name")
        ) {
          continue;
        }
        let imgSrc = driveUrlToThumb(getCell("gallery", k, "image"));
        html += `<li style="animation-delay: ${Math.random() * POP_IN_VARIANCE}ms;"><figure><img src="${imgSrc}">`;
        if (getCell("gallery", k, "caption") != null) {
          html += `<figcaption>${getCell("gallery", k, "caption")}</figcaption>`;
        }
        html += "</figure></li>";
      }
      html += "</ul>";
    }
  }

  document.getElementById("gallery").innerHTML = html;
}

window.addEventListener("DOMContentLoaded", () => {
  commonInit();
  fetchSheet("socials", makeSocials);
  fetchSheet("links", makeLinks);
  fetchSheet("positions", () => {
    makeOpenings();
    handleAllTooltips();
  });
  // fetchSheet('sponsors', makeSponsors);
  fetchSheets(["events", "positions"], () => {
    makeEvents(4);
  });
  fetchSheets(["collections", "gallery"], makeGallery);
});
