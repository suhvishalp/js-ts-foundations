# Session 2 — Modern JavaScript (ES6+)

**Session guide** · ~120 minutes · you learn the modern syntax every React and Angular codebase is written in, why each feature exists, and you turn Session 1's product page into a searchable, filterable, sortable catalogue with live stats

---

## Where you are starting from

Session 1's finished product page, one step further along. The `starter/` folder is the same Vite project: sixteen
product cards rendered by `createCard` and `renderGrid` in `src/ui/render.js`, the pure helpers in
`src/lib/format.js` (`formatPrice`, `discountedPrice`, `stockStatus`), and the wishlist with its one delegated click
listener and its "♥ N saved" count. The JS Playground panel has gone; the side panel now holds **Live stats** and a
**state** inspector.

Two things changed on the way in, and both are written for you:

- **The wishlist lives in one `state` object** in `src/main.js`, together with the search text, the category and the
  sort order. The saved ids are now an **array** rather than Session 1's `Set`, because today we copy state, print it
  as JSON and store it in `localStorage`, and arrays do all three directly. `includes` does the membership check.
- **An `update()` function renders the whole page from `state`.** Change state, call `update()`. That answers the
  question Session 1 ended on: when the grid re-renders, the hearts survive, because each card is drawn from
  `state.saved`, not from whatever was on screen before.

Also written for you: `index.html` (the header, the toolbar with a search box, a sort select and a Reset button, an
empty row for category chips, and the two side panels) and all of `style.css`.

Stubs that return safe defaults: every function in `src/lib/catalog.js`, the `h()` helper in `src/ui/dom.js`, and
`renderCategoryChips` and `renderStats` in `src/ui/render.js`. The toolbar is there but nothing listens to it yet.

**Sixteen `TODO(lab-2.x)` markers** say where your code goes, numbered `2.1` to `2.16` in the order you meet them (the
`2` is the session number; two of them, `2.15` and `2.16`, mark two places each). Search for `TODO(lab-2.` if you get
lost.

## What you ship today

**ShopScope Lite: search, filter & sort.** A search box that matches title or brand as you type, case-insensitive.
Category chips generated from the data (a `Set` of categories plus "All"), each with a live count from a `Map` that
follows your search. A sort select with five orders (Featured, Price ↑, Price ↓, Rating, Biggest discount) that never
touches the original list. A **Live stats** panel built with one `reduce`: products shown, average rating, total
inventory value (price × stock) and the best discount on screen. The wishlist still works, and now survives a reload.
A Reset button, and a panel that prints the `state` object live, so you can watch every click change one object.

By the end you will be able to answer, without hesitating:

- Why `const` does not make an object immutable, and why `var` is gone from modern code
- What destructuring, spread and rest each do, and why a spread copy is only one level deep
- When `??` and `||` give different answers, and why that matters for a stock of `0`
- Which array methods return a new array, and which one quietly changes the array you called it on
- How `reduce` turns a list into one value, and when a `Set` or a `Map` beats an object
- What named and default exports are, and why modules exist at all
- Why "one state object in, whole view out" is the idea React and Angular are both built on

> **Modern JavaScript is mostly about saying *what* you want instead of *how* to loop for it, and about never
> changing data you were given.** `filter`, `map`, spread and destructuring are not shortcuts for their own sake;
> each one exists so that data flows one way and the old value stays untouched. That is exactly the discipline React
> and Angular expect from you.

---

## Before the session (10 minutes)

**Option A: in the browser (nothing to install).** Open the `starter/` folder of this session in StackBlitz, using
the link your trainer shares. Wait for the install to finish and the preview to show sixteen product cards. Bookmark
the tab once its address changes to `stackblitz.com/edit/…`: that is your copy.

**Option B: locally.** You need Node.js 22 or newer (`node -v`).

```bash
cd sessions/02-modern-javascript-es6/starter
npm install
npm run dev          # open http://localhost:5173
```

Keep DevTools → **Console** open. Every concept below has a snippet you can paste in and run.

---

## How this guide works

Every lab has the same shape:

| | |
|---|---|
| **Problem** | What is missing or broken, concretely |
| **Concept** | The idea behind it: *what*, *why*, then *how* |
| **Steps** | Exactly what to type, in which file, at which TODO |
| **Verify** | The specific thing you should see |
| **Watch out** | The mistake you are most likely to make, and why |
| **Challenge** | Two minutes, optional, a little harder |
| **In the real world** | Where this shows up in React and Angular code |

The code blocks in **Steps** are exactly what is in `solution/`. If you fall behind, open the matching file in
`../solution/src/` and compare.

---

## Orientation — what is in the box (5 min)

```
starter/
├── index.html            ← header, toolbar, empty chip row, grid, two side panels
└── src/
    ├── main.js           ← state, setState(), update(), the event listeners
    ├── base.css          ← the shared design system (do not edit)
    ├── style.css         ← this session's styles (written for you)
    ├── data/products.js  ← sixteen products, the same file as Session 1
    ├── lib/
    │   ├── format.js     ← Session 1's helpers, unchanged
    │   └── catalog.js    ← filter, sort, categories, counts, stats: all stubs today
    └── ui/
        ├── dom.js        ← h(): build an element in one expression (stub)
        └── render.js     ← createCard, renderGrid, renderCategoryChips, renderStats
```

