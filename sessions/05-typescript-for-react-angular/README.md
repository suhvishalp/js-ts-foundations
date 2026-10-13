# Session 5 — TypeScript for React & Angular

**Session guide** · ~120 minutes · the live catalogue from Session 4, rewritten in strict TypeScript, so you walk into React or Angular fluent in the language both of them default to

---

## Where you are starting from

Session 4 ended with a live catalogue in plain JavaScript: a debounced search you can
cancel, a category select, skeletons, an error state with a retry button, a network log
and a cart. The starter is **the same app, already converted to TypeScript**. It is a
Vite `vanilla-ts` project, the files are `.ts`, and `strict` is on.

The logic is all there and the app runs. What is missing is the *types*. The starter gets
through strict mode the way a lot of real projects do: with `any`, a `status: string`, a
`Promise<any>`, and an untyped store. `npm run build` passes, and the compiler catches
nothing, because `any` means "stop checking".

Written for you: every line of runtime logic, `index.html`, the styles, `src/lib/assert.ts`,
the `ApiError` class, and `examples/` (React and Angular reference files for Lab 5).
Your job: **16 `TODO(lab-5.x)` markers**, where `x` is the lab number. Find them with
`grep -rn "TODO(lab-5" src`.

| File | Session 4 had | Today you add |
|---|---|---|
| `src/types.ts` | nothing (JavaScript has no types) | `Product`, `ProductsResponse`, `CartLine`, `RequestState<T>` |
| `src/api/client.ts` | `fetchJson`, `withRetry`, `ApiError` | `fetchJson<T>`, `withRetry<T>`, the `isApiError` guard |
| `src/api/products.ts` | `getProducts`, `searchProducts`… | return types, and a runtime guard for the response |
| `src/store/createStore.ts` | `observable.js` + `createCartStore.js` | one generic `createStore<T>()` |
| `src/store/cart.ts` | cart actions | a discriminated union of actions |
| `src/ui/render.ts` | `render` switching on a status string | an exhaustive `switch` with `assertNever` |
| `src/lib/*.ts`, `src/main.ts` | helpers, wiring | generic helpers, a typed DOM, typed events |

## What you ship today

**ShopScope Lite — typed.** The same live catalogue, with zero `any` in `src/`. The screen
is driven by one value of type `RequestState<Product[]>`, and the renderer handles every
state or the build fails. A generic `fetchJson<T>()` and a generic `createStore<T>()` power
the catalogue, the cart and the network log. A type guard checks what the network really
sent. A "Type safety" panel shows three bugs the compiler caught in this very app. And
`examples/` shows the same types in a React component and hook, and an Angular service and
component.

By the end you will be able to answer, without hesitating:

- What happens to your types when the code runs (and why TypeScript cannot make code slower)
- When to write a type annotation and when to let inference do it
- Whether to reach for `interface` or `type`, and why it rarely matters
- How a discriminated union makes "loading *and* an error" impossible to write
- What `never` is doing in `assertNever`, and how it turns a forgotten case into a build error
- How `fetchJson<T>()`, `useState<T>()` and `HttpClient.get<T>()` are the same idea
- Why `unknown` is safe and `any` is not, and what `value is ApiError` buys you
- Why `noUncheckedIndexedAccess` makes `products[0]` a `Product | undefined`

> **TypeScript is a set of facts about your JavaScript that a machine can check.** A union
> is a fact about which shapes can appear. A generic is a fact that travels through a
> function. `unknown` is the honest fact about what a network hands you. None of it exists
> at runtime; all of it exists at 2 a.m., when you rename a field and the compiler lists
> every place that needs to change.

## Before the session (10 minutes)

**StackBlitz:** open the `sessions/05-typescript-for-react-angular/starter` folder in
StackBlitz (use the fork link your trainer shares, or drag the folder into stackblitz.com).
Bookmark your copy's `stackblitz.com/edit/…` URL, so you come back to *your* work.

**Locally** (Node 22 or newer):

```bash
cd sessions/05-typescript-for-react-angular/starter
npm install
npm run dev
```

Open a **second terminal** in the same folder. You will run `npm run typecheck` in it all
session. Use an editor with TypeScript support (VS Code works out of the box), because the
red squiggles are half of today's feedback.

## How this guide works

Every lab follows the same rhythm:

- **Problem**: what is wrong with the app right now.
- **Concept**: the *what*, the *why* and the *how*, with short examples.
- **Steps**: numbered and exact. Which file, which TODO, the code to write. The code matches `solution/`.
- **Verify**: how you know it worked, including errors you trigger on purpose.
- **Watch out**: the mistakes people actually make.
- **Challenge (2 min)**: a small stretch, if you finish early.
- **In the real world**: where this exact idea appears in **React** and in **Angular**.

One rule for today: **Vite serves, `tsc` checks.** The dev server strips types without
reading them, so a type error never stops the page from loading. `npm run typecheck` is the
check, and `npm run build` runs it first. The page working proves nothing about the types.

---

## Orientation — what is in the box (5 min)

Run the starter. Search for "phone", pick a category, tick **Simulate a failing API**, watch
the retries in the network log, add something to the cart. It all works. Now open
`src/types.ts`:

```ts
export type Product = any;
```

Hover `product` anywhere in `render.ts`: `any`. Type `product.pirce` in `productCard`:
no squiggle, and `npm run typecheck` passes. **That is the problem this session solves.**

Three files are worth two minutes each:

- `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`,
  and `include: ["src"]`, which is why `examples/` is not compiled. Lab 4 reads it line by line.
- `src/lib/assert.ts`: `assertNever(value: never): never`. Four lines you will use twice.
- The **Type safety** panel in the app. Three real bugs, with the exact compiler messages.
  Today, with loose types, the compiler catches none of them. By Lab 4 it catches all three.

---

## Lab 1 — Why TypeScript, inference and the basic types (20 min)

### Problem

`Product` is `any`, so the compiler cannot tell you that `product.pirce` is a typo, that
`brand` is sometimes missing, or that `formatPrice('9.99')` is a mistake. Every file that
touches a product is unchecked.

### Concept

**Why TypeScript at all?** Four reasons, in the order you will feel them:

1. **It catches bugs before runtime.** `product.price.toFixed(2)` on a product that might be
   `undefined` is a red squiggle, not a crash report.
2. **Editor intelligence.** Autocomplete on `product.`, "go to definition", and *rename
   symbol* that updates every file safely.
