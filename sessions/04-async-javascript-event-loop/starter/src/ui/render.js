/**
 * DOM rendering for the catalogue. These functions build nodes from data and
 * take callbacks for anything the user does: they never decide what a click MEANS.
 * That is the same split as a React component receiving onAdd as a prop.
 *
 * Session 4 adds the two states a network brings: loading (skeletons) and a
 * message state (empty or error, with an optional Retry button).
 */
import { formatPrice, discountedPrice, stockStatus } from "../lib/format.js";
import { categoryLabel } from "../lib/catalog.js";

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
  gridEl.removeAttribute("aria-busy");
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

/** Loading: card-shaped placeholders in the same grid, so nothing jumps when data arrives. */
export function renderSkeletons(gridEl, count = 8) {
  gridEl.setAttribute("aria-busy", "true");
  gridEl.replaceChildren(...Array.from({ length: count }, () => el("div", { className: "skeleton" })));
}

/** One message filling the grid: the empty state, or the error state with a Retry button. */
export function renderState(gridEl, { tone = "", title, message, onRetry }) {
  gridEl.removeAttribute("aria-busy");
  const box = el(
    "div",
    { className: `state ${tone}`.trim(), role: tone === "error" ? "alert" : "status" },
    el("strong", { className: "state-title" }, title),
    el("p", {}, message),
  );
  if (onRetry) {
    const retry = el("button", { type: "button", className: "btn primary", textContent: "Retry" });
    retry.addEventListener("click", () => onRetry());
    box.append(retry);
  }
  gridEl.replaceChildren(box);
}

/** The category <select>, filled from the API's list of slugs. */
export function renderCategoryOptions(select, slugs) {
  const options = slugs.map((slug) => el("option", { value: slug }, categoryLabel(slug)));
  select.replaceChildren(el("option", { value: "all" }, "All categories"), ...options);
}