Read `src/main.js` top to bottom before you start. Three things to notice:

1. **`let state = { ...initialFilters, saved: [] };`** Everything that can change lives in this one object. The `...`
   is spread; you will write your own in Lab 2.
2. **`update()` never reads the DOM to decide anything.** It reads `state`, computes, and draws. Events will only
   ever call `setState(…)`.
3. **Every file starts with `import` and every function is `export`ed.** That is ES modules. Vite follows these
   imports to build the app, and `import "./style.css"` is a Vite feature (bundlers treat CSS as a module; plain
   browsers do not). Lab 5 explains the rules.

---

## Lab 1 — Modern syntax tour: `let`/`const`, arrows, template literals, destructuring (20 min)

### Problem

Open `createCard` in `src/ui/render.js`. It is correct, and it is nearly sixty lines: `product.` appears twelve times, every
element takes three lines to create, and you cannot see the card's shape without reading all of it. Adding a
"−18%" pill means another five lines in the right place. And `renderGrid` spells out a loop to do what is really one
idea: "one card per product".

### Concept

**`const` by default, `let` when you must reassign, `var` never.** `var` has two behaviours that caused real bugs
for twenty years. It is *hoisted*: the declaration moves to the top of the function, so reading it early gives
`undefined` instead of an error. And it is *function-scoped*, so a loop shares one variable across every iteration:

```js
console.log(total); // undefined: var total was hoisted, its value was not
var total = 5;

console.log(count); // ReferenceError: Cannot access 'count' before initialization
let count = 5;

for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3: one shared i
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j)); // 0 1 2: a fresh j per loop
```

`let` and `const` are **block-scoped**: they exist only between the nearest `{ }`, and touching them before their
line is an error (the "temporal dead zone"). An early, loud error is exactly what you want.

> **Misconception: "`const` means immutable."** It does not. `const` means the *binding* cannot be reassigned. The
> object it points to can still change: `const cart = []; cart.push(1);` is legal. `cart = []` is the error. Making
> the object itself read-only is a separate, one-level-deep step. In this course we get safety another way: we
> simply never mutate data we were given (Lab 2).

**Arrow functions** are shorter, and they do not have their own `this`. That makes them ideal for callbacks:
`products.map((p) => p.title)`. One parameter needs no parentheses; a single expression needs no braces and no
`return`. Returning an object literal needs parentheses: `() => ({ id: 1 })`. **When not to use them:** as object
methods that use `this`, and as constructors (`new` on an arrow is a TypeError). Session 3 is all about `this`; for
today, arrows everywhere for callbacks, `function` for named top-level functions.

**Template literals** are strings in backticks. `${…}` holds any *expression*, even a ternary or another template
literal, and they can span lines. That makes them a natural way to write a chunk of markup.

**Destructuring** pulls values out of an object or array into variables, in one line:

```js
const { title, price } = product;                 // object: by name
const { brand = "No brand" } = product;           // default, used only when the value is undefined
const { category: productCategory } = product;    // rename
const { category, brand = category } = product;   // a default can use a name from earlier in the same pattern
const [first, second] = ["beauty", "fragrances"]; // array: by position
function show({ title, price }) { … }             // in a parameter list: the caller passes one object
```

Why it exists: you name each field once, at the top, and the rest of the function reads like plain variables. It
also documents which fields a function actually uses.

### Steps

**A. `src/ui/render.js` — `TODO(lab-2.1)`: rewrite `createCard`.**

Delete the marker comment and replace the whole function with:

```js
/** One product → one <article class="card">. The caller decides where it goes. */
export function createCard(product, isSaved) {
  // Destructuring: name the fields once. brand defaults to category when it is undefined.
  const { id, title, category, brand = category, price, discountPercentage, rating, stock, thumbnail } = product;
  const { tone, label } = stockStatus(stock);
  const hasDiscount = discountPercentage >= 1;

  const card = document.createElement("article");
  card.className = "card";
  card.classList.toggle("is-out", tone === "out");
  card.classList.toggle("is-saved", isSaved);

  // A template literal is the markup, with ${…} holes. Fine for our own data file;
  // anything a user typed goes through textContent instead (innerHTML parses it as HTML).
  card.innerHTML = `
    <div class="thumb">
      <img src="${thumbnail}" alt="${title}" loading="lazy" />
      ${hasDiscount ? `<span class="off">−${Math.round(discountPercentage)}%</span>` : ""}
    </div>
    <div class="body">
      <span class="brand">${brand}</span>
      <h3>${title}</h3>
      <p class="price">${formatPrice(discountedPrice(price, discountPercentage))}${hasDiscount ? `<s>${formatPrice(price)}</s>` : ""}</p>
      <div class="row">
        <span class="badge ${tone}">${label}</span>
        <span class="rating">★ ${rating.toFixed(1)}</span>
      </div>
    </div>
    <button type="button" class="heart" data-id="${id}" aria-pressed="${isSaved}"
      aria-label="Save ${title} to your wishlist">${isSaved ? "♥" : "♡"}</button>`;
  return card;
}
```

Notice `const { tone, label } = stockStatus(stock);`: destructuring works on any object, including a function's
return value. And the template has a template literal *inside* a `${…}`: the discount pill only exists when
`hasDiscount` is true.

**B. `src/ui/render.js` — `TODO(lab-2.2)`: `renderGrid` in one expression.**

