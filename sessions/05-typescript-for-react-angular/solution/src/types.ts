/**
 * The shapes this app agrees on. Types are erased at build time: nothing in this
 * file exists in the browser. It exists for the compiler, the editor and the next
 * developer, and React and Angular code can import it unchanged (see examples/).
 */
import type { ApiError } from './api/client';

/** A category is a DummyJSON slug such as "smartphones" or "mens-shirts". */
export type Category = string;

/** One product, trimmed to the fields the app asks DummyJSON for. */
export interface Product {
  readonly id: number;
  title: string;
  description: string;
  category: Category;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  /** Optional: about half the live catalogue has no brand. */
  brand?: string;
  thumbnail: string;
}

/** The paging fields every DummyJSON list response carries. */
export interface Page {
  total: number;
  skip: number;
  limit: number;
}

/**
 * A list response: the paging fields plus ONE array under a resource key.
 * `{ products: Product[] }`, `{ users: User[] }`... `K extends string` constrains the key,
 * and the default `'products'` means `ApiListResponse<Product>` is all you usually write.
 */
export type ApiListResponse<T, K extends string = 'products'> = Page & Record<K, T[]>;

/** Exactly what GET https://dummyjson.com/products returns: { products, total, skip, limit }. */
export type ProductsResponse = ApiListResponse<Product>;

/** A cart line keeps only what the cart shows, plus a quantity. `Pick` copies those fields' types. */
export type CartLine = Readonly<Pick<Product, 'id' | 'title' | 'price' | 'thumbnail'> & { qty: number }>;

/** What the toolbar asks for. */
export interface CatalogQuery {
  q: string;
  category: Category | 'all';
}

/**
 * Request state as a DISCRIMINATED UNION: four shapes, told apart by `status`.
 * `data` only exists when status is 'success'; `error` only when it is 'error'.
 * Impossible combinations (loading AND an error) cannot even be written.
 */
export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

/** Everything the network log panel can show. */
export type LogKind = 'request' | 'success' | 'retry' | 'abort' | 'error';

export interface LogEntry {
  readonly id: number;
  readonly at: Date;
  kind: LogKind;
  text: string;
}
