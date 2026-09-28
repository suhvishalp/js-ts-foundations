/**
 * Small, pure functions: same input, same output, no side effects.
 * They know nothing about the DOM, so any file (or any framework) can reuse them.
 *
 * Right now they are stubs that return safe defaults, so the page still renders.
 */

// TODO(lab-1.4): create ONE Intl.NumberFormat for US dollars here, and use it in formatPrice.
/** 1899.99 → "$1,899.99". Never build money strings by hand. */
export function formatPrice(amount) {
  return String(amount);
}

// TODO(lab-1.5): derive the sale price from the list price and the discount percentage.
/** The API gives a list price and a percentage; the sale price is derived. */
export function discountedPrice(price, discountPercentage = 0) {
  return price;
}

// TODO(lab-1.6): 0 → out / "Sold out", 1–5 → low / "Only N left", otherwise ok / "In stock".
/** Turns a stock number into a badge: which colour, and what it says. */
export function stockStatus(stock) {
  return { tone: "ok", label: "In stock" };
}
