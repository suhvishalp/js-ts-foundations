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

  // TODO(lab-1.7): build a <p class="price"> holding the sale price, then the original price in an <s>.
  const price = document.createElement("p");
  price.className = "price";
  price.textContent = product.price;

  // TODO(lab-1.8): build the stock badge (<span class="badge ok|low|out">) and mark sold-out cards with "is-out".
  const badge = document.createElement("span");

  const rating = document.createElement("span");
  rating.className = "rating";
  rating.textContent = `★ ${product.rating.toFixed(1)}`;

  const row = document.createElement("div");
  row.className = "row";
  row.append(badge, rating);

  // TODO(lab-1.9): create the heart <button class="heart"> with data-id, aria-pressed and aria-label, and append it to the card.

  body.append(brand, title, price, row);
  card.append(thumb, body);
  return card;
}

/** Renders every product into the grid in one DOM update. */
export function renderGrid(gridEl, products) {
  // TODO(lab-1.10): render EVERY product (for...of + a DocumentFragment), not just the first one.
  gridEl.replaceChildren(createCard(products[0]));
}
