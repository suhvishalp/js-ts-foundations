/**
 * Pure functions over the product list. None of them touches the DOM, and none of them changes
 * the array it is given: same arguments in, same result out. That is what makes them safe to call
 * on every keystroke, and easy to test.
 *
 * Right now they are stubs that return safe defaults, so the page still renders.
 */

/** Keeps the products whose title or brand contains the query, in the chosen category. */
export function filterProducts(products, filters) {
  // TODO(lab-2.6): destructure { query = "", category = "all" } from the second parameter, then return
  //                products.filter(…): case-insensitive match on title OR brand (brand?.…), and the category.
  return products;
}

/** Returns a NEW, sorted array. sortKey is "featured" or "<field>-<asc|desc>", e.g. "price-asc". */
export function sortProducts(products, sortKey) {
  // TODO(lab-2.7): "featured" → a copy in catalogue order. Otherwise split the key into [field, direction]
  //                and sort a COPY ([...products]) by that field. Never call products.sort() directly.
  return products;
}

/** Every category once, in the order it first appears. */
export function getCategories(products) {
  // TODO(lab-2.10): map to categories, drop duplicates with a Set, spread back into an array.
  return [];
}

/** How many products per category: a Map from category name to count. */
export function countByCategory(products) {
  // TODO(lab-2.11): loop over the products and count each category in a Map (get, then set).
  return new Map();
}

/** Four numbers from one pass over the list: count, average rating, inventory value, best deal. */
export function computeStats(products) {
  // TODO(lab-2.12): one products.reduce(…) that sums ratings and price × stock and keeps the product with the
  //                 biggest discountPercentage. Then return the four stats below (average = sum / count).
  return { count: 0, averageRating: 0, inventoryValue: 0, bestDeal: null };
}
