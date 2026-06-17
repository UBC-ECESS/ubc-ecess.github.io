/*
 * Google Apps Script for Syncing Private Locker Sheet to Public Sheet
 *
 * SETUP INSTRUCTIONS:
 * 1. Open Private Locker Management Sheet in Google Sheets.
 * 2. Go to Extensions → Apps Script and Update Code.
 * 3. Run installTrigger() Once to Set Up Daily Sync.
 *
 * CONFIGURATION:
 * - PRIVATE_SHEET_ID: Detailed Locker Management Data, User-Editable.
 * - PUBLIC_SHEET_ID: Minimal Public Interface, Read-Only for Website.
 *
 * This Script Transforms Sensitive Data Into a Minimal Public Interface:
 * Private Columns (Excluded): name, email, notes, action, status, serial, combo, student number, discord username
 * Public Columns (Exposed): Set, Number, Taken
 */

const PRIVATE_SHEET_ID = "1RYP-CQd0NlMrBrDnOi18g7F3P7Vjxx18tyVZRqNymfY";
const PUBLIC_SHEET_ID = "17CjfpnlwCs6aKsXiT2DS-d8jX6Hk9tSPYcHhPP2nL2A";

/*
 * Syncs Locker Data from Private Management Sheet to Public Interface Sheet
 * Transforms and Filters Sensitive Data
 *
 * Private Sheet Columns: [locker, name, email, notes, action, status, serial, combo, student#, discord, notes]
 * Public Sheet Columns: [Set, Number, Taken]
 */
function syncLockersToPublic() {
  try {
    const privateDoc = SpreadsheetApp.openById(PRIVATE_SHEET_ID);
    const privateSheet = privateDoc.getSheetByName("Main");

    const range = privateSheet.getDataRange();
    const values = range.getValues();

    const headers = values[0];
    const lockerIndex = headers.indexOf("locker");
    const statusIndex = headers.indexOf("status");

    if (lockerIndex === -1 || statusIndex === -1) {
      Logger.log("ERROR: Missing 'locker' or 'status' column in private sheet");
      return;
    }

    const transformedData = [["Set", "Number", "Taken"]];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const lockerNum = row[lockerIndex];
      const status = row[statusIndex];

      if (!lockerNum || lockerNum === "") continue;

      const lockerNumber = parseInt(lockerNum);
      let setName = `Floor ${Math.floor(lockerNumber / 100)}`;

      const taken = (status === "Reserved" || status === "ECESS");
      transformedData.push([setName, lockerNumber, taken]);
    }

    const publicDoc = SpreadsheetApp.openById(PUBLIC_SHEET_ID);
    const publicSheet = publicDoc.getSheetByName("Lockers");

    publicSheet.clearContents();
    publicSheet.getRange(1, 1, transformedData.length, 3).setValues(transformedData);

    Logger.log(`✓ Sync Completed Successfully at ${new Date()}`);
    Logger.log(`✓ Transformed ${transformedData.length - 1} lockers`);

  } catch (error) {
    Logger.log(`✗ Sync Failed: ${error.message}`);
    sendErrorNotification(error);
  }
}

/*
 * Installs Time-Based Trigger for Automatic Daily Sync.
 * Run to Set Up Automation. Removes Existing Triggers to Avoid Duplicates.
 */
function installTrigger() {
  try {
    // Remove Existing Triggers to Avoid Duplicates
    ScriptApp.getProjectTriggers().forEach(trigger => {
      ScriptApp.deleteTrigger(trigger);
    });

    // Create New Trigger: Runs Every 24 Hours
    ScriptApp.newTrigger("syncLockersToPublic")
      .timeBased()
      .everyDays(1)
      .create();

    Logger.log("✓ Trigger Installed Successfully");
    Logger.log("✓ syncLockersToPublic() Will Run Automatically Every 24 Hours");

  } catch (error) {
    Logger.log(`✗ Trigger Installation Failed: ${error.message}`);
  }
}

/*
 * Removes the Automatic Sync Trigger. Use This if You Want to Disable Automatic Syncing.
 */
function removeTrigger() {
  try {
    ScriptApp.getProjectTriggers().forEach(trigger => {
      ScriptApp.deleteTrigger(trigger);
    });

    Logger.log("✓ Trigger Removed - Automatic Sync Disabled");

  } catch (error) {
    Logger.log(`✗ Failed to Remove Trigger: ${error.message}`);
  }
}

/*
 * Sends Error Notification (Optional - Requires Email Setup)
 */
function sendErrorNotification(error) {
  try {
    const email = Session.getEffectiveUser().getEmail();
    MailApp.sendEmail(
      email,
      "ECESS Locker Sync Error",
      `The locker sync failed:\n\n${error.message}\n\nCheck the Apps Script logs for details.`
    );
  } catch (e) {
    Logger.log("Could Not Send Error Email: " + e.message);
  }
}

/*
 * Test Function - Runs Sync Once and Logs Results
 * Useful for Debugging Before Setting Up the Trigger
 */
function testSync() {
  Logger.log("Starting Test Sync...");
  syncLockersToPublic();
  Logger.log("Test Sync Completed - Check Logs Above");
}