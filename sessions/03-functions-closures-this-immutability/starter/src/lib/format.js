/**
 * Small, pure functions: same input, same output, no side effects.
 * They know nothing about the DOM, so any file (or any framework) can reuse them.
 */

// One formatter, created once when the module loads, not on every call.
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** 1899.99 → "$1,899.99". Never build money strings by hand. */
export function formatPrice(amount) {
  return usd.format(amount);
}

/** The API gives a list price and a percentage; the sale price is derived. */
export function discountedPrice(price, discountPercentage = 0) {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}

/** Turns a stock number into a badge: which colour, and what it says. */
export function stockStatus(stock) {
  if (stock === 0) {
    return { tone: "out", label: "Sold out" };
  }
  if (stock <= 5) {
    return { tone: "low", label: `Only ${stock} left` };
  }
  return { tone: "ok", label: "In stock" };
}
