/**
 * DOM rendering for the catalogue. These functions build nodes from data and
 * take callbacks for anything the user does: they never decide what a click MEANS.
 * That is the same split as a React component receiving onAdd as a prop.
 */
import { formatPrice, discountedPrice, stockStatus } from "../lib/format.js";

/** Tiny helper: el("p", { className: "x" }, "text", childNode) → a real element. */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}

/** One product card. `onToggleSave` and `onAdd` are callbacks, called with the product. */
export function createCard(product, { saved = false, qty = 0, onToggleSave, onAdd } = {}) {
  const status = stockStatus(product.stock);
  const soldOut = status.tone === "out";

  const img = el("img", { src: product.thumbnail, alt: product.title, loading: "lazy" });
  const price = el(
    "p",
    { className: "price" },
    formatPrice(discountedPrice(product.price, product.discountPercentage)),
    el("s", {}, formatPrice(product.price)),
  );
  const row = el(
    "div",
    { className: "row" },
    el("span", { className: `badge ${status.tone}` }, status.label),
    el("span", { className: "rating" }, `★ ${product.rating.toFixed(1)}`),
  );

  const add = el("button", { type: "button", className: "btn add", disabled: soldOut });
  add.textContent = soldOut ? "Sold out" : qty > 0 ? `Add another · ${qty} in cart` : "Add to cart";
  add.setAttribute("aria-label", soldOut ? `${product.title} is sold out` : `Add ${product.title} to cart`);
  // The card calls whatever function it was given. It does not know (or care) which store that is.
  add.addEventListener("click", () => onAdd(product));

  const heart = el("button", { type: "button", className: "heart", textContent: saved ? "♥" : "♡" });
  heart.setAttribute("aria-pressed", String(saved));
  heart.setAttribute("aria-label", `Save ${product.title} to your wishlist`);
  heart.addEventListener("click", () => onToggleSave(product.id));

  const body = el(
    "div",
    { className: "body" },
    el("span", { className: "brand" }, product.brand || product.category),
    el("h3", {}, product.title),
    price,
    row,
    add,
  );

  const card = el("article", { className: "card" }, el("div", { className: "thumb" }, img), body, heart);
  card.classList.toggle("is-out", soldOut);
  card.classList.toggle("in-cart", qty > 0);
  return card;
}

/** Renders the whole grid in one DOM update, or an empty state. */
export function renderGrid(gridEl, products, { saved = [], quantities = new Map(), onToggleSave, onAdd } = {}) {
  if (products.length === 0) {
    gridEl.replaceChildren(el("p", { className: "state" }, "No products match. Try another search or category."));
    return;
  }
  const cards = products.map((product) =>
    createCard(product, {
      saved: saved.includes(product.id),
      qty: quantities.get(product.id) ?? 0,
      onToggleSave,
      onAdd,
    }),
  );
  gridEl.replaceChildren(...cards);
}

/** The category filter as a row of toggle chips. */
export function renderCategoryChips(container, categories, active, onSelect) {
  const chips = categories.map((category) => {
    const chip = el("button", { type: "button", className: "filter-chip", textContent: category });
    chip.setAttribute("aria-pressed", String(category === active));
    chip.addEventListener("click", () => onSelect(category));
    return chip;
  });
  container.replaceChildren(...chips);
}

/** The stats side panel. */
export function renderStats(container, stats) {
  const rows = [
    ["Showing", String(stats.count)],
    ["Average price", formatPrice(stats.averagePrice)],
    ["In stock", `${stats.inStock} of ${stats.count}`],
    ["Top rated", stats.topRated ? `${stats.topRated.title} (★ ${stats.topRated.rating.toFixed(1)})` : "—"],
  ];
  container.replaceChildren(...rows.flatMap(([label, value]) => [el("dt", {}, label), el("dd", {}, value)]));
}
