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

function fillTopics() {
  let html = `<option value="" selected disabled>Select Topic</option>`;
  for (let i = 0; i < rows("contacts").length; i++) {
    if (
      field(rows("contacts")[i], "option") == null ||
      field(rows("contacts")[i], "show") == false
    ) {
      continue;
}
    html += `<option value="${field(rows("contacts")[i], "option")}">${field(rows("contacts")[i], "option")}</option>`;
  }

  document.getElementById("form-key").setAttribute("value", "");
  document
    .getElementById("form-subject")
    .setAttribute("value", "Website Contact Message");

  const topicMenu = document.getElementById("form-type");
  topicMenu.innerHTML = html;
  setSendEnabled(false);
}

function setSendEnabled(enabled) {
  document.getElementById("send").disabled = !enabled;
}

function applyTopic() {
  const topicMenu = document.getElementById("form-type");
  const type = topicMenu.value;
  if (type == "") {
    document.getElementById("form-key").setAttribute("value", "");
    document.getElementById("form-subject").setAttribute("value", "Website Contact Message");
    setSendEnabled(false);
    return;
  }

  let key;
  for (let i = 0; i < rows("contacts").length; i++) {
    if (
      field(rows("contacts")[i], "option") == null ||
      field(rows("contacts")[i], "show") == false
    ) {
      continue;
}
    if (field(rows("contacts")[i], "option") == type) {
      let searchEmail =
        field(rows("contacts")[i], "override") != null
          ? field(rows("contacts")[i], "override")
          : field(rows("contacts")[i], "email") != null
            ? field(rows("contacts")[i], "email")
            : field(rows("contacts")[0], "email"); // take preference for override, otherwise use regular email, if both blank, default to first entry
      for (let j = 0; j < rows("positions").length; j++) {
        if (
          field(rows("positions")[j], "email") != null &&
          field(rows("positions")[j], "email") == searchEmail
        ) {
          key =
            field(rows("positions")[j], "key") != null
              ? field(rows("positions")[j], "key")
              : field(rows("positions")[0], "key");
          break;
        }
      }
    }
  }
  const subject = `Website Contact Message (${type})`;

  document.getElementById("form-key").setAttribute("value", key?.trim() ?? "");
  document.getElementById("form-subject").value = subject;
  setSendEnabled(true);
}

export function startContactForm() {
  load(["contacts", "positions"]).then(fillTopics);
  document.getElementById("form-type").addEventListener("input", applyTopic);
}