3. **It documents intent.** `function discountedPrice(price: number, discountPercentage = 0): number`
   is documentation that cannot go out of date, because the compiler enforces it.
4. **It scales to teams.** Change a shared type and the compiler lists every place that needs
   to change, including code you have never read.

**TypeScript is a superset of JavaScript.** Every JavaScript program is (syntactically) a
TypeScript program; TypeScript adds a type layer on top. And then **it erases it**: the
compiler (or Vite, or esbuild) removes the types and ships plain JavaScript.

```ts
// what you write
function formatPrice(amount: number): string {
  return usd.format(amount);
}
```

```js
// what the browser runs
function formatPrice(amount) {
  return usd.format(amount);
}
```

> **Misconception: "TypeScript makes code slower."** The types are gone before the code
> runs. There is nothing left to be slow. The cost is at *build* time (the type check),
> never in the browser.

**Inference: let the compiler work.** You rarely need to write a type for a variable.

```ts
let status = 'idle';          // string  (let can be reassigned, so it widens)
const mode = 'idle';          // 'idle'  (const cannot change, so it keeps the literal)
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }); // Intl.NumberFormat
const titles = products.map((p) => p.title);  // string[]
```

**Annotate where it adds value**: function parameters (nothing to infer from), exported
return types (a promise to your callers), and empty starting values (`useState<Product[]>([])`,
`new Set<Listener<T>>()`). Annotate the boundaries, infer the middle.

**The basic types.** Primitives: `string`, `number`, `boolean`, `null`, `undefined`,
`bigint`, `symbol`. Arrays: `string[]` or `Array<string>`, and `readonly string[]` when
nobody may push to it. **Tuples** are arrays with a fixed length and a type per position:

```ts
const entry: [string, number] = ['phone', 23];
entry[2]; // error TS2493: Tuple type '[string, number]' of length '2' has no element at index '2'.
```

You already use a tuple every day in React: `const [count, setCount] = useState(0)`.

**Object types, `interface` versus `type`.** Both describe object shapes:

```ts
interface Product { readonly id: number; title: string; brand?: string }
type Product = { readonly id: number; title: string; brand?: string };
```

`?` means the key may be absent (its type becomes `string | undefined`). `readonly` means
nobody may assign to it after creation. The practical rule in this course: **`interface` for
object shapes, `type` for everything else** (unions, tuples, aliases like `Category`,
mapped and utility types). An `interface` can be *extended* (`interface RetryOptions extends RequestOptions`)
and *merged* (declare it twice and the declarations combine); a `type` can express unions,
which an interface cannot.

> **Misconception: "interfaces and types are totally different."** For object shapes they
> are nearly interchangeable. Declaring the same `interface` twice merges them; declaring the
> same `type` twice is `error TS2300: Duplicate identifier`. Pick one convention and move on.

### Steps

**A. `src/types.ts` — first `TODO(lab-5.1)`: `Category` and `Product`**

Replace the two `any` aliases. Read the fields against `https://dummyjson.com/products/1`:

```ts
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
```

`Category` is only an alias for `string`, but it documents intent: a function that takes a
`Category` is asking for a slug, not any string.

**B. `src/types.ts` — second `TODO(lab-5.1)`: the list response**

Every DummyJSON list looks like `{ products: [...], total, skip, limit }` (for users it is
`{ users: [...], ... }`). Model the part that is always the same, then the part that varies:

```ts
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
```

This is your first generic type. Lab 3 explains `<T>` and `extends` properly; for now, read
it as "a template with blanks", and `&` as "has everything from both".

**C. `src/types.ts` — third `TODO(lab-5.1)`: `CartLine`**

```ts
/** A cart line keeps only what the cart shows, plus a quantity. `Pick` copies those fields' types. */
export type CartLine = Readonly<Pick<Product, 'id' | 'title' | 'price' | 'thumbnail'> & { qty: number }>;
```

`Pick` and `Readonly` are *utility types* (Lab 4). The win right now: if `Product.price`
ever changes type, `CartLine.price` follows automatically.

**D. `src/lib/format.ts` — `TODO(lab-5.1)`**

Replace the three signatures (the bodies stay the same, except `word` loses its `: any`):

