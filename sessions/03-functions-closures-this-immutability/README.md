# Session 3 — Functions, Closures, `this` & Immutability

**Session guide** · ~120 minutes · the JavaScript that React hooks and Angular services are built on, learned by building one cart twice

---

## Where you are starting from

The starter is Session 2's finished catalogue: sixteen products, a search box,
category chips, a sort select and a stats panel, all driven by one `state`
object and one `renderAll()` function. Written for you and unchanged from
Session 2: `src/lib/format.js`, `src/lib/catalog.js` and `src/ui/render.js`.
Two small additions since Session 2: every card now has an **Add to cart**
button, and `render.js` exports a tiny `el()` helper for building elements.

New today, and mostly stubs: `src/lib/fn.js` (three closure helpers),
`src/lib/cart.js` (the cart's rules as pure functions),
`src/store/createCartStore.js`, `src/store/CartService.js` and
`src/ui/cart.js`. The cart panel, its implementation toggle and the
"Reference check" log are already in `index.html` and already wired in
`main.js`. Every stub returns a safe default, so the page builds and renders
from minute one; clicking the cart buttons just does nothing yet. One
deliberate exception: switch the panel to **CartService** and click **Add to
cart**, and the console shows a real `TypeError`. That bug is Lab 3.

Sixteen `TODO(lab-3.x)` markers across fifteen steps, numbered `3.1` to
`3.15` in the order you meet them. (`3.10` appears twice in one file.)

## What you ship today

**ShopScope Lite — cart & store.** The search is debounced: it waits until you
pause typing, and a small meter shows "12 keystrokes · 2 searches run". Each
card has an Add to cart button. A cart panel lists the lines with − / + and
remove, shows a subtotal and has a Clear button. The cart is implemented
**twice**, behind the same interface, and a toggle in the panel switches
between them live:

- **`createCartStore`**, a closure-based store, "React-hook style"
- **`CartService`**, a class with private fields, "Angular service style"

Under the cart, a **Reference check** logs `prevLines === nextLines` after every
change (always `false`), plus how many line objects were reused. A dashed
"Mutate in place" button shows what happens when you break the rules.

By the end you will be able to answer, without hesitating:

- What a closure captures (a variable, not a copy of its value) and why the variable outlives the function call that created it
- How `debounce` and `memoize` work, because you wrote them
- Why React calls state "a snapshot", and why `setCount((c) => c + 1)` fixes the stale-value bug
- The four rules that decide `this`, and why arrow functions don't follow them
- Why `onClick={cart.add}` can throw `Cannot read properties of undefined`, and three ways to fix it
- What a class really is in JavaScript (syntax over prototypes), and what `#private` buys you
- Why `===` on two objects compares references, and why React and Angular's OnPush depend on that
- What makes a function pure, and why frameworks want your updates to be pure

> **The key idea:** a function remembers where it was *written* (its closure),
> but `this` is decided by how it is *called*. Keep state private in closures,
> never mutate it, and always hand back a new reference when something changes.
> That is the contract React hooks and Angular services are built on.

---

## Before the session (10 minutes)

**StackBlitz (nothing to install).** Open the `starter` folder of this session
in StackBlitz, let it install, and keep the tab open. Once it loads, the
address bar changes to your own project URL: bookmark that tab so you come back
to your work, not a fresh copy.

**Or locally:**

```bash
cd sessions/03-functions-closures-this-immutability/starter
npm install
npm run dev          # http://localhost:5173
```

Node **22 or newer** (`node -v`). Open the browser's DevTools console too: we
use it in every lab.

---

## How this guide works

Every lab has the same shape:

| | |
|---|---|
| **Problem** | What actually hurts, concretely |
| **Concept** | The idea that fixes it: what, why, how |
| **Steps** | What to type, in order, with the file and TODO named |
| **Verify** | The specific thing you should see |
| **Watch out** | The mistake you are most likely to make, and why |
| **Challenge** | Two minutes, optional, harder |
| **In the real world** | Where this exact idea lives in React and Angular code |

Search the project for `TODO(lab-3` (`Ctrl/Cmd+Shift+F`) to see every marker.
If you fall behind, the `solution/` folder is the finished app: diff one file,
not the whole project.

---

## Orientation — what is in the box (5 min)

```
starter/
├── index.html                 ← header, toolbar, grid, and the cart panel (toggle + reference log)
└── src/
    ├── main.js                ← the glue: state, event wiring, renderAll()
    ├── data/products.js       ← sixteen products, same as Sessions 1–2
    ├── lib/
    │   ├── format.js          ← formatPrice, discountedPrice, stockStatus (Session 1)
    │   ├── catalog.js         ← filterProducts, sortProducts, getCategories, computeStats (Session 2)
    │   ├── fn.js              ← makeCounter, memoize, debounce          ← Lab 1
    │   └── cart.js            ← addLine, changeQty, removeLine, …       ← Labs 2 and 4
    ├── store/
    │   ├── createCartStore.js ← the closure store                        ← Lab 2
    │   └── CartService.js     ← the class service                        ← Lab 3
    └── ui/
        ├── render.js          ← createCard, renderGrid, chips, stats (Session 2)
        └── cart.js            ← renderCart                               ← Lab 2
```

Three things to notice before we start:

**Look at `renderAll()` in `main.js`.** It passes the cart's methods to the UI
as plain values: `onAdd: cart.add`, `onIncrement: cart.increment`. The UI
never sees the store. It just calls `onAdd(product)`. That is exactly how a
React component receives `onAdd={cart.add}` as a prop, and it is the line that
breaks in Lab 3.

**Look at `MODES` in `main.js`.** Two ways to make a cart:
`createCartStore(lines)` and `new CartService(lines)`. Everything else in
`main.js` only uses `getState`, `subscribe` and the five actions. **Same
interface, two implementations.** When you switch, the current lines are
handed to the new store.

**`lib/cart.js` has no DOM and no store in it.** Just functions from lines to
new lines. Both stores will call them. Keeping the rules pure and the "where
does state live" question separate is the design idea of the whole session.

---

## Lab 1 — Closures from scratch (25 min)

### Problem

Type "sofa" into the search box. The grid re-renders on **every keystroke**:
`s`, `so`, `sof`, `sofa`. With sixteen local products that is cheap. With a
real API (Session 4) it is four network requests, three of them wasted, and
they can come back out of order. You want to search once, when the user pauses.
To do that, a function has to *remember* a timer between calls. Functions
that remember things are closures.

### Concept

**Functions are values.** You can store one in a variable, pass it as an
argument, return it from another function, and put it in an object. A function
that takes or returns a function is a **higher-order function**. You already
use them: `products.filter(fn)`, `addEventListener("click", fn)`. Today you
write your own.

```js
const shout = (text) => text.toUpperCase();
const apply = (fn, value) => fn(value);   // takes a function
apply(shout, "hi");                        // "HI"
```

**Lexical scope.** When JavaScript meets a variable name, it looks in the
current function, then the function that *contains it in the source code*,
then the next one out, up to the module. That chain is fixed by **where the
code is written**, not where it is called from. "Lexical" just means "decided
by the text".

```js
const tax = 0.2;
function priceWithTax(price) {
  return price * (1 + tax);   // not local, so look one level out: finds `tax`
}
```

**A closure is a function plus the variables it can see from where it was
written.** Normally a function's local variables disappear when it returns.
But if an inner function that uses them is still reachable, they stay alive:

```js
export function makeCounter(start = 0) {
  let count = start;
  return {
    increment: () => {
      count += 1;
      return count;
    },
    reset: () => {
      count = start;
    },
    value: () => count,
  };
}

const a = makeCounter();
const b = makeCounter(10);
a.increment(); a.increment();
a.value();   // 2
b.value();   // 10: every call to makeCounter creates a NEW `count`
```

`makeCounter` has returned, yet `count` lives on, and nothing outside those
three arrows can read or change it. There is no `a.count`. That is **private
state without a class**.

> **Misconception: "closures copy variables."** They don't. A closure keeps a
> live link to the variable itself (the *binding*), not a snapshot of its value:
>
> ```js
> let n = 1;
> const read = () => n;
> n = 2;
> read();   // 2, not 1
> ```
>
> The classic proof is a loop. `var` creates **one** `i` for the whole loop;
> `let` creates a **new** `i` for each iteration:
>
> ```js
> for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));   // 3, 3, 3
> for (let j = 0; j < 3; j++) setTimeout(() => console.log(j));   // 0, 1, 2
> ```

**Stale closures, and why React calls state "a snapshot".** If closures see
live variables, how can a value go stale? When each call creates a *new*
variable that never changes afterwards. That is exactly what a React render
is: each render is a new call of your component function, and `count` is a
fresh `const` in each one.

```js
function render(count) {                        // think: one render of a component
  const handleClick = () => console.log(`clicked at ${count}`);
  return handleClick;
}
const firstRender = render(0);
const secondRender = render(1);
firstRender();   // "clicked at 0": it closed over the FIRST call's count, which is forever 0
```

A handler created during render 1 keeps seeing render 1's values. That is a
**stale closure**, and it is why this React code only adds 1:

```jsx
setCount(count + 1);
setCount(count + 1);   // `count` is still this render's value: 0 + 1 again
```

The fix is the **functional update**: pass a function, and React calls it with
the *latest* value: `setCount((c) => c + 1)`. Hold that thought: our store in
Lab 2 does the same thing internally.

**Memoize** is a higher-order function that returns a function with a private
cache:

```js
export function memoize(fn) {
  const cache = new Map();
  return (arg) => {
    if (cache.has(arg)) {
      return cache.get(arg);
    }
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}
```

**Debounce** returns a function that keeps pushing back one private timer:

```js
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
```

Every call to the returned function **shares one `timer`**, because they all
closed over the same variable. A new keystroke clears the pending search and
schedules a fresh one. Only the last keystroke's search survives.

### Steps

1. **`src/lib/fn.js` — `TODO(lab-3.1)`.** Replace the body of `makeCounter`
   with the version in the Concept above: `let count = start;` and the
   returned `{ increment, reset, value }`.

2. **`src/lib/fn.js` — `TODO(lab-3.2)`.** Replace `return fn;` in `memoize`
   with the `cache` version above. `main.js` already uses it:

   ```js
   const findProduct = memoize((id) => products.find((product) => product.id === id));
   ```

   The first lookup of an id scans the array; every later one is a Map hit.

3. **`src/lib/fn.js` — `TODO(lab-3.3)`.** Replace `return fn;` in `debounce`
   with the `timer` version above.

4. **`src/main.js` — `TODO(lab-3.4)`.** Replace the Session 2 search listener
   (and the TODO comment above it) with a debounced search and the two counters.
   The `keystrokes` and `searches` counters are already declared just above;
   keep them:

   ```js
   // debounce: wait until typing pauses for 250 ms, then search once with the latest text.
   const runSearch = debounce((query) => {
     state.query = query;
     searches.increment();
     renderAll();
   }, 250);

   els.search.addEventListener("input", (event) => {
     keystrokes.increment();
     runSearch(event.target.value);
     renderMeter();
   });
   ```

   Two counters, two independent `count` variables: the factory at work.

### Verify

Type "essence" quickly. The meter reads **7 keystrokes · 1 searches run**, and
the grid updates once, a quarter-second after you stop. Type slowly, one letter
per second, and the two numbers climb together.

Then, in the DevTools console (the dev server serves your source files, so you
can import them):

```js
const { makeCounter, memoize, debounce } = await import("/src/lib/fn.js");
const c = makeCounter(); c.increment(); c.increment(); c.value();   // 2
c.count;                                                            // undefined: private
let calls = 0;
const square = memoize((n) => { calls += 1; return n * n; });
square(4); square(4); square(4); calls;                             // 1
const log = debounce((q) => console.log("search", q), 500);
log("a"); log("ab"); log("abc");                                    // one line after 0.5 s: search abc
```

### Watch out

**`setTimeout(fn(...args), ms)`.** That *calls* `fn` right now and schedules
its return value (`undefined`). Pass a function: `() => fn(...args)`. React's
version of the same mistake is `onClick={save()}`.

**Creating the debounced function inside the listener.**
`input → debounce(search, 250)("...")` makes a **new** closure, with a new
`timer`, on every keystroke, so nothing is ever cancelled. Create it once,
outside, and call it many times.

**Memoize by reference.** `memoize` uses a `Map`, and Maps compare objects by
reference. `memoize(computeStats)` would miss every time, because
`filterProducts` returns a new array on every render. Memoizing works best on
primitive keys or on objects you know are reused. Lab 4 explains why.

### Challenge (2 min)

Write `once(fn)`: the returned function runs `fn` the first time and returns
that same result forever after. (Hint: two closure variables, `called` and
`result`.)

### In the real world

**React.** Every hook is a closure. A custom hook is `makeCounter` with React
holding the variable for you:

```jsx
function useCounter(start = 0) {
  const [count, setCount] = useState(start);
  const increment = () => setCount((c) => c + 1);   // functional update: never stale
  return { count, increment };
}
```

`useMemo(() => expensive(a), [a])` is a memoize with a one-entry cache, keyed
by the dependency array (compared with `Object.is`). The stale closure you saw
above is the number-one hooks bug: an effect with `[]` dependencies that reads
state inside a `setInterval` sees the first render's value forever. And
debouncing in React needs one stable debounced function across renders
(`useMemo` or `useRef`), for the same "create it once" reason as the Watch out.

**Angular.** Search boxes use RxJS: `this.search.valueChanges.pipe(debounceTime(250))`.
`debounceTime` is an operator built on this exact closure-over-a-timer idea.
Pure pipes are memoized: Angular re-runs `transform()` only when an input
changes by reference, which is `memoize` built into the template language.

---

## Lab 2 — A closure-based store with immutable updates (25 min)

### Problem

Click **Add to cart**. Nothing happens. The cart needs state that several
parts of the page read (the panel, the badge, the buttons on each card) and
that changes in five ways (add, increment, decrement, remove, clear). If every
part of the page is allowed to poke at a shared array, you will never know who
changed what. You want the state **private**, the changes **named**, and
anyone who cares **told** when it changes.

### Concept

**A store is a closure with a subscribe.** Private state in a closure
variable, a function to read it (`getState`), functions to change it (the
actions), and a list of listeners to call after each change (`subscribe`).
`subscribe` returns an **unsubscribe** function, which is itself a closure
over the listener it should remove.

**Pure functions versus side effects.** A **pure** function returns a value
computed only from its arguments, and changes nothing outside itself. Same
input, same output, every time:

```js
const add = (a, b) => a + b;                    // pure
let total = 0;
const addToTotal = (n) => { total += n; };      // side effect: changes outside state
```

Side effects aren't bad: updating the DOM, calling listeners and saving to a
server are the whole point of an app. The trick is to **keep them at the
edges**. So `lib/cart.js` is pure (lines in, new lines out), and the store is
the one small place with side effects: it swaps its private variable and tells
the listeners.

**Immutable updates.** "Change the cart" never means "edit the array". It
means "make a new array that differs in one place":

| You want to | Mutating (don't) | Immutable (do) |
|---|---|---|
| add an item | `lines.push(line)` | `[...lines, line]` |
| change one item | `line.qty += 1` | `lines.map((l) => (l.id === id ? { ...l, qty } : l))` |
| remove an item | `lines.splice(i, 1)` | `lines.filter((l) => l.id !== id)` |
| empty it | `lines.length = 0` | `[]` |

Notice what `map` does in the second row: the changed line becomes a **new
object**, and every other line is the **same object** as before. Only the path
that changed is new. Lab 4 shows why that matters.

**`reduce` folds a list into one value.** `lines.reduce((total, line) => total + line.qty, 0)`
starts at `0` and adds each line's quantity. It's the tool for totals.

### Steps

1. **`src/lib/cart.js` — `TODO(lab-3.5)`.** Replace the TODO comment and the
   three stubs below it:

   ```js
   /** Adds a product, or bumps its quantity if it is already in the cart. */
   export function addLine(lines, product) {
     if (product.stock === 0) {
       return lines;
     }
     const existing = lines.find((line) => line.id === product.id);
     if (existing) {
       return changeQty(lines, product.id, +1);
     }
     const line = {
       id: product.id,
       title: product.title,
       thumbnail: product.thumbnail,
       price: discountedPrice(product.price, product.discountPercentage),
       stock: product.stock,
       qty: 1,
     };
     return [...lines, line];
   }

   /** Changes one line's quantity by `delta`, capped at stock. Reaching 0 removes the line. */
   export function changeQty(lines, id, delta) {
     const line = lines.find((l) => l.id === id);
     if (!line) {
       return lines;
     }
     const qty = Math.min(line.qty + delta, line.stock);
     if (qty === line.qty) {
       return lines; // nothing changed (already at the stock limit): return the SAME array
     }
     if (qty <= 0) {
       return removeLine(lines, id);
     }
     // A new array, a new object for the changed line, and the untouched lines reused as they are.
     return lines.map((l) => (l.id === id ? { ...l, qty } : l));
   }

   /** Removes a line. `filter` always returns a new array. */
   export function removeLine(lines, id) {
     return lines.filter((line) => line.id !== id);
   }
   ```

   Read the "nothing changed" branch twice. When an update changes nothing,
   return the **same** array. "Same reference" will mean "no change" all day.

2. **`src/lib/cart.js` — `TODO(lab-3.6)`.** The two totals:

   ```js
   export function cartCount(lines) {
     return lines.reduce((total, line) => total + line.qty, 0);
   }

   export function cartSubtotal(lines) {
     return lines.reduce((total, line) => total + line.price * line.qty, 0);
   }
   ```

3. **`src/store/createCartStore.js` — `TODO(lab-3.7)` and `TODO(lab-3.8)`.**
   Replace the whole function body:

   ```js
   export function createCartStore(initialLines = []) {
     let lines = freezeLines(initialLines);
     const listeners = new Set();

     // The ONE place state changes. Every action goes through here.
     function setLines(next) {
       if (next === lines) {
         return; // same reference = nothing changed, so nobody needs to hear about it
       }
       const prev = lines;
       lines = freezeLines(next);
       listeners.forEach((listener) => listener(lines, prev));
     }

     return {
       getState: () => lines,
       subscribe: (listener) => {
         listeners.add(listener);
         return () => listeners.delete(listener);
       },
       add: (product) => setLines(addLine(lines, product)),
       increment: (id) => setLines(changeQty(lines, id, +1)),
       decrement: (id) => setLines(changeQty(lines, id, -1)),
       remove: (id) => setLines(removeLine(lines, id)),
       clear: () => setLines(lines.length === 0 ? lines : []),
     };
   }
   ```

   (`freezeLines` is a no-op stub until Lab 4. Call it now anyway.)

   Look at `add`: it reads `lines` **when it is called**, not when the store
   was created. Closures see the live variable, so every action works on the
   current cart. That is the "functional update" from Lab 1, built in:
   `changeQty(lines, …)` always receives the latest lines, never a stale copy.

4. **`src/ui/cart.js` — `TODO(lab-3.9)`.** Replace the TODO comment and the
   placeholder line under it (the end of `renderCart`) with the real panel:

   ```js
   const items = lines.map((line) => {
     const minus = el("button", { type: "button", className: "qty-btn", textContent: "−" });
     minus.setAttribute("aria-label", `One fewer ${line.title}`);
     minus.addEventListener("click", () => onDecrement(line.id));

     const plus = el("button", { type: "button", className: "qty-btn", textContent: "+", disabled: line.qty >= line.stock });
     plus.setAttribute("aria-label", `One more ${line.title}`);
     plus.addEventListener("click", () => onIncrement(line.id));

     const remove = el("button", { type: "button", className: "remove-btn", textContent: "×" });
     remove.setAttribute("aria-label", `Remove ${line.title}`);
     remove.addEventListener("click", () => onRemove(line.id));

     return el(
       "li",
       { className: "cart-line" },
       el("img", { src: line.thumbnail, alt: "", loading: "lazy" }),
       el(
         "div",
         { className: "cart-line-main" },
         el("span", { className: "cart-line-title" }, line.title),
         el("span", { className: "cart-line-price" }, `${formatPrice(line.price)} × ${line.qty} = ${formatPrice(line.price * line.qty)}`),
         el("div", { className: "qty" }, minus, el("output", {}, String(line.qty)), plus),
       ),
       remove,
     );
   });

   const clear = el("button", { type: "button", className: "btn clear-btn", textContent: "Clear cart" });
   clear.addEventListener("click", () => onClear());

   const footer = el(
     "div",
     { className: "cart-footer" },
     el("span", {}, "Subtotal"),
     el("strong", { className: "cart-subtotal" }, formatPrice(cartSubtotal(lines))),
     clear,
   );

   container.replaceChildren(el("ul", { className: "cart-lines" }, ...items), footer);
   ```

   Every button calls a callback it was given, as a plain function call:
   `onDecrement(line.id)`. Remember that detail for Lab 3.

### Verify

With the panel on **createCartStore**: add the mascara twice and the sofa once.
The badge reads **3**, the mascara line shows `× 2`, the card button says
"Add another · 2 in cart", and the subtotal is the sum. − down to zero removes
the line. **Red Nail Polish** has 3 in stock: its + disables at 3, and clicking
Add to cart a fourth time changes nothing. Clear empties the cart.

In the console:

```js
const { createCartStore } = await import("/src/store/createCartStore.js");
const store = createCartStore();
const stop = store.subscribe((next, prev) => console.log(prev.length, "→", next.length));
store.add({ id: 99, title: "Test", thumbnail: "", price: 10, discountPercentage: 0, stock: 5 });   // 0 → 1
stop();
store.clear();          // silent: we unsubscribed
store.lines;            // undefined: the state is private
```

### Watch out

**Mutating inside a "pure" function.** `existing.qty += 1; return lines;`
looks like it works (the numbers change) but returns the same array, so
`setLines` sees `next === lines` and skips the update. The screen doesn't
change. The symptom of mutation is "my update didn't show up".

**`return () => listeners.delete(listener)` versus `listeners.delete(listener)`.**
`subscribe` must return a *function*. Returning the result of `delete` (a
boolean) means the caller's `unsubscribe()` throws "is not a function".

**Forgetting `...l`.** `{ qty }` instead of `{ ...l, qty }` gives you a line
that has a quantity and nothing else. The panel shows "undefined".

### Challenge (2 min)

Add a `setQty(id, qty)` action to the store, using a new pure function in
`lib/cart.js`. It should return the same array when `qty` equals the current
quantity.

### In the real world

**React.** Your store's shape is exactly what React's
`useSyncExternalStore(subscribe, getSnapshot)` expects. This is a working hook:

```jsx
const cart = createCartStore();

function useCart() {
  const lines = useSyncExternalStore(cart.subscribe, cart.getState);
  return { lines, add: cart.add, remove: cart.remove };
}
```

React calls `subscribe` with its own listener, calls `getState` after each
notification, and re-renders when the returned reference changes. That only
works because every change produces a new array. Zustand, one of the most
popular React state libraries, is built on this same closure-plus-listeners
idea. And `useReducer` asks you for exactly what `lib/cart.js` is: a pure
function from (state, action) to new state.

**Angular.** The idiomatic Angular store is a service holding a
`BehaviorSubject`, which is your `lines` variable plus your listener set in
one object:

```ts
@Injectable({ providedIn: "root" })
export class CartStore {
  readonly #lines = new BehaviorSubject<CartLine[]>([]);
  readonly lines$ = this.#lines.asObservable();                 // subscribe()
  add(product: Product) {
    this.#lines.next(addLine(this.#lines.value, product));      // setLines(), same pure helper
  }
}
```

(That snippet is TypeScript; Session 5 covers the types.) Same idea, same
immutable update, different packaging. With Angular signals it is
`lines = signal<CartLine[]>([])` and `this.lines.update((l) => addLine(l, product))`.

---

## Lab 3 — `this` and classes: CartService, the callback bug and the fixes (25 min)

### Problem

Angular teams write services as classes, so let's build the same cart as a
class. Switch the panel to **CartService** and click **Add to cart**. Open the
console:

```
Uncaught TypeError: Cannot read properties of undefined (reading '#lines')
```

The method is right there in the class. `this.#lines` is right there in the
method. Why is `this` undefined?

### Concept

**Classes are syntax over prototypes.** A class is a constructor function plus
an object of shared methods:

```js
class Counter {
  #count = 0;                 // private field: only code inside the class body can touch it
  constructor(start) {
    this.#count = start;      // runs once per `new Counter(…)`
  }
  get value() {               // a getter: read as counter.value, no parentheses
    return this.#count;
  }
  increment() {               // stored ONCE, on Counter.prototype, shared by every instance
    this.#count += 1;
  }
}

typeof Counter;                                    // "function"
const c = new Counter(5);
Object.getPrototypeOf(c) === Counter.prototype;    // true: that's where increment lives
```

Because methods live on the prototype, `increment` doesn't belong to any one
instance. It finds "its" instance through `this`, **at call time**. `#count`
is enforced by the language: `c.#count` outside the class is a syntax error,
not just a convention like `_count`.

**The four rules for `this`.** For a regular function (or method), `this` is
decided by **how it is called**, not where it was written:

| Rule | Call looks like | `this` is |
|---|---|---|
| 1. `new` binding | `new CartService()` | the brand-new object |
| 2. Explicit | `fn.call(obj, a)`, `fn.apply(obj, [a])`, `fn.bind(obj)` | `obj` |
| 3. Implicit | `cart.add(p)` | the object before the dot: `cart` |
| 4. Default | `add(p)`, plain call | `undefined` in strict code (modules and classes are always strict). In old sloppy scripts, the global object. |

Now the bug is obvious. `main.js` passes `onAdd: cart.add`. That hands over
**the function**, not "add on this cart". The dot is gone. The card later
calls `onAdd(product)`, a plain call, so rule 4: `this` is `undefined`, and
`undefined.#lines` throws.

```js
const cart = new CartService();
cart.add(p);            // implicit: this === cart ✔
const add = cart.add;   // just the function, detached from cart
add(p);                 // default: this === undefined ✘
```

`addEventListener("click", cart.clear)` fails too, differently: the browser
calls listeners with `this` set to the element, so `this.#lines` reads a
private field from a `<button>` and throws "Cannot read private member".

**Arrow functions don't have their own `this`.** They use the `this` of the
code around them, exactly like any other variable in the scope chain (lexical
`this`). `call`, `apply` and `bind` can't change it, and you can't `new` an
arrow.

> **Misconception: "arrow functions are just shorter functions."** They
> behave differently: no own `this`, no `arguments`, no `prototype`, can't be
> called with `new`. That makes them perfect for callbacks inside methods,
> where you want the method's `this`, and wrong as object methods that need
> `this` to be the object:
>
> ```js
> const product = { title: "Lamp", describe: () => this.title };
> product.describe();   // TypeError in a module: the arrow's `this` is the module's, undefined
> ```

**Three fixes for a detached method:**

```js
// 1. Bind in the constructor: each instance gets its own copy with `this` fixed.
constructor() {
  this.add = this.add.bind(this);
}

// 2. An arrow class field: a per-instance arrow, whose `this` is the instance.
add = (product) => {
  this.#set(addLine(this.#lines, product));
};

// 3. An arrow wrapper at the call site: the call keeps its dot.
onAdd: (product) => cart.add(product),
```

Fixes 1 and 2 fix the class for every caller. Fix 3 fixes one call site.
Our closure store never had this problem because it has no `this` at all.

### Steps

1. **`src/store/CartService.js` — `TODO(lab-3.10)` (two places).** Replace
   `subscribe` and the `#set` private method:

   ```js
   subscribe(listener) {
     this.#listeners.add(listener);
     // An arrow function has no `this` of its own: it uses subscribe's `this`, the service.
     return () => this.#listeners.delete(listener);
   }
   ```

   ```js
   #set(next) {
     if (next === this.#lines) {
       return;
     }
     const prev = this.#lines;
     this.#lines = freezeLines(next);
     this.#listeners.forEach((listener) => listener(this.#lines, prev));
   }
   ```

   Both arrows here *rely* on lexical `this`. A regular `function (listener) {…}`
   in `forEach` would get its own `this` (undefined) and break.

2. **`src/store/CartService.js` — `TODO(lab-3.11)`.** Replace the five method
   stubs:

   ```js
   add(product) {
     const next = addLine(this.#lines, product); // pure: work out the new lines
     this.#set(next); // side effect: store them and notify
   }

   increment(id) {
     const next = changeQty(this.#lines, id, +1);
     this.#set(next);
   }

   decrement(id) {
     const next = changeQty(this.#lines, id, -1);
     this.#set(next);
   }

   remove(id) {
     const next = removeLine(this.#lines, id);
     this.#set(next);
   }

   clear() {
     const next = this.#lines.length === 0 ? this.#lines : [];
     this.#set(next);
   }
   ```

   The same pure helpers as the closure store. Only the packaging differs.

3. **Reproduce the bug.** Save, switch to **CartService**, click Add to cart.
   Still `Cannot read properties of undefined (reading '#lines')`. The methods
   are correct; the *call* is the problem. Try fix 3 to prove it: in `main.js`,
   temporarily change `onAdd: cart.add` to `onAdd: (product) => cart.add(product)`.
   Adding works. Undo that change: we want the class to be safe for every caller.

4. **`src/store/CartService.js` — `TODO(lab-3.12)`.** In the constructor,
   under `this.#lines = …`:

   ```js
   // Explicit binding: each instance gets its own copies with `this` fixed to it.
   this.add = this.add.bind(this);
   this.increment = this.increment.bind(this);
   this.decrement = this.decrement.bind(this);
   this.remove = this.remove.bind(this);
   this.clear = this.clear.bind(this);
   ```

### Verify

On **CartService**: add, −, +, remove and clear all work, with no console
errors. Add two items, switch to **createCartStore**, then back: the cart
comes with you, because `switchMode` hands the current lines to the new store.
The log reads "switched to CartService (Angular service style), same 2-line
array handed over".

In the console:

```js
const { CartService } = await import("/src/store/CartService.js");
Object.getOwnPropertyNames(CartService.prototype);  // ["constructor", "getState", "subscribe", "add", …]
const cart = new CartService();
Object.keys(cart);                                   // ["add", "increment", …]: the bound copies
const { getState } = cart;
getState();                                          // TypeError: we did not bind getState
```

That last line is the bug, on purpose: only the five actions are bound, because
only they are handed out as callbacks. `#set` and `#listeners` don't appear
anywhere: private members aren't properties.

### Watch out

**Binding in the wrong place.** `onAdd: cart.add.bind(cart)` inside
`renderAll()` works, but creates a new function on every render. In React
that new identity defeats `memo` and `useCallback` (see Lab 4). Bind once,
in the constructor.

**An arrow method in a plain object literal.** `{ add: () => this.lines }`
does not give you the object as `this`. Use method syntax `add() {}` in
objects; use arrow *fields* only in classes.

**Private fields are per class.** `cart.add.call(otherCart)` works only if
`otherCart` is also a `CartService`. From any other object you get "Cannot read
private member #lines from an object whose class did not declare it".

### Challenge (2 min)

Replace the five `bind` lines with arrow class fields (fix 2) and check that
`Object.getOwnPropertyNames(CartService.prototype)` no longer lists them. Then
add a `get count()` getter that returns `cartCount(this.#lines)`.

### In the real world

**Angular.** Services are classes, created by Angular's dependency injection
with `new` (rule 1) and handed to components through the constructor or
`inject()`. In templates, `(click)="cart.add(product)"` keeps the dot, so
`this` is fine. The bug appears the moment you pass a method **reference**:
`.subscribe(this.handleLines)`, `setTimeout(this.save, 500)`,
`items.map(this.format)`, or a callback `@Input()`. Angular code uses arrow
wrappers or arrow fields for exactly those:

```ts
@Component({ /* … */ })
export class CartPanelComponent {
  private cart = inject(CartService);
  ngOnInit() {
    this.cart.lines$.subscribe((lines) => this.render(lines));   // arrow keeps `this`
  }
}
```

**React.** Function components have no `this`, which is one reason React moved
to them. You still meet it in class components
(`this.handleClick = this.handleClick.bind(this)` in the constructor was the
standard line for years) and whenever a React component uses a class-based
library object: `<CartPanel onAdd={cart.add} />` with a `CartService` breaks
exactly as it did here, and `useSyncExternalStore(service.subscribe, service.getState)`
needs `subscribe` and `getState` bound too.

---

## Lab 4 — Immutability and reference equality (20 min)

### Problem

Each cart change calls `renderAll()`, which rebuilds the whole grid and panel.
Fine for sixteen products, wasteful for a thousand. A framework wants to ask
"did this piece of state change?" and skip everything that didn't. Comparing
two carts field by field, line by line, is slow. There is a cheaper question:
**is it the same object?**

### Concept

**`===` on objects compares references, not contents.**

```js
[1, 2] === [1, 2];     // false: two different arrays that happen to look alike
const a = { qty: 1 };
const b = a;
b.qty = 2;
a.qty;                 // 2: a and b are the SAME object
a === b;               // true
```

A variable holding an object holds a *reference* to it, like an address. That
is why mutation is dangerous: everyone holding the address sees the change,
and nobody was told.

**Immutability turns "did it change?" into one `===`.** If you never edit
state, and always build a new object when something changes, then:

- `prev === next` → **nothing changed**. Skip the work. (Your `setLines`
  already does this.)
- `prev !== next` → **something changed**. Re-render.

And because `map` reuses the untouched lines, you can go deeper cheaply:
`prev[0] === next[0]` tells you whether the first line needs re-rendering.
Only the changed path gets new references.

> **Misconception: "`const` objects can't change."** `const` means the
> *variable* can't be reassigned. The object it points to is as mutable as ever:
>
> ```js
> const cart = { lines: [] };
> cart.lines.push("mug");   // fine
> cart = {};                // TypeError: Assignment to constant variable.
> ```

**`Object.freeze` makes an object read-only, shallowly.** In strict code
(every ES module), writing to a frozen object throws a `TypeError`. But it only
freezes one level:

```js
const frozen = Object.freeze({ tags: ["a"] });
frozen.tags.push("b");   // works! the array inside was not frozen
frozen.x = 1;            // TypeError: Cannot add property x, object is not extensible
```

That is why `freezeLines` freezes each line **and** the array.

### Steps

1. **`src/main.js` — `TODO(lab-3.13)`.** Replace `onCartChange` with the
   reference check:

   ```js
   function onCartChange(nextLines, prevLines) {
     // Immutable updates mean "did anything change?" is one === check, not a deep comparison.
     changeNumber += 1;
     const same = prevLines === nextLines;
     const reused = nextLines.filter((line) => prevLines.includes(line)).length;
     els.refSummary.innerHTML = `prevLines === nextLines → <code class="${same}">${same}</code>`;
     logRef(`#${changeNumber}  prev === next → ${same}  ·  ${reused} of ${nextLines.length} line objects reused`);
     renderAll();
   }
   ```

   `prevLines.includes(line)` uses `===` for each element, so it counts the
   line objects that survived unchanged.

2. **`src/main.js` — `TODO(lab-3.14)`.** Wire the "Mutate in place" button to
   do the wrong thing on purpose:

   ```js
   els.mutate.addEventListener("click", () => {
     const lines = cart.getState();
     if (lines.length === 0) {
       logRef("mutate: add something to the cart first");
       return;
     }
     try {
       lines[0].qty += 1;
       logRef(`mutate: lines[0].qty is now ${lines[0].qty}, but no new reference, no listener ran, the screen is stale`);
     } catch (error) {
       logRef(`mutate blocked → ${error.constructor.name}: ${error.message}`);
     }
   });
   ```

   Add an item, click **Mutate in place** twice. The log says `qty` is now 3,
   but the panel still shows 1. Nobody called `setLines`, so nobody re-rendered.
   Click + and the panel jumps to 4. **That is the mutation bug in every
   framework:** state changed, the UI didn't.

3. **`src/lib/cart.js` — `TODO(lab-3.15)`.** Make the rules enforceable:

   ```js
   export function freezeLines(lines) {
     lines.forEach((line) => Object.freeze(line));
     return Object.freeze(lines);
   }
   ```

   Both stores already call it on every update. Reload, add an item, click
   **Mutate in place**: the log now reads
   `mutate blocked → TypeError: Cannot assign to read only property 'qty' of object '#<Object>'`.

### Verify

Every change logs `prev === next → false`, in **both** modes. Add three
different items, then + the middle one: "2 of 3 line objects reused". Remove
one: "2 of 2 reused". Put all 3 Red Nail Polish in the cart, then click
"Add another" on its card: **no log line at all**, because `changeQty` returned the same array and `setLines`
stopped there. Mutating is blocked with a `TypeError`.

In the console:

```js
const { addLine } = await import("/src/lib/cart.js");
const one = addLine([], { id: 1, title: "A", thumbnail: "", price: 5, discountPercentage: 0, stock: 9 });
const two = addLine(one, { id: 2, title: "B", thumbnail: "", price: 7, discountPercentage: 0, stock: 9 });
one === two;          // false: a new array
one[0] === two[0];    // true: line A was reused, not copied
one.length;           // 1: the old array is untouched
```

### Watch out

**`sort()` and `reverse()` mutate.** `lines.sort(…)` reorders the array in
place and returns the same reference. Copy first (`[...lines].sort(…)`, as
`sortProducts` does) or use the newer `toSorted()`.

**Freezing isn't a deep copy, and a spread isn't deep either.** `{ ...cart }`
copies the top level; nested arrays are shared. That is usually what you want
(structural sharing), as long as you replace nested things instead of editing
them.

**Freezing costs something.** Immer (which Redux Toolkit uses) freezes state for
you; some teams freeze only in development. Here it is on everywhere, for teaching.

### Challenge (2 min)

`memoize(computeStats)` misses on every render. Why? Now memoize a function
keyed by the cart `lines` array instead, and log a hit when you press + at the
stock limit.

### In the real world

**React** decides whether to re-render by comparing references with
`Object.is`. `setLines(lines)` with the same (mutated) array: React bails out,
and your change never appears. `setLines([...lines, line])`: new reference,
re-render. `React.memo`, `useMemo` and `useCallback` all compare props and
dependencies by reference, so `{}` or `() => {}` created during render is "new"
every time:

```jsx
// React: new reference → re-render; same reference → skip
setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)));
const onAdd = useCallback((p) => cart.add(p), []);   // same function identity every render
```

**Angular** with `ChangeDetectionStrategy.OnPush` checks a component only when
an `@Input()` receives a **new reference**, an event handler in the component
runs, an `async` pipe emits, a signal it reads changes, or you call
`markForCheck()`. Push into an input array and an OnPush child never
re-renders. Signals use the same rule: `signal.set(sameArray)` is ignored,
because the default equality check is `Object.is`.

```ts
// Angular: the child only updates when `lines` is a new array
@Component({ selector: "cart-panel", changeDetection: ChangeDetectionStrategy.OnPush, /* … */ })
export class CartPanelComponent {
  @Input() lines: CartLine[] = [];
}
// parent: this.lines = [...this.lines, line];   ✔     this.lines.push(line);   ✘ (no update)
```

---

## Wrap-up — what you can now do

- [x] Explain a closure as "a function plus the variables it can see", and prove it captures bindings, not values
- [x] Write `makeCounter`, `memoize` and `debounce` from scratch, and say where each lives in React and Angular
- [x] Explain a stale closure and fix it with a functional update
- [x] Build a store: private state, named actions, `subscribe` returning `unsubscribe`
- [x] Name the four `this` rules, and fix a detached method three ways
- [x] Read a class as a constructor plus a prototype, with `#private` fields enforced by the language
- [x] Update state immutably with spread, `map` and `filter`, and explain why `prev === next` is the whole trick
- [x] Tell a pure function from a side effect, and keep side effects at the edges

