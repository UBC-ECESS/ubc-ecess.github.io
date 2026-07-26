/*
 * Google Apps Script for Syncing Upcoming Calendar Events to Events Sheet
 *
 * SETUP INSTRUCTIONS:
 * 1. Open Events Sheet in Website Database Spreadsheet.
 * 2. Go to Extensions → Apps Script and Update Code.
 * 3. Run testCalendarSync() Once and Approve Permissions.
 * 4. Run installCalendarSyncTrigger() Once to Set Up Daily Sync.
 *
 * CONFIGURATION:
  * - PUBLIC_SHEET_ID: Minimal Public Interface, Read-Only for Website.
 * - CALENDAR_ID: Source ECESS Google Calendar ID.
 * - IMAGES_FOLDER_ID: Drive Folder for Downloaded Event Images.
 *
 * This Script Transforms Calendar Data Into a Website Events Interface:
 * - Matches Rows by Calendar Link (Stable Event ID URL)
 *    - Updates Existing Rows
 *    - Appends New Rows
 *    - Removes Stale Rows
 * - Extracts Optional Description Fields: Image, Link, Instagram.
 * - Downloads Image URLs to Drive and Stores Drive File Links.
 *    - Removes Images Relating to Stale Rows.
 */

const CALENDAR_ID = "4evjt29geb1jp20kq20fodu31s@group.calendar.google.com";
const IMAGES_FOLDER_ID = "1Swt-X7DqkXkmuaM8sCBWLDtuYA7wGwHt";

/*
 * Syncs Calendar Data from ECESS Google Calendar to Website Database
 *
 * Required Columns: [Date, Start, End, Name, Location, Calendar link, Show]
 * Optional Columns: [Image, RSVP link, RSVP label, Instagram link]
 */
function syncCalendarToDB() {
  try {
    const publicDoc = SpreadsheetApp.openById(PUBLIC_SHEET_ID);
    const eventsSheet = publicDoc.getSheetByName("Events");
    if (!eventsSheet) {
      Logger.log("ERROR: No `Events` Sheet in Website Database");
      return;
    }

    const values = eventsSheet.getRange(1, 1, eventsSheet.getLastRow(), eventsSheet.getLastColumn()).getValues(); // Read All Data
    const headers = values[0]; // First Row

    const calendarLinkIndex = headers.indexOf("Calendar link");
    const dateIndex = headers.indexOf("Date");
    const startIndex = headers.indexOf("Start");
    const endIndex = headers.indexOf("End");
    const nameIndex = headers.indexOf("Name");
    const locationIndex = headers.indexOf("Location");
    const showIndex = headers.indexOf("Show");
    const imageIndex = headers.indexOf("Image");
    const labelIndex = headers.indexOf("RSVP label");
    const linkIndex = headers.indexOf("RSVP link");
    const instagramIndex = headers.indexOf("Instagram link");

    if (
      calendarLinkIndex === -1 ||
      dateIndex === -1 ||
      startIndex === -1 ||
      endIndex === -1 ||
      nameIndex === -1 ||
      locationIndex === -1 ||
      showIndex === -1
    ) {
      Logger.log("ERROR: Missing 1+ Required Columns in `Events` Sheet");
      return;
    }

    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      Logger.log("ERROR: Unable to Access Calendar with ID " + CALENDAR_ID);
      return;
    }

    const today = new Date();
    const yearDuration = 365 * 24 * 60 * 60 * 1000; // 1 Year (ms)
    const windowEnd = new Date(today.getTime() + yearDuration);
    const upcomingEvents = calendar.getEvents(today, windowEnd);

    const currentEventsByCalendarLink = {};
    upcomingEvents.forEach(function(event) { // Map Upcoming Events by Calendar Link
      currentEventsByCalendarLink[getCalendarEventUrl(event, CALENDAR_ID)] = event;
    });

    // Sync Existing Calendar-Sourced Rows: Update Current Matches and Remove Stale Rows
    const claimedLinks = syncExistingCalendarRows(
      eventsSheet,
      currentEventsByCalendarLink,
      calendarLinkIndex,
      dateIndex,
      startIndex,
      endIndex,
      nameIndex,
      locationIndex,
      imageIndex,
      labelIndex,
      linkIndex,
      instagramIndex
    );

    // Add New Upcoming Events Not Yet Represented in the Sheet
    addCalendarEvents(
      eventsSheet,
      headers,
      upcomingEvents,
      claimedLinks,
      dateIndex,
      startIndex,
      endIndex,
      nameIndex,
      locationIndex,
      calendarLinkIndex,
      showIndex,
      imageIndex,
      labelIndex,
      linkIndex,
      instagramIndex
    );

    if (imageIndex !== -1) { // If the Image Column Exists, Clean Up the Calendar Image Folder
      cleanupCalendarImageFolder(eventsSheet, imageIndex);
    }

    Logger.log("✓ Sync Completed Successfully at " + new Date());
    Logger.log("✓ Processed " + upcomingEvents.length + " Upcoming Event(s)");

  } catch (error) {
    Logger.log("✗ Sync Failed: " + error.message);
    sendCalendarErrorNotification(error);
  }
}

