/**
 * REFERENCE FILE (Angular 17+). Not compiled by this project: see ../README.md.
 *
 * src/api/products.ts, as an Angular service. Same URLs, same types. Two differences:
 * HttpClient does the fetch and the JSON parsing, and it returns an Observable, not a Promise.
 * Needs provideHttpClient() in app.config.ts.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import type { Category, Product, ProductsResponse } from '../../src/types';

const API = 'https://dummyjson.com';
const FIELDS = 'title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  /**
   * get<ProductsResponse>() is the Angular twin of fetchJson<ProductsResponse>():
   * the type argument describes the body. Like `as T`, it is a promise, not a runtime check.
   */
  getProducts(limit = 24): Observable<Product[]> {
    return this.http
      .get<ProductsResponse>(`${API}/products`, { params: { limit, select: FIELDS } })
      .pipe(map((res) => res.products)); // res is ProductsResponse, so res.products is Product[]
  }

  search(q: string): Observable<Product[]> {
    return this.http
      .get<ProductsResponse>(`${API}/products/search`, { params: { q, select: FIELDS } })
      .pipe(map((res) => res.products));
  }

  getByCategory(category: Category): Observable<Product[]> {
    return this.http
      .get<ProductsResponse>(`${API}/products/category/${encodeURIComponent(category)}`, { params: { select: FIELDS } })
      .pipe(map((res) => res.products));
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${API}/products/category-list`);
  }
}

/*
 * Cancellation is built into RxJS operators. The Angular version of Session 4's
 * "abort the previous search" is switchMap: a new term unsubscribes from the old request,
 * and HttpClient aborts it.
 *
 *   readonly products$ = this.searchTerm.valueChanges.pipe(
 *     debounceTime(300),
 *     switchMap((q) => this.productService.search(q)),
 *   );
 */