Replace the body of `renderGrid`:

```js
/** Renders the products into the grid in one DOM update, or a friendly message when there are none. */
export function renderGrid(gridEl, products, savedIds) {
  if (products.length === 0) {
    const empty = document.createElement("p");
    empty.className = "state";
    empty.textContent = "No products match. Try a different search or category.";
    gridEl.replaceChildren(empty);
    return;
  }
  gridEl.replaceChildren(...products.map((product) => createCard(product, savedIds.includes(product.id))));
}
```

`map` turns sixteen products into sixteen cards. The `...` in front spreads that array into sixteen separate
arguments, because `replaceChildren(a, b, c)` takes nodes, not an array. Lab 2 is about that `...`.

### Verify

The page looks the same as before, with one addition: purple "−10%" pills on the discounted products (not on Dolce
Shine, whose discount is 0.62%, and Dolce Shine has no struck-through price either). The Apple card's brand line
says **groceries**: the default kicked in. Hearts still toggle and the count still updates.

In the console, prove the hoisting difference yourself: paste the four `console.log` lines from the Concept, one pair
at a time.

### Watch out

**Defaults only replace `undefined`.** `const { brand = "x" } = { brand: null }` gives `null`, not `"x"`. If an API
sends `null` for "missing", use `??` (Lab 2) instead of a destructuring default.

**`innerHTML` parses HTML.** Our product file is data we wrote, so a template is fine here. Text a *user* typed (the
search box) must never be interpolated into `innerHTML`; it would run as markup. That is why the empty state above
uses `textContent`. React and Angular escape interpolated values for you, which is one reason they exist.

**Arrow with braces returns nothing.** `products.map((p) => { createCard(p) })` gives an array of `undefined`.
Either drop the braces or write `return`.

### Challenge (2 min)

Swap `rating.toFixed(1)` for five stars built from a template literal and `"★".repeat(…)` / `"☆".repeat(…)`. Round
the rating first. Which string method did you just discover?

### In the real world

That template literal is nearly JSX. In React, `createCard` becomes
`function ProductCard({ product, isSaved }) { … }`: destructuring in the parameter list is how *every* React
component receives its props. In Angular, the template lives in a separate `.html` file (or a backtick `template:`
string in the component decorator), and `{{ product.title }}` plays the role of `${title}`. Both frameworks escape
the values for you.

---

## Lab 2 — Spread, rest, `?.` and `??` (20 min)

### Problem

Three things in the starter are "Session 1 style" and each will hurt as the app grows:

1. The heart listener **mutates** `state.saved` with `push` and `splice`. Nothing else can tell that it changed.
2. `setState(changes)` ignores `changes`: it just calls `update()`.
3. Building a small element (a chip, a stats row) takes four or five lines of `createElement`, `className` and
   `append`. `h()` in `src/ui/dom.js` was meant to do it in one expression, but it ignores everything except the tag.

### Concept

**Spread (`...`) unpacks** an array or object into a new one:

```js
const more = [...saved, 7];                        // a NEW array: the old ids, plus 7
const merged = { ...state, query: "red" };         // a NEW object: every key of state, query overwritten
const copy = [...products];                        // a copy of the array
Math.max(...[3, 9, 4]);                            // 9: spread into separate arguments
```

For objects, **later keys win**. `{ ...state, ...changes }` means "the old state, overwritten by whatever changed".
That single line is how React and Angular state updates are written.

> **Misconception: "spread makes a copy, so the original is safe."** Only one level deep. A spread copies the
> *references* of nested objects, not the objects themselves:
>
> ```js
> const original = { name: "Desk", dims: { w: 1 } };
> const copy = { ...original };
> copy.dims.w = 99;
> original.dims.w; // 99: both point at the same dims object
> ```
>
> That is a **shallow copy**. For a deep copy use `structuredClone(original)`; in practice you spread each level you
> change (`{ ...original, dims: { ...original.dims, w: 99 } }`).

**Rest (`...`) gathers** the remaining items. Same three dots, opposite job, and it appears on the *left* side or in
a parameter list:

```js
function sum(...nums) { return nums.reduce((a, b) => a + b, 0); } // rest parameter: all arguments, as an array
const [first, ...others] = ["a", "b", "c"];                        // others is ["b", "c"]
const { saved, ...filters } = state;                               // filters is state without saved
```

**Default parameters** fill in a missing (`undefined`) argument: `function h(tag, props = {})`.

**Optional chaining `?.`** reads through something that may be `null` or `undefined`, and gives `undefined` instead
of throwing. `event.target.closest(".heart")?.dataset.id` is `undefined` when the click was not on a heart. The
whole rest of the chain is skipped.

**Nullish coalescing `??`** gives the right-hand value only when the left is `null` or `undefined`. `||` gives it
whenever the left is *falsy*, and falsy includes `0`, `""` and `false`:

```js
const powder = products[2];        // the Powder Canister: stock 0
powder.stock || "unknown";         // "unknown": wrong, we know it is 0
powder.stock ?? "unknown";         // 0: right
```

> **Misconception: "`||` is how you set a default."** It was, before 2020. It treats a real `0`, an empty string and
> `false` as missing. For "use this if the value is absent", write `??`. Keep `||` for genuine true/false logic.

### Steps

