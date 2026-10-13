# examples/ — the same types in React and Angular

Reference files for Lab 5. They are **not compiled by this project** (`tsconfig.json`
includes only `src/`), because they need React or Angular installed. They import
the real `src/types.ts`, `src/api/*` and `src/lib/format.ts`, so you can see that
the types you wrote today move into either framework unchanged.

| File | Framework | What to look at |
|---|---|---|
| `react/ProductCard.tsx` | React 19 | `interface ProductCardProps`, a callback prop, an optional prop with a default, `ChangeEvent<HTMLInputElement>` |
| `react/useProducts.ts` | React 19 | `useState<RequestState<Product[]>>`, `useEffect` with an `AbortController` cleanup |
| `angular/product.service.ts` | Angular 17+ | `@Injectable`, `inject(HttpClient)`, `http.get<ProductsResponse>()` returning an `Observable<Product[]>` |
| `angular/product-card.component.ts` | Angular 17+ | a standalone component, `@Input({ required: true }) product!: Product`, a typed `@Output`, `@if` |

To try one for real, copy `src/types.ts`, `src/api/` and `src/lib/format.ts` into a
new project (`npm create vite@latest -- --template react-ts`, or `ng new`) and fix
the import paths. The Angular service also needs `provideHttpClient()` in `app.config.ts`.
