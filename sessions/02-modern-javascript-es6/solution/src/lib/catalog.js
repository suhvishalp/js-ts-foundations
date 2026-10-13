/**
 * Pure functions over the product list. None of them touches the DOM, and none of them changes
 * the array it is given: same arguments in, same result out. That is what makes them safe to call
 * on every keystroke, and easy to test.
 */

/** Keeps the products whose title or brand contains the query, in the chosen category. */
export function filterProducts(products, { query = "", category = "all" } = {}) {
  const q = query.trim().toLowerCase();

  return products.filter(({ title, brand, category: productCategory }) => {
    const inCategory = category === "all" || productCategory === category;
    // brand?.… : one product has no brand. ?. gives undefined instead of throwing a TypeError.
    const matchesQuery = q === "" || title.toLowerCase().includes(q) || brand?.toLowerCase().includes(q);
    return inCategory && matchesQuery;
  });
}

/**
 * Returns a NEW, sorted array. sortKey is "featured" or "<field>-<asc|desc>", e.g. "price-asc".
 * sort() reorders the array in place, so we always sort a copy.
 */
export function sortProducts(products, sortKey = "featured") {
  if (sortKey === "featured") return [...products]; // the catalogue's own order

  const [field, direction] = sortKey.split("-"); // "price-desc" → ["price", "desc"]
  const sign = direction === "desc" ? -1 : 1;
  return [...products].sort((a, b) => (a[field] - b[field]) * sign);
}

/** Every category once, in the order it first appears. A Set drops the duplicates for us. */
export function getCategories(products) {
  return [...new Set(products.map(({ category }) => category))];
}

/** How many products per category: a Map from category name to count. */
export function countByCategory(products) {
  const counts = new Map();
  for (const { category } of products) {
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return counts;
}

/** Four numbers from one pass over the list: count, average rating, inventory value, best deal. */
export function computeStats(products) {
  const totals = products.reduce(
    (acc, product) => ({
      ratingSum: acc.ratingSum + product.rating,
      inventoryValue: acc.inventoryValue + product.price * product.stock,
      bestDeal:
        !acc.bestDeal || product.discountPercentage > acc.bestDeal.discountPercentage ? product : acc.bestDeal,
    }),
    { ratingSum: 0, inventoryValue: 0, bestDeal: null }, // the starting value: what an empty list gives
  );

  const count = products.length;
  return {
    count,
    averageRating: count > 0 ? totals.ratingSum / count : 0,
    inventoryValue: totals.inventoryValue,
    bestDeal: totals.bestDeal,
  };
}