**A. `src/ui/dom.js` — `TODO(lab-2.3)`: the `h()` helper.**

Replace the function (keep the comment above it):

```js
export function h(tag, props = {}, ...children) {
  const { dataset = {}, ...rest } = props; // pull dataset out; everything else stays in `rest`
  const el = document.createElement(tag);
  Object.assign(el, rest); // className, textContent, type, ariaPressed…
  Object.assign(el.dataset, dataset); // { category: "beauty" } → data-category="beauty"
  el.append(...children); // spread: append(a, b, c), not append([a, b, c])
  return el;
}
```

Four features in six lines: a default parameter, a rest parameter, a destructuring default with object rest, and a
spread call. `Object.assign(target, source)` copies each key of `source` onto `target`, so
`{ className: "stat" }` sets `el.className`.

**B. `src/main.js` — `TODO(lab-2.4)`: `setState`.**

```js
function setState(changes) {
  state = { ...state, ...changes }; // a NEW object: the old state, overwritten by the changes
  update();
}
```

**C. `src/main.js` — `TODO(lab-2.5)`: the heart listener, immutably.**

Replace the whole grid listener:

```js
els.grid.addEventListener("click", (event) => {
  const idText = event.target.closest(".heart")?.dataset.id;
  if (idText === undefined) return; // the click was somewhere else on the grid

  const id = Number(idText); // dataset values are always strings
  const { saved } = state;
  setState({ saved: saved.includes(id) ? saved.filter((savedId) => savedId !== id) : [...saved, id] });
});
```

No `push`, no `splice`: removing is `filter`, adding is spread. The old array is never touched.

### Verify

Hearts toggle exactly as before and the count follows. Now prove the difference in the console. Temporarily add
`window.getState = () => state;` at the bottom of `main.js`, then:

```js
const before = getState().saved;
// click a heart
getState().saved === before;   // false: a brand-new array
before;                        // still the old contents
```

With the Session 1 `push` version, that comparison was `true`: the "old" value had silently changed. Remove the
`window.getState` line when you are done.

### Watch out

**`{ ...changes, ...state }` in the wrong order.** Later keys win, so this keeps every old value and your changes
vanish. State first, changes second.

**`Number(undefined)` is `NaN`.** That is why we check `idText === undefined` *before* converting.

**`[...saved, id]` versus `[saved, id]`.** Without the dots you get a nested array, `[[1, 5], 7]`.

### Challenge (2 min)

Write `const without = (arr, item) => arr.filter((x) => x !== item);` and
`const toggle = (arr, item) => (arr.includes(item) ? without(arr, item) : [...arr, item]);` and use `toggle` in the
listener. Could this helper live in `lib/`? Why is it safe to reuse anywhere?

### In the real world

`state = { ...state, ...changes }` is React's `setState(prev => ({ ...prev, ...changes }))` and the reducer pattern
you meet in the ReactJS program. React decides whether to re-render by comparing references: a mutated array is the
*same* reference, so React sees no change and your UI goes stale. Angular's `OnPush` change detection works the same
way for `@Input()`s. `h(tag, props, ...children)` has exactly the signature of `React.createElement(type, props,
...children)`, which is what every line of JSX compiles to.

---

## Lab 3 — The array toolbox: `filter`, `map`, sort without mutation (30 min)

### Problem

The toolbar does nothing. Typing in the search box, picking a sort order: no effect. `filterProducts` and
`sortProducts` in `src/lib/catalog.js` return their input unchanged, and nothing is listening to the controls.

### Concept

**Array methods say *what* you want; the loop is written for you.** Each takes a callback and each has one job:

| Method | Returns | Use it to |
|---|---|---|
| `map(fn)` | a new array, same length | turn each item into something else |
| `filter(fn)` | a new array, same or shorter | keep items where `fn` returns truthy |
| `find(fn)` | the first match, or `undefined` | get one item |
| `some(fn)` / `every(fn)` | `true` / `false` | ask "any?" / "all?" |
| `includes(x)` | `true` / `false` | check membership (arrays *and* strings) |
| `reduce(fn, start)` | anything | fold the list into one value (Lab 4) |

```js
products.find((p) => p.id === 3)?.title;         // "Powder Canister"
products.some((p) => p.stock === 0);             // true
products.every((p) => p.price > 0);              // true
"Red Lipstick".toLowerCase().includes("red");    // true
```

Why they exist: none of them changes the original array, each returns a value (so they chain), and the name tells
the reader your intent before they read the callback.

**`sort()` is the exception.** It sorts the array **in place** and returns that same array.

> **Misconception: "`const sorted = products.sort(…)` gives me a sorted copy."** It gives you the *same* array,
> now reordered. `sorted === products` is `true`. Anything else holding `products` (the "Featured" order, another
> component, a cache) just changed under its feet. Always sort a copy: `[...products].sort(compare)`, or, in
> ES2023 and later, `products.toSorted(compare)`, which returns a new array (supported in all current browsers and
> Node 20+). Also: with no compare function, `sort()` compares **as strings**, so `[10, 9, 1].sort()` is
> `[1, 10, 9]`. For numbers, always pass `(a, b) => a - b`.

A compare function returns a negative number if `a` goes first, positive if `b` goes first, `0` if equal. `a - b`
sorts ascending; `b - a` descending.

### Steps

**A. `src/lib/catalog.js` — `TODO(lab-2.6)`: `filterProducts`.**

