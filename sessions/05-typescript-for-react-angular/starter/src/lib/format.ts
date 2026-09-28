/** Formatting helpers. Annotate the boundaries (parameters, return types); let inference do the middle. */

// Created once at module scope, not on every call. Its type (Intl.NumberFormat) is inferred.
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

// TODO(lab-5.1): replace every `any` below with a real type, and give each function a return type.
// Strict mode will not let a parameter go unannotated; `any` is how this file "gets away with it".
export function formatPrice(amount: any) {
  return usd.format(amount);
}

export function discountedPrice(price: any, discountPercentage: any = 0) {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}

/** "mens-shirts" → "Mens Shirts". */
export function categoryLabel(slug: any) {
  return slug
    .split('-')
    .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// TODO(lab-5.4): make StockLevel a literal union ('ok' | 'low' | 'out') and give stockLevel that
// return type. Then make STOCK_LABELS `as const satisfies Record<StockLevel, string>`.
export type StockLevel = string;

export function stockLevel(stock: number): StockLevel {
  if (stock === 0) return 'out';
  if (stock < 10) return 'low';
  return 'ok';
}

export const STOCK_LABELS: Record<string, string> = {
  ok: 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
};