/*
 * Syncs Existing Calendar-Sourced Rows.
 * Updates Current Matches and Removes Rows for Missing/Past Events.
 * Returns the Set of Links Already Claimed in the Sheet.
 */
function syncExistingCalendarRows(
  eventsSheet,
  currentEventsByCalendarLink,
  calendarLinkIndex,
  dateIndex,
  startIndex,
  endIndex,
  nameIndex,
  locationIndex,
  imageIndex,
  labelIndex,
  linkIndex,
  instagramIndex
) {
  const claimedLinks = new Set();
  const lastRow = eventsSheet.getLastRow();
  if (lastRow < 2) return claimedLinks; // No Data Rows to Process

  // Read Data Rows from the Sheet (Excluding Header Row)
  const data = eventsSheet.getRange(2, 1, lastRow - 1, eventsSheet.getLastColumn()).getValues();

  const rowsToDelete = [];
  data.forEach(function(row, i) {
    const rowNum = i + 2; // Actual Row Number in the Sheet
    const link = row[calendarLinkIndex];
    if (!link) return;

    // Check if the Calendar Link Exists in the Current Events Mapping
    const event = currentEventsByCalendarLink[link];
    if (event && !claimedLinks.has(link)) {
      claimedLinks.add(link);
      const start = event.getStartTime();
      const end = event.getEndTime();
      const description = event.getDescription() || "";

      eventsSheet.getRange(rowNum, dateIndex + 1).setValue(start);
      eventsSheet.getRange(rowNum, startIndex + 1).setValue(start);
      eventsSheet.getRange(rowNum, endIndex + 1).setValue(event.isAllDayEvent() ? "" : end);
      eventsSheet.getRange(rowNum, nameIndex + 1).setValue(event.getTitle());
      eventsSheet.getRange(rowNum, locationIndex + 1).setValue(event.getLocation() || "");

      // Process Event Image from Description
      if (imageIndex !== -1) {
        const imageUrl = extractCalendarLabeledUrl(description, "Image");
        if (imageUrl) {
          const driveUrl = downloadCalendarImageToDrive(imageUrl, event.getTitle());
          eventsSheet.getRange(rowNum, imageIndex + 1).setValue(driveUrl || "");
        } else {
          eventsSheet.getRange(rowNum, imageIndex + 1).setValue("");
        }
      }

      // Process Event Labels and Links from Description
      if (linkIndex !== -1) {
        const rsvpInfo = extractCalendarRsvpInfo(description);
        eventsSheet.getRange(rowNum, linkIndex + 1).setValue(rsvpInfo.url || "");
        if (labelIndex !== -1) {
          eventsSheet.getRange(rowNum, labelIndex + 1).setValue(rsvpInfo.label || "");
        }
      }

      // Process Event Instagram from Description
      if (instagramIndex !== -1) {
        const instagramUrl = extractCalendarLabeledUrl(description, "Instagram");
        eventsSheet.getRange(rowNum, instagramIndex + 1).setValue(instagramUrl || "");
      }
    } else {
      rowsToDelete.push(rowNum); // Stale or Duplicate Row
    }
  });

  // Sort in Descending Order To Avoid Row Shifting Issues During Deletion
  // E.g. Deleting Rows [5, 3, 2] Keeps Remaining Row Order
  rowsToDelete.sort(function(a, b) {
    return b - a;
  });

  rowsToDelete.forEach(function(rowNum) {
    eventsSheet.deleteRow(rowNum);
  });

  if (rowsToDelete.length > 0) {
    Logger.log("Removed " + rowsToDelete.length + " Stale/Duplicate Row(s).");
  }

  return claimedLinks;
}

