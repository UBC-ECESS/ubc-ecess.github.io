import {
  data,
  POP_IN_VARIANCE,
  fetchSheet,
  fetchSheets,
  getCell,
  anyCellNull,
  driveUrlToThumb,
  makeSocials,
  commonInit,
} from "../app.js";

// MERCH

function makeMerchCategories() {
  let html = "";

  let firstCategory = true;
  for (let i = 0; i < data.categories.length; i++) {
    if (
      getCell("categories", i, "name") == null ||
      getCell("categories", i, "show") == false
    ) {
      continue;
    }

    html += '<li><button class="button';

    if (firstCategory == true) {
      firstCategory = false;
      html += " selected";
    }

    html += `" id="${getCell("categories", i, "name")}-button">`;

    if (getCell("categories", i, "icon") != null) {
      html += `<i class="fa-solid fa-${getCell("categories", i, "icon")}"></i>`;
    }

    html += `${getCell("categories", i, "name")}</button></li>`;
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

  for (let i = 0; i < data.merch.length; i++) {
    if (
      anyCellNull("merch", i, ["item", "price", "category"]) == true ||
      getCell("merch", i, "show") == false
    ) {
      continue;
    } // skip blank entries

    html += `<li class="merch-item ${getCell("merch", i, "category")}" style="animation-delay: ${Math.random() * POP_IN_VARIANCE}ms;">`;

    if (getCell("merch", i, "image") != null) {
      html += `<img src="${driveUrlToThumb(getCell("merch", i, "image"))}">`;
    } else {
      let catIcon = "gear";
      for (let j = 0; j < data.categories.length; j++) {
        if (
          getCell("categories", j, "name") == getCell("merch", i, "category")
        ) {
          catIcon = getCell("categories", j, "icon");
        }
      }
      html += `<i class="fa-solid fa-${catIcon}"></i>`;
    }

    html += `<h2>${getCell("merch", i, "item")}</h2>`;
    html += `<div><div class="price">$${Number(getCell("merch", i, "price")).toFixed(2)}</div>`;

    let stock =
      getCell("merch", i, "stock") == null
        ? ""
        : getCell("merch", i, "stock").replaceAll(" ", "").split(",");
    if (getCell("merch", i, "sizes") != null) {
      let sizes = getCell("merch", i, "sizes").split(", ");

      html += '<ul class="sizes">';
      for (let j = 0; j < sizes.length; j++) {
        html += `<li${stock[j] == "0" || stock[j] == "" ? ' class="out-of-stock">' : Number(stock[j]) < 11 ? ` class="running-low"><div class="counter">${stock[j]}</div>` : ">"}${sizes[j]}</li>`;
      }
      html += "</ul>";
    } else {
      if (stock[0] == "0" || stock[0] == "") {
        html += '<div class="status out-of-stock">Out of stock</div>';
      } else if (Number(stock[0]) < 11) {
        html += `<div class="status running-low">Only ${stock[0]} left!</div>`;
      } else {
        html += '<div class="status in-stock">In stock</div>';
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
  for (let i = 0; i < data.categories.length; i++) {
    if (
      getCell("categories", i, "name") == null ||
      getCell("categories", i, "show") == false
    ) {
      continue;
    }
    defaultCategory = getCell("categories", i, "name");
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
        merchItems[i].style =
          `animation-delay: ${Math.random() * POP_IN_VARIANCE}ms;`;
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
  commonInit();
  fetchSheet("socials", makeSocials);
  fetchSheets(["merch", "categories"], () => {
    makeMerchCategories();
    makeMerch();
  });

  document.querySelectorAll("#merch-categories").forEach((el) => {
    el.addEventListener("input", filterMerch);
  });
});
