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

  // TODO(lab-3.9): render one <li class="cart-line"> per line (image, title, price × qty,
  // − / + buttons, a × remove button), then a footer with the subtotal and a "Clear cart"
  // button. Each button calls its callback: () => onIncrement(line.id), and so on.
  container.replaceChildren(el("p", { className: "cart-empty" }, `${lines.length} line(s) in the cart. Rendering them is lab 3.9.`));
}