/*
 * Constructs a Direct URL to a Google Calendar Event Using Event Object and Calendar ID.
 */
function getCalendarEventUrl(event, calendarId) {
  const id = event.getId().split("@")[0];
  return "https://calendar.google.com/calendar/event?eid=" +
    Utilities.base64Encode(id + " " + calendarId).replace(/=+$/, "");
}

/*
 * Adds New Upcoming Events Not Yet Represented in the Sheet.
 */
function addCalendarEvents(
  eventsSheet,
  headers,
  upcomingEvents,
  claimedLinks,
  dateIndex,
  startIndex,
  endIndex,
  nameIndex,
  locationIndex,
  calendarLinkIndex,
  showIndex,
  imageIndex,
  labelIndex,
  linkIndex,
  instagramIndex
) {
  const newRows = [];

  upcomingEvents.forEach(function(event) { // Iterate Over Each Upcoming Event
    const link = getCalendarEventUrl(event, CALENDAR_ID);
    if (claimedLinks.has(link)) return; // Skip Events Already Represented in the Sheet

    const start = event.getStartTime();
    const end = event.getEndTime();
    const description = event.getDescription() || "";

    const row = new Array(headers.length).fill("");

    // Populate Row with Date and Time Information
    row[dateIndex] = start;
    row[startIndex] = start;
    row[endIndex] = event.isAllDayEvent() ? "" : end;

    // Populate Row with Event Details
    row[nameIndex] = event.getTitle();
    row[locationIndex] = event.getLocation() || "";
    row[calendarLinkIndex] = link;
    row[showIndex] = true;

    // Process Event Image from Description
    if (imageIndex !== -1) {
      const imageUrl = extractCalendarLabeledUrl(description, "Image");
      if (imageUrl) {
        const driveUrl = downloadCalendarImageToDrive(imageUrl, event.getTitle());
        if (driveUrl) row[imageIndex] = driveUrl;
      }
    }

    // Process Event Labels and Links from Description
    if (linkIndex !== -1) {
      const rsvpInfo = extractCalendarRsvpInfo(description);
      if (rsvpInfo.url) row[linkIndex] = rsvpInfo.url;
      if (labelIndex !== -1 && rsvpInfo.label) {
        row[labelIndex] = rsvpInfo.label;
      }
    }

    // Process Event Instagram from Description
    if (instagramIndex !== -1) {
      const instagramUrl = extractCalendarLabeledUrl(description, "Instagram");
      if (instagramUrl) row[instagramIndex] = instagramUrl;
    }

    newRows.push(row);
    claimedLinks.add(link);
  });


  if (newRows.length === 0) {
    Logger.log("No New Upcoming Events to Add.");
    return;
  }

  // Append New Rows to the Sheet
  eventsSheet.getRange(eventsSheet.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
  Logger.log("Added " + newRows.length + " New Event Row(s).");
}

/*
 * Escapes Regex-Special Characters in a String for Dynamic Regex Construction.
 */
function escapeRegexText(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/*
 * Resolves Google Redirect URLs (google.com/url?q=...) to Original URL.
 */
function resolveGoogleRedirectUrl(url) {
  if (!url) return "";

  const googleRedirectRegex = /^https?:\/\/(?:www\.)?google\.com\/url\?/i;
  if (!googleRedirectRegex.test(url)) {
    return url;
  }

  const qMatch = url.match(/[?&]q=([^&]+)/i);
  if (!qMatch) {
    return url;
  }

  try {
    return decodeURIComponent(qMatch[1]);
  } catch (error) {
    return qMatch[1];
  }
}

/*
 * Normalizes Extracted URL Text and Resolves Redirect Wrappers.
 */
function normalizeCalendarUrl(rawUrl) {
  if (!rawUrl) return "";

  const cleanedUrl = String(rawUrl)
    .replace(/&amp;/g, "&")
    .trim()
    .replace(/[)>.,;]+$/, "");

  return resolveGoogleRedirectUrl(cleanedUrl);
}

/*
 * Extracts a URL Following a "Label:" Marker in Event Description.
 * Supports HTML Anchor, Markdown Link, and Plain URL Formats.
 */
function extractCalendarLabeledUrl(text, label) {
  if (!text || !label) return "";

  const escapedLabel = escapeRegexText(label);

  const htmlRe = new RegExp(escapedLabel + '\\s*:\\s*<a[^>]*href="([^"]+)"', "i");
  const htmlMatch = text.match(htmlRe);
  if (htmlMatch) return normalizeCalendarUrl(htmlMatch[1]);

  const markdownRe = new RegExp(escapedLabel + '\\s*:\\s*\\[([^\\]]+)\\]\\(([^)]+)\\)', "i");
  const markdownMatch = text.match(markdownRe);
  if (markdownMatch) {
    const visibleUrl = normalizeCalendarUrl(markdownMatch[1]);
    if (/^https?:\/\//i.test(visibleUrl)) {
      return visibleUrl;
    }
    return normalizeCalendarUrl(markdownMatch[2]);
  }

  const plainRe = new RegExp(escapedLabel + '\\s*:\\s*(https?:\\/\\/\\S+)', "i");
  const plainMatch = text.match(plainRe);
  return plainMatch ? normalizeCalendarUrl(plainMatch[1]) : "";
}

/*
 * Extracts RSVP Label + Link from Event Description.
 * Uses the First `label: value` Entry Whose Label Is Not Image/Instagram.
 */
function extractCalendarRsvpInfo(description) {
  const emptyInfo = { label: "", url: "" };
  if (!description) return emptyInfo;

  const lines = String(description).split(/(?:\r?\n|<br\s*\/?\s*>)+/i);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) continue;

    const label = String(match[1]).trim();
    const lowerLabel = label.toLowerCase();
    if (lowerLabel === "image" || lowerLabel === "instagram") continue;

    const rawValue = String(match[2]).trim();
    const url = extractCalendarUrlFromText(rawValue);
    if (!url) continue;

    return {
      label: label,
      url: url
    };
  }

  // Fallback: If URL Exists But no Labeled `key: value` Entry Exists, Default Label to Link.
  const fallbackUrl = extractCalendarUrlFromText(description);
  if (fallbackUrl) {
    return {
      label: "Link",
      url: fallbackUrl
    };
  }

  return emptyInfo;
}

