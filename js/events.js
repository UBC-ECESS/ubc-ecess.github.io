import {
  data,
  CONFIG,
  POP_IN_VARIANCE,
  fetchSheet,
  fetchSheets,
  getCell,
  anyCellNull,
  anyCellFilled,
  dateToUTC,
  dateToString,
  driveUrlToThumb,
  makeSocials,
  addButtonEvents,
  commonInit,
} from "../app.js";

// EVENTS

export function makeEvents(num) {
  let upcoming = new Map();
  let today = Date.now() - 1000 * 60 * 60 * 24;
  for (let i = 0; i < data.events.length; i++) {
    if (
      getCell("events", i, "show") == false ||
      anyCellNull("events", i, ["date", "name"]) == true
    ) {
      continue;
    } // skip blank entries
    let utc = dateToUTC(getCell("events", i, "date"));
    if (utc < today) {
      continue;
    }
    upcoming.set(i, utc);
  }

  if (upcoming.size == 0) {
    let html = `<li><div class="no-entries">No upcoming events. See you next term!</div></li>`;
    document.getElementById("events").innerHTML = html;
    addButtonEvents();
    return;
  }

  let sorted = Array.from(upcoming)
    .sort((a, b) => a[1] - b[1])
    .slice(0, Math.min(num, Array.from(upcoming).length));

  let html = "";
  for (let i = 0; i < sorted.length; i++) {
    let currEvent = sorted[i][0];
    html += `<li class="event" style="animation-delay: ${Math.random() * POP_IN_VARIANCE}ms;">`;

    html += "<div>";
    if (getCell("events", currEvent, "image") != null) {
      html += `<img src="${driveUrlToThumb(getCell("events", currEvent, "image"))}" alt="${getCell("events", currEvent, "name")}">`;
    } else {
      html += '<i class="fa-solid fa-gear"></i>';
    }

    if (getCell("events", currEvent, "instagram") != null) {
      html += `<a class="button link icon" href="${getCell("events", currEvent, "instagram")}" target="_blank"><i class="fa-brands fa-instagram" style="transform: scale(1.25);"></i></a>`;
    }
    html += "</div>";

    html += `<h2>${getCell("events", currEvent, "name")}</h2>`;
    html += '<ul class="event-dtl">';
    html += `<li><i class="fa-solid fa-calendar"></i>${dateToString(getCell("events", currEvent, "date"))}</li>`;
    let eventTime =
      getCell("events", currEvent, "start", true) == null
        ? "TBD"
        : getCell("events", currEvent, "start", true) +
          (getCell("events", currEvent, "end", true) == null
            ? ""
            : `–${getCell("events", currEvent, "end", true)}`);
    html += `<li><i class="fa-solid fa-clock"></i>${eventTime}</li>`;
    html += `<li><i class="fa-solid fa-location-dot"></i>${getCell("events", currEvent, "location") != null ? getCell("events", currEvent, "location") : "TBD"}</li>`;
    html += "</ul>";
    if (anyCellFilled("events", currEvent, ["contacts", "rsvp", "calendar"])) {
      html += '<ul class="event-links">';

      html +=
        getCell("events", currEvent, "rsvp") != null
          ? `<li><a class="button link" href="${getCell("events", currEvent, "rsvp")}" target="_blank"><i class="fa-solid fa-reply"></i>RSVP</a></li>`
          : "";

      html +=
        getCell("events", currEvent, "calendar") != null
          ? `<li><a class="button link" href="${getCell("events", currEvent, "calendar")}" target="_blank"><i class="fa-brands fa-google"></i>Add to Calendar</a></li>`
          : "";

      if (getCell("events", currEvent, "contacts") != null) {
        let eventContacts = getCell("events", currEvent, "contacts").split(
          ", ",
        );

        let href = "mailto:";
        for (let i = 0; i < eventContacts.length; i++) {
          if (i > 0) {
            href += ",";
          }
          for (let j = 0; j < data.positions.length; j++) {
            if (eventContacts[i] == getCell("positions", j, "position")) {
              href += getCell("positions", j, "email");
            }
          }
        }
        href += `?subject=${CONFIG.siteNameFull} ${getCell("events", currEvent, "name")}`;

        html += `<li><a class="button link" href="${href}" target="_blank"><i class="fa-solid fa-envelope"></i>Contact Organizers</a></li>`;
      }

      html += "</ul>";
    }
    html += "</li>";
  }
  document.getElementById("events").innerHTML = html;
  addButtonEvents();
}

window.addEventListener("DOMContentLoaded", () => {
  commonInit();
  fetchSheet("socials", makeSocials);
  fetchSheets(["events", "positions"], () => {
    makeEvents(Number.POSITIVE_INFINITY);
  });
});
