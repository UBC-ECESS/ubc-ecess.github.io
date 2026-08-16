# Google Apps Scripts

## Table of Contents

- [Overview](#overview)
- [Script Files](#script-files)
- [Locker Sync](#locker-sync)
  - [Locker Operations](#locker-operations)
  - [Locker Data Transformations](#locker-data-transformations)
  - [Locker Troubleshooting](#locker-troubleshooting)
- [Merch Sync](#merch-sync)
  - [Merch Operations](#merch-operations)
  - [Merch Data Transformations](#merch-data-transformations)
  - [Merch Troubleshooting](#merch-troubleshooting)
- [Calendar Sync](#calendar-sync)
  - [Calendar Operations](#calendar-operations)
  - [Calendar Data Handling](#calendar-data-handling)
  - [Calendar Troubleshooting](#calendar-troubleshooting)
- [General Troubleshooting](#general-troubleshooting)

---

## Overview

This folder contains Google Apps Scripts used to keep website data up to date:
1. Locker Sync
   - Source: Private Locker Management Spreadsheet, `Main` sheet
   - Destination: Public Website Database Spreadsheet, `Lockers` sheet
2. Merch Sync
   - Source: Private Merch Management Spreadsheet, `Summary` sheet
   - Destination: Public Website Database Spreadsheet, `Merch` sheet
3. Calendar Sync
   - Source: ECESS Google Calendar
   - Destination: Public Website Database Spreadsheet, `Events` sheet

These functions are run in the [Apps Script Editor](https://script.google.com/u/0/home/projects/1484v3zs-dAP-nQ-2wq-tXx6XW6yTB8sLi8NarVOy3I6Cq0OXlffrF1zP/) to perform automatic updates.

Recommended first-time setup for each script:
1. Run the script test function once to approve permissions and validate setup.
2. Install the daily trigger only after the test run succeeds.

## Script Files

| File | Purpose | Canonical Entry Points |
|---|---|---|
| `helpers.js` | Shared `DB_SHEET_ID` for the public Website Database spreadsheet | — |
| `LockerSync.js` | Locker sync script for private `Main` -> public `Lockers` | `syncLockersToDB()`, `testLockerSync()`, `installLockerSyncTrigger()`, `removeLockerSyncTrigger()` |
| `MerchSync.js` | Merch sync script for private `Summary` -> public `Merch` stock | `syncMerchToDB()`, `testMerchSync()`, `installMerchSyncTrigger()`, `removeMerchSyncTrigger()` |
| `CalendarSync.js` | Calendar sync script for Google Calendar -> public `Events` | `syncCalendarToDB()`, `testCalendarSync()`, `installCalendarSyncTrigger()`, `removeCalendarSyncTrigger()` |

## Locker Sync

| Component | Details | Function |
|---|---|---|
| Admin Sheet [PRIVATE] | Contains sensitive data (names, emails, combos, student numbers) | Admin I/O |
| Website Database [PUBLIC] | Contains only locker set, number, and availability | Script writes transformed data |
| Website Codebase | Reads public availability data only | Reads `Lockers` sheet from [Website Database](https://docs.google.com/spreadsheets/d/17CjfpnlwCs6aKsXiT2DS-d8jX6Hk9tSPYcHhPP2nL2A) |

> Key benefit: Sensitive locker data stays private while the website receives only minimal public fields.

### Locker Operations

| Action | Function | Purpose |
|---|---|---|
| Test Sync | Run `testLockerSync()` | Runs locker sync immediately and validates permissions/config. |
| Run Sync Now | Run `syncLockersToDB()` | Runs locker sync immediately without modifying triggers. |
| Enable Auto-Sync | Run `installLockerSyncTrigger()` | Installs a daily trigger after test sync succeeds. |
| Disable Auto-Sync | Run `removeLockerSyncTrigger()` | Removes locker auto-sync trigger(s). |

### Locker Data Transformations

Locker sync maps private sheet fields to public fields as follows.

| Source (`Main`) | Destination (`Lockers`) |
|---|---|
| `locker` in 100-199 | `Set` = Floor 1 |
| `locker` in 200-299 | `Set` = Floor 2 |
| `locker` in 300-399 | `Set` = Floor 3 |
| `locker` in 400-499 | `Set` = Floor 4 |
| `locker` value | `Number` |
| `status` = Reserved or ECESS | `Taken` = TRUE |
| `status` = unassigned | `Taken` = FALSE |

Private columns like name, email, combo, student number, and notes are not copied.

### Locker Troubleshooting

**No `Lockers` Updates in Public Sheet**
1. Open Apps Script Executions and inspect the latest run logs.
2. Run `testLockerSync()` manually and confirm no missing-sheet errors.
3. Verify `LOCKER_SHEET_ID` and `DB_SHEET_ID` match the intended spreadsheets.
4. Confirm `Main` and `Lockers` sheets exist and are named exactly as expected.

**Missing Column Error for locker or status**
1. Verify `Main` header names include `locker` and `status` exactly.
2. If headers were renamed, update the `headers.indexOf(...)` lookups in locker script.

**Trigger Installed But Wrong Script Runs**
1. Remove trigger with `removeLockerSyncTrigger()`.
2. Recreate only with `installLockerSyncTrigger()` from the locker project.
3. Re-test with `testLockerSync()`.

## Merch Sync

| Component | Details | Function |
|---|---|---|
| Admin Sheet [PRIVATE] | Contains per-item inventory rows (original stock, sold, remaining, percentage) | Admin I/O |
| Website Database [PUBLIC] | Contains merch catalogue; script updates only `Stock` | Script writes stock counts |
| Website Codebase | Reads item, price, category, sizes, stock, image, show | Reads `Merch` sheet from [Website Database](https://docs.google.com/spreadsheets/d/17CjfpnlwCs6aKsXiT2DS-d8jX6Hk9tSPYcHhPP2nL2A) |

> Key benefit: Inventory is managed privately while the website receives only stock counts for existing catalogue rows.

### Merch Operations

| Action | Function | Purpose |
|---|---|---|
| Test Sync | Run `testMerchSync()` | Runs merch sync immediately and validates permissions/config. |
| Run Sync Now | Run `syncMerchToDB()` | Runs merch sync immediately without modifying triggers. |
| Enable Auto-Sync | Run `installMerchSyncTrigger()` | Installs a daily trigger after test sync succeeds. |
| Disable Auto-Sync | Run `removeMerchSyncTrigger()` | Removes merch auto-sync trigger(s). |

### Merch Data Transformations

Merch sync reads each private `Summary` row and updates matching public `Merch` stock.

| Source (`Summary`) | Destination (`Merch`) |
|---|---|
| `Item` = `Navy Hoodie (S)` | `Item` = Navy Hoodie, size `S` stock |
| `Item` = `Light Blue Hoodie (M)` | `Item` = Light Blue Hoodie, size `M` stock |
| `Item` = `ELEC T-Shirt (L)` | `Item` = ELEC T-Shirt, size `L` stock |
| `Item` = `CPEN T-Shirt (XL)` | `Item` = CPEN T-Shirt, size `XL` stock |
| `Item` without size, e.g. `CPEN Sticker` | Matching `Item` with empty `Sizes`, single stock value |
| `Quantity Remaining` | `Stock` count |

Public stock format matches the website catalogue:
- Apparel with sizes: `S, M, L, XL` → `2, 11, 8, 3`
- Stickers/patches with no sizes: empty `Sizes` → `6`

Summary base names must match public `Item` names exactly. Only the `Stock` column is written.

**Items Not in Summary Are Left As-Is**
- If a public `Merch` row has no matching item in private `Summary`, its existing `Stock` value is kept.
- Example: stickers and patches that are only in the Website Database keep `100`, `6`, `50`, etc. until you add them to `Summary`.
- `Item`, `Price`, `Category`, `Sizes`, `Image`, and `Show` are never rewritten by merch sync.

### Merch Troubleshooting

**No `Merch` Stock Updates in Public Sheet**
1. Open Apps Script Executions and inspect the latest run logs.
2. Run `testMerchSync()` manually and confirm no missing-sheet errors.
3. Verify `MERCH_SHEET_ID` and `DB_SHEET_ID` match the intended spreadsheets.
4. Confirm `Summary` and `Merch` sheets exist and are named exactly as expected.

**Missing Column Error for Item or Quantity Remaining**
1. Verify `Summary` header names include `Item` and `Quantity Remaining` exactly.
2. If headers were renamed, update the `headers.indexOf(...)` lookups in merch script.

**Stock Not Updating for a Specific Item**
1. Confirm the public `Merch` `Item` name matches the Summary base name exactly.
2. For apparel, confirm Summary uses `Item (Size)` rows and public `Sizes` use `S, M, L, XL`.
3. If the item is not in `Summary` at all, unchanged stock is expected — add a Summary row to start syncing it.
4. For stickers/patches, confirm Summary has a row with the exact public item name and no size suffix.

**Trigger Installed But Wrong Script Runs**
1. Remove trigger with `removeMerchSyncTrigger()`.
2. Recreate only with `installMerchSyncTrigger()` from the merch project.
3. Re-test with `testMerchSync()`.

## Calendar Sync

### Calendar Operations

| Action | Function | Purpose |
|---|---|---|
| Test Sync | Run `testCalendarSync()` | Runs calendar sync immediately and validates permissions/config. |
| Run Sync Now | Run `syncCalendarToDB()` | Syncs upcoming events into `Events` sheet immediately. |
| Enable Auto-Sync | Run `installCalendarSyncTrigger()` | Installs daily trigger after test sync succeeds. |
| Disable Auto-Sync | Run `removeCalendarSyncTrigger()` | Removes calendar auto-sync trigger(s). |

### Calendar Data Handling

Calendar sync uses calendar event link identity as the stable key and performs three phases each run:
1. Update existing rows that still match current events.
2. Append rows for new upcoming events.
3. Remove stale rows no longer represented by current upcoming events.

It also parses optional description labels:

| Label in Description | `Events` Column |
|---|---|
| `Image:` | `Image` |
| `Instagram:` | `Instagram link` |
| *Free-Text Key* (E.g. `Link:`, `Ticket:`, `Eventbrite:`) | `RSVP label`, `RSVP link` |

Supported URL formats include HTML anchors, markdown links, and plain URLs. Google redirect URLs are normalized automatically.

When the image is present and downloadable, the script saves it to Drive and stores the URL in `Events`.

### Calendar Troubleshooting

**No `Events` Updates in `Events` Sheet**
1. Run `testCalendarSync()` and inspect Apps Script execution logs.
2. Verify `Events` sheet exists and contains required columns: Date, Start, End, Name, Location, Calendar link, Show.
3. Verify `CALENDAR_ID` is correct and accessible by the executing account.

**Image/Instagram Not Populating**
1. Confirm description labels use expected prefixes: `Image:`, `Instagram:`.
2. Ensure URLs are valid and reachable.
3. For image URLs, check logs for HTTP download warnings.

**Rows Deleted Unexpectedly**
1. Calendar rows are matched by Calendar link.
2. If a row has a missing/edited Calendar link, it can be treated as stale.
3. Re-run sync to re-create row from current calendar event when available.

## General Troubleshooting

**Permissions Prompt Keeps Reappearing**
1. Ensure script runs from the same Google account each time.
2. Re-run the script test function and accept all required scopes.

**Daily Trigger Did Not Run**
1. Open Apps Script Triggers and confirm the trigger exists.
2. Remove and reinstall trigger using the script-specific install function.
3. Check Executions history for quota or authorization failures.

**Website Shows Stale Data After Successful Sync**
1. Hard refresh browser cache.
2. Open DevTools, clear localStorage cache entries used by site data loader.
3. Verify the expected public spreadsheet row values changed.

**Conflicts Between Sync Trigger Management**
1. Keep locker, merch, and calendar scripts in separate Apps Script projects when possible.
2. If sharing a single Apps Script project, verify each remove/install function only targets its own handler function.
