import {
  load,
  rows,
  field,
  lacks,
  photo,
  paintIcons,
  boot,
} from "../app.js?version=7";

function stockList(row) {
  const raw = field(row, "stock");
  if (raw == null) return [""];
  return String(raw).replaceAll(" ", "").split(",");
}

function categoryIcon(categoryName) {
  const match = rows("categories").find((row) => field(row, "name") === categoryName);
  return match && field(match, "icon") ? field(match, "icon") : "tag";
}

function sizeList(counts, labels) {
  const items = labels.map((label, index) => {
    const count = counts[index] ?? "";
    if (count === "0" || count === "") return `<li class="out-of-stock">${label}</li>`;
    if (Number(count) < 11) return `<li class="running-low"><div class="counter">${count}</div>${label}</li>`;
    return `<li>${label}</li>`;
  });
  return `<ul class="sizes">${items.join("")}</ul>`;
}

function stockLine(count) {
  if (count === "0" || count === "") return '<div class="status out-of-stock">Out of stock</div>';
  if (Number(count) < 11) return `<div class="status running-low">Only ${count} left</div>`;
  return '<div class="status in-stock">In Stock</div>';
}

function paintCategories() {
  const buttons = [];
  let picked = false;
  rows("categories").forEach((row) => {
    if (field(row, "name") == null || field(row, "show") == false) return;
    const name = field(row, "name");
    const icon = field(row, "icon");
    const iconMarkup = icon == null ? "" : `<i class="fa-solid fa-${icon}"></i>`;
    const selected = picked ? "" : " selected";
    picked = true;
    buttons.push(`<li><button class="button${selected}" id="${name}-button">${iconMarkup}${name}</button></li>`);
  });
  const host = document.getElementById("merch-categories");
  host.innerHTML = buttons.join("");
  host.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      showCategory(button.id.slice(0, button.id.lastIndexOf("-button")));
    });
  });
}

function paintMerch() {
  const cards = rows("merch").flatMap((row) => {
    if (lacks(row, ["item", "price", "category"]) || field(row, "show") == false) return [];
    const category = field(row, "category");
    const image = field(row, "image");
    const picture = image != null
      ? `<img src="${photo(image)}" alt="">`
      : `<i class="fa-solid fa-${categoryIcon(category)}"></i>`;
    const price = `$${Number(field(row, "price")).toFixed(2)}`;
    const counts = stockList(row);
    const sizes = field(row, "sizes");
    const inventory = sizes != null ? sizeList(counts, sizes.split(", ")) : stockLine(counts[0]);
    return [`<li class="merch-item ${category}">${picture}<h2>${field(row, "item")}</h2><div><div class="price">${price}</div>${inventory}</div></li>`];
  });
  document.getElementById("merch-grid").innerHTML = cards.join("");
}

function firstCategory() {
  const row = rows("categories").find((entry) => field(entry, "name") != null && field(entry, "show") != false);
  return row ? field(row, "name") : "";
}

function showCategory(category) {
  const grid = document.querySelector("#merch-grid");
  const fallback = firstCategory();
  grid.style.minHeight = `${grid.getBoundingClientRect().height}px`;
  window.setTimeout(() => {
    grid.style.minHeight = "";
  }, 1);
  document.querySelectorAll(".merch-item").forEach((item) => {
    item.style.display = "none";
    window.setTimeout(() => {
      const keep = category === fallback || item.classList.contains(category);
      item.style.display = keep ? "" : "none";
    }, 1);
  });
  document.querySelectorAll("#merch-categories button").forEach((button) => {
    const name = button.id.slice(0, button.id.lastIndexOf("-button"));
    button.classList.toggle("selected", name === category);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  boot();
  load("socials").then(paintIcons);
  load(["merch", "categories"]).then(() => {
    paintCategories();
    paintMerch();
  });
});
