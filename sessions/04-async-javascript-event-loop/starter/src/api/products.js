/**
 * The DummyJSON product endpoints. Each function returns a promise of plain
 * data (an array), so the rest of the app never sees URLs or envelopes.
 * Every function accepts { signal } so its request can be cancelled.
 */
import { fetchJson } from "./client.js";

const BASE = "https://dummyjson.com/products";
const FIELDS = "id,title,brand,category,price,discountPercentage,rating,stock,thumbnail";

/** List endpoints answer with an envelope: { products, total, skip, limit }. */
const unwrap = (envelope) => envelope.products ?? [];

export async function getProducts({ signal } = {}) {
  return unwrap(await fetchJson(`${BASE}?limit=24&select=${FIELDS}`, { signal }));
}

/** An array of slugs: ["beauty", "fragrances", …]. No envelope here. */
export async function getCategories({ signal } = {}) {
  return fetchJson(`${BASE}/category-list`, { signal });
}

// TODO(lab-3.2): implement both, following getProducts:
//   search:   `${BASE}/search?q=${q}&limit=24&select=${FIELDS}`       (q = encodeURIComponent(query))
//   category: `${BASE}/category/${category}?limit=24&select=${FIELDS}` (category = encodeURIComponent(slug))
export async function searchProducts(query, { signal } = {}) {
  return [];
}

export async function getByCategory(slug, { signal } = {}) {
  return [];
}
