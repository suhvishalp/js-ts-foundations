/**
 * The shapes this app agrees on. Types are erased at build time: nothing in this
 * file exists in the browser. It exists for the compiler, the editor and the next
 * developer, and React and Angular code can import it unchanged (see examples/).
 *
 * Right now most of these are `any`, which means "stop checking". The app runs, and the
 * compiler cannot help you. Lab 1 and Lab 2 replace every `any` in this file.
 */

// TODO(lab-5.1): Category is a DummyJSON slug ("smartphones"): make it a string alias.
// Then write Product as an interface: readonly id, title, description, category, price,
// discountPercentage, rating, stock, an OPTIONAL brand, and thumbnail.
export type Category = any;
export type Product = any;

// TODO(lab-5.1): model the list response { products, total, skip, limit }: a Page interface,
// a generic ApiListResponse<T, K extends string = 'products'> = Page & Record<K, T[]>,
// and ProductsResponse = ApiListResponse<Product>.
export type ProductsResponse = any;

// TODO(lab-5.1): a CartLine is Pick<Product, 'id' | 'title' | 'price' | 'thumbnail'> plus qty: number, all Readonly.
export type CartLine = any;

/** What the toolbar asks for. */
export interface CatalogQuery {
  q: string;
  category: Category | 'all';
}

// TODO(lab-5.2): replace this loose shape with a DISCRIMINATED UNION of four states:
// idle | loading | success (with data: T) | error (with error: ApiError).
// You will need `import type { ApiError } from './api/client';` at the top of the file.
export interface RequestState<T = any> {
  status: string;
  data?: T;
  error?: any;
}

/** Everything the network log panel can show. */
export type LogKind = 'request' | 'success' | 'retry' | 'abort' | 'error';

export interface LogEntry {
  readonly id: number;
  readonly at: Date;
  kind: LogKind;
  text: string;
}
