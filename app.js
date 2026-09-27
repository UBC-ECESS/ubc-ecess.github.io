import { rows, field, photo } from "./js/records.js";

export {
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
} from "./js/records.js";

export const CONFIG = {
  siteNameFull: "UBC ECESS",
  author: "UBC ECESS",
  formFromName: "UBC ECESS Website",
  ogImage: "https://ubc-ecess.github.io/media/logos/ece-og.png",
  ogImageAlt: "UBC ECESS logo",
  ogImageType: "image/png",
};

const NAV_LINKS = [
  { label: "Home", href: "." },
  { label: "Courses", href: "./courses" },
  { label: "Careers", href: "./careers" },
  { label: "Merch", href: "./merch" },
  { label: "Lockers", href: "./lockers" },
  { label: "Council", href: "./council" },
];

const page = document.querySelector("body");

function currentHref() {
  const file = (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
  if (!file || file === "index") return ".";
  return `./${file}`;
}

function mountNav() {
  if (document.querySelector("body > header")) return;
  const here = currentHref();
  const header = document.createElement("header");
  header.innerHTML = `
    <a class="brand" href=".">
      <span class="logo"><img src="media/logos/ece-white.png" alt="ECESS"></span>
    </a>
    <button class="button icon square" id="open-nav" type="button" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
    <nav id="nav" class="hidden">
      ${NAV_LINKS.map(({ label, href }) => `<a class="button nav${href === here ? " current" : ""}" href="${href}">${label}</a>`).join("")}
    </nav>
  `;
  page.insertBefore(header, page.firstChild);
  header.querySelector("#open-nav").addEventListener("click", () => {
    header.querySelector("#nav").classList.toggle("hidden");
  });
}

function mountFooter() {
  if (document.getElementById("site-footer")) return;
  const footer = document.createElement("footer");
  footer.id = "site-footer";
  footer.innerHTML = `
    <p>Thanks to Club Mech for sharing website building resources with ECESS.</p>
    <div id="socials"></div>
  `;
  page.appendChild(footer);
}

function mountMeta() {
  const description = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
  const tags = [
    ["name", "author", CONFIG.author],
    ["property", "og:title", document.title],
    ["property", "og:site_name", CONFIG.siteNameFull],
    ["property", "og:type", "website"],
    ["property", "og:description", description],
    ["property", "og:image", CONFIG.ogImage],
    ["property", "og:image:alt", CONFIG.ogImageAlt],
    ["property", "og:image:type", CONFIG.ogImageType],
  ];
  for (const [attr, name, content] of tags) {
    const meta = document.createElement("meta");
    meta.setAttribute(attr, name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
}

export function boot({ injectNav = true } = {}) {
  mountMeta();
  if (injectNav) mountNav();
  mountFooter();
  document.querySelectorAll('input[name="from_name"]').forEach((input) => {
    input.value = CONFIG.formFromName;
  });
  window.addEventListener("resize", placeTips);
}

export function placeTips() {
  document.querySelectorAll(":has(>.tooltip)").forEach((host) => {
    const tip = host.querySelector(".tooltip");
    if (!tip) return;
    const box = host.getBoundingClientRect();
    tip.classList.toggle("right", box.left + box.width / 2 <= window.innerWidth / 2);
    tip.classList.toggle("left", box.left + box.width / 2 > window.innerWidth / 2);
  });
}

export function wireIcons() {}

export function paintIcons() {
  const html = rows("socials")
    .filter((row) => field(row, "show") !== false && field(row, "link") && field(row, "icon"))
    .map((row) => `<a class="button icon" href="${field(row, "link")}" target="_blank"><i class="fa-brands fa-${field(row, "icon")}"></i></a>`)
    .join("");
  const slot = document.getElementById("socials");
  if (slot) slot.innerHTML = html;
}
