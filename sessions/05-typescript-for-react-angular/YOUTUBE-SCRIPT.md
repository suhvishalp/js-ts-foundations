# YouTube script — Session 5: TypeScript for React & Angular

A 12–13 minute recorded demo session. It teaches four real TypeScript ideas on a live app,
and shows exactly where they appear in React and Angular code.

---

## 1. Video metadata

**Title options**

1. TypeScript for React & Angular: the 4 ideas that actually matter
2. This JavaScript bug ships silently. TypeScript catches it before you run it.
3. Discriminated unions, generics and type guards, on a real app (TypeScript for React & Angular)

**Thumbnail text** (at most 5 words): `'sucess' never ran`

**YouTube description**

> One typo, `'sucess'` instead of `'success'`, and a JavaScript app sits on a loading
> skeleton forever, with no error anywhere. In this session we take a real live product
> catalogue and rewrite it in strict TypeScript, so bugs like that become red squiggles
> before you ever hit save.
>
> You will see:
> • why TypeScript cannot make your app slower (the types are erased)
> • a discriminated union for request state, with an exhaustive switch that fails the build when you forget a case
> • a generic fetchJson<T>(), and why `unknown` beats `any` at the network boundary
> • the exact same types in a React component and hook, and an Angular service and component
>
> This is Session 5 of JavaScript & TypeScript Foundations, the 5-day preparation track for
> the React and Angular programs at Deesha Tech Academy, taught by Vishal Shah (20 years in
> the industry).
>
> Register at deeshatechacademy.com
> https://deeshatechacademy.com
>
> Chapters
> 0:00 A bug JavaScript will never tell you about
> 0:30 What we are building
> 1:30 types.ts: types that disappear
> 4:00 A request state machine with discriminated unions
> 7:00 Generics: fetchJson<T> and unknown vs any
> 9:30 The same types in React and Angular
> 11:30 Recap
> 12:15 What's next

**Tags:** typescript, typescript tutorial, typescript for react, typescript for angular,
react typescript, angular typescript, discriminated unions, typescript generics, unknown vs any,
type guards, strict mode, noUncheckedIndexedAccess, satisfies, javascript, web development,
frontend, Deesha Tech Academy, Vishal Shah

---

## 2. Recording setup

- **Browser (left, 55%)**: the **solution** app at `http://localhost:5173` (`cd solution && npm run dev`),
  DevTools closed until the cold open. Zoom 110%.
- **Editor (right, 45%)**: VS Code with the **solution** folder open for the cold open and
  segments 2 to 4, and a second window on the **starter** for segment 1. Font size 18,
  minimap off, "Use Workspace Version" of TypeScript selected. Error Lens (or hover) on, so
  errors are readable on video.
- **Terminal** (bottom of the editor): one tab ready to run `npm run typecheck`.
- Before recording: reload the app once so DummyJSON is warm; clear the network log; empty the cart.
- Have `examples/react/ProductCard.tsx` and `examples/angular/product-card.component.ts`
  ready to open side by side (split editor) for segment 4.

---

## 3. The script

### [00:00–00:30] Cold open — a bug JavaScript will never report

**ON SCREEN**
- Editor: a new scratch file `scratch.js` beside the app. Type:
  ```js
  const products = [{ id: 1, title: 'Mascara', price: 9.99 }];
  const state = { status: 'sucess', data: products };
  if (state.status === 'success') console.log('render', state.data);
  const product = products.find((p) => p.id === 2);
  console.log(product.price.toFixed(2));
  ```
- Paste it into the browser console. Nothing logs for the first `if`. Then the red
  `TypeError: Cannot read properties of undefined (reading 'price')`.
- Rename the file to `scratch.ts` inside `solution/src/`, add types at the top:
  `import type { Product, RequestState } from './types';` and annotate
  `const products: Product[]` (fill in the fields) and `const state: RequestState<Product[]>`.
- Two red squiggles appear instantly. Hover them: `Did you mean '"success"'?` and
  `'product' is possibly 'undefined'.`

**SAY**
"Here are five lines of JavaScript with two bugs in them. Let's run it. The first bug does
nothing at all: no error, no warning, the render just never happens, because I typed
'sucess'. The second one crashes, but only when a user gets there. Now watch the same five
lines in TypeScript. I haven't run anything, and both bugs are already underlined, with the fix
suggested. That is what today is about."

---

### [00:30–01:30] Intro — who, what, and what we build

**ON SCREEN**
- Close the scratch file (delete it). Show the solution app: header, search "phone", pick
  "Smartphones", add two items to the cart, point at the network log and the **Type safety**
  panel.

