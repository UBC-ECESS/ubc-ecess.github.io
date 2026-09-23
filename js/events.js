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

export function listUpcoming(num) {
  let upcoming = new Map();
  const dayMs = 24 * 60 * 60 * 1000;
  let today = Date.now() - dayMs;
  for (let i = 0; i < rows("events").length; i++) {
    if (
      field(rows("events")[i], "show") == false ||
      lacks(rows("events")[i], ["date", "name"]) == true
    ) {
      continue;
}
    let utc = sheetUtc(field(rows("events")[i], "date"));
    if (utc < today) {
      continue;
    }
    upcoming.set(i, utc);
  }

  if (upcoming.size == 0) {
    const empty = document.getElementById("events");
    empty.innerHTML = `<li><div class="empty-note">Nothing coming up. See you next term.</div></li>`;
    wireIcons();
    return;
  }

  let sorted = Array.from(upcoming)
    .sort((a, b) => a[1] - b[1])
    .slice(0, num);

  let html = "";
  for (const pair of sorted) {
    let currEvent = pair[0];
    html += `<li class="event">`;

    html += "<div>";
    if (field(rows("events")[currEvent], "image") != null) {
      html += `<img src="${photo(field(rows("events")[currEvent], "image"))}" alt="${field(rows("events")[currEvent], "name")}">`;
    } else {
      html += '<i class="fa-solid fa-calendar-day"></i>';
    }

    const hoverRsvpLabel = field(rows("events")[currEvent], "rsvp_label");
    const hoverRsvpLink = field(rows("events")[currEvent], "rsvp");
    const validHoverRsvpLink = getValidEventUrl(hoverRsvpLink);
    const hoverInstagramLink = field(rows("events")[currEvent], "instagram");
    const validHoverInstagramLink = getValidEventUrl(hoverInstagramLink);
    if (validHoverRsvpLink || validHoverInstagramLink) {
      html += '<div class="event-quick">';

      if (validHoverRsvpLink) {
        html += `<a class="button link icon" href="${validHoverRsvpLink}" target="_blank"><i class="fa-solid ${getRsvpIconClass(hoverRsvpLabel, validHoverRsvpLink)}"></i></a>`;
      }

      if (validHoverInstagramLink) {
        html += `<a class="button link icon" href="${validHoverInstagramLink}" target="_blank"><i class="fa-brands fa-instagram" style="transform: scale(1.25);"></i></a>`;
      }

      html += "</div>";
    }
    html += "</div>";

    html += `<h2>${field(rows("events")[currEvent], "name")}</h2>`;
    html += '<ul class="event-when">';
    html += `<li class="event-date">${writtenDate(field(rows("events")[currEvent], "date"))}</li>`;
    let eventTime =
      field(rows("events")[currEvent], "start", true) == null
        ? "TBD"
        : field(rows("events")[currEvent], "start", true) +
          (field(rows("events")[currEvent], "end", true) == null
            ? ""
            : `–${field(rows("events")[currEvent], "end", true)}`);
    let eventPlace =
      field(rows("events")[currEvent], "location") != null
        ? field(rows("events")[currEvent], "location")
        : "TBD";
    html += `<li class="event-meta">${eventTime} · ${eventPlace}</li>`;
    html += "</ul>";
    if (present(rows("events")[currEvent], ["contacts", "rsvp", "calendar"])) {
      html += '<ul class="event-actions">';

      const rsvpLink = field(rows("events")[currEvent], "rsvp");
      const validRsvpLink = getValidEventUrl(rsvpLink);
      const calendarLink = field(rows("events")[currEvent], "calendar");
      const validCalendarLink = getValidEventUrl(calendarLink);

      html +=
        validRsvpLink
          ? `<li><a class="button link" href="${validRsvpLink}" target="_blank"><i class="fa-solid ${getRsvpIconClass(field(rows("events")[currEvent], "rsvp_label"), validRsvpLink)}"></i>RSVP</a></li>`
          : "";

      html +=
        validCalendarLink
          ? `<li><a class="button link" href="${validCalendarLink}" target="_blank"><i class="fa-brands fa-google"></i>Add to Calendar</a></li>`
          : "";

      if (field(rows("events")[currEvent], "contacts") != null) {
        const titles = field(rows("events")[currEvent], "contacts").split(", ");
        const emails = titles.flatMap((title) => {
          const role = rows("positions").find((row) => field(row, "position") === title);
          return role && field(role, "email") ? [field(role, "email")] : [];
        });
        const subject = encodeURIComponent(`${CONFIG.siteNameFull} ${field(rows("events")[currEvent], "name")}`);
        const href = `mailto:${emails.join(",")}?subject=${subject}`;
        html += `<li><a class="button link" href="${href}" target="_blank"><i class="fa-solid fa-envelope"></i>Email organizers</a></li>`;
      }

      html += "</ul>";
    }
    html += "</li>";
  }
  document.getElementById("events").replaceChildren();
  document.getElementById("events").insertAdjacentHTML("beforeend", html);
  wireIcons();
}

function getRsvpIconClass(label = "", url = "") {
  const normalizedLabel = String(label || "").toLowerCase();
  if (normalizedLabel.includes("ticket") || normalizedLabel.includes("eventbrite")) {
    return "fa-ticket";
  }

  const normalizedUrl = String(url || "").toLowerCase();
  if (normalizedUrl.includes("eventbrite") || normalizedUrl.includes("ticket")) {
    return "fa-ticket";
  }

  return "fa-reply";
}

function getValidEventUrl(url) {
  const value = String(url || "").trim();
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return "";
}