/*
 * Extracts a URL from HTML, Markdown, or Plain Text Snippets.
 */
function extractCalendarUrlFromText(text) {
  if (!text) return "";

  const htmlMatch = text.match(/<a[^>]*href="([^"]+)"/i);
  if (htmlMatch) return normalizeCalendarUrl(htmlMatch[1]);

  const markdownMatch = text.match(/\[[^\]]*\]\(([^)]+)\)/);
  if (markdownMatch) return normalizeCalendarUrl(markdownMatch[1]);

  const plainMatch = text.match(/https?:\/\/\S+/i);
  if (plainMatch) return normalizeCalendarUrl(plainMatch[0]);

  return "";
}

/*
 * Extracts EID Token from Calendar Event Link.
 */
function getCalendarEventToken(link) {
  const parts = String(link).split("eid=");
  return parts.length > 1 ? parts[1] : "";
}

/*
 * Sanitizes Event Name Segment for Safe Drive File Naming.
 */
function sanitizeFileNamePart(name) {
  const cleaned = String(name)
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);

  return cleaned || "event";
}

/*
 * Determines Image Extension from Content Type or URL Fallback.
 */
function getImageExtension(contentType, url) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/bmp": ".bmp"
  };

  if (contentType && map[contentType]) return map[contentType];

  const match = String(url).match(/\.(jpg|jpeg|png|gif|webp|bmp)(?:[?#]|$)/i);
  return match ? "." + match[1].toLowerCase() : ".jpg";
}

/*
 * Downloads External Image and Stores It in IMAGES_FOLDER_ID.
 * Returns the Drive File URL, or Empty String on Failure.
 */
function downloadCalendarImageToDrive(imageUrl, eventName) {
  try {
    const response = UrlFetchApp.fetch(imageUrl, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      Logger.log("WARNING: Could not download image (HTTP " + response.getResponseCode() + "): " + imageUrl);
      return "";
    }

    const blob = response.getBlob();
    const extension = getImageExtension(blob.getContentType(), imageUrl);
    const safeName = sanitizeFileNamePart(eventName);

    blob.setName(safeName + extension);

    const folder = DriveApp.getFolderById(IMAGES_FOLDER_ID);
    const file = folder.createFile(blob);
    return file.getUrl();

  } catch (error) {
    Logger.log("WARNING: Failed to Download/Save Image for '" + eventName + "': " + error.message);
    return "";
  }
}

/*
 * Cleans the Drive Image Folder by Removing Stale Event Images.
 */
function cleanupCalendarImageFolder(eventsSheet, imageIndex) {
  const folder = DriveApp.getFolderById(IMAGES_FOLDER_ID);
  const lastRow = eventsSheet.getLastRow();
  const validFileIds = new Set();

  if (lastRow >= 2) {
    const data = eventsSheet.getRange(2, 1, lastRow - 1, eventsSheet.getLastColumn()).getValues();
    data.forEach(function(row) {
      const imageUrl = row[imageIndex];
      if (imageUrl) {
        const fileId = getDriveFileIdFromUrl(imageUrl);
        if (fileId) validFileIds.add(fileId);
      }
    });
  }

  const files = folder.getFiles();
  let removed = 0;

  // Iterate Through All Files in the Folder
  while (files.hasNext()) {
    const file = files.next();

    // Remove if File ID Is Not Referenced by the Current Events Sheet
    if (!validFileIds.has(file.getId())) {
      file.setTrashed(true);
      removed++;
    }
  }

  if (removed > 0) {
    Logger.log("Removed " + removed + " Stale Image File(s) from Drive Folder.");
  }
}

/*
 * Extracts a Drive File ID from Supported Drive URL Formats.
 */
function getDriveFileIdFromUrl(url) {
  if (!url) return "";

  const text = String(url);
  const idPathMatch = text.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idPathMatch) return idPathMatch[1];

  const idQueryMatch = text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch) return idQueryMatch[1];

  return "";
}

