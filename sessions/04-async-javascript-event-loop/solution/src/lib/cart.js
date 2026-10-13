/**
 * The cart's rules, as PURE functions: lines in, new lines out.
 * No DOM, no store, no `this`, no mutation. Both stores (the closure one and
 * the class one) call these, so the rules are written, and tested, once.
 *
 * A line looks like: { id, title, thumbnail, price, stock, qty }.
 */
import { discountedPrice } from "./format.js";

/** Adds a product, or bumps its quantity if it is already in the cart. */
export function addLine(lines, product) {
  if (product.stock === 0) {
    return lines;
  }
  const existing = lines.find((line) => line.id === product.id);
  if (existing) {
    return changeQty(lines, product.id, +1);
  }
  const line = {
    id: product.id,
    title: product.title,
    thumbnail: product.thumbnail,
    price: discountedPrice(product.price, product.discountPercentage),
    stock: product.stock,
    qty: 1,
  };
  return [...lines, line];
}

/** Changes one line's quantity by `delta`, capped at stock. Reaching 0 removes the line. */
export function changeQty(lines, id, delta) {
  const line = lines.find((l) => l.id === id);
  if (!line) {
    return lines;
  }
  const qty = Math.min(line.qty + delta, line.stock);
  if (qty === line.qty) {
    return lines; // nothing changed (already at the stock limit): return the SAME array
  }
  if (qty <= 0) {
    return removeLine(lines, id);
  }
  // A new array, a new object for the changed line, and the untouched lines reused as they are.
  return lines.map((l) => (l.id === id ? { ...l, qty } : l));
}

/** Removes a line. `filter` always returns a new array. */
export function removeLine(lines, id) {
  return lines.filter((line) => line.id !== id);
}

/** How many items, counting quantities: 2 mugs + 1 lamp = 3. */
export function cartCount(lines) {
  return lines.reduce((total, line) => total + line.qty, 0);
}

/** The subtotal: price × qty, summed. */
export function cartSubtotal(lines) {
  return lines.reduce((total, line) => total + line.price * line.qty, 0);
}

/**
 * Freezes the array AND each line. Object.freeze is shallow: freezing the
 * array alone would still let `lines[0].qty = 99` through.
 */
export function freezeLines(lines) {
  lines.forEach((line) => Object.freeze(line));
  return Object.freeze(lines);
}
