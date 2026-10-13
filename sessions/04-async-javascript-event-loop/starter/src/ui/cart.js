/**
 * The cart panel. It receives the lines and four callbacks, and calls them
 * as plain functions: onIncrement(id), not store.increment(id). That is how a
 * React child calls a prop, and how most callback APIs call you back.
 */
import { formatPrice } from "../lib/format.js";
import { cartSubtotal } from "../lib/cart.js";
import { el } from "./render.js";

export function renderCart(container, lines, { onIncrement, onDecrement, onRemove, onClear }) {
  if (lines.length === 0) {
    container.replaceChildren(el("p", { className: "cart-empty" }, "Your cart is empty. Add something from the grid."));
    return;
  }

  const items = lines.map((line) => {
    const minus = el("button", { type: "button", className: "qty-btn", textContent: "−" });
    minus.setAttribute("aria-label", `One fewer ${line.title}`);
    minus.addEventListener("click", () => onDecrement(line.id));

    const plus = el("button", { type: "button", className: "qty-btn", textContent: "+", disabled: line.qty >= line.stock });
    plus.setAttribute("aria-label", `One more ${line.title}`);
    plus.addEventListener("click", () => onIncrement(line.id));

    const remove = el("button", { type: "button", className: "remove-btn", textContent: "×" });
    remove.setAttribute("aria-label", `Remove ${line.title}`);
    remove.addEventListener("click", () => onRemove(line.id));

    return el(
      "li",
      { className: "cart-line" },
      el("img", { src: line.thumbnail, alt: "", loading: "lazy" }),
      el(
        "div",
        { className: "cart-line-main" },
        el("span", { className: "cart-line-title" }, line.title),
        el("span", { className: "cart-line-price" }, `${formatPrice(line.price)} × ${line.qty} = ${formatPrice(line.price * line.qty)}`),
        el("div", { className: "qty" }, minus, el("output", {}, String(line.qty)), plus),
      ),
      remove,
    );
  });

  const clear = el("button", { type: "button", className: "btn clear-btn", textContent: "Clear cart" });
  clear.addEventListener("click", () => onClear());

  const footer = el(
    "div",
    { className: "cart-footer" },
    el("span", {}, "Subtotal"),
    el("strong", { className: "cart-subtotal" }, formatPrice(cartSubtotal(lines))),
    clear,
  );

  container.replaceChildren(el("ul", { className: "cart-lines" }, ...items), footer);
}