**SAY**
"I'm Vishal Shah from Deesha Tech Academy. This is Session 5 of our JavaScript and TypeScript
Foundations track, the session where everything becomes TypeScript, because both React and
Angular default to it now. This is ShopScope Lite: a live catalogue from a real API, with
search you can cancel, retries, a cart and a network log. In Session 4 we built it in
JavaScript. Today it's strict TypeScript, and that panel on the right lists three real bugs the
compiler caught in this app. Four ideas, one app, and at the end, the same types in React and
Angular."

---

### [01:30–04:00] Segment 1 — `types.ts`: types that disappear

**ON SCREEN**
1. Switch to the **starter** window. Open `src/types.ts`: `export type Product = any;`.
2. In `src/ui/render.ts`, inside `productCard`, type `product.pirce`. No squiggle. Run
   `npm run typecheck`: passes. Delete it.
3. Back in `types.ts`, type the `Product` interface (paste it, then talk through it):
   `readonly id`, `price: number`, `brand?: string`.
4. Type `product.pirce` again: `Property 'pirce' does not exist on type 'Product'. Did you mean 'price'?`
5. Hover `product.brand`: `string | undefined`. Show the `?? categoryLabel(...)` fallback it forces.
6. Browser: DevTools → Sources → `src/lib/format.ts` as served by Vite. Point at
   `formatPrice(amount)`: no `: number` anywhere.

**SAY**
"This is where most projects start: the file is TypeScript, but the key type is `any`, and
`any` means 'stop checking'. So a typo sails through. Let me describe a product properly.
`readonly id` because nobody should change an id. `brand` with a question mark, because about
half the products don't have one. And now the same typo is caught, with a suggestion."

"Here's the **aha**. Look at what the browser actually runs. The types are gone. TypeScript is
JavaScript plus a layer the compiler checks and then erases. So when someone tells you
TypeScript makes your app slower: there's nothing left to be slow."

**B-roll / on-screen text:** "TypeScript = JavaScript + types that get erased" · "`any` = checking OFF"

---

### [04:00–07:00] Segment 2 — a request state machine with discriminated unions

**ON SCREEN**
1. Solution window. `src/types.ts`: show `RequestState<T>` with its four shapes.
2. `src/ui/render.ts`: `renderProducts`. Hover `state` inside `case 'success':`: it shows
   `{ status: 'success'; data: Product[] }`. Hover it inside `case 'error':`: `{ status: 'error'; error: ApiError }`.
3. Type `state.data` inside `case 'loading':`. Red: `Property 'data' does not exist…`. Delete.
4. Comment out the whole `case 'error':` block. The `assertNever(state)` line turns red:
   `Argument of type '{ status: "error"; error: ApiError; }' is not assignable to parameter of type 'never'.`
5. Uncomment. Show `src/lib/assert.ts` (four lines).
6. Browser: tick **Simulate a failing API**. Skeletons, two retries in the log, then the
   error card with **Try again**. Untick.

**SAY**
"In JavaScript this was a status string, plus a `data` that might be there and an `error` that
might be there. That's how you get a spinner and an error message on screen at the same time.
A discriminated union says: there are exactly four states, and each one carries exactly its own
data. Success has `data`. Error has `error`. Loading has nothing. Watch the editor: inside the
success case, it knows `data` exists. Inside loading, it won't even let me ask."

"Now the **aha**. I'll 'forget' to handle errors. The build fails, right here, and the message
tells me which state I forgot. `never` is the type with no values. If every case is handled,
nothing is left, and this line compiles. Add a new state next month, and every screen that
doesn't handle it lights up red. That's a refactor you can trust."

**B-roll / on-screen text:** "Impossible states, impossible to write" · "`never` = nothing left to handle"

---

### [07:00–09:30] Segment 3 — generics: `fetchJson<T>` and `unknown` versus `any`

**ON SCREEN**
1. `src/api/client.ts`: `fetchJson<T>(url, { signal }): Promise<T>`. Highlight `<T>` and `as T`.
2. `src/api/products.ts`: `getCategories` calls `fetchJson<Category[]>(...)`. In `main.ts`, hover
   `categories` in the `.then`: `string[]`.
3. Back to `products.ts`: `getList` calls `fetchJson<unknown>` and then `isProductsResponse(data)`.
   Temporarily delete the `if (!isProductsResponse(data)) { … }` block: red,
   `'data' is of type 'unknown'.` Undo.
4. Show `isProductsResponse` and read its one line: `typeof`, `!== null`, `in`, `Array.isArray`.
5. `src/store/createStore.ts`: `createStore<T>`. In `main.ts`, point at the three stores:
   `createStore<RequestState<Product[]>>`, `createCartStore()`, `createStore<readonly LogEntry[]>`.

**SAY**
"A generic is a parameter, but for a type. `fetchJson` doesn't know what's at the URL, so the
caller tells it: 'this returns an array of categories'. And from then on, everything downstream
is typed."

