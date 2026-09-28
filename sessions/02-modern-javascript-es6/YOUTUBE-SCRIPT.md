# YouTube script — Session 2: Modern JavaScript (ES6+)

A 12–13 minute recorded demo session. It teaches something real (destructuring, array methods without mutation,
`reduce`) and shows the app learners build in the full session.

---

## 1. Video metadata

**Title options**

1. One Line of JavaScript That Silently Breaks Your App (and the Modern Fix)
2. Modern JavaScript for React & Angular: Destructuring, Array Methods and reduce, Live
3. Build Search, Filter & Sort in Plain JavaScript: No Framework, No Mutation

**Thumbnail text** (at most 5 words): `sort() CHANGED MY DATA`

**YouTube description**

> `products.sort()` looks harmless. It quietly reorders your original data, and in React or Angular that becomes
> the bug nobody can find. In this session we fix it live, then build a real product catalogue in plain modern
> JavaScript: search, category filters, sorting and a live stats panel, using destructuring, spread, `filter`,
> `map`, `reduce`, `Set` and ES modules.
>
> You'll see:
> 00:00 The sort() bug
> 00:30 What we're building
> 01:15 Destructuring: name it once
> 03:30 filter, map and sort without mutation: live search and sorting
> 07:00 reduce and Set: live stats and category chips
> 09:30 Where this lives in React and Angular
> 11:15 Recap
>
> This is Session 2 of the 5-day JavaScript & TypeScript Foundations program at Deesha Tech Academy, the
> preparation track for our React and Angular programs. Taught by Vishal Shah, Founder & Principal Trainer, with 20
> years in the industry.
>
> Register at deeshatechacademy.com
> https://deeshatechacademy.com

**Tags:** modern javascript, es6, javascript tutorial, destructuring, spread operator, array methods, javascript
reduce, javascript sort mutation, toSorted, optional chaining, nullish coalescing, es modules, javascript for react,
javascript for angular, react preparation, angular preparation, vanilla javascript project, Deesha Tech Academy

---

## 2. Recording setup

- **Browser (right half):** the **solution** app running (`cd solution && npm run dev`), at `http://localhost:5173`,
  DevTools Console docked at the bottom, collapsed until the cold open. Clear `localStorage` first so the wishlist
  starts at 0.
- **Editor (left half):** VS Code with a copy of the **starter** open for segments 1–3, with Lab 2 already done off
  camera (`h()`, `setState` and the heart listener from `TODO(lab-2.3)`–`TODO(lab-2.5)`), so search and sort work as
  soon as they are wired, and the solution's `src/main.js` open in a
  second tab for the cold open and segment 6. Font size 18+, a dark theme, minimap off, word wrap on.
- **Prepared, not typed on camera:** the long template literal in `createCard` (paste it, then walk through it), and
  the `renderStats` / `renderCategoryChips` bodies (paste; talk about the data, not the DOM calls).
- Browser zoom 110%, so the chips and stats read clearly on a phone screen.
- Have a second browser tab with the finished solution, in case a live edit goes wrong.

---

## 3. The script

### [0:00–0:30] Cold open: the sort() bug

**ON SCREEN:** The solution app, Featured order: Essence Mascara first. In the solution's `src/main.js`, just above
the final `update();`, type:

```js
const cheapest = products.sort((a, b) => a.price - b.price)[0];
console.log("Cheapest:", cheapest.title);
```

Save. The console prints `Cheapest: Apple`. The grid, still on **Featured**, now starts with Apple, then Red Nail
Polish. Point at the sort select: it still says Featured.

**SAY:**
"I asked JavaScript one question: what's the cheapest product? It answered: Apple. Correct. But look at the page. I
never touched the sort menu, it still says Featured, and my whole catalogue is now in price order. One innocent line
just rewrote my data. Let's fix it, and then build this whole app the modern way."

**ON SCREEN:** Change `products.sort(` to `products.toSorted(`. Save. Featured is back to Essence Mascara first; the
console still says `Cheapest: Apple`.

**SAY:**
"`sort` changes the array you call it on. `toSorted` gives you a new one. Same answer, and my original list is safe."

*(Delete the two lines before moving on.)*

### [0:30–1:15] Intro

**ON SCREEN:** Scroll the solution app slowly: header, toolbar, chips, grid, stats panel, state panel.

**SAY:**
"Hi, I'm Vishal Shah, founder of Deesha Tech Academy. I've been building and teaching software for twenty years.
This is Session 2 of our JavaScript and TypeScript Foundations program: Modern JavaScript. Today we build this:
ShopScope Lite. A search box, category chips, five sort orders, a live stats panel, and a wishlist. No framework.
Just modern JavaScript: destructuring, spread, array methods, `reduce`, a `Set`, and modules. And every one of those
features exists for a reason, so for each one I'll show you the problem it solves."

