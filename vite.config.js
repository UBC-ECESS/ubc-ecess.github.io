import { resolve } from "node:path";
import { defineConfig } from "vite";

const pages = [
  "index",
  "events",
  "council",
  "courses",
  "careers",
  "contact",
  "merch",
  "lockers",
  "leaderboard",
  "discord",
  "linkedin",
];

function toPageFile(url) {
  const [path, query = ""] = url.split("?");
  const suffix = query ? `?${query}` : "";
  const clean = path.replace(/\/+$/, "") || "/";
  if (clean.includes(".") && !clean.endsWith(".html")) return null;

  const bare = clean.replace(/^\//, "").replace(/\.html$/, "");
  const name = bare.startsWith("pages/") ? bare.slice("pages/".length) : bare;
  if (name === "" || name === "index") return `/pages/index.html${suffix}`;
  if (pages.includes(name)) return `/pages/${name}.html${suffix}`;
  return null;
}

function rewritePages(server) {
  server.middlewares.use((req, _res, next) => {
    if (req.url) {
      const nextUrl = toPageFile(req.url);
      if (nextUrl) req.url = nextUrl;
    }
    next();
  });
}

export default defineConfig({
  appType: "mpa",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(pages.map((page) => [page, resolve("pages", `${page}.html`)])),
    },
  },
  plugins: [
    {
      name: "pages-urls",
      configureServer: rewritePages,
      configurePreviewServer: rewritePages,
      enforce: "post",
      generateBundle(_options, bundle) {
        for (const item of Object.values(bundle)) {
          if (item.type !== "asset" || !item.fileName.startsWith("pages/") || !item.fileName.endsWith(".html")) {
            continue;
          }
          item.fileName = item.fileName.slice("pages/".length);
          if (typeof item.source === "string") {
            item.source = item.source.replace(/(href|src)="\.\.\//g, '$1="/');
          }
        }
      },
    },
  ],
});
