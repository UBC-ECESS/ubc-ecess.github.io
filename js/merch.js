import {
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
  paintIcons,
  placeTips,
  wireIcons,
  boot,
  CONFIG,
} from "../app.js?version=7";

function makeMerchCategories() {
  let html = "";

  let firstCategory = true;
  for (let i = 0; i < rows("categories").length; i++) {
    if (
      field(rows("categories")[i], "name") == null ||
      field(rows("categories")[i], "show") == false
    ) {
      continue;
    }

    html += '<li><button class="button';

    if (firstCategory == true) {
      firstCategory = false;
      html += " selected";
    }

    html += `" id="${field(rows("categories")[i], "name")}-button">`;

    if (field(rows("categories")[i], "icon") != null) {
      html += `<i class="fa-solid fa-${field(rows("categories")[i], "icon")}"></i>`;
    }

    html += `${field(rows("categories")[i], "name")}</button></li>`;
  }

  document.getElementById("merch-categories").innerHTML = html;

  document.querySelectorAll("#merch-categories button").forEach((el) => {
    el.addEventListener("click", (event) => {
      filterMerch(el.getAttribute("id").split("-")[0]);
    });
  });
}

function makeMerch() {
  let html = "";

  for (let i = 0; i < rows("merch").length; i++) {
    if (
      lacks(rows("merch")[i], ["item", "price", "category"]) == true ||
      field(rows("merch")[i], "show") == false
    ) {
      continue;
    } // skip blank entries

    html += `<li class="merch-item ${field(rows("merch")[i], "category")}">`;

    if (field(rows("merch")[i], "image") != null) {
      html += `<img src="${photo(field(rows("merch")[i], "image"))}">`;
    } else {
      let catIcon = "gear";
      for (let j = 0; j < rows("categories").length; j++) {
        if (
          field(rows("categories")[j], "name") == field(rows("merch")[i], "category")
        ) {
          catIcon = field(rows("categories")[j], "icon");
        }
      }
      html += `<i class="fa-solid fa-${catIcon}"></i>`;
    }

    html += `<h2>${field(rows("merch")[i], "item")}</h2>`;
    html += `<div><div class="price">$${Number(field(rows("merch")[i], "price")).toFixed(2)}</div>`;

    let stock =
      field(rows("merch")[i], "stock") == null
        ? ""
        : field(rows("merch")[i], "stock").replaceAll(" ", "").split(",");
    if (field(rows("merch")[i], "sizes") != null) {
      let sizes = field(rows("merch")[i], "sizes").split(", ");

      html += '<ul class="sizes">';
      for (let j = 0; j < sizes.length; j++) {
        html += `<li${stock[j] == "0" || stock[j] == "" ? ' class="out-of-stock">' : Number(stock[j]) < 11 ? ` class="running-low"><div class="counter">${stock[j]}</div>` : ">"}${sizes[j]}</li>`;
      }
      html += "</ul>";
    } else {
      if (stock[0] == "0" || stock[0] == "") {
        html += '<div class="status out-of-stock">Out of stock</div>';
      } else if (Number(stock[0]) < 11) {
        html += `<div class="status running-low">Only ${stock[0]} Left!</div>`;
      } else {
        html += '<div class="status in-stock">In Stock</div>';
      }
    }
    html += "</div>";
    html += "</li>";
  }

  document.getElementById("merch-grid").innerHTML = html;
}

function filterMerch(category) {
  let merchItems = document.querySelectorAll(".merch-item");

  let defaultCategory;
  for (let i = 0; i < rows("categories").length; i++) {
    if (
      field(rows("categories")[i], "name") == null ||
      field(rows("categories")[i], "show") == false
    ) {
      continue;
    }
    defaultCategory = field(rows("categories")[i], "name");
    break;
  }

  let merchGrid = document.querySelector("#merch-grid");
  merchGrid.style = `min-height: ${merchGrid.getBoundingClientRect().height}px`;
  setTimeout(() => {
    merchGrid.style = "";
  }, 1);

  for (let i = 0; i < merchItems.length; i++) {
    merchItems[i].style = "";
    merchItems[i].style.display = "none";

    setTimeout(() => {
      if (
        category == defaultCategory ||
        merchItems[i].classList.contains(category)
      ) {
        merchItems[i].style.display = "";
      }
    }, 1);
  }

  let categoryButtons = document.querySelectorAll("#merch-categories button");
  for (let i = 0; i < categoryButtons.length; i++) {
    categoryButtons[i].classList.remove("selected");
    if (categoryButtons[i].id.split("-")[0] == category) {
      categoryButtons[i].classList.add("selected");
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  boot();
  load("socials").then(paintIcons);
  load(["merch", "categories"]).then(() => {
    makeMerchCategories();
    makeMerch();
  });

  document.querySelectorAll("#merch-categories").forEach((el) => {
    el.addEventListener("input", filterMerch);
  });
});
