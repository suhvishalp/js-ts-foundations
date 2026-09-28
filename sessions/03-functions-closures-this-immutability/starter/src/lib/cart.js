/**
 * The cart's rules, as PURE functions: lines in, new lines out.
 * No DOM, no store, no `this`, no mutation. Both stores (the closure one and
 * the class one) call these, so the rules are written, and tested, once.
 *
 * A line looks like: { id, title, thumbnail, price, stock, qty }.
 */
import { discountedPrice } from "./format.js";

// TODO(lab-3.5): write addLine, changeQty and removeLine as immutable updates
// (spread, map, filter; never push, splice or `line.qty++`). The stubs return
// the lines unchanged, which is safe: nothing breaks, nothing happens.

/** Adds a product, or bumps its quantity if it is already in the cart. */
export function addLine(lines, product) {
  return lines;
}

/** Changes one line's quantity by `delta`, capped at stock. Reaching 0 removes the line. */
export function changeQty(lines, id, delta) {
  return lines;
}

/** Removes a line. `filter` always returns a new array. */
export function removeLine(lines, id) {
  return lines;
}

// TODO(lab-3.6): cartCount and cartSubtotal, each one `reduce`.

/** How many items, counting quantities: 2 mugs + 1 lamp = 3. */
export function cartCount(lines) {
  return 0;
}

/** The subtotal: price × qty, summed. */
export function cartSubtotal(lines) {
  return 0;
}

/**
 * Freezes the array AND each line. Object.freeze is shallow: freezing the
 * array alone would still let `lines[0].qty = 99` through.
 */
export function freezeLines(lines) {
  // TODO(lab-3.15): freeze every line, then the array, and return it.
  return lines;
}
