import { formatPrice, discountedPrice, stockStatus } from "../lib/format.js";
import { h } from "./dom.js";

/** One product → one <article class="card">. The caller decides where it goes. */
export function createCard(product, isSaved) {
  // Destructuring: name the fields once. brand defaults to category when it is undefined.
  const { id, title, category, brand = category, price, discountPercentage, rating, stock, thumbnail } = product;
  const { tone, label } = stockStatus(stock);
  const hasDiscount = discountPercentage >= 1;

  const card = document.createElement("article");
  card.className = "card";
  card.classList.toggle("is-out", tone === "out");
  card.classList.toggle("is-saved", isSaved);

  // A template literal is the markup, with ${…} holes. Fine for our own data file;
  // anything a user typed goes through textContent instead (innerHTML parses it as HTML).
  card.innerHTML = `
    <div class="thumb">
      <img src="${thumbnail}" alt="${title}" loading="lazy" />
      ${hasDiscount ? `<span class="off">−${Math.round(discountPercentage)}%</span>` : ""}
    </div>
    <div class="body">
      <span class="brand">${brand}</span>
      <h3>${title}</h3>
      <p class="price">${formatPrice(discountedPrice(price, discountPercentage))}${hasDiscount ? `<s>${formatPrice(price)}</s>` : ""}</p>
      <div class="row">
        <span class="badge ${tone}">${label}</span>
        <span class="rating">★ ${rating.toFixed(1)}</span>
      </div>
    </div>
    <button type="button" class="heart" data-id="${id}" aria-pressed="${isSaved}"
      aria-label="Save ${title} to your wishlist">${isSaved ? "♥" : "♡"}</button>`;
  return card;
}

/** Renders the products into the grid in one DOM update, or a friendly message when there are none. */
export function renderGrid(gridEl, products, savedIds) {
  if (products.length === 0) {
    const empty = document.createElement("p");
    empty.className = "state";
    empty.textContent = "No products match. Try a different search or category.";
    gridEl.replaceChildren(empty);
    return;
  }
  gridEl.replaceChildren(...products.map((product) => createCard(product, savedIds.includes(product.id))));
}

/** One button per category, with a live count. The active one has aria-pressed="true". */
export function renderCategoryChips(container, categories, active, counts) {
  const chips = categories.map((category) =>
    h(
      "button",
      { type: "button", className: "filter-chip", ariaPressed: String(category === active), dataset: { category } },
      category === "all" ? "All" : category,
      h("span", { className: "n", textContent: String(counts.get(category) ?? 0) }),
    ),
  );
  container.replaceChildren(...chips);
}

/** The stats panel: four rows, each a <dt> label and a <dd> value. */
export function renderStats(container, { count, averageRating, inventoryValue, bestDeal }) {
  const rows = [
    { label: "Products shown", value: String(count) },
    { label: "Average rating", value: count > 0 ? `★ ${averageRating.toFixed(2)}` : "—" },
    { label: "Inventory value", value: formatPrice(inventoryValue), note: "price × stock" },
    {
      label: "Best discount",
      value: bestDeal ? `${Math.round(bestDeal.discountPercentage)}% off` : "—",
      note: bestDeal?.title,
    },
  ];

  container.replaceChildren(
    ...rows.map(({ label, value, note = "" }) =>
      h("div", { className: "stat" }, h("dt", { textContent: label }), h("dd", { textContent: value }, h("small", { textContent: note }))),
    ),
  );
}
