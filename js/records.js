const SOCIETY_BOOK = "17CjfpnlwCs6aKsXiT2DS-d8jX6Hk9tSPYcHhPP2nL2A";
const GAMES_BOOK = "1u-wBWNxd7jEW2euJwzaiinHMNy8S_QvJgzh0G9xjU98";

const TABLES = {
  events: { book: SOCIETY_BOOK, tab: "Events" },
  links: { book: SOCIETY_BOOK, tab: "Links" },
  socials: { book: SOCIETY_BOOK, tab: "Socials" },
  gallery: { book: SOCIETY_BOOK, tab: "Gallery" },
  collections: { book: SOCIETY_BOOK, tab: "Collections" },
  council: { book: SOCIETY_BOOK, tab: "Council" },
  positions: { book: SOCIETY_BOOK, tab: "Positions" },
  merch: { book: SOCIETY_BOOK, tab: "Merch" },
  categories: { book: SOCIETY_BOOK, tab: "Categories" },
  contacts: { book: SOCIETY_BOOK, tab: "Contacts" },
  sponsors: { book: SOCIETY_BOOK, tab: "Sponsors" },
  external: { book: SOCIETY_BOOK, tab: "External" },
  courses: { book: SOCIETY_BOOK, tab: "Courses" },
  course_resources: { book: SOCIETY_BOOK, tab: "Course_Resources" },
  lockers: { book: SOCIETY_BOOK, tab: "Lockers" },
  sets: { book: SOCIETY_BOOK, tab: "Sets" },
  matches: { book: GAMES_BOOK, tab: "Matches" },
  players: { book: GAMES_BOOK, tab: "Players" },
  games: { book: GAMES_BOOK, tab: "Games" },
  parameters: { book: GAMES_BOOK, tab: "Parameters" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MEMORY_KEY = "ecess-tables-v1";

const KEYS = {
  events: ["date", "start", "end", "name", "location", "contacts", "rsvp_label", "rsvp", "calendar", "instagram", "image", "show"],
  links: ["name", "icon_pack", "icon", "link", "show"],
  socials: ["link", "icon", "show"],
  gallery: ["collection", "image", "caption", "show"],
  collections: ["name", "show"],
  council: ["year", "name", "position", "photo"],
  positions: ["position", "type", "email", "key", "responsibilities", "open"],
  merch: ["item", "price", "category", "sizes", "stock", "image", "show"],
  categories: ["name", "icon", "show"],
  contacts: ["option", "email", "override", "show"],
  sponsors: ["name", "link", "logo", "tier", "show"],
  external: ["date", "expiry", "name", "description", "location", "link", "image", "show"],
  courses: ["code", "name", "show"],
  course_resources: ["code", "link", "type", "show"],
  lockers: ["set", "number", "taken"],
  sets: ["name", "location", "unavailable", "image", "show"],
  matches: ["timestamp", "game", "p1_id", "p2_id", "p3_id", "p4_id", "winner", "p1_points", "p2_points", "p3_points", "p4_points", "time"],
  players: ["id", "name"],
  games: ["name", "icon", "system", "rounding", "starts", "show"],
  parameters: ["game", "init_rating", "base", "divisor", "k", "interpolation", "starts"],
};

const tables = new Map();

function savedTables() {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");
  } catch {
    return {};
  }
}

function remember(name, records) {
  const saved = savedTables();
  saved[name] = records;
  localStorage.setItem(MEMORY_KEY, JSON.stringify(saved));
}

export function endpoint(name) {
  const table = TABLES[name];
  const query = encodeURIComponent("select *");
  return `https://docs.google.com/spreadsheets/d/${table.book}/gviz/tq?sheet=${encodeURIComponent(table.tab)}&tq=${query}`;
}

function parsePayload(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("Sheet response was not a table");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function slug(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function recordsFromPayload(name, payload) {
  const expected = KEYS[name] || [];
  const headers = (payload.table.cols || []).map((col) => slug(col?.label));
  return (payload.table.rows || []).map((row) => {
    const values = {};
    const labels = {};
    const width = Math.max(expected.length, row.c?.length || 0, headers.length);
    for (let index = 0; index < width; index++) {
      const cell = row.c?.[index];
      const value = cell == null ? null : cell.v ?? null;
      const label = cell == null ? null : cell.f ?? cell.v ?? null;
      const keys = new Set([expected[index], headers[index]].filter(Boolean));
      keys.forEach((key) => {
        values[key] = value;
        labels[key] = label;
      });
    }
    return { values, labels };
  });
}

export function ingest(name, text) {
  const records = recordsFromPayload(name, parsePayload(text));
  tables.set(name, records);
  remember(name, records);
  return records;
}

export function rows(name) {
  return tables.get(name) || [];
}

export function field(row, key, asLabel = false) {
  if (!row) return null;
  const bag = asLabel ? row.labels : row.values;
  if (!bag || !(key in bag)) return null;
  const value = bag[key];
  return value === undefined ? null : value;
}

export function lacks(row, keys) {
  return keys.some((key) => field(row, key) == null);
}

export function present(row, keys) {
  return keys.some((key) => field(row, key) != null);
}

async function pull(name, { fresh = false } = {}) {
  const saved = savedTables();
  if (!fresh && Array.isArray(saved[name])) {
    tables.set(name, saved[name]);
  }
  const response = await fetch(fresh ? `${endpoint(name)}&t=${Date.now()}` : endpoint(name), {
    cache: fresh ? "no-store" : "default",
  });
  ingest(name, await response.text());
}

export function load(names) {
  const list = Array.isArray(names) ? names : [names];
  return Promise.all(list.map((name) => pull(name))).then(() => undefined);
}

export function reload(name) {
  return pull(name, { fresh: true });
}

export function photo(url) {
  const id = String(url || "").match(/\/d\/([^/]+)/)?.[1];
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1080` : "";
}

export function embed(url) {
  const id = String(url || "").match(/\/d\/([^/]+)/)?.[1];
  return id ? `https://drive.google.com/file/d/${id}/preview` : "";
}

function sheetParts(value) {
  const match = String(value || "").match(/Date\(([^)]*)\)/);
  if (!match) return null;
  return match[1].split(",").map((part) => Number(part.trim()));
}

export function sheetUtc(value) {
  const parts = sheetParts(value);
  if (!parts) return NaN;
  if (parts.length > 3) {
    return Date.UTC(parts[0], parts[1], parts[2], parts[3], parts[4] || 0);
  }
  return Date.UTC(parts[0], parts[1], parts[2]);
}

export function writtenDate(value) {
  const parts = sheetParts(value);
  if (!parts) return "";
  return `${parts[2]} ${MONTHS[parts[1]]} ${parts[0]}`;
}

export function ordinal(text) {
  return String(text ?? "").replace(/(\d)(st|nd|rd|th)/gi, "$1<sup>$2</sup>");
}
