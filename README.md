# UBC ECESS Website

The official website for the [UBC ECESS](https://www.ecess.ca/). For detailed maintenance documentation, see the [ECESS Website Maintenance Guide](https://docs.google.com/document/d/11ngWaC8yhN9Z55oqLVWshfCQ2vGyDXgXAOFII1_dUmo/edit?usp=sharing).

## Table of Contents

- [Data System](#data-system)
- [For Site Admin](#for-site-admin)
- [For Developers](#for-developers)

---

## Data System

Dynamic content is fetched from **Google Sheets** documents at runtime using the [Google Visualization Query API](https://developers.google.com/chart/interactive/docs/querylanguage).

> **Note** The fetched data is cached in `localStorage` under `ecess-tables-v1`, then refreshed in the background.

### Sources

| Document | ID | Data |
|---|---|---|
| **Main Database** | [`17CjfpnlwCs6...`](https://docs.google.com/spreadsheets/d/17CjfpnlwCs6aKsXiT2DS-d8jX6Hk9tSPYcHhPP2nL2A) | Events, External, Council, Positions, Contacts, Courses, Course_Resources, Socials, Links, Merch, Categories, Gallery, Collections, Sponsors, Lockers, Sets |
| **Games Log** | [`1u-wBWNxd7jE...`](https://docs.google.com/spreadsheets/d/1u-wBWNxd7jEW2euJwzaiinHMNy8S_QvJgzh0G9xjU98) | Leaderboard (Matches, Players, Games, Rating Parameters) |

### Integration

`js/records.js` maps each table to a workbook and tab. `KEYS` lists the field names in column order. Rows are read by the sheet's header label, and by that column order when a header is blank.

```js
events: { book: SOCIETY_BOOK, tab: "Events" }
```

Page scripts call `load`, `rows`, and `field` from `app.js`. Do not rename a header unless the matching name in `KEYS` is updated too.

---

## For Site Admin

### Updates - Spreadsheet

Most updates will only require editing the **Google Sheets**.

| Action | Steps |
|---|---|
| Add / Edit Event, Merch Item, Council Member, Course, Sponsor, etc. | Add / Edit in Main Database |
| Hide / Show Row | Set `show` Col to `FALSE` / `TRUE` |
| Record Leaderboard Match | Add Row to **Matches** Tab in Games Log |

### Updates - Code Base

Changing the structure of a sheet means updating `TABLES` and `KEYS` in `js/records.js`.

| Structural Change | Steps |
|---|---|
| Rename or reorder a column | Update that table's entry in `KEYS` |
| Add a sheet | Add it to `TABLES` and `KEYS`, then load it from the page script |

## For Developers

You need [Node.js](https://nodejs.org/) (npm comes with it).

**1. Clone the repository:**

```bash
git clone https://github.com/UBC-ECESS/ubc-ecess.github.io
cd ubc-ecess.github.io
```

**2. Install dependencies:**

```bash
npm install
```

**3. Start the dev server:**

```bash
npm run dev
```

**4. Open [http://127.0.0.1:5173](http://127.0.0.1:5173).**

Page HTML lives in `pages/`. The dev server still opens each one at a short URL: `/`, `/events`, `/courses`, and so on. The server stays on port 5173.

To check the production build:

```bash
npm run build
npm run preview
```

`npm run build` writes the site to `dist/`.

### Python, if you don't want Node

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080/pages/index.html](http://localhost:8080/pages/index.html). Other pages are `pages/events.html`, `pages/courses.html`, and so on. Nav links omit `.html`, so use `npm run dev` if you want those short URLs.

---
