import { formatPrice, discountedPrice, stockStatus } from "../lib/format.js";

/** Builds one product card as real DOM nodes. Returns it; the caller decides where it goes. */
export function createCard(product) {
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
  heart.setAttribute("aria-pressed", "false");
  heart.setAttribute("aria-label", `Save ${product.title} to your wishlist`);
  heart.textContent = "♡";

  body.append(brand, title, price, row);
  card.append(thumb, body, heart);
  return card;
}

/** Renders every product into the grid in one DOM update. */
export function renderGrid(gridEl, products) {
  const fragment = document.createDocumentFragment();
  for (const product of products) {
    fragment.append(createCard(product));
  }
  gridEl.replaceChildren(fragment);
}
