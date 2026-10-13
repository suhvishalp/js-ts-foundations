/**
 * Wrappers around https://dummyjson.com. Each one works, and each one returns Promise<any>,
 * so a caller has to guess (or read the network tab) to know the shape.
 */
import { fetchJson } from './client';
import type { RequestOptions } from './client';
import type { CatalogQuery, Category } from '../types';

export const API = 'https://dummyjson.com';

/** Ask only for the fields `Product` declares: a smaller payload, and a shape that matches the type. */
const FIELDS = 'title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';
const LIMIT = 24;

// TODO(lab-5.4): TypeScript does not check data at runtime. Write a type guard
// isProductsResponse(value: unknown): value is ProductsResponse, then make getList ask for
// fetchJson<unknown>(…) and throw an ApiError('Unexpected response shape', 200, url) if the guard fails.
async function getList(url: string, options: RequestOptions) {
  const data = await fetchJson(url, options);
  return data.products;
}

// TODO(lab-5.3): give every function below an explicit return type: Promise<Product[]> for the lists,
// Promise<Category[]> for getCategories (via fetchJson<Category[]>). getList returns Promise<Product[]> too.
export function getProducts(options: RequestOptions = {}) {
  return getList(`${API}/products?limit=${LIMIT}&select=${FIELDS}`, options);
}

export function searchProducts(q: string, options: RequestOptions = {}) {
  return getList(`${API}/products/search?q=${encodeURIComponent(q)}&limit=${LIMIT}&select=${FIELDS}`, options);
}

export function getByCategory(category: Category, options: RequestOptions = {}) {
  return getList(`${API}/products/category/${encodeURIComponent(category)}?limit=${LIMIT}&select=${FIELDS}`, options);
}

/** `/products/category-list` returns plain slugs: ["beauty", "fragrances", ...]. */
export function getCategories(options: RequestOptions = {}) {
  return fetchJson(`${API}/products/category-list`, options);
}

export interface CatalogOptions extends RequestOptions {
  /** Demo switch: hit DummyJSON's /http/503 endpoint to see retries and the error state. */
  simulateFailure?: boolean;
}

/** A readable label for the network log, e.g. `/products/search?q=phone`. */
export function describeQuery({ q, category }: CatalogQuery, simulateFailure = false): string {
  if (simulateFailure) return '/http/503';
  if (q) return `/products/search?q=${q}${category === 'all' ? '' : ` (in ${category})`}`;
  if (category !== 'all') return `/products/category/${category}`;
  return '/products';
}

/** One entry point for the toolbar: search wins, then category; a search inside a category filters locally. */
export async function getCatalog({ q, category }: CatalogQuery, options: CatalogOptions = {}) {
  if (options.simulateFailure) {
    return getList(`${API}/http/503`, options);
  }
  if (q) {
    const found = await searchProducts(q, options);
    return category === 'all' ? found : found.filter((p: any) => p.category === category);
  }
  return category === 'all' ? getProducts(options) : getByCategory(category, options);
}