```js
/** Keeps the products whose title or brand contains the query, in the chosen category. */
export function filterProducts(products, { query = "", category = "all" } = {}) {
  const q = query.trim().toLowerCase();

  return products.filter(({ title, brand, category: productCategory }) => {
    const inCategory = category === "all" || productCategory === category;
    // brand?.… : one product has no brand. ?. gives undefined instead of throwing a TypeError.
    const matchesQuery = q === "" || title.toLowerCase().includes(q) || brand?.toLowerCase().includes(q);
    return inCategory && matchesQuery;
  });
}
```

Destructuring twice: the second parameter (with defaults, and `= {}` so calling with no filters still works), and
each product in the callback, where `category: productCategory` renames to avoid clashing with the filter's
`category`.

**B. `src/lib/catalog.js` — `TODO(lab-2.7)`: `sortProducts`.**

```js
/**
 * Returns a NEW, sorted array. sortKey is "featured" or "<field>-<asc|desc>", e.g. "price-asc".
 * sort() reorders the array in place, so we always sort a copy.
 */
export function sortProducts(products, sortKey = "featured") {
  if (sortKey === "featured") return [...products]; // the catalogue's own order

  const [field, direction] = sortKey.split("-"); // "price-desc" → ["price", "desc"]
  const sign = direction === "desc" ? -1 : 1;
  return [...products].sort((a, b) => (a[field] - b[field]) * sign);
}
```

Look at the `<select>` in `index.html`: the option values are `price-asc`, `price-desc`, `rating-desc` and
`discountPercentage-desc`. Array destructuring splits each into a field name and a direction; `a[field]` reads the
property whose name is in the variable.

**C. `src/main.js` — `TODO(lab-2.8)`: derive `visible` in `update()`.**

Replace `const visible = products;` with:

```js
const visible = sortProducts(filterProducts(products, state), state.sort);
```

We pass the whole `state` as the filters object. `filterProducts` destructures only `query` and `category` and
ignores the rest. That is destructuring as a contract: take what you need.

**D. `src/main.js` — `TODO(lab-2.9)`: listen to the controls.**

Replace the marker comment with:

```js
els.search.addEventListener("input", (event) => setState({ query: event.target.value }));
els.sort.addEventListener("change", (event) => setState({ sort: event.target.value }));

els.chips.addEventListener("click", (event) => {
  const category = event.target.closest("[data-category]")?.dataset.category;
  if (category) setState({ category });
});
```

`{ category }` is shorthand for `{ category: category }`. The chip listener is ready now; the chips themselves
arrive in Lab 4.

### Verify

- Type `annibale`: two furniture products, "2 of 16 products". Type `RED`: Red Lipstick and Red Nail Polish (case
  does not matter). Type `apple`: the Apple, which has no brand, and nothing crashes.
- Sort **Price ↑**: Apple ($1.99) first, then Red Nail Polish. **Rating**: Knoll Saarinen chair (4.88) first.
  **Biggest discount**: Bedside Table African Cherry (19.09%) first.
- Switch back to **Featured**: the original order returns, because `products` itself is never reordered.
- Type `zzz`: the friendly empty state from Lab 1.

### Watch out

**`brand.toLowerCase()` without `?.`** crashes on the Apple: `TypeError: Cannot read properties of undefined
(reading 'toLowerCase')`, and only when the search is non-empty, which is why this bug ships.

**`return products.sort(…)`.** In this app it *seems* to work, only because `filterProducts` always hands
`sortProducts` a fresh array. Call `sortProducts(products, "price-asc")` anywhere else (a test, another panel) and
you reorder the catalogue itself: `products[0]` is no longer the mascara, and every other user of that array sees
the new order. A function that is only correct because of who happens to call it is a bug waiting for a new caller.
Try it: put `products.sort((a, b) => a.price - b.price);` at the top of `main.js` and watch Featured change.

**Comparing strings with `a - b`.** `"b" - "a"` is `NaN`. For text, use `a.title.localeCompare(b.title)`.

### Challenge (2 min)

Add an option `<option value="title-asc">Name A–Z</option>`. It breaks: why? Make `sortProducts` use
`localeCompare` when the field holds strings (`typeof a[field] === "string"`). Then rewrite the copy-and-sort with
`toSorted`.

### In the real world

In React, the list you render is *derived* on every render:
`const visible = sortProducts(filterProducts(products, filters), sort);` sits right in the component body, and
`{visible.map((p) => <ProductCard key={p.id} product={p} />)}` renders it. Sorting the prop in place is one of the
classic React bugs: you mutate your parent's data. In Angular, the same derivation lives in a component getter or a
`computed()` signal, and the template loops with `@for (p of visible; track p.id)`. Angular *pipes* are the same idea
as these pure functions: input in, new value out, no side effects.

---

## Lab 4 — `reduce` and `Set`: stats and categories (20 min)

### Problem

There are no category chips, and the Live stats panel shows four dashes. `getCategories`, `countByCategory` and
`computeStats` return empty values, and the two render functions do nothing.

### Concept

**`reduce` folds a list into one value.** You give it a function `(accumulator, item) => newAccumulator` and a
starting value. It calls your function once per item, feeding each result into the next call:

```js
[4, 2, 3].reduce((sum, n) => sum + n, 0);   // 0+4 → 4, 4+2 → 6, 6+3 → 9
```

