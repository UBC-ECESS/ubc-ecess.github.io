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
import { startContactForm } from "./contact.js?version=12";

function councilYears() {
  const years = [];
  for (let i = 0; i < rows("council").length; i++) {
    if (field(rows("council")[i], "year") == null) break;
    const currYear = Number(field(rows("council")[i], "year").split("/")[0]);
    if (Number.isNaN(currYear) || years.includes(currYear)) continue;
    years.push(currYear);
  }
  years.sort((a, b) => b - a);
  return years;
}

function memberCard(row, titles, showEmail) {
  let html = `<li class="council-member visible">`;
  if (field(row, "photo") != null) {
    html += `<img src="${photo(field(row, "photo"))}" alt="${field(row, "name")}">`;
  } else {
    html += `<i class="fa-solid fa-user" aria-hidden="true"></i>`;
  }
  html += `<h2>${ordinal(field(row, "name"))}</h2><h3>`;
  titles.forEach((title, j) => {
    const role = rows("positions").find((entry) => field(entry, "position") === title);
    if (role) {
      html += `<span class="role"><span class="role-name">${ordinal(title)}</span><i class="fa-solid fa-circle-info"><div class="tooltip">${ordinal(field(role, "responsibilities"))}</div></i></span>`;
    }
    if (j + 1 < titles.length) html += ", ";
  });
  html += `</h3>`;
  if (showEmail) {
    const emails = [];
    titles.forEach((title) => {
      const role = rows("positions").find((entry) => field(entry, "position") === title);
      const address = role ? field(role, "email") : null;
      if (address != null && !emails.includes(address)) emails.push(address);
    });
    if (emails.length) {
      html += `<ul>${emails.map((address) => `<li><a class="button link" href="mailto:${address}">${address}</a></li>`).join("")}</ul>`;
    }
  }
  html += `</li>`;
  return html;
}

function renderPeople() {
  const years = councilYears();
  const latest = years[0] ?? null;
  let html = "";
  years.forEach((year) => {
    let cards = "";
    for (let p = 0; p < rows("positions").length; p++) {
      for (let i = 0; i < rows("council").length; i++) {
        if (field(rows("council")[i], "year") == null) break;
        const currYear = Number(field(rows("council")[i], "year").split("/")[0]);
        if (Number.isNaN(currYear)) continue;
        const titles = field(rows("council")[i], "position").split(", ");
        if (currYear == year && titles[0] == field(rows("positions")[p], "position")) {
          cards += memberCard(rows("council")[i], titles, year == latest);
        }
      }
    }
    if (!cards) return;
    html += `<section class="council-year"><h2>${year}–${year + 1}</h2><ul>${cards}</ul></section>`;
  });
  document.getElementById("people").innerHTML = html;
}

function renderRoles() {
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
    execHTML = `<li><div class="empty-note">No open roles at the moment.</div></li>`;
  }
  const execList = document.getElementById("role-exec");
  const exoList = document.getElementById("role-other");
  execList.innerHTML = execHTML;
  exoList.innerHTML = exoHTML;
}

window.addEventListener("DOMContentLoaded", () => {
  boot();
  load("socials").then(paintIcons);
  load(["council", "positions"]).then(() => {
    renderPeople();
    renderRoles();
    startContactForm();
    placeTips();
  });

});
