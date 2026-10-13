/** Formatting helpers. Annotate the boundaries (parameters, return types); let inference do the middle. */

// Created once at module scope, not on every call. Its type (Intl.NumberFormat) is inferred.
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 9.99 → "$9.99". */
export function formatPrice(amount: number): string {
  return usd.format(amount);
}

/** DummyJSON gives a list price and a percentage; the sale price is derived. */
export function discountedPrice(price: number, discountPercentage = 0): number {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}

/** "mens-shirts" → "Mens Shirts". */
export function categoryLabel(slug: string): string {
  return slug
    .split('-')
    // With noUncheckedIndexedAccess, `word[0]` is `string | undefined` (an empty word has no [0]).
    // charAt(0) always returns a string, so no check is needed.
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** A literal union: exactly three values, and a typo in any of them is a compile error. */
export type StockLevel = 'ok' | 'low' | 'out';

export function stockLevel(stock: number): StockLevel {
  if (stock === 0) return 'out';
  if (stock < 10) return 'low';
  return 'ok';
}

/**
 * `satisfies` checks that every StockLevel has a label (miss one and it fails),
 * while `as const` keeps the exact literal values: STOCK_LABELS.low is 'Low stock', not string.
 */
export const STOCK_LABELS = {
  ok: 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
} as const satisfies Record<StockLevel, string>;