```ts
/** 9.99 → "$9.99". */
export function formatPrice(amount: number): string {
  return usd.format(amount);
}

/** DummyJSON gives a list price and a percentage; the sale price is derived. */
export function discountedPrice(price: number, discountPercentage = 0): number {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}

/** "mens-shirts" → "Mens Shirts". */
export function categoryLabel(slug: string): string {
  return slug
    .split('-')
    // With noUncheckedIndexedAccess, `word[0]` is `string | undefined` (an empty word has no [0]).
    // charAt(0) always returns a string, so no check is needed.
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

`discountPercentage = 0` has no annotation: the default value tells TypeScript it is a
`number`, and makes it optional. `word` needs none either: `split` returns `string[]`, so
`map` knows each `word` is a `string`.

### Verify

1. `npm run typecheck` passes.
2. In `render.ts`, inside `productCard`, type `product.pirce`. Red squiggle:
   `Property 'pirce' does not exist on type 'Product'. Did you mean 'price'?` Delete it.
3. Hover `product.brand`: `string | undefined`. Now find where `render.ts` uses it:
   `product.brand ?? categoryLabel(product.category)`. The optional field forced a fallback.
4. In `categoryLabel`, change `word.charAt(0)` to `word[0]`:
   `error TS2532: Object is possibly 'undefined'.` That is `noUncheckedIndexedAccess` (Lab 4). Revert.

### Watch out

**The page still runs with type errors.** Vite does not check types. Keep the typecheck
terminal visible.

**Do not annotate everything.** `const total: number = a + b` adds noise and no safety.

### Challenge (2 min)

`Product` from DummyJSON also has `tags: string[]`. Add it as optional and readonly
(`readonly tags?: readonly string[]`), add `tags` to `FIELDS` in `products.ts`, and write a
`tagLine(product: Product): string` in `format.ts` that joins them or returns `''`.
(Hint: `?.` and `??`.)

### In the real world

**React:** props are an object type, and `interface` is the convention:

```tsx
interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  inCart?: number;                    // optional prop, default it in the destructuring
}
export function ProductCard({ product, onAdd, inCart = 0 }: ProductCardProps) { /* … */ }
```

**Angular:** the same `Product` interface types a component input and a service method.
Angular models are almost always interfaces (not classes), precisely because types are
erased and cost nothing:

```ts
@Input({ required: true }) product!: Product;
getProducts(): Observable<Product[]> { /* … */ }
```

Both frameworks can import *this exact* `src/types.ts`. That is Lab 5.

---

## Lab 2 — Unions, narrowing and a request state machine (30 min)

### Problem

`RequestState` is `{ status: string; data?: any; error?: any }`. So `'sucess'` compiles,
`data` has to be treated as maybe-missing even on success (look for `state.data ?? []` in
`render.ts`), and nothing stops "loading with an error and stale data". The cart has the same
flaw: `{ type: 'ad' }` is a valid `CartAction`.

### Concept

**Unions and literal types.** `A | B` means "one of these". A *literal type* is a single
value used as a type: `'idle'`, `404`, `true`. Combine them and you get a precise set:

```ts
type StockLevel = 'ok' | 'low' | 'out';
let level: StockLevel = 'low';   // fine
level = 'medium';                // error: Type '"medium"' is not assignable to type 'StockLevel'.
```

**Narrowing** is TypeScript following your `if`s. Inside a branch, the type is smaller.
The app uses all five kinds:

| Check | Example from this app | After the check |
|---|---|---|
| `typeof` | `typeof value === 'object'` in `isProductsResponse` | `value` is `object \| null` |
| truthiness | `if (!el) throw …` in `dom.ts` | `el` is `T`, not `T \| null` |
| `in` | `'products' in value` | `value` has a `products` key |
| `instanceof` | `event.target instanceof Element` | `closest()` is available |
| equality | `state.status === 'success'` | `state.data` exists |

**Discriminated unions** are the big one. A union of object types that share one literal
field, the *discriminant* (here `status`):

```ts
export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };
```

Checking `status` narrows the whole object. `data` exists *only* in the success shape, so
`state.data` outside a success branch is `error TS2339: Property 'data' does not exist on type 'RequestState<Product[]>'`.
Impossible states become impossible to write. Session 4's `'empty'` status disappears too:
empty is a success whose `data` has no items.

**Exhaustiveness with `never`.** `never` is the type with no values. After a `switch` has
handled every member of a union, what is left is `never`. So:

```ts
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
```

in the `default` branch compiles only when nothing is left. Add a fifth state next month,
forget one renderer, and the build fails *at that renderer*:

```
error TS2345: Argument of type '{ status: "error"; error: ApiError; }' is not assignable to parameter of type 'never'.
```

**Enums versus union literals: prefer unions.** `enum Status { Idle = 'idle' }` is one of
the few TypeScript features that is *not* erased: it compiles to a runtime object (an IIFE
that builds `Status`). Unions cost nothing at runtime, work with plain strings from JSON,
and read the same in React and Angular code. This project's `tsconfig` even sets
`erasableSyntaxOnly`, which rejects enums (`error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.`).
When you also need the list of values at runtime, write the array with `as const` (Lab 4).

### Steps

**A. `src/types.ts` — `TODO(lab-5.2)`**

Add a type-only import at the top of the file:

```ts
import type { ApiError } from './api/client';
```

and replace the loose interface:

```ts
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
```

`import type` promises the import is used only as a type, so it is erased completely (Lab 4
explains why this project requires it). Run the typecheck: still green. The starter's
`if/else` chain happens to narrow correctly; it is just not exhaustive.

**B. `src/ui/render.ts` — `TODO(lab-5.2)`**

Import the helper at the top:

```ts
import { assertNever } from '../lib/assert';
```

Replace `renderProducts` and `statusText` (and the TODO comment above them):

```ts
/**
 * One function, four states. Inside each `case`, TypeScript narrows `state`:
 * `state.data` only compiles under 'success', `state.error` only under 'error'.
 * `assertNever` in `default` makes the switch exhaustive.
 */
export function renderProducts(root: HTMLElement, state: RequestState<Product[]>, handlers: ProductHandlers): void {
  root.setAttribute('aria-busy', String(state.status === 'loading'));
  switch (state.status) {
    case 'idle':
      root.replaceChildren(message('Pick a category or start typing to search the catalogue.'));
      return;
    case 'loading':
      root.replaceChildren(...skeletons(8));
      return;
    case 'success':
      // "Empty" is not a fifth state: it is a success whose data has no items.
      root.replaceChildren(
        ...(state.data.length === 0 ? [message('No products match your search.', 'empty')] : state.data.map(productCard)),
      );
      return;
    case 'error':
      root.replaceChildren(errorState(state.error, handlers.onRetry));
      return;
    default:
      assertNever(state);
  }
}

/** The toolbar counter, derived from the same state. */
export function statusText(state: RequestState<Product[]>): string {
  switch (state.status) {
    case 'idle':
      return 'Ready';
    case 'loading':
      return 'Loading…';
    case 'success':
      return `${state.data.length} ${state.data.length === 1 ? 'product' : 'products'}`;
    case 'error':
      return `Error ${state.error.status || ''}`.trim();
    default:
      return assertNever(state);
  }
}
```

The `?? []` and the `?.` are gone: in the `'success'` case, `data` is *guaranteed*.

**C. `src/store/cart.ts` — `TODO(lab-5.2)`**

Update the imports:

```ts
import { createStore } from './createStore';
import { assertNever } from '../lib/assert';
import { discountedPrice } from '../lib/format';
import type { CartLine, Product } from '../types';
```

Replace the loose `CartAction`:

```ts
/** A discriminated union of everything that can happen to a cart. `type` is the tag. */
export type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'increment'; id: Product['id'] }
  | { type: 'decrement'; id: Product['id'] }
  | { type: 'remove'; id: Product['id'] }
  | { type: 'clear' };
```

and in `cartReducer`, replace `default: return state;` with:

```ts
    default:
      return assertNever(action);
