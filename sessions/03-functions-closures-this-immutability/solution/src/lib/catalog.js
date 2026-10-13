/**
 * Catalogue logic from Session 2: pure functions over the product array.
 * Nothing here mutates its input. Every function returns a NEW array or object.
 */
import { discountedPrice } from "./format.js";

/** Keeps the products that match the search text and the category. */
export function filterProducts(products, { query = "", category = "all" } = {}) {
  const needle = query.trim().toLowerCase();
  return products.filter((product) => {
    const inCategory = category === "all" || product.category === category;
    const haystack = `${product.title} ${product.brand ?? ""}`.toLowerCase();
    return inCategory && haystack.includes(needle);
  });
}

// One comparator per sort key. A lookup table beats a growing if/else chain.
const comparators = {
  "price-asc": (a, b) => discountedPrice(a.price, a.discountPercentage) - discountedPrice(b.price, b.discountPercentage),
  "price-desc": (a, b) => discountedPrice(b.price, b.discountPercentage) - discountedPrice(a.price, a.discountPercentage),
  rating: (a, b) => b.rating - a.rating,
  title: (a, b) => a.title.localeCompare(b.title),
};

/** Returns a sorted COPY. `.sort()` mutates, so we spread first. "featured" keeps the original order. */
export function sortProducts(products, sortKey = "featured") {
  const compare = comparators[sortKey];
  return compare ? [...products].sort(compare) : [...products];
}

/** ["all", "beauty", "fragrances", ...]: a Set removes the duplicates. */
export function getCategories(products) {
  return ["all", ...new Set(products.map((product) => product.category))];
}

/** The numbers in the stats panel, derived from whatever is visible. */
export function computeStats(products) {
  const count = products.length;
  const total = products.reduce((sum, p) => sum + discountedPrice(p.price, p.discountPercentage), 0);
  const inStock = products.filter((p) => p.stock > 0).length;
  const topRated = products.reduce((best, p) => (best === null || p.rating > best.rating ? p : best), null);
  return {
    count,
    averagePrice: count === 0 ? 0 : total / count,
    inStock,
    topRated,
  };
}
