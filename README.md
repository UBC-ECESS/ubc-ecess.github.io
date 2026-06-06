# UBC ECESS Website

The official website for the [UBC ECESS](https://www.ecess.ca/). For detailed maintenance documentation, see the [ECESS Website Maintenance Guide](https://docs.google.com/document/d/11ngWaC8yhN9Z55oqLVWshfCQ2vGyDXgXAOFII1_dUmo/edit?usp=sharing).

## Table of Contents

- [Data System](#data-system)
- [For Site Admin](#for-site-admin)
- [For Developers](#for-developers)

---

## Data System

Dynamic content is fetched from **Google Sheets** documents at runtime using the [Google Visualization Query API](https://developers.google.com/chart/interactive/docs/querylanguage).

> **Note** The fetched data is also cached in `localStorage` so subsequent page visits don't re-fetch everything.

### Sources

| Document | ID | Data |
|---|---|---|
| **Main Database** | [`17CjfpnlwCs6...`](https://docs.google.com/spreadsheets/d/17CjfpnlwCs6aKsXiT2DS-d8jX6Hk9tSPYcHhPP2nL2A) | Events, Council, Contacts, Courses, Socials, Merch, Gallery, Sponsors, Lockers |
| **Games Log** | [`1u-wBWNxd7jE...`](https://docs.google.com/spreadsheets/d/1u-wBWNxd7jEW2euJwzaiinHMNy8S_QvJgzh0G9xjU98) | Leaderboard (Matches, Players, Games, Rating Parameters) |

### Integration

At the top of `app.js`, the `SHEETS` object maps a key name to its sheet tab, document, and expected column order:

```js
events: {
  SHEET: "Events",  // Tab Name
  DOC: DATABASE_DOC, // Document Constant
  COLS: ["date", "start", "end", "name", ...], // Column Order
}
```

> **Note:** This site reads each row by **column index**. The order of `COLS` in `app.js` must match the column order in the spreadsheet.

---

## For Site Admin

### Updates - Spreadsheet

Most updates will only require editing the **Google Sheets**.

| Action | Steps |
|---|---|
| Add / Edit Event, Merch Item, Council Member, Course, Sponsor, etc. | Add / Edit in Main Database |
| Hide / Show Row | Set `show` Col to `FALSE` / `TRUE` |
| Record Leaderboard Match | Add Row to **Matches** Tab in Games Log |

> Leaderboard ratings are calculated client-side on every page load.

### Updates - Code Base

Changing the structure of a sheet will require an update to the `SHEETS` object in `app.js`.

| Structural Change | Steps |
|---|---|
| Reorder Cols | Update `COLS` Array with New Order |
| Add New Sheet | Add New Entry to `SHEETS` and Write `make*` Render Function |

## For Developers

This is a static site with no build step. The only requirement is **Python 3**. You can install this from the [official website](https://www.python.org/downloads/).

**1. Check that Python 3 is available:**

```bash
python3 --version
```

**2. Clone the repository:**

```bash
git clone https://github.com/UBC-ECESS/ubc-ecess.github.io
cd ubc-ecess.github.io
```

**3. Start a local server:**

```bash
python3 -m http.server 8080
```

**4. Open [http://localhost:8080](http://localhost:8080) in your browser.**

> **Note:** When running locally, pages must be accessed with the `.html` suffix (e.g. http://localhost:8080/courses.html)

---