/*
 * Installs Time-Based Trigger for Automatic Daily Calendar Sync.
 * Run to Set Up Automation. Removes Existing Calendar Sync Triggers to Avoid Duplicates.
 */
function installCalendarSyncTrigger() {
  try {
    removeCalendarSyncTrigger();

    ScriptApp.newTrigger("syncCalendarToDB")
      .timeBased()
      .everyDays(1)
      .create();

    Logger.log("✓ Trigger Installed Successfully");
    Logger.log("✓ syncCalendarToDB() Will Run Automatically Every 24 Hours");

  } catch (error) {
    Logger.log("✗ Trigger Installation Failed: " + error.message);
  }
}

/*
 * Removes Automatic Calendar Sync Trigger.
 * Use This if You Want to Disable Automatic Calendar Syncing.
 */
function removeCalendarSyncTrigger() {
  try {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === "syncCalendarToDB") {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    Logger.log("✓ Trigger Removed - Automatic Sync Disabled");

  } catch (error) {
    Logger.log("✗ Failed to Remove Trigger: " + error.message);
  }
}

/*
 * Sends Error Notification (Optional - Requires Email Setup)
 */
function sendCalendarErrorNotification(error) {
  try {
    const email = Session.getEffectiveUser().getEmail();
    MailApp.sendEmail(
      email,
      "ECESS Calendar Sync Error",
      "Calendar Sync Failed:\n\n" + error.message + "\n\nCheck Apps Script Logs for Details."
    );
  } catch (e) {
    Logger.log("Could Not Send Error Email: " + e.message);
  }
}

/*
 * Test Function - Runs Sync Once and Logs Results
 * Useful for Debugging Before Setting Up the Trigger
 */
function testCalendarSync() {
  Logger.log("Starting Calendar Test Sync...");
  syncCalendarToDB();
  Logger.log("Calendar Test Sync Completed - Check Logs Above");
}
