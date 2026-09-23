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
  paintIcons,
  wireIcons,
  boot,
  CONFIG,
} from "../app.js?version=7";
import { makeEvents } from "./events.js?version=8";
function makeLinks() {
  let html = "";
  let linkIdx = 0;
  for (let i = 0; i < rows("links").length; i++) {
    if (
      lacks(rows("links")[i], ["name", "link"]) == true ||
      field(rows("links")[i], "show") == false
    ) {
      continue;
    } // skip blank entries
    let icon =
      lacks(rows("links")[i], ["icon_pack", "icon"]) == false
        ? `<i class="fa-${field(rows("links")[i], "icon_pack")} fa-${field(rows("links")[i], "icon")}"></i>`
        : "";
    html += `<li><a class="button link" href="${field(rows("links")[i], "link")}" target="_blank">${icon + field(rows("links")[i], "name")}</a></li>`;
    linkIdx++;
  }
  document.getElementById("links").innerHTML = html;
  wireIcons();
}

function makeGallery() {
  let yearsSet = new Set();
  for (let i = 0; i < rows("collections").length; i++) {
    // loops through collections entries and gets the most recent year
    if (
      field(rows("collections")[i], "name") == null ||
      field(rows("collections")[i], "show") == false
    ) {
      continue;
    }
    let currYear = Number(
      field(rows("collections")[i], "name").split(" ")[0].split("/")[0],
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
    for (let j = rows("collections").length - 1; j >= 0; j--) {
      if (
        field(rows("collections")[j], "name") == null ||
        field(rows("collections")[j], "show") == false
      ) {
        continue;
      }
      let currYear = Number(
        field(rows("collections")[j], "name").split(" ")[0].split("/")[0],
      );
      if (galleryYears[i] != currYear) {
        continue;
      }
      let collectionName = field(rows("collections")[j], "name");
      html += `<h4>${collectionName.substring(collectionName.indexOf(" ") + 1)}</h4>`;
      html += '<ul class="collection">';

      for (let k = 0; k < rows("gallery").length; k++) {
        if (
          lacks(rows("gallery")[k], ["image", "collection"]) == true ||
          field(rows("gallery")[k], "show") == false
        ) {
          continue;
        }
        if (
          field(rows("gallery")[k], "collection") !=
          field(rows("collections")[j], "name")
        ) {
          continue;
        }
        let imgSrc = photo(field(rows("gallery")[k], "image"));
        html += `<li><figure><img src="${imgSrc}" alt="" referrerpolicy="no-referrer">`;
        if (field(rows("gallery")[k], "caption") != null) {
          html += `<figcaption>${field(rows("gallery")[k], "caption")}</figcaption>`;
        }
        html += "</figure></li>";
      }
      html += "</ul>";
    }
  }

  document.getElementById("gallery").innerHTML = html;
  startGallerySlideshows();
}

function startGallerySlideshows() {
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const slideMs = 3800;

  document.querySelectorAll("#gallery .collection").forEach((list, listIndex) => {
    const slides = [...list.querySelectorAll(":scope > li")];
    if (slides.length < 2) {
      return;
    }

    const dots = document.createElement("div");
    dots.className = "collection-dots";
    dots.hidden = true;
    slides.forEach((_, slideIndex) => {
      const dot = document.createElement("span");
      dot.className = "collection-dot";
      if (slideIndex === 0) {
        dot.classList.add("is-active");
      }
      dots.appendChild(dot);
    });
    list.after(dots);

    let index = 0;
    let timer = 0;

    const paint = () => {
      const playing = !reduceQuery.matches;
      list.classList.toggle("slideshow", playing);
      dots.hidden = !playing;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle("is-active", playing && active);
        slide.toggleAttribute("aria-hidden", playing && !active);
      });
      [...dots.children].forEach((dot, slideIndex) => {
        dot.classList.toggle("is-active", slideIndex === index);
      });
    };

    const stop = () => {
      if (timer) {
        window.clearTimeout(timer);
        timer = 0;
      }
    };

    const arm = (delay) => {
      stop();
      if (reduceQuery.matches) {
        return;
      }
      timer = window.setTimeout(() => {
        index = (index + 1) % slides.length;
        paint();
        arm(slideMs);
      }, delay);
    };

    const sync = () => {
      paint();
      arm(slideMs + listIndex * 450);
    };

    reduceQuery.addEventListener("change", sync);
    sync();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  boot();
  load("socials").then(paintIcons);
  load("links").then(makeLinks);
  load(["events", "positions"]).then(() => makeEvents(Number.POSITIVE_INFINITY));
  load(["collections", "gallery"]).then(makeGallery);
});