The accumulator can be anything: a number, an object with several totals, even a product. **Always pass the
starting value.** Without it, `reduce` uses the first item and throws a TypeError on an empty array, and a search
that matches nothing gives an empty array.

**A `Set` holds each value once.** `new Set(["a", "b", "a"])` has size 2. Spread it back into an array:
`[...new Set(list)]` is the idiomatic "unique values" in one line. `set.has(x)` is a fast membership check.

**A `Map` is a key-value collection built for lookups and counting.** Unlike a plain object, its keys can be any
type (numbers, objects), it remembers insertion order, it has `.size`, and it never collides with inherited keys like
`"constructor"`. The API is `get`, `set`, `has`, `delete`; `set` returns the map, so calls chain:

```js
const counts = new Map();
counts.set("beauty", 5).set("groceries", 1);
counts.get("beauty");       // 5
counts.get("toys");         // undefined, so: counts.get("toys") ?? 0
```

That `?? 0` is the right operator: a count of `0` is a real answer, and `??` would keep it.

### Steps

**A. `src/lib/catalog.js` — `TODO(lab-2.10)`: `getCategories`.**

```js
/** Every category once, in the order it first appears. A Set drops the duplicates for us. */
export function getCategories(products) {
  return [...new Set(products.map(({ category }) => category))];
}
```

**B. `src/lib/catalog.js` — `TODO(lab-2.11)`: `countByCategory`.**

```js
/** How many products per category: a Map from category name to count. */
export function countByCategory(products) {
  const counts = new Map();
  for (const { category } of products) {
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return counts;
}
```

Yes, a `for…of` loop. Array methods are the default, not a religion: when you are filling a collection step by step,
a loop over destructured items is the clearest code.

**C. `src/lib/catalog.js` — `TODO(lab-2.12)`: `computeStats`.**

```js
/** Four numbers from one pass over the list: count, average rating, inventory value, best deal. */
export function computeStats(products) {
  const totals = products.reduce(
    (acc, product) => ({
      ratingSum: acc.ratingSum + product.rating,
      inventoryValue: acc.inventoryValue + product.price * product.stock,
      bestDeal:
        !acc.bestDeal || product.discountPercentage > acc.bestDeal.discountPercentage ? product : acc.bestDeal,
    }),
    { ratingSum: 0, inventoryValue: 0, bestDeal: null }, // the starting value: what an empty list gives
  );

  const count = products.length;
  return {
    count,
    averageRating: count > 0 ? totals.ratingSum / count : 0,
    inventoryValue: totals.inventoryValue,
    bestDeal: totals.bestDeal,
  };
}
```

The reducer returns a *new* accumulator object each time (the parentheses around `({ … })` make the arrow return an
object literal). The `count > 0` check avoids `0 / 0`, which is `NaN`.

**D. `src/ui/render.js` — `TODO(lab-2.13)`: `renderCategoryChips`.**

```js
/** One button per category, with a live count. The active one has aria-pressed="true". */
export function renderCategoryChips(container, categories, active, counts) {
  const chips = categories.map((category) =>
    h(
      "button",
      { type: "button", className: "filter-chip", ariaPressed: String(category === active), dataset: { category } },
      category === "all" ? "All" : category,
      h("span", { className: "n", textContent: String(counts.get(category) ?? 0) }),
    ),
  );
  container.replaceChildren(...chips);
}
```

**E. `src/ui/render.js` — `TODO(lab-2.14)`: `renderStats`.**

```js
/** The stats panel: four rows, each a <dt> label and a <dd> value. */
export function renderStats(container, { count, averageRating, inventoryValue, bestDeal }) {
  const rows = [
    { label: "Products shown", value: String(count) },
    { label: "Average rating", value: count > 0 ? `★ ${averageRating.toFixed(2)}` : "—" },
    { label: "Inventory value", value: formatPrice(inventoryValue), note: "price × stock" },
    {
      label: "Best discount",
      value: bestDeal ? `${Math.round(bestDeal.discountPercentage)}% off` : "—",
      note: bestDeal?.title,
    },
  ];

  container.replaceChildren(
    ...rows.map(({ label, value, note = "" }) =>
      h("div", { className: "stat" }, h("dt", { textContent: label }), h("dd", { textContent: value }, h("small", { textContent: note }))),
    ),
  );
}
```

Destructuring in the parameter list, `?.` for the case where nothing is shown, and a destructuring default
`note = ""` that catches both the rows without a note and `bestDeal?.title` being `undefined`.

### Verify

- Chips: **All 16 · Beauty 5 · Fragrances 5 · Furniture 5 · Groceries 1**, generated from the data (CSS
  capitalises the names). Click **Furniture**: five products, the chip turns dark.
- Stats with everything shown: **16** products, average rating **★ 3.88**, inventory value **$383,258.40**, best
  discount **19% off** (Bedside Table African Cherry).
- Click **Beauty**: 5 shown, **★ 3.75**, **$2,877.73**, **18% off** (Eyeshadow Palette with Mirror).
- Search `zzz`: 0 shown, dashes for rating and discount, **$0.00**, and no error. That is the starting value of
  `reduce` doing its job.

Curious about the raw number? Add `console.log(computeStats(products).inventoryValue)` to `main.js` for a moment:
`383258.3999999999`, Session 1's floating-point lesson. `formatPrice` rounds it for display.