```

`Product['id']` is an *indexed access type*: "whatever type `id` has on `Product`". Inside
`case 'add':`, hover `action`: it is `{ type: 'add'; product: Product }`, so
`action.product` is safe. Inside `case 'remove':`, `action.product` would be an error.

### Verify

1. `npm run typecheck` passes. The app behaves exactly as before.
2. In `main.ts`, change `status: 'success'` to `status: 'sucess'`. **Nothing happens yet**:
   `catalog` is still an untyped store (Lab 3 fixes that). Now try it where the type *is*
   known: at the bottom of `render.ts`, add
   `const probe: RequestState<Product[]> = { status: 'sucess', data: [] };`
   ```
   error TS2820: Type '"sucess"' is not assignable to type '"idle" | "loading" | "success" | "error"'. Did you mean '"success"'?
   ```
   Delete both edits.
3. Comment out the `case 'error':` block in `renderProducts`. The `default` line turns red
   with the `never` error above. Uncomment.
4. In `main.ts`, change a dispatch to `cart.dispatch({ type: 'ad', product })`:
   `Type '"ad"' is not assignable to type '"add" | "increment" | "decrement" | "remove" | "clear"'.` Revert.

### Watch out

**Narrowing belongs to one value.** `catalog.getState().status === 'success' && catalog.getState().data`
is an error: two calls, two values, and the compiler cannot assume they match. Read the state
into a `const` once and narrow that, as the grid click handler does.

**`default: return state` hides new cases.** It compiles forever and silently ignores the
action you added last week. `assertNever` is the version that complains.

**`if/else` chains are not exhaustive.** A chain that ends in `else` treats every unknown
status as the last case. That is how `'sucess'` shows skeletons forever in plain JS.

### Challenge (2 min)

Add a fifth state, `{ status: 'refreshing'; data: T }` (showing old data while reloading).
Run the typecheck and count the red lines: every one is a place your UI would have been
wrong. Then remove it.

### In the real world

**React:** the same union goes into `useState`, and the component narrows it in JSX logic.
`useReducer` actions are discriminated unions, exactly like `CartAction`:

```tsx
const [state, setState] = useState<RequestState<Product[]>>({ status: 'idle' });
if (state.status === 'error') return <ErrorState error={state.error} />;

const [cart, dispatch] = useReducer(cartReducer, emptyCart);
dispatch({ type: 'add', product });   // { type: 'ad' } is a compile error
```

Variant props are literal unions too: `variant: 'primary' | 'secondary'`.

**Angular:** strict templates narrow on the discriminant with `@switch`, and NgRx actions
and reducers use the same tagged-union pattern:

```html
@let s = state();
@if (s.status === 'loading') { <app-skeletons /> }
@if (s.status === 'error') { <app-error [error]="s.error" /> }   <!-- s.error is ApiError here -->
@if (s.status === 'success') { <app-grid [products]="s.data" /> }
```

(`@let` is Angular 18.1+. Narrow a local variable, not repeated `state()` calls, for the
same reason as in the Watch out above.)

---

## Lab 3 — Generics: fetchJson<T> and createStore<T> (30 min)

### Problem

`fetchJson` returns `Promise<any>`, so every product list, every category list and every
error path is unchecked the moment it leaves the network. `createStore` holds `any`, so the
catalogue store will happily accept `{ status: 'sucess' }`. You want **one** `fetchJson` and
**one** store that work for any type, without losing the type.

### Concept

**A generic is a parameter for a type.** Functions take values as parameters; a generic
function also takes a *type* as a parameter, written in angle brackets:

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}
first([1, 2, 3]);        // T is number → number | undefined
first(['a', 'b']);       // T is string → string | undefined
```

Usually TypeScript **infers** `T` from the arguments. When nothing in the arguments
mentions `T` (like a URL string), the *caller* supplies it: `fetchJson<Category[]>(url)`.
If nobody supplies it, `T` becomes `unknown`: safe, but you cannot use it until you check it.

**Generic types** work the same way: `ApiListResponse<T>`, `RequestState<T>`, `Store<T>`,
`Promise<T>`, `Array<T>`. You have been using generics since `Promise<Response>`.

**Constraints with `extends`.** Sometimes `T` must have a certain shape. `extends` sets a
lower bound:

```ts
export function byId<T extends { id: number }>(items: readonly T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}
```

Inside, you may read `item.id`. Outside, the caller gets their *own* type back: products in,
`Product | undefined` out. `Args extends unknown[]` in `debounce` says "any parameter list".

> **Why not just `any`?** `function first(items: any[]): any` also "works for any type". It
> throws the type away. A generic *carries* it through: what goes in determines what comes out.

### Steps

**A. `src/api/client.ts` — `TODO(lab-5.3)`: `fetchJson<T>` and `withRetry<T>`**

Change the signature and the last line of `fetchJson`:

```ts
/**
 * GET a URL and parse JSON as `T`. The caller chooses T: `fetchJson<Category[]>(url)`.
 * Honest note: `res.json()` is `any`, and `as T` is a promise TypeScript cannot check.
 * When the shape matters, ask for `unknown` and validate it (see products.ts).
 */
export async function fetchJson<T>(url: string, { signal }: RequestOptions = {}): Promise<T> {
```

```ts
  return (await res.json()) as T;
```

Then make `withRetry` generic in the same way:

```ts
/** Runs `task` and retries retryable ApiErrors with exponential backoff. Whatever T the task returns, you get back. */
export async function withRetry<T>(
  task: () => Promise<T>,
  { retries = 2, baseMs = 400, signal, onRetry }: RetryOptions = {},
): Promise<T> {
```

Run the typecheck. **It goes red** in `products.ts`: `'data' is of type 'unknown'.` That is
the compiler listing every caller that was leaning on `any`. Good. Step B fixes them.

**B. `src/api/products.ts` — `TODO(lab-5.3)`: return types**

Import the types:

```ts
import type { CatalogQuery, Category, Product, ProductsResponse } from '../types';
```

Give `getList` a return type and a type argument (Lab 4 will upgrade this line to a runtime check):

```ts
async function getList(url: string, options: RequestOptions): Promise<Product[]> {
  const data = await fetchJson<ProductsResponse>(url, options);
  return data.products;
}
```

Add return types to the four public functions:

```ts
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
```

Finally, in `getCatalog`, delete the `: any` in `found.filter((p: any) => …)`. `found` is
`Product[]` now, so `p` is inferred.

**C. `src/store/createStore.ts` — `TODO(lab-5.3)`**

Replace the whole function:

```ts
export type Listener<T> = (state: T, prev: T) => void;
export type Updater<T> = (state: T) => T;

export interface Store<T> {
  getState(): T;
  setState(updater: Updater<T>): void;
  subscribe(listener: Listener<T>): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener<T>>();

  return {
    getState: () => state,
    setState(updater) {
      const prev = state;
      const next = updater(prev);
      if (Object.is(next, prev)) return; // same reference: nothing changed, nobody is notified
      state = next;
      listeners.forEach((listener) => listener(next, prev));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
```