## Next session

**Session 4 — Async JavaScript & the Event Loop.** The sixteen local products
become the live DummyJSON API. You'll add loading, error and empty states,
cancel stale searches with `AbortController` (your debounce stops the extra
requests; cancellation stops the out-of-order ones), retry failed requests,
and watch the event loop decide what runs when.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Cannot read properties of undefined (reading '#lines')` | A `CartService` method was called without its object: `onAdd(product)` after `onAdd: cart.add`. Bind in the constructor (lab 3.12). |
| `Cannot read private member #lines from an object whose class did not declare it` | The method was called with the wrong `this`, usually a DOM element (`addEventListener("click", cart.clear)`). Wrap it: `() => cart.clear()`, or bind. |
| Nothing happens when I click Add to cart | Still on a stub: check labs 3.5, 3.7 and 3.8. Or an update function mutates and returns the same array, so `setLines` skips it. |
| The panel shows old numbers until I click something else | Mutation: state changed without a new reference or a notification. Use spread, `map` or `filter`. |
| `unsubscribe is not a function` | `subscribe` returned something other than a function. Return `() => listeners.delete(listener)`. |
| Search still runs on every keystroke | You call `debounce(…)` inside the listener. Create the debounced function once, outside. |
| Search never runs | `setTimeout(fn(...args), ms)` called `fn` immediately; pass `() => fn(...args)`. |
| Lines show `undefined` for title or price | `{ qty }` instead of `{ ...l, qty }` dropped the other fields. |
| `TypeError: Cannot assign to read only property 'qty'` in your own code | Working as intended: the lines are frozen. Build a new line instead of editing this one. |
| The production build's error says `#e` instead of `#lines` | The minifier renames private fields. Use `npm run dev` to see real names. |