### Watch out

**Forgetting the `reduce` starting value.** With `{ ratingSum: 0, … }` missing, the first *product* becomes the
accumulator, `acc.ratingSum` is `undefined`, and the average and inventory value become `NaN`. On an empty list
it throws.

**`counts.get(category) || 0`** happens to work here, but only because a `0` is never stored. Write the operator
that says what you mean.

**Chip counts ignore the search for now.** Search `annibale` and the chips still say Beauty 5. You fix that in Lab 5.

### Challenge (2 min)

Add a fifth stat, "Low or sold out", using `filter(…).length`, then again using `reduce`. Which reads better? Now use
`some` to show a warning when any visible product is sold out.

### In the real world

In React, derived numbers like these are computed during render, wrapped in `useMemo` only when they are expensive:
`const stats = useMemo(() => computeStats(visible), [visible]);`. The reducer shape `(state, action) => newState`
is exactly `reduce`'s callback shape, which is why React's `useReducer` and Redux are named after it. In Angular, a
`computed(() => computeStats(this.visible()))` signal recalculates only when its inputs change, and `Set` and `Map`
show up constantly in services for selection state and lookups by id.

---

## Lab 5 — Modules and one-state-object architecture (15 min)

### Problem

Reload the page: your hearts are gone. Type `annibale`: the chips still count everything. Click **Reset**: nothing.
And if something else ever changed `state.query`, the search box would still show the old text, because the
controls are the one part of the page `update()` does not draw.

### Concept

**Why modules exist.** Before ES modules (2015), every `<script>` shared one global scope. Two files that both
declared `total` overwrote each other, and the order of script tags was load-bearing. A module has **its own scope**:
nothing leaks out unless you `export` it, and nothing comes in unless you `import` it. Dependencies become visible at
the top of each file, and tools like Vite can follow them to build (and drop unused code from) your app.

**Named exports** (what this course uses) export by name, and the importer must use that name, in braces:

```js
// lib/storage.js
export function loadSaved() { … }
// main.js
import { loadSaved } from "./lib/storage.js";
import { loadSaved as loadWishlist } from "./lib/storage.js"; // renaming on import
```

**A default export** is the module's one main value; the importer picks any name and uses no braces:

```js
// ui/Card.js
export default function createCard() { … }
// main.js
import createCard from "./ui/Card.js";
```

Named exports are easier to search for, to rename safely, and for editors to auto-import; React component files
often use default exports, and Angular uses named exports everywhere. A module can have both.

**Import paths:** `./` means "next to this file", `../` means "one folder up". In the browser and in Vite projects
like ours, write the extension (`.js`). A bare name without `./` (like `"react"`) means a package from
`node_modules`. Modules run once, the first time they are imported, and are always in strict mode.

**One state object, one `update()`.** Every event changes `state` through `setState`; `update()` turns the whole
state into the whole page. There is no "remember to also update the count" code, because every render draws
*everything* from state. This is exactly the React model: `view = f(state)`.

**A first look at classes.** You could also hold state in a class:

```js
class Wishlist {
  #ids = [];                        // a private field
  toggle(id) { this.#ids = this.#ids.includes(id) ? this.#ids.filter((x) => x !== id) : [...this.#ids, id]; }
  get count() { return this.#ids.length; }
}
const w = new Wishlist();
w.toggle(3);
w.count; // 1
```

A class bundles data with the methods that change it. Angular services are classes; Session 3 builds the cart both
as a class and as a closure, and explains `this` properly.

### Steps

**A. Create `src/lib/storage.js` — `TODO(lab-2.15)`.**

A new file, a new module:

```js
/**
 * The wishlist survives a page reload. localStorage only stores strings, so we store JSON.
 * Two named exports: the importing file asks for exactly these names.
 */
const KEY = "shopscope-lite:saved";

export function loadSaved() {
  try {
    // getItem gives null when nothing was saved yet; JSON.parse(null) is null; ?? turns that into [].
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return []; // storage blocked, or the stored text was not valid JSON
  }
}

export function saveSaved(ids) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}
```

`KEY` is not exported, so no other file can see it. That is module scope doing its job.

Then, in **`src/main.js`**, at the two `TODO(lab-2.15)` markers: add the import below the catalog import,

```js
import { loadSaved, saveSaved } from "./lib/storage.js";
```

and start the wishlist from storage:

```js
let state = { ...initialFilters, saved: loadSaved() };
```

(`saveSaved` is called from `update()` in the next step.)

**B. `src/main.js` — `TODO(lab-2.16)`: `update()` in its final form, and Reset.**

Replace the whole `update()` function:

```js
// ---- update(): state in, whole view out. Exactly what React does on every render. ----
function update() {
  const { sort, saved, ...filters } = state; // rest: filters is { query, category }
  const visible = sortProducts(filterProducts(products, filters), sort);
  const matching = filterProducts(products, { query: filters.query }); // chip counts ignore the category
  const counts = countByCategory(matching).set("all", matching.length);

  renderCategoryChips(els.chips, ["all", ...categories], filters.category, counts);
  renderGrid(els.grid, visible, saved);
  renderStats(els.stats, computeStats(visible));
  els.count.textContent = `${visible.length} of ${products.length} products`;
  els.saved.textContent = `♥ ${saved.length} saved`;
  els.saved.classList.toggle("has-items", saved.length > 0);

  // The controls show state too, so Reset can never leave them out of sync.
  if (els.search.value !== filters.query) els.search.value = filters.query;
  els.sort.value = sort;

  els.inspector.textContent = JSON.stringify(state, null, 2);
  saveSaved(saved);
}
```

