/**
 * Catalogue logic: pure functions over the product array.
 * Nothing here mutates its input. Every function returns a NEW array or value.
 *
 * Session 4: search and category filtering now happen on the SERVER. What is
 * left here is the filter from Session 2 (still used to narrow search results
 * by category) and two small label helpers.
 */

/** Keeps the products that match the search text and the category. */
export function filterProducts(products, { query = "", category = "all" } = {}) {
  const needle = query.trim().toLowerCase();
  return products.filter((product) => {
    const inCategory = category === "all" || product.category === category;
    const haystack = `${product.title} ${product.brand ?? ""}`.toLowerCase();
    return inCategory && haystack.includes(needle);
  });
}

/** "home-decoration" → "Home decoration" */
export function categoryLabel(slug) {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** What the grid is showing, in words. The race-condition demo depends on it. */
export function describeQuery({ query, category }) {
  const where = category === "all" ? "" : categoryLabel(category);
  if (query && where) return `"${query}" in ${where}`;
  if (query) return `search "${query}"`;
  return where || "all products";
}
