# Google Apps Scripts

## Table of Contents

- [Overview](#overview)
- [Operations](#operations)
  - [Data Transformations](#data-transformations)
  - [Troubleshooting FAQ](#troubleshooting-faq)

---

## Overview

This folder contains the **Google Apps** script to automatically sync locker data from the master sheet → website database.

| Component | Details | Function
|---|---|---|
| **Master Sheet [PRIVATE]** | Contains sensitive data (names, emails, combos, student numbers) | Admin I/O |
| **Website Database [PUBLIC]** | Contains only locker sets, numbers, and availability | **Google Apps** script fetches data (automatically every 24 hrs) |
| **Website Codebase** | Reads from public sheet and displays availability | Reads gable from `Lockers` sheet in [Website Database](https://docs.google.com/spreadsheets/d/17CjfpnlwCs6aKsXiT2DS-d8jX6Hk9tSPYcHhPP2nL2A) |

> **Key Benefit:** Sensitive locker management data remains private with admin control while website automatically shows updates.

## Operations

These functions are run in the [Apps Script Editor](https://script.google.com/u/0/home/projects/1484v3zs-dAP-nQ-2wq-tXx6XW6yTB8sLi8NarVOy3I6Cq0OXlffrF1zP/) to perform the automatic updates for locker information.

| Action | Function | Purpose |
|---|---|---|
| **Test Sync** | Run `testSync()` | Sync immediately without waiting for daily trigger. |
| **Enable Auto-Sync** | Run `installTrigger()` | Re-enables daily syncing (every 24 hours) after disabling. |
| **Disable Auto-Sync** | Run `removeTrigger()` | Turns off automatic daily syncing. |

### Data Transformations

The following logic is applied to copy the relevant data for the website.

| Private Sheet | Public Sheet |
|---|---|
| `status` = "Reserved" | `taken` = `TRUE` |
| `status` = "ECESS" | `taken` = `TRUE` |
| `status` = "unassigned" | `taken` = `FALSE` |
| `locker` = 100–199 | `set` = "Floor 1" |
| `locker` = 200–299 | `set` = "Floor 2" |
| `locker` = 300–399 | `set` = "Floor 3" |
| `locker` = 400–499 | `set` = "Floor 4" |

> **Note:** Sensitive columns (name, email, combo, student number, discord username, notes) are **NOT** copied to the public sheet.

### Troubleshooting FAQ

**Public Sheet Isn't Updating**
1. Open **Extensions → Apps Script → Executions** and check the logs.
2. Run `testSync()` manually with the [Apps Script Editor](https://script.google.com/u/0/home/projects/1484v3zs-dAP-nQ-2wq-tXx6XW6yTB8sLi8NarVOy3I6Cq0OXlffrF1zP/) to observe errors.
3. Verify that sheet IDs are correct.

**Website Shows Stale Data**
1. Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R).
2. Open F12 → Application → localStorage and clear the ECESS entry.

**Column Names Don't Match**
1. Ensure the column names match the private sheet header names in the **Google Apps** script (i.e. `locker`, `status`).
2. Change the string in `headers.indexOf(...)` to match the private sheet.