### [1:15–3:30] Segment 1: Destructuring, name it once

**ON SCREEN:** Starter, `src/ui/render.js`, `createCard`. Scroll through it slowly. Highlight every `product.`.

**SAY:**
"This is where we left the card at the end of Session 1. It works. But count the word `product`: twelve times. And
it's almost sixty lines for one card. You can't see the shape of it."

**ON SCREEN:** At the top of the function, type:

```js
const { id, title, category, brand = category, price, discountPercentage, rating, stock, thumbnail } = product;
```

**SAY:**
"This is destructuring. It says: from this product, give me these fields as plain variables. I name each field once,
right here, and now anyone reading the function knows exactly what it uses."

**ON SCREEN:** Point at `brand = category`.

**SAY:**
"And here's a nice detail. `brand = category` is a default. One product, the Apple, has no brand. When `brand` is
undefined, it falls back to the category. A default can even use a name from earlier in the same line."

**ON SCREEN:** Paste the template-literal version of the card (the solution's `card.innerHTML = \`…\``). Save.
Scroll to the Apple card: its brand line says **groceries**. Point at the purple "−10%" pills.

**SAY:**
"And the body is now a template literal: backticks, with dollar-brace holes for any expression. Even a ternary. Even
another template literal, for this discount pill. That's the aha: the card's markup is now readable as markup. If
you're heading to React, this is almost JSX already."

### [3:30–7:00] Segment 2: filter, map and sort, live search and sorting

**ON SCREEN:** Starter `src/lib/catalog.js`. Show the `filterProducts` stub returning `products`.

**SAY:**
"The toolbar does nothing yet. Let's make search work. Old-school JavaScript would make an empty array, loop, and
push. Modern JavaScript says what it wants: keep the products that match."

**ON SCREEN:** Type the solution's `filterProducts`, but first *without* `?.`:
`title.toLowerCase().includes(q) || brand.toLowerCase().includes(q)`. Wire the search listener in `main.js`:

```js
els.search.addEventListener("input", (event) => setState({ query: event.target.value }));
```

and the pipeline line in `update()`. Type `a` in the search box: the list narrows, no problem. Clear it and type
`red`. The grid stops updating and the console shows
`TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.

**SAY:**
"The letter `a` works. Now `red`... and it crashes. Why? When a title doesn't match, we check the brand instead. The
Apple's title doesn't contain `red`, so JavaScript asks for its brand, and the Apple has no brand.
`undefined.toLowerCase()` is an error. Notice it only crashes for some searches. That's exactly why this kind of bug
ships to production."

**ON SCREEN:** Add `?.`: `brand?.toLowerCase().includes(q)`. Save. Type `red` again: Red Lipstick and Red Nail
Polish, no error. Type `annibale`: two furniture products, matched by brand.

**SAY:**
"Optional chaining. Question mark, dot. If brand is missing, stop and give me undefined, instead of throwing. One
character, and the crash is gone."

**ON SCREEN:** Type the solution's `sortProducts`. Highlight `[...products]`.

**SAY:**
"Now sorting. Remember the cold open? We never sort the array we were given. We spread it into a new array first,
then sort the copy. And look at this line: `const [field, direction] = sortKey.split("-")`. Array destructuring.
`price-desc` becomes a field, `price`, and a direction, `desc`. One function handles all four sort orders."

**ON SCREEN:** Wire the sort `change` listener. In the app: Price ↑ (Apple first), Rating (Knoll chair first),
Biggest discount (Bedside Table first), then back to Featured: the original order.

**SAY:**
"Price, rating, discount, and back to Featured, exactly as it was. That's what not mutating buys you. And every one
of these functions is pure: same input, same output, no DOM. That's why they're so easy to trust."

### [7:00–9:30] Segment 3: reduce and Set, stats and categories

**ON SCREEN:** Starter `src/lib/catalog.js`, `getCategories`. Type:

```js
return [...new Set(products.map(({ category }) => category))];
```

Paste the prepared `countByCategory` and `renderCategoryChips` bodies. Save; the chips appear: All 16, Beauty 5,
Fragrances 5, Furniture 5, Groceries 1.

**SAY:**
"Category chips. Map every product to its category: sixteen strings, lots of repeats. Put them in a `Set`, and a Set
only keeps each value once. Spread it back into an array. Four categories, from the data itself. Add a new category
to the data tomorrow, and a chip appears. Nobody edits the HTML."

**ON SCREEN:** Type the solution's `computeStats`. Pause on the starting value
`{ ratingSum: 0, inventoryValue: 0, bestDeal: null }`. Paste `renderStats`. Save.

**SAY:**
"Now the stats panel, with `reduce`. `reduce` walks the list once and carries a running result: the accumulator. Here
it carries three things at once: the sum of ratings, the inventory value, which is price times stock, and the best
deal so far. And this last argument is the starting value: what an empty list gives you."

**ON SCREEN:** The panel: 16 products, ★ 3.88, $383,258.40, 19% off, Bedside Table African Cherry. Click
**Beauty**: 5, ★ 3.75, $2,877.73, 18% off. Then type `zzz` in the search: 0, dashes, $0.00.

**SAY:**
"Click Beauty: every number updates. Now search for something that doesn't exist. Zero products, and nothing breaks.
That's the starting value doing its job. Leave it out, and an empty search gives you NaN, or an error. That's the
aha with `reduce`: always give it somewhere to start."

### [9:30–11:15] Segment 4: Where this lives in React and Angular

**ON SCREEN:** Solution `src/main.js`: highlight `let state = …`, `setState`, and `update()`. In the app, click a
chip, type in search, save a heart. Point at the **state** panel changing each time.

**SAY:**
"Here's the architecture. All the data that can change lives in one object: `state`. Every click and keystroke calls
`setState`, which makes a *new* object with spread: the old state, overwritten by what changed. Then `update()` draws
the whole page from that state. Watch the panel on the right: that's the only thing that changes. The page just
follows."

**ON SCREEN:** Show this React snippet as an on-screen card (not typed):

```jsx
const [filters, setFilters] = useState({ query: "", category: "all", sort: "featured" });
const visible = sortProducts(filterProducts(products, filters), filters.sort);
return visible.map((p) => <ProductCard key={p.id} product={p} />);
```

**SAY:**
"In React, that's exactly this. `useState` is our state object. The setter is our `setState`. The component function
is our `update()`: React calls it again whenever state changes. And our `filterProducts` and `sortProducts` drop in
unchanged. React compares state by reference, so if you'd used `push` or `sort` on the original, React would think
nothing changed. That's why we practise spread and copies today."

**ON SCREEN:** Show this Angular snippet as an on-screen card:

```ts
visible = computed(() => sortProducts(filterProducts(this.products, this.filters()), this.filters().sort));
// template:  @for (p of visible(); track p.id) { <app-product-card [product]="p" /> }
```

**SAY:**
"And in Angular, the same pure functions power a `computed` signal, and the template loops over the result. Pipes in
Angular are this same idea: input in, new value out. And every Angular file starts with `import`: ES modules are
underneath everything."

### [11:15–11:50] Recap

**ON SCREEN:** Three bullets appear over the finished app:

- **Destructuring and spread:** name fields once; copy and merge without touching the original
- **filter, map, sort a copy:** say what you want, and never mutate data you were given
- **reduce, Set, one state object:** derive stats and categories, and let the view follow the state

**SAY:**
"Three things to take away. Destructuring and spread: name it once, copy instead of change. Array methods: say what
you want, and always sort a copy. And `reduce`, `Set`, and one state object: derive everything, and let the page
follow the data. That's modern JavaScript, and it's exactly how React and Angular expect you to think."

### [11:50–12:30] Call to action

**ON SCREEN:** The Deesha Tech Academy end card with `deeshatechacademy.com`.

**SAY:**
"This is Session 2 of our 5-day JavaScript & TypeScript Foundations program, the preparation track for our React and
Angular programs at Deesha Tech Academy. Register at deeshatechacademy.com, link in the description. In the full
session you build all of this yourself, step by step, with a guide for every lab. Next up, Session 3: closures,
`this`, and immutability, where we build a real cart twice, once the React way and once the Angular way. See you
there."

---

## 4. B-roll, on-screen text and pinned comment

**B-roll suggestions**

- Close-up of the grid reordering itself during the cold open (record at 2× zoom, slow to 50%).
- A split view of Session 1's `createCard` (58 lines) next to the destructured template version.
- Typing `red`, then `annibale`, in the search box, with the result count ticking.
- Clicking through the five sort orders, then back to Featured.
- The stats panel numbers changing as category chips are clicked.
- The state panel updating on each click, zoomed in.

**On-screen text**

- 0:05 — `sort() changes the original array`
- 0:25 — `toSorted() → a new array`
- 1:40 — `Destructuring: name each field once`
- 2:30 — `Defaults apply only when the value is undefined`
- 4:40 — `?. stops at null or undefined instead of throwing`
- 5:40 — `[...products].sort() = sort a copy`
- 7:10 — `new Set(): each value once`
- 8:00 — `reduce(fn, START): always pass a starting value`
- 9:40 — `view = f(state)`
- 10:20 — `React: useState · Angular: computed() signals`

**Pinned comment**

> Quick quiz from the video: `const stock = 0;` What do `stock || "unknown"` and `stock ?? "unknown"` give you? Answer
> in the replies, and tell us which one you would use for a product's stock.
>
> This is Session 2 of the 5-day JavaScript & TypeScript Foundations program at Deesha Tech Academy, the preparation
> track for our React and Angular programs. Register at deeshatechacademy.com
