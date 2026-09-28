/**
 * Typed wrappers around https://dummyjson.com. Every function states what it resolves to,
 * so a caller never has to guess (or read the network tab) to know the shape.
 */
import { ApiError, fetchJson } from './client';
import type { RequestOptions } from './client';
import type { CatalogQuery, Category, Product, ProductsResponse } from '../types';

export const API = 'https://dummyjson.com';

/** Ask only for the fields `Product` declares: a smaller payload, and a shape that matches the type. */
const FIELDS = 'title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';
const LIMIT = 24;

/**
 * TypeScript does not check data at runtime. This guard does, at the boundary:
 * `unknown` goes in, and only a value with a `products` array comes out as ProductsResponse.
 */
export function isProductsResponse(value: unknown): value is ProductsResponse {
  return typeof value === 'object' && value !== null && 'products' in value && Array.isArray(value.products);
}

async function getList(url: string, options: RequestOptions): Promise<Product[]> {
  const data = await fetchJson<unknown>(url, options);
  if (!isProductsResponse(data)) {
    throw new ApiError('Unexpected response shape', 200, url);
  }
  return data.products;
}

export function getProducts(options: RequestOptions = {}): Promise<Product[]> {
  return getList(`${API}/products?limit=${LIMIT}&select=${FIELDS}`, options);
}

export function searchProducts(q: string, options: RequestOptions = {}): Promise<Product[]> {
  return getList(`${API}/products/search?q=${encodeURIComponent(q)}&limit=${LIMIT}&select=${FIELDS}`, options);
}

export function getByCategory(category: Category, options: RequestOptions = {}): Promise<Product[]> {
  return getList(`${API}/products/category/${encodeURIComponent(category)}?limit=${LIMIT}&select=${FIELDS}`, options);
}

/** `/products/category-list` returns plain slugs: ["beauty", "fragrances", ...]. */
export function getCategories(options: RequestOptions = {}): Promise<Category[]> {
  return fetchJson<Category[]>(`${API}/products/category-list`, options);
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
export async function getCatalog({ q, category }: CatalogQuery, options: CatalogOptions = {}): Promise<Product[]> {
  if (options.simulateFailure) {
    return getList(`${API}/http/503`, options);
  }
  if (q) {
    const found = await searchProducts(q, options);
    return category === 'all' ? found : found.filter((p) => p.category === category);
  }
  return category === 'all' ? getProducts(options) : getByCategory(category, options);
}
