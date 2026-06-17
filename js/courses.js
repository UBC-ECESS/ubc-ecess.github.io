import {
  data,
  POP_IN_DELAY,
  fetchSheet,
  fetchSheets,
  getCell,
  anyCellNull,
  makeSocials,
  addButtonEvents,
  commonInit,
} from "../app.js";

/*
 * Parses Course Code to Extract Year-Level
 */
function parseYear(code) {
  const match = String(code).match(/\d+/);
  if (!match) return null;
  return Math.floor(Number(match[0]) / 100) * 100;
}

/*
 * Icon and Label Metadata for Resource Types
 */
const RESOURCE_TYPES = {
  "Website": { icon: "link", label: "Course Website" },
  "Syllabus": { icon: "file-lines", label: "Syllabus" },
  "Notes": { icon: "note-sticky", label: "Notes" },
  "Cheat Sheet": { icon: "note-sticky", label: "Cheat Sheet" },
  "Tutorials": { icon: "chalkboard-user", label: "Tutorials" },
  "Practice": { icon: "pencil", label: "Practice" },
  "Video Playlist": { icon: "video", label: "Video Playlist" },
};

function makeCourses() {
  // Build Map of Course Code to Resources from Course_Resources Sheet
  const resourcesByCode = new Map();
  for (let i = 0; i < data.course_resources.length; i++) {
    if (anyCellNull("course_resources", i, ["code", "link"])) continue;
    if (getCell("course_resources", i, "show") == false) continue;
    const code = String(getCell("course_resources", i, "code")).trim();
    if (!resourcesByCode.has(code)) resourcesByCode.set(code, []);
    resourcesByCode.get(code).push({
      link: getCell("course_resources", i, "link"),
      type: getCell("course_resources", i, "type"),
    });
  }

  // Collect unique year-levels for filter buttons
  let levelsSet = new Set();
  for (let i = 0; i < data.courses.length; i++) {
    if (
      anyCellNull("courses", i, ["code", "name"]) ||
      getCell("courses", i, "show") == false
    ) continue;
    const level = parseYear(getCell("courses", i, "code"));
    if (level != null) levelsSet.add(level);
  }

  let levels = Array.from(levelsSet).sort((a, b) => a - b);
  let yearHTML = `<li><button class="button selected" id="course-year-all-button">All</button></li>`;
  for (let lvl of levels) {
    yearHTML += `<li><button class="button" id="course-year-${lvl}-button">${lvl}-Level</button></li>`;
  }
  document.getElementById("course-years").innerHTML = yearHTML;

  document.querySelectorAll("#course-years button").forEach((el) => {
    el.addEventListener("click", () => {
      document.querySelectorAll("#course-years button").forEach((b) =>
        b.classList.remove("selected"),
      );
      el.classList.add("selected");

      const id = el.getAttribute("id");
      const lvlStr = id.replace("course-year-", "").replace("-button", "");
      filterCourses(lvlStr === "all" ? null : Number(lvlStr));
    });
  });

  let html = "";
  let idx = 0;

  for (let i = 0; i < data.courses.length; i++) {
    if (
      anyCellNull("courses", i, ["code", "name"]) ||
      getCell("courses", i, "show") == false
    ) continue;

    const code = String(getCell("courses", i, "code")).trim();
    const name = getCell("courses", i, "name");
    const level = parseYear(code);

    html += `<li class="course-item${level != null ? ` year-${level}` : ""}" style="animation-delay: ${idx * POP_IN_DELAY}ms;">`;
    if (level != null) html += `<div class="year-badge">${level}-Level</div>`;
    html += `<h2>${code}</h2>`;
    html += `<h3>${name}</h3>`;

    const resources = resourcesByCode.get(code) ?? [];
    if (resources.length === 1) {
      const meta = RESOURCE_TYPES[resources[0].type] ?? { icon: "link", label: resources[0].type ?? "Link" }; // Set Icon for Resource Type, Default to Link Icon
      html += `<a class="button link" href="${resources[0].link}" target="_blank"><i class="fa-solid fa-${meta.icon}"></i>${meta.label}</a>`;
    } else if (resources.length > 1) {
      html += `<details class="course-resources"><summary class="button link"><i class="fa-solid fa-book-open"></i>Resources <i class="fa-solid fa-chevron-down chevron"></i></summary><div class="course-resources-list">`;
      for (const res of resources) {
        const meta = RESOURCE_TYPES[res.type] ?? { icon: "link", label: res.type ?? "Link" };
        html += `<div><a class="button link" href="${res.link}" target="_blank"><i class="fa-solid fa-${meta.icon}"></i>${meta.label}</a></div>`;
      }
      html += `</div></details>`;
    }

    html += "</li>";
    idx++;
  }

  if (idx === 0) {
    html = `<li><div class="no-entries">No Courses Listed Yet...Check Back Soon!</div></li>`;
  }

  document.getElementById("courses-grid").innerHTML = html;
  addButtonEvents();
}

function filterCourses(level) {
  let courseItems = document.querySelectorAll(".course-item");
  let coursesGrid = document.querySelector("#courses-grid");

  coursesGrid.style = `min-height: ${coursesGrid.getBoundingClientRect().height}px`;
  setTimeout(() => {
    coursesGrid.style = "";
  }, 1);

  for (let i = 0; i < courseItems.length; i++) {
    courseItems[i].style = "";
    courseItems[i].style.display = "none";
    setTimeout(() => {
      if (level == null || courseItems[i].classList.contains(`year-${level}`)) {
        courseItems[i].style = `animation-delay: ${i * POP_IN_DELAY}ms;`;
        courseItems[i].style.display = "";
      }
    }, 1);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  commonInit();
  fetchSheet("socials", makeSocials);
  fetchSheets(["courses", "course_resources"], makeCourses);
});
