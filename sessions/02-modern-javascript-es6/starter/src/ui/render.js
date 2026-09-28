import { formatPrice, discountedPrice, stockStatus } from "../lib/format.js";
import { h } from "./dom.js";

// TODO(lab-2.1): rewrite createCard with modern syntax. Destructure the fields you need from `product` in ONE
//                line (give brand a default of category), then build the card's inside with ONE template literal
//                assigned to card.innerHTML. Add a "−18%" pill (<span class="off">) to the thumb when the discount
//                is at least 1%, and only strike through the old price in that case too.
/** Builds one product card as real DOM nodes. Returns it; the caller decides where it goes. */
export function createCard(product, isSaved) {
  const card = document.createElement("article");
  card.className = "card";

  const thumb = document.createElement("div");
  thumb.className = "thumb";
  const img = document.createElement("img");
  img.src = product.thumbnail;
  img.alt = product.title;
  img.loading = "lazy";
  thumb.append(img);

  const body = document.createElement("div");
  body.className = "body";

  const brand = document.createElement("span");
  brand.className = "brand";
  brand.textContent = product.brand || product.category; // one product has no brand: fall back

  const title = document.createElement("h3");
  title.textContent = product.title; // textContent: shown as text, never parsed as HTML

  // The sale price, then the original struck through.
  const price = document.createElement("p");
  price.className = "price";
  const original = document.createElement("s");
  original.textContent = formatPrice(product.price);
  price.append(formatPrice(discountedPrice(product.price, product.discountPercentage)), original);

  // The stock badge: tone picks the colour class, label is what people read.
  const status = stockStatus(product.stock);
  const badge = document.createElement("span");
  badge.className = `badge ${status.tone}`;
  badge.textContent = status.label;
  card.classList.toggle("is-out", status.tone === "out");
  card.classList.toggle("is-saved", isSaved);

  const rating = document.createElement("span");
  rating.className = "rating";
  rating.textContent = `★ ${product.rating.toFixed(1)}`;

  const row = document.createElement("div");
  row.className = "row";
  row.append(badge, rating);

  // The heart carries the product id in data-id, so ONE listener on the grid can tell hearts apart.
  const heart = document.createElement("button");
  heart.type = "button";
  heart.className = "heart";
  heart.dataset.id = product.id;
  heart.setAttribute("aria-pressed", String(isSaved));
  heart.setAttribute("aria-label", `Save ${product.title} to your wishlist`);
  heart.textContent = isSaved ? "♥" : "♡";

  body.append(brand, title, price, row);
  card.append(thumb, body, heart);
  return card;
}

/** Renders every product into the grid in one DOM update. */
export function renderGrid(gridEl, products, savedIds) {
  // TODO(lab-2.2): if `products` is empty, show a <p class="state"> message instead. Otherwise replace this loop
  //                with ONE line: gridEl.replaceChildren(...products.map(…)), using an arrow function.
  const fragment = document.createDocumentFragment();
  for (const product of products) {
    fragment.append(createCard(product, savedIds.includes(product.id)));
  }
  gridEl.replaceChildren(fragment);
}

/** One button per category, with a live count. The active one has aria-pressed="true". */
export function renderCategoryChips(container, categories, active, counts) {
  // TODO(lab-2.13): map each category to an h("button", …) with data-category, aria-pressed and a
  //                 <span class="n"> holding counts.get(category) ?? 0. Then container.replaceChildren(...chips).
}

/** The stats panel: four rows, each a <dt> label and a <dd> value. */
export function renderStats(container, stats) {
  // TODO(lab-2.14): destructure { count, averageRating, inventoryValue, bestDeal } from the stats, build four
  //                 rows, and render each as h("div", { className: "stat" }, h("dt", …), h("dd", …)).
}