"But here's the honest part, and it's the **aha** of this segment. `as T` is a promise, not a
check. TypeScript is erased, so it cannot look at what the server really sent. That's why, for
the data that matters, I ask for `unknown`. `unknown` means 'I don't know yet', and the compiler
won't let me touch it until I prove what it is. `any` would let me do anything, and crash later.
This little guard is the proof: it runs at runtime, and it teaches the compiler at the same time."

"Same idea for state: one `createStore<T>`, three different Ts: the catalogue, the cart and the
log. Write it once, fully typed everywhere."

**B-roll / on-screen text:** "Generic = a parameter for a type" · "`unknown` = checking ON until you prove it" · "Types are not validation"

---

### [09:30–11:30] Segment 4 — the same types in a React component and an Angular service

**ON SCREEN**
1. Split editor: `examples/react/ProductCard.tsx` on the left, `examples/angular/product-card.component.ts` on the right.
2. Left: highlight `interface ProductCardProps { product: Product; onAdd: (product: Product) => void; inCart?: number }`.
3. Right: highlight `@Input({ required: true }) product!: Product;` and `@Output() readonly add = new EventEmitter<Product>();`.
4. Highlight both import lines: `import type { Product } from '../../src/types';`. Same file.
5. Swap to `examples/react/useProducts.ts` (left) and `examples/angular/product.service.ts` (right).
6. Left: `useState<RequestState<Product[]>>({ status: 'idle' })` and the `return () => controller.abort()` cleanup.
7. Right: `this.http.get<ProductsResponse>(...)` and `.pipe(map((res) => res.products))`.

**SAY**
"Here's the question everyone asks: what does this look like in my framework? On the left,
React. On the right, Angular. Same import, same `Product`. In React, the card's props are an
interface: forget `onAdd` and the component won't compile. In Angular, it's an `@Input` marked
required, so the template compiler rejects a card without a product, and an `@Output` that emits
a `Product`."

"Now data. React: `useState` with our exact `RequestState` union, and the `AbortController`
from Session 4 now lives in the effect's cleanup. Angular: `HttpClient.get<ProductsResponse>()`,
which is our `fetchJson<T>()` returning an Observable. The **aha**: you already know both. The
frameworks change where state lives. The types don't change at all."

**B-roll / on-screen text:** "`fetchJson<T>()` ≈ `HttpClient.get<T>()`" · "`useState<RequestState<Product[]>>`" · "Types at the centre, frameworks at the edge"

---

### [11:30–12:15] Recap — three things to remember

**ON SCREEN**
- The app, full screen, with the Type safety panel visible. Three bullets animate in.

**SAY**
"Three things to take away.
One: TypeScript's types are erased. They cost nothing at runtime, and they don't check your data
either, so validate what comes from the network.
Two: model state as a discriminated union and switch on it exhaustively. Impossible states become
impossible to write, and a forgotten case fails the build.
Three: generics carry types through your code. `fetchJson<T>`, `useState<T>`, `HttpClient.get<T>`:
it's the same idea everywhere."

---

### [12:15–13:00] Call to action

**ON SCREEN**
- End card: "JavaScript & TypeScript Foundations · 5 sessions" with the five session titles,
  then "Next: ReactJS Developer Program · Angular program", and `deeshatechacademy.com`.

**SAY**
"That's the end of our five-day track. You've gone from 'what is JavaScript' to a strictly typed,
cancellable, retrying live app, and you've seen the same code in React and in Angular. This is
Session 5 of our 5-day JavaScript and TypeScript Foundations program, the preparation track for
our React and Angular programs at Deesha Tech Academy. If you want to build real applications in
either framework, register at deeshatechacademy.com. The
link is in the description. See you in class."

---

## 4. B-roll, on-screen text and pinned comment

**B-roll suggestions**
- Close-up of a red squiggle appearing as `'sucess'` is typed (slow the typing down).
- Split screen: the `.ts` source on the left, the JavaScript Vite serves on the right, types fading out.
- The network log filling up during **Simulate a failing API**: `→`, `↻ retry 1`, `↻ retry 2`, `!`.
- A quick pan across the Type safety panel's three cards.
- The React and Angular files side by side, with the shared `import type { Product }` line highlighted in both.

**On-screen text (lower thirds)**
- "Strict mode on: `strict`, `noUncheckedIndexedAccess`"
- "Discriminated union: one field decides the shape"
- "`assertNever`: the build fails if you forget a case"
- "`unknown` > `any`"
- "`value is ApiError`: a type guard"
- "Same types in React & Angular"

**Pinned comment**

> Session 5 of JavaScript & TypeScript Foundations, the preparation track for our React and
> Angular programs at Deesha Tech Academy.
> Try this before the next video: add a fifth state, `{ status: 'refreshing'; data: T }`, to
> `RequestState` and count how many red lines appear. Every one is a screen that would have been
> wrong. Tell me your number below.
> Register at deeshatechacademy.com