Then replace the Reset marker near the bottom with:

```js
els.reset.addEventListener("click", () => setState(initialFilters));
```

`setState(initialFilters)` spreads the three filter keys over state; `saved` is not in `initialFilters`, so the
wishlist stays.

### Verify

- The **state** panel prints the object and changes on every keystroke, chip click, sort change and heart.
- Search `annibale`: the chips update to **All 2 · Furniture 2**, and the other categories show 0.
- Save two products and reload: **♥ 2 saved**, and the hearts are filled.
- Set a search, a category and a sort, then click **Reset**: the search box empties, the select says Featured, All is
  active, and your hearts are still there.
- In DevTools → Application → Local Storage, find `shopscope-lite:saved`.

### Watch out

**`import { loadSaved } from "./lib/storage"`** (no `.js`) happens to work under Vite but fails in a plain browser.
Write the extension.

**`import loadSaved from "./lib/storage.js"`** (no braces) asks for a *default* export, which this file does not
have: `does not provide an export named 'default'`.

**Why the `if` before setting `els.search.value`?** Writing the same value back is harmless in current browsers, but
writing a *different* one moves the caret to the end. Only writing when it differs keeps typing smooth; React solves
the same problem with "controlled inputs".

**Focus on chips.** `update()` rebuilds the chip buttons, so a keyboard user's focus drops after pressing one. Our
"redraw everything" approach is simple but blunt; React's answer is to *compare* the new view with the old one and
touch only what changed. That comparison is the thing you are about to stop writing by hand.

### Challenge (2 min)

Turn `storage.js` into a default export: `export default { load: loadSaved, save: saveSaved };` and update the
import in `main.js` to `import storage from "./lib/storage.js";`. Which version would you rather search for in a
large codebase? Put it back.

### In the real world

**React:** `state` is `useState` (or `useReducer`), `setState` is its setter, and `update()` is your component
function, which React calls again after every state change. `saveSaved(saved)` inside `update()` is a side effect of
state, which in React goes in a `useEffect`. **Angular:** the component class holds state in fields or signals, the
template is the `update()`, and change detection re-runs it. Underneath both, every file is an ES module:
Angular's standalone components are classes that `import { Component } from "@angular/core"`, and even the older
`NgModule` system sits on top of ES `import`/`export`, it does not replace it.

---

## Wrap-up — what you can now do

- [x] Choose `const`, then `let`, and explain the `var` hoisting and loop pitfalls
- [x] Explain why `const` does not make an object read-only, and what spread copies (one level only)
- [x] Destructure objects and arrays, with defaults and renames, in variables and parameters
- [x] Use spread to copy and merge, and rest to gather parameters and "everything else"
- [x] Read through missing values with `?.`, and choose `??` over `||` when `0` is a real answer
- [x] Filter, map, find, check with `some`/`every`/`includes`, and sort without mutating
- [x] Fold a list into stats with `reduce`, get unique values with a `Set`, count with a `Map`
- [x] Split code into modules with named exports, and explain default exports and import paths
- [x] Keep all changeable data in one state object and derive the whole view from it

**One question to bring to Session 3:** `setState`, `update` and `state` are all loose in `main.js`, and any code in
the file could reassign `state` directly. How could you hide `state` so that the *only* way to change it is through
`setState`?

## Next session

**Session 3 — Functions, Closures, `this` & Immutability.** The answer to that question is a closure. You build a
real cart twice: once as a closure-based store (the way React hooks work) and once as a class service (the way
Angular services work), meet `this` properly, and add a debounced search.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Red error overlay in the browser | A syntax error. The overlay names the file and line; check for a missing `)`, `}` or backtick near it. |
| `does not provide an export named …` | The name in `import { … }` does not match an `export` in that file, or you used braces for a default export (or no braces for a named one). |
| `Cannot read properties of undefined (reading 'toLowerCase')` | The Apple has no brand. Use `brand?.toLowerCase()` in `filterProducts`. |
| Featured shows the wrong order | Something called `.sort()` on `products` itself. Sort a copy: `[...products].sort(…)`. |
| Stats show `NaN` | The `reduce` starting value is missing, or a property name is misspelt (`discountPercent`). |
| Chips show but nothing happens on click | `dataset: { category }` missing in `renderCategoryChips`, or `h()` still ignores props (Lab 2, `TODO(lab-2.3)`). |
| Chips or stats rows are empty boxes | `h()` is still the stub: it ignores props and children. Do `TODO(lab-2.3)`. |
| Hearts stop working after Lab 2 | `setState` is still the stub, so `state` never changes. Do `TODO(lab-2.4)`. |
| Wishlist does not survive a reload | `saved: loadSaved()` missing in the initial state, or `saveSaved(saved)` missing from `update()`. |
| Grid shows cards of `undefined` | An arrow with braces and no `return` in a `map` callback. |
| `npm run dev` fails | Check `node -v` is 22 or newer, and that you ran `npm install` inside `starter/`. |