Notice what is *not* annotated: `state` (inferred from `initial`), and the parameters of
`setState` and `subscribe` (the return type `Store<T>` supplies them). `new Set<Listener<T>>()`
does need its type argument: an empty set has nothing to infer from.

Now give the stores their types. In `src/store/cart.ts`, inside `createCartStore`:

```ts
  const store = createStore<CartState>(emptyCart);
```

In `src/main.ts`, update the type import and the two stores:

```ts
import type { CatalogQuery, LogEntry, Product, RequestState } from './types';
```

```ts
// ---------- state: the SAME generic store, three different T's ----------
const catalog = createStore<RequestState<Product[]>>({ status: 'idle' });
const cart = createCartStore();
const log = createStore<readonly LogEntry[]>([]);
```

Why the explicit `<RequestState<Product[]>>`? Without it, `T` would be inferred from
`{ status: 'idle' }` as `{ status: string }`: far too loose. Why `<readonly LogEntry[]>`?
From `[]` alone, TypeScript infers `never[]`, an array that can hold nothing.

**D. `src/lib/fn.ts` — `TODO(lab-5.3)`**

```ts
/**
 * Delays `fn` until the calls stop for `ms`. `Args` captures the parameter list,
 * so the debounced function takes exactly what the original takes.
 */
export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, ms: number): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * A CONSTRAINT: T can be anything that has a numeric `id`. Products, cart lines and log
 * entries all qualify, and the result keeps its full type (Product in, Product out).
 */
export function byId<T extends { id: number }>(items: readonly T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}
```

`ReturnType<typeof setTimeout>` is "whatever `setTimeout` returns here" (a `number` in the
browser, a `Timeout` object in Node). A sneak peek at Lab 4.

### Verify

1. `npm run typecheck` passes.
2. Hover `getCategories` in `main.ts`: `(options?: RequestOptions) => Promise<string[]>`.
   (`Category` is an alias for `string`, and the editor shows the underlying type.) Hover
   `categories` in its `.then`: `string[]`.
3. In `main.ts`, change `status: 'success'` to `status: 'sucess'` in `load`. **Now** it is an
   error, because the store knows its `T`. Revert.
4. In the grid click handler, hover `product` (from `byId(state.data, …)`): `Product | undefined`.
   Delete the `if (product)` and write `cart.dispatch({ type: 'add', product })`: an error,
   because `undefined` is not a `Product`. Revert. (That is card 2 of the Type safety panel.)
5. Hover `searchSoon`: `(q: string) => void`. `debounce` inferred `Args = [string]`.

### Watch out

**`fetchJson<Product[]>(url)` is a claim, not a check.** The type argument tells the
compiler what to *assume*. If the API sends `{ products: [...] }`, your "array" is an object,
and TypeScript will not notice. Lab 4 adds the check where it matters.

**Do not add a type argument that inference already gets right.** `byId<Product>(state.data, id)`
is noise; `createStore<RequestState<Product[]>>` is necessary. The test: hover, and add one
only if the inferred type is wrong or too wide.

### Challenge (2 min)

Write `pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][]`. Then
`pluck(products, 'title')` is `string[]`, and `pluck(products, 'titel')` is a compile error.

### In the real world

**React:** hooks are generic functions. `useState<T>`, `useRef<T>`, `useReducer`, and your own:

```tsx
const [products, setProducts] = useState<Product[]>([]);   // empty array: T is required
const inputRef = useRef<HTMLInputElement>(null);

function useFetch<T>(url: string): RequestState<T> { /* fetchJson<T>(url) inside */ }
const state = useFetch<ProductsResponse>('https://dummyjson.com/products');
```

Libraries follow suit: TanStack Query's `useQuery<Product[]>()`, Zustand's `create<CartState>()`
(which is `createStore<T>()` with extra features).

**Angular:** `HttpClient.get<T>()` is `fetchJson<T>()` returning an Observable. Same claim,
same caveat: it does not validate the body.

```ts
this.http.get<ProductsResponse>(`${API}/products`).pipe(map((res) => res.products));
readonly cart = signal<CartState>(emptyCart);          // signal<T>
readonly add = new EventEmitter<Product>();            // EventEmitter<T>
```

---

## Lab 4 — Utility types, unknown vs any, type guards and the DOM (20 min)

### Problem

Four holes remain. `isApiError` returns a plain `boolean`, so checking it tells the compiler
nothing. The network response is trusted blindly. `$()` returns `any`, hiding both `null` and
the element type. And `main.ts` is full of `any`: `addLog(entry: any)`, `load(patch: any)`,
`catch (err: any)`, `(event: any) =>`.

### Concept

**Utility types** transform types you already have, so you never write a shape twice:

| Utility | Means | In this app |
|---|---|---|
| `Partial<T>` | every key optional | `load(patch: Partial<CatalogQuery>)`: pass only what changed |
| `Pick<T, K>` | only these keys | `CartLine` picks four fields of `Product` |
| `Omit<T, K>` | all keys except these | `addLog(entry: Omit<LogEntry, 'id' \| 'at'>)` |
| `Record<K, V>` | an object with keys K, values V | `Record<StockLevel, string>` |
| `ReturnType<F>` | what a function returns | `CartStore = ReturnType<typeof createCartStore>` |
| `Awaited<T>` | what a promise resolves to | `Awaited<ReturnType<typeof getCatalog>>` is `Product[]` |

**`unknown` versus `any`.** Both accept any value. The difference is what you may do next.

```ts
const a: any = JSON.parse(text);
a.toFixed(2).foo.bar();          // compiles. Crashes at runtime.

const u: unknown = JSON.parse(text);
u.toFixed(2);                    // error TS18046: 'u' is of type 'unknown'.
if (typeof u === 'number') u.toFixed(2);   // fine: narrowed
```

`any` switches checking **off**, and it spreads: anything you read from an `any` is `any`
too. `unknown` keeps checking **on** until you prove what the value is. Under `strict`, a
`catch (err)` variable is `unknown` for exactly this reason: anything can be thrown.

> **Misconception: "`any` is fine for now."** `any` is contagious and silent. One `any` at
> the network boundary makes every product, price and title downstream unchecked, and no
> error will ever tell you. "For now" becomes "forever". Use `unknown` and narrow.

**Type guards.** A function whose return type is `value is X`:

```ts
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
```

At runtime it is a boolean. At compile time, `if (isApiError(err))` narrows `err` to
`ApiError` inside the branch. It is how you teach the compiler a check it cannot see through.

> **Misconception: "TypeScript checks data at runtime."** It does not. Types are erased.
> `fetchJson<ProductsResponse>()` is an *assumption* about what the server sends. If the
> server changes, or you call the wrong URL, the types still say "fine". Data that comes from
> outside (network, `localStorage`, URL, forms) must be **validated**: by hand with a guard,
> as below, or with a schema library such as Zod or Valibot in larger apps.

**`as const` and `satisfies`.** `as const` locks a literal down: every value keeps its literal
type and becomes `readonly`. `satisfies` checks a value against a type *without* widening it
to that type:

```ts
export const STOCK_LABELS = {
  ok: 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
} as const satisfies Record<StockLevel, string>;
```

Forget `out` and it fails (`Property 'out' is missing…`); yet `STOCK_LABELS.low` stays the
literal `'Low stock'`, not `string`. An annotation (`: Record<StockLevel, string>`) would
check but widen; `as const` alone would keep literals but check nothing.

**Typing the DOM.** `document.querySelector('#search')` returns `Element | null`: the
element may not exist, and even if it does, TypeScript cannot know from a selector string
that it is an `<input>`. Two fixes, one each:

- The type argument names the element: `querySelector<HTMLInputElement>('#search')`.
- A check removes `null`: `if (!el) throw new Error(…)`.

The shortcut is the **non-null assertion** `!`: `querySelector<HTMLInputElement>('#search')!`.
It tells the compiler "trust me, it is there", and is erased like every other type. If you
are wrong, you get `Cannot read properties of null` at the line that *uses* it, far from the
cause. A check fails immediately with a message naming the selector. Use `!` only when the
element is guaranteed (static markup, one call site); prefer a helper that checks.

Events are inferred from the event name: `addEventListener('click', (event) => …)` gives
`event: MouseEvent`, `'keydown'` gives `KeyboardEvent`. But `event.target` is
`EventTarget | null` (it could be a text node, the window, anything), so narrow it with
`instanceof` before calling `closest()`.

**`tsconfig.json`, line by line** (the options that matter):

- `strict: true` switches on a family: `strictNullChecks` (`null` is not a valid `Product`),
  `noImplicitAny` (unannotated parameters are errors), `useUnknownInCatchVariables`,
  `strictPropertyInitialization` (why Angular needs `product!: Product`), and more.
- `noUncheckedIndexedAccess: true` adds `| undefined` to every `array[i]` and
  `record[key]` read. At runtime `products[99]` *is* `undefined`; this makes the type honest.
  It is not part of `strict`, and it is worth turning on in every new project.
- `noUnusedLocals`, `noUnusedParameters`: dead code is an error.
- `moduleResolution: "bundler"`: resolve imports the way Vite (or any modern bundler) does,
  so `import './api/client'` needs no `.js` extension.
- `verbatimModuleSyntax: true`: imports are emitted exactly as written, so type-only imports
  must say so: `import type { Product } from './types'`. Otherwise:
  `error TS1484: 'Product' is a type and must be imported using a type-only import…`
- `erasableSyntaxOnly: true`: only syntax that can be deleted is allowed (no `enum`, no
  constructor parameter properties). Node's built-in type stripping has the same rule.
- `include: ["src"]`: only `src/` is compiled. `examples/` needs React and Angular installed.

### Steps

**A. `src/api/client.ts` — `TODO(lab-5.4)`**

Replace `isApiError` and change `toApiError`'s parameter:

```ts
/** A TYPE GUARD: returns a boolean at runtime, and tells the compiler what `value` is when it is true. */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
```

```ts
export function toApiError(value: unknown, url = ''): ApiError {
```

In `withRetry`, change `catch (err: any)` to `catch (err: unknown)`. It still compiles: the
guard narrows `err` to `ApiError` before `err.retryable` is read. That is the guard working.

**B. `src/api/products.ts` — `TODO(lab-5.4)`**

Add `ApiError` to the value import:

```ts
import { ApiError, fetchJson } from './client';
```

Replace `getList` with a guard and a checked version:

```ts
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
```

Four narrowings in one line: `typeof` removes the primitives, `!== null` removes `null`,
`in` proves the key exists, `Array.isArray` proves it is an array. The guard is shallow on
purpose (it does not check every field of every product); a schema library does the deep version.

**C. `src/lib/format.ts` — `TODO(lab-5.4)`**

Replace `StockLevel` and `STOCK_LABELS` (leave `stockLevel` as it is):

```ts
/** A literal union: exactly three values, and a typo in any of them is a compile error. */
export type StockLevel = 'ok' | 'low' | 'out';
```

```ts
/**
 * `satisfies` checks that every StockLevel has a label (miss one and it fails),
 * while `as const` keeps the exact literal values: STOCK_LABELS.low is 'Low stock', not string.
 */
export const STOCK_LABELS = {
  ok: 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
} as const satisfies Record<StockLevel, string>;
```

Then in `src/ui/render.ts`, inside `productCard`, the fallback is no longer needed. The
line becomes:

```ts
  row.append(el('span', `badge ${level}`, STOCK_LABELS[level]), add);
```

Why was `?? level` there? `Record<string, string>` indexed by any string is
`string | undefined` under `noUncheckedIndexedAccess`. Keyed by the union, every key is known.
`LOG_ICONS` at the bottom of `render.ts` uses the same pattern.

**D. `src/lib/dom.ts` — `TODO(lab-5.4)`**

```ts
export function $<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el; // narrowed from T | null to T by the check above
}
```

A constraint (`T extends Element`) and a **default** (`= HTMLElement`): `$('#grid')` is an
`HTMLElement`, `$<HTMLInputElement>('#search')` an input. The typecheck now goes red in
`main.ts` (`Property 'value' does not exist on type 'HTMLElement'`). Step E fixes it.

**E. `src/main.ts` — `TODO(lab-5.4)`**

Replace the TODO comment and the `els` object:

```ts
// ---------- the DOM, typed once ----------
// Each element type is named once here; from then on `els.search.value` is a checked string.
const els = {
  search: $<HTMLInputElement>('#search'),
  category: $<HTMLSelectElement>('#category'),
  fail: $<HTMLInputElement>('#simulate-failure'),
  count: $('#count'),
  grid: $('#grid'),
  cart: $<HTMLUListElement>('#cart'),
  cartTotal: $('#cart-total'),
  cartCount: $('#cart-count'),
  clearCart: $<HTMLButtonElement>('#clear-cart'),
  log: $('#log'),
  clearLog: $<HTMLButtonElement>('#clear-log'),
};
```

Type `addLog` with `Omit`, and `load` with `Partial`, adding the `Awaited` alias above it:

```ts
/** Omit: the caller supplies kind and text; id and time are filled in here. */
function addLog(entry: Omit<LogEntry, 'id' | 'at'>): void {
  log.setState((entries) => [...entries.slice(-49), { ...entry, id: nextLogId++, at: new Date() }]);
}
```

```ts
/** Awaited<ReturnType<…>>: what getCatalog resolves to (Product[]), derived instead of repeated. */
type CatalogResult = Awaited<ReturnType<typeof getCatalog>>;

/** Partial: pass only what changed, e.g. `load({ q: 'phone' })`. */
async function load(patch: Partial<CatalogQuery> = {}): Promise<void> {
```

Inside `load`, annotate the result and make the `catch` honest:

```ts
    const products: CatalogResult = await withRetry(() => getCatalog(query, { signal: ctrl.signal, simulateFailure }), {
```

```ts
  } catch (err: unknown) {
    // `err` is unknown: TypeScript makes you find out what it is before you use it.
    if (isAbortError(err)) {
```

Delete every remaining `: any` on a callback parameter: in the three `subscribe` calls,
the `keydown` listener, and `.catch((err: any) => …)` (make that one `err: unknown`). Then
narrow the two click handlers:

```ts
els.grid.addEventListener('click', (event) => {
  // event.target is `EventTarget | null`: it could be text, the window, anything. Narrow it.
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('button[data-add]');
  if (!button) return;
  const state = catalog.getState();
  if (state.status !== 'success') return; // narrowing: after this line, state.data exists
  const product = byId(state.data, Number(button.dataset.add));
  if (product) cart.dispatch({ type: 'add', product });
});

els.cart.addEventListener('click', (event) => {
  if (!(event.target instanceof HTMLButtonElement)) return;
  const { inc, dec } = event.target.dataset; // dataset values are `string | undefined`
  if (inc) cart.dispatch({ type: 'increment', id: Number(inc) });
  if (dec) cart.dispatch({ type: 'decrement', id: Number(dec) });
});
```

Finally, above `searchSoon`, add the comment
`/** Only the parameter type is written; debounce<[string]> is inferred from it. */`,
and above the events section:
`// No annotations needed: from the event name, TypeScript infers \`event\` as Event, MouseEvent or KeyboardEvent.`

### Verify

1. `grep -rnw "any" src` finds the word only in comments. `npm run typecheck` and
   `npm run build` pass.
2. Hover `event` in the grid click handler: `MouseEvent`. In the `keydown` handler: `KeyboardEvent`.
3. In the grid handler, delete the `instanceof` line:
   `'event.target' is possibly 'null'` and `Property 'closest' does not exist on type 'EventTarget'`. Revert.
4. Rename `id="search"` in `index.html` and reload: the page fails at once with
   `Missing element: #search` in the console, not later with a confusing `null`. Revert.
5. In `STOCK_LABELS`, delete the `out` line: `Property 'out' is missing…`. Revert.
6. Tick **Simulate a failing API**: two retries, then the error state. The error path is
   typed end to end: `unknown` → `toApiError` → `ApiError` → `RequestState` → `errorState`.

### Watch out

**`as` is not a conversion.** `data as Product[]` changes nothing at runtime; it silences
the compiler. Every `as` is a place you should be able to justify. This app has two
(`as T` in `fetchJson`, and `as const`).

**`!` moves the crash, it does not prevent it.** Prefer a check with a message.

**Guards can lie.** `function isProduct(x: unknown): x is Product { return true; }`
compiles. The compiler trusts your predicate, so keep guards small and obviously correct.

### Challenge (2 min)

Write `isProduct(value: unknown): value is Product` checking `id` is a number and `title` a
string, and make `isProductsResponse` require `value.products.every(isProduct)`. What does the
app do if DummyJSON ever drops `title`? (Try it by adding a bogus field name to `FIELDS`.)

### In the real world

**React:** DOM and event types come from React's own definitions. The common ones:

```tsx
import type { ChangeEvent, ComponentProps, FormEvent } from 'react';   // React.ChangeEvent etc.

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.currentTarget.value);          // a checked string
  }
  return <input value={value} onChange={handleChange} />;
}
const onSubmit = (e: FormEvent<HTMLFormElement>) => e.preventDefault();
type ButtonProps = ComponentProps<'button'> & { variant?: 'primary' | 'ghost' };
type EditProductForm = Pick<Product, 'title' | 'price'>;    // utility types for form state
```

**Angular:** strict templates type-check your bindings, including `$event`. Typed reactive
forms infer from their initial values, and `Partial` shows up in `patchValue`:

```ts
readonly form = new FormGroup({
  q: new FormControl('', { nonNullable: true }),                     // FormControl<string>
  category: new FormControl<Category | 'all'>('all', { nonNullable: true }),
});
this.form.patchValue({ q: 'phone' });          // takes a Partial of the form's value
// template: (input)="onSearch($any($event.target).value)" is the escape hatch; prefer a form control.
```

---

## Lab 5 — The same types in React and Angular (15 min)

### Problem

You have typed a vanilla app. The question learners always ask next: *"What does this look
like in my framework?"* The answer is `examples/`: four reference files that import the
**same** `src/types.ts`, `src/api/*` and `src/lib/format.ts` you just wrote.

### Concept

The frameworks change *where* state lives and *how* the DOM updates. They do not change the
types. Here is the map:

| Idea | This app (`src/`) | React (`examples/react/`) | Angular (`examples/angular/`) |
|---|---|---|---|
| The data shape | `Product`, `ProductsResponse` | same import | same import |
| Typed fetch | `fetchJson<T>()` → `Promise<T>` | `fetchJson` inside `useEffect` | `http.get<T>()` → `Observable<T>` |
| Request state | `createStore<RequestState<Product[]>>` | `useState<RequestState<Product[]>>` | a signal or `Observable` of it |
| Cancellation | `AbortController` in `load` | `AbortController` in the effect cleanup | `switchMap` unsubscribes, HttpClient aborts |
| A card | `productCard(product: Product)` | `ProductCard(props: ProductCardProps)` | `@Input({ required: true }) product!: Product` |
| "Add" callback | `cart.dispatch({ type: 'add', product })` | `onAdd: (product: Product) => void` | `@Output() add = new EventEmitter<Product>()` |

