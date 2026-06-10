import {
  data,
  fetchSheet,
  fetchSheets,
  getCell,
  anyCellNull,
  makeSocials,
  commonInit,
} from "../app.js";

// CONTACT

function makeContactOptions() {
  let html = "";
  for (let i = 0; i < data.contacts.length; i++) {
    if (
      getCell("contacts", i, "option") == null ||
      getCell("contacts", i, "show") == false
    ) {
      continue;
    } // skip blank entries
    html += `<option value="${getCell("contacts", i, "option")}">${getCell("contacts", i, "option")}</option>`;
  }

  let key;
  for (let i = 0; i < data.positions.length; i++) {
    if (
      getCell("positions", i, "email") != null &&
      getCell("contacts", 0, "email") == getCell("positions", i, "email")
    ) {
      key = getCell("positions", i, "key");
      break;
    }
  }

  document.getElementById("form-key").setAttribute("value", key?.trim() ?? "");
  document
    .getElementById("form-subject")
    .setAttribute(
      "value",
      `Website Contact Message (${getCell("contacts", 0, "option")})`,
    );

  document.getElementById("form-type").innerHTML = html;
}

function updateContactForm() {
  let selectObj = document.getElementById("form-type");
  let type = selectObj.options[selectObj.selectedIndex].value;

  let key;
  for (let i = 0; i < data.contacts.length; i++) {
    if (
      getCell("contacts", i, "option") == null ||
      getCell("contacts", i, "show") == false
    ) {
      continue;
    } // skip blank entries
    if (getCell("contacts", i, "option") == type) {
      let searchEmail =
        getCell("contacts", i, "override") != null
          ? getCell("contacts", i, "override")
          : getCell("contacts", i, "email") != null
            ? getCell("contacts", i, "email")
            : getCell("contacts", 0, "email"); // take preference for override, otherwise use regular email, if both blank, default to first entry
      for (let j = 0; j < data.positions.length; j++) {
        if (
          getCell("positions", j, "email") != null &&
          getCell("positions", j, "email") == searchEmail
        ) {
          key =
            getCell("positions", j, "key") != null
              ? getCell("positions", j, "key")
              : getCell("positions", 0, "key"); // lowermost default to president
          break;
        }
      }
    }
  }
  let subject = `Website Contact Message (${type})`;

  document.getElementById("form-key").setAttribute("value", key?.trim() ?? "");
  document.getElementById("form-subject").setAttribute("value", subject);
}

window.addEventListener("DOMContentLoaded", () => {
  commonInit();
  fetchSheet("socials", makeSocials);
  fetchSheets(["contacts", "positions"], makeContactOptions);

  document.querySelectorAll("#form-type").forEach((el) => {
    el.addEventListener("input", updateContactForm);
  });
});