These files are **not compiled** by this project (`include: ["src"]`). They were checked
against React 19 and Angular types when this course was written.

### Steps

1. **`examples/react/ProductCard.tsx`.** Read `interface ProductCardProps`. Find the
   optional prop and its default (`inCart = 0`). Find `ChangeEvent<HTMLInputElement>` in
   `SearchBox`. Compare the JSX with `productCard()` in `render.ts`: the same fields, the same
   helpers (`stockLevel`, `STOCK_LABELS`, `discountedPrice`), no `createElement`.
2. **`examples/react/useProducts.ts`.** Find `useState<RequestState<Product[]>>` and read
   the comment on why the type argument is required. Find the `AbortController` and the
   cleanup `return () => controller.abort()`. It is `load()` from `main.ts`, split into
   "start" (the effect) and "cancel" (the cleanup).
3. **`examples/angular/product.service.ts`.** Find `http.get<ProductsResponse>()` and the
   `.pipe(map((res) => res.products))`. Hover in your head: `res` is `ProductsResponse`, so
   `res.products` is `Product[]`, and the method returns `Observable<Product[]>`. Note
   `inject(HttpClient)` instead of constructor injection.
4. **`examples/angular/product-card.component.ts`.** Find `@Input({ required: true }) product!: Product`.
   Two safety nets: `required: true` makes Angular's template compiler reject
   `<app-product-card>` without `[product]`; the `!` satisfies `strictPropertyInitialization`,
   because Angular, not the constructor, sets the value. Read the comment about the signal
   alternative, `input.required<Product>()`.
5. Open `src/types.ts` beside any example. **Nothing in it knows about React or Angular.**
   That is the design goal: types at the centre, frameworks at the edge.

### Verify

You can answer, out loud: *Where would `RequestState` live in a React app? In an Angular
app? What replaces `AbortController` in Angular?* (A `useState`; a signal or an Observable;
`switchMap` plus HttpClient's cancellation on unsubscribe.)

Optional, at home: `npm create vite@latest shop -- --template react-ts`, copy `src/types.ts`,
`src/api/` and `src/lib/format.ts` in, drop in the two React files, fix the import paths, and
render `<ProductCard>` from `useProducts`.

### Watch out

**`!` on an `@Input` is a promise to the compiler.** Without `required: true`, nothing
stops a parent from forgetting the binding, and `product.title` crashes. Use both.

**`http.get<T>()` and `fetchJson<T>()` share the Lab 4 caveat.** Neither validates the body.

### Challenge (2 min)

Write the React version of the category select as a component with
`interface CategorySelectProps { categories: readonly Category[]; value: Category | 'all'; onChange: (value: Category | 'all') => void }`.
Which event type does its `onChange` handler take? (`React.ChangeEvent<HTMLSelectElement>`,
imported as `import type { ChangeEvent } from 'react'`.)

### In the real world

**React** projects created with Vite's `react-ts` template ship with `strict: true`, and
many teams add `noUncheckedIndexedAccess`. Every component you write in the ReactJS program
starts with a props interface, and every data hook returns a union like `RequestState<T>`.

**Angular** has TypeScript built in: `ng new` generates `strict: true` and
`strictTemplates: true`. Services return `Observable<T>` from `HttpClient.get<T>()`,
components declare typed `@Input`s and `@Output`s (or signal `input<T>()` and `output<T>()`),
and forms are typed from their initial values.

---

## Wrap-up — what you can now do

- Explain why TypeScript cannot slow your app down (types are erased) and why it cannot
  validate your data (same reason).
- Let inference work, and annotate the boundaries: parameters, exported return types, empty
  initial values.
- Model object shapes with `interface`, everything else with `type`, and use `?` and `readonly`.
- Narrow unions with `typeof`, truthiness, `in`, `instanceof` and equality.
- Replace a loose status string with a **discriminated union**, and make every `switch` over
  it exhaustive with `assertNever`.
- Write generic functions and types (`fetchJson<T>`, `createStore<T>`, `byId<T extends { id: number }>`).
- Derive types with `Partial`, `Pick`, `Omit`, `Record`, `ReturnType` and `Awaited`.
- Choose `unknown` over `any`, write a type guard, and use `as const` and `satisfies`.
- Type the DOM without `!` everywhere, and read a `tsconfig.json` with confidence.
- Recognise all of the above in a React component and an Angular service.

## Next session

This was the last session of the **JavaScript & TypeScript Foundations** track. In five
sessions you went from "what is JavaScript?" to a strictly typed, cancellable, retrying live
catalogue, and you have seen the same code in React and Angular form.

The next step is a framework. The **ReactJS Developer Program** and the **Angular program**
at Deesha Tech Academy start from exactly this ShopScope app and these types, so you begin
on day one writing components, not fighting the language. Register at
[deeshatechacademy.com](https://deeshatechacademy.com).

## Troubleshooting

**The page works but `npm run build` fails.** Expected when there are type errors: Vite's
dev server strips types without checking them. Read the `tsc` output; it names the file and line.

**The build went red in the middle of a lab.** Several steps deliberately break callers
first (Lab 3A breaks `products.ts`, Lab 4D breaks `main.ts`). Finish the lab's next step.

**`'X' is a type and must be imported using a type-only import…` (TS1484).** Use
`import type { X } from '…'`, or split value and type imports as the solution does.

**`Cannot find name 'ApiError'` in `types.ts`.** You skipped the `import type` line in Lab 2A.

**`Argument of type '…' is not assignable to parameter of type 'never'`.** Your `switch`
misses a case (or has a typo in a `case` label). The type in the message is the missing one.

**The editor shows errors that `tsc` does not (or the reverse).** Make sure the editor uses
the workspace TypeScript version (VS Code: "TypeScript: Select TypeScript Version" → "Use
Workspace Version"), then "TypeScript: Restart TS Server".

**The catalogue shows the error state and "Simulate a failing API" is not ticked.** DummyJSON
may be slow or down. The retry button tries again; the network log shows the status code.

**`npm install` fails.** Check `node -v` is 22 or newer. On StackBlitz, reload the tab.
