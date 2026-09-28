# Session 4 — Async JavaScript & the Event Loop

**Session guide** · ~120 minutes · one thread, many things happening at once: you learn exactly how JavaScript schedules your code, then build a live catalogue that loads, fails, retries and cancels like a production app

---

## Where you are starting from

The starter is **Session 3's app, one step further**: the same product cards, the same wishlist hearts, and the same
closure-based cart store (`createCartStore`) with its cart panel. One thing has moved: **the products no longer live in
a file.** `src/data/products.js` is gone, and the app now asks `https://dummyjson.com` for them through a small network
layer in `src/api/`.

That network layer is **stubbed**. `fetchJson()` never touches the network: it pretends every request succeeded and
hands back an empty array. So the page builds and renders, the Network log shows requests "succeeding" in 0 ms with
status `stub`, and the grid says *No products match*. Everything around it is written for you: the render functions,
the cart, the log panels, the toolbar toggles and the state object that drives the grid.

**16 markers**, `TODO(lab-4.x)` style, show you exactly where today's code goes. Search for `TODO(lab-` in your editor.

## What you ship today

**ShopScope Lite — live catalogue.** On load, products and categories arrive **in parallel** from DummyJSON while
skeleton cards shimmer. A search box searches **as you type** (debounced), and every new search **cancels** the one
before it. A category menu loads that category from the server. A **Slow network** switch adds a random 300–1500 ms
delay to every request, so you can watch the race condition happen, and a **Break the API** switch makes every request
answer `503`, so you can watch **retry with exponential backoff** and then a friendly error with a Retry button. A dark
**Network log** records every request: `→` started, `✓` success with its time, `✕` aborted, `!` error. An **Event loop
order** panel runs a puzzle and prints the real order. And the cart from Session 3 still works.

By the end you will be able to answer, without hesitating:

- If JavaScript has one thread, how can a page wait for the network and still respond to clicks?
- What is the difference between the task queue and the microtask queue, and which one runs first?
- Why does `setTimeout(fn, 0)` not run "immediately"?
- What `await` actually pauses (and what it does not)
- Why `fetch` does **not** reject on a 404 or a 500, and what you must do about it
- When to use `Promise.all`, `allSettled`, `race` and `any`
- What a race condition between two searches looks like, and how `AbortController` ends it
- How an Observable differs from a Promise, and why Angular's `HttpClient` returns one

> **JavaScript never does two things at once. The browser does, and the event loop decides when your code gets to
> hear about it.** Everything today, from promises to React's `useEffect` cleanup to Angular's `switchMap`, is a way of
> working with that one fact.

---

## Before the session (10 minutes)

**Option A: in the browser (nothing to install).** Open the `starter/` folder of this session in StackBlitz, using the
link your trainer shares. Wait for the install to finish and the preview to show the header and the message *No
products match*. Bookmark the tab once its address changes to `stackblitz.com/edit/…`: that is your copy.

**Option B: locally.** You need Node.js 22 or newer (`node -v`).

```bash
cd sessions/04-async-javascript-event-loop/starter
npm install
npm run dev          # open http://localhost:5173
```

Then open these three URLs in browser tabs. Looking at raw JSON before you write code against it is a habit worth
forming:

- `https://dummyjson.com/products?limit=2&select=id,title,price`: a list. Note the **envelope**: `{ products, total, skip, limit }`.
- `https://dummyjson.com/products/category-list`: a plain **array of slugs**, `["beauty", "fragrances", …]`. No envelope.
- `https://dummyjson.com/products/9999`: a **404**. The body is still JSON: `{ "message": "Product with id '9999' not found" }`.

Keep the browser's developer tools open all session (**F12**, or **Cmd+Option+I** on a Mac): today you will use both
the **Console** and the **Network** tab.

---

## How this guide works

Every lab has the same shape:

| | |
|---|---|
| **Problem** | What actually hurts, concretely |
| **Concept** | The idea that fixes it: what, why and how |
| **Steps** | What to type, in order, with the file and the TODO named |
| **Verify** | The specific thing you should see |
| **Watch out** | The mistake you are most likely to make, and why |
| **Challenge** | Two minutes, optional, harder |
| **In the real world** | Where this exact idea lives in React and in Angular |

If you fall behind, `../solution/` has the finished code. Every code block in this guide matches it.

---

## Orientation — what is in the box (5 min)

```
starter/
├── index.html                ← header, toolbar, three toggles, grid, and three side panels
└── src/
    ├── main.js               ← the glue: state, refresh(), event wiring       (6 TODOs)
    ├── eventloop.js          ← the ordering puzzle; no DOM, so it runs in Node too  (2 TODOs)
    ├── api/
    │   ├── client.js         ← fetchJson, ApiError, delay, withRetry, the network event feed  (5 TODOs)
    │   └── products.js       ← getProducts, getCategories, searchProducts, getByCategory  (1 TODO)
    ├── lib/
    │   ├── observable.js     ← createObservable, fromEvent                   (2 TODOs)
    │   ├── catalog.js        ← filterProducts (Session 2) + two label helpers
    │   ├── cart.js           ← Session 3's pure cart rules, unchanged
    │   ├── fn.js             ← Session 3's debounce and memoize, unchanged
    │   └── format.js         ← formatPrice, discountedPrice, stockStatus, unchanged
    ├── store/createCartStore.js  ← Session 3's closure store, unchanged
    └── ui/
        ├── render.js         ← cards and grid (Session 3) + skeletons, message states, category options
        ├── cart.js           ← the cart panel, unchanged
        └── log.js            ← appends coloured lines to the two dark log panels
```

Four things to notice before you start:

**`main.js` holds one `state` object with a `status` field.** It is exactly one of `"loading"`, `"success"`, `"error"`
or `"empty"`, and `render()` is a `switch` over it, already written. One field instead of separate `isLoading` and
`hasError` booleans means impossible combinations ("loading *and* error") cannot happen. Session 5 turns this into a
TypeScript union type.

**Every request goes through `fetchJson()` in `api/client.js`.** That single doorway is what makes the Network log
possible: `fetchJson` publishes an event (`start`, `success`, `abort`, `error`) for every request, and `main.js`
subscribes with `onNetworkEvent(…)`. It is the same `subscribe` shape as the cart store.

**Every function in `api/products.js` takes `{ signal }`.** You will not need it until Lab 3, but it is threaded
through from the start, because cancellation is much easier to design in than to bolt on.

**The Session 3 class version of the cart (`CartService`) has been retired**, together with the chips, sort and stats.
The server now does the filtering. The closure store stays, unchanged.

---

## Lab 1 — The event loop: the ordering puzzle (20 min)

### Problem

Here is a question that separates people who *use* JavaScript from people who *understand* it. Eight `log` calls,
labelled A to H, written in this order:

```js
log("A · sync: script start");

setTimeout(() => {
  log("B · task: setTimeout 0");
  resolve();
}, 0);

async function load() {
  log("C · sync: inside the async function");
  await null;
  log("D · microtask: after await");
}
load();

Promise.resolve()
  .then(() => log("E · microtask: then #1"))
  .then(() => log("F · microtask: then #2"));

queueMicrotask(() => log("G · microtask: queueMicrotask"));

log("H · sync: script end");
```

In what order do they print? If your answer is "A to H", or you are not sure where B goes, this lab is for you. Every
bug in Labs 2 to 5 (a spinner that never stops, a stale search result, a "fetch that didn't fail") gets easier to see
once you can answer this.

### Concept

**JavaScript runs on one thread.** There is one **call stack**: the list of functions currently running. While a
function is on the stack, nothing else in your JavaScript can run. No other click handler, no timer callback, nothing.

**The browser, however, is not single-threaded.** Timers, network requests, reading files, and listening for clicks are
done by the browser itself, outside your JavaScript, through **Web APIs**. When you call `setTimeout` or `fetch`, you
hand the job to the browser and your function carries on immediately. When the job is done, the browser does not
interrupt you. It puts a callback in a **queue**, and the **event loop** runs it when the stack is empty.

There are **two** queues, and the difference between them is the whole puzzle:

| Queue | What goes in it | When it runs |
|---|---|---|
| **Task queue** (often called the macrotask queue) | `setTimeout` / `setInterval` callbacks, event handlers (click, input), the initial script | **One** task per turn of the loop |
| **Microtask queue** | `.then` / `.catch` / `.finally` callbacks, the code after an `await`, `queueMicrotask(fn)` | **All** of them, after every task, before anything else |

The loop, in pseudo-code:

```
forever:
  1. take ONE task from the task queue and run it to completion
  2. run EVERY microtask, including new ones queued while draining
  3. if it is time for a frame: run requestAnimationFrame callbacks, then style, layout, paint
```

Step 3 is **rendering**. The browser can only paint *between* tasks, and never while microtasks are still queued. That
is why a long loop freezes the page: the browser literally cannot paint until your code gives the thread back.

Now the puzzle, one rule at a time:

1. **Synchronous code runs first, to completion.** A. Then `setTimeout` hands a timer to the browser: its callback, B,
   will be a *task*, later. Then `load()` is called, and **an async function runs synchronously until its first
   `await`**, so C prints now. `await null` pauses `load` and queues "the rest of `load`" as microtask **D**.
   `Promise.resolve().then(…)` queues microtask **E** (F is not queued yet: it waits for E's promise). `queueMicrotask`
   queues **G**. Finally H. So far: **A C H**.
2. **The script (itself a task) is finished, so the microtask queue drains**, in the order jobs were queued: **D, E,
   G**. Running E resolves the promise that F was waiting on, so F is queued *now*, at the back, and it still runs in
   this same drain: **F**.
3. **Only now, with the microtask queue empty, can the browser render and take the next task: B.**

Answer: **A C H D E G F B**. This order is produced by running the code, not guessed: you will run it in the app and in
Node.

> **Misconception: "`setTimeout(fn, 0)` runs immediately."** The `0` means *no earlier than* 0 ms. The callback becomes
> a task, and tasks wait for the current code **and every microtask** to finish. Block the thread for 200 ms and a
> `setTimeout(fn, 0)` callback runs after 200 ms. (Browsers also clamp deeply nested timers to at least 4 ms.)

> **Misconception: "async functions run on another thread."** They do not. `async`/`await` changes *when* your code
> runs, never *where*. Every line of the puzzle ran on the same single thread. The only way to get a second JavaScript
> thread in a browser is a Web Worker.

### Steps

**A. `src/eventloop.js` — `TODO(lab-1.1)`.** Delete the three placeholder `log` calls and the `setTimeout(resolve, 0)`
line, and write the puzzle inside the `new Promise((resolve) => { … })`:

```js
    log("A · sync: script start");

    setTimeout(() => {
      log("B · task: setTimeout 0");
      resolve();
    }, 0);

    async function load() {
      log("C · sync: inside the async function");
      await null;
      log("D · microtask: after await");
    }
    load();

    Promise.resolve()
      .then(() => log("E · microtask: then #1"))
      .then(() => log("F · microtask: then #2"));

    queueMicrotask(() => log("G · microtask: queueMicrotask"));

    log("H · sync: script end");
```

`resolve()` inside the timer callback is what lets `main.js` `await` the puzzle and print a summary after the last line.

**B. `src/eventloop.js` — `TODO(lab-1.2)`, part one. Do not run anything yet.** Write your honest prediction as eight
letters:

```js
export const MY_PREDICTION = ["A", "C", "H", "D", "E", "G", "F", "B"];
```

(That is the correct answer. Type *your* guess first, so the app can tell you whether you were right.)

**C. Run it.** Click **Run puzzle** in the *Event loop order* panel. White lines are synchronous, blue are microtasks,
yellow is the task. The panel ends with *Actual order* and your prediction, marked ✓ or ✕.

**D. Run the same file in Node**, from the `starter/` folder:

```bash
node -e "import('./src/eventloop.js').then((m) => m.runEventLoopPuzzle(console.log))"
```

Same order. The event loop is not a browser feature. It is how JavaScript runtimes work.

**E. `TODO(lab-1.2)`, part two.** Replace `EXPLANATION` with the rules, one line each:

```js
export const EXPLANATION = [
  "1. Synchronous code runs to completion first: A, C, H.",
  "   An async function runs synchronously until its first await, so C is sync.",
  "2. Then the microtask queue drains completely, in the order jobs were queued:",
  "   D (queued by await), E (then #1), G (queueMicrotask).",
  "   Running E queues F, and F runs in the same drain, before any task.",
  "3. Only when the microtask queue is empty may the browser render,",
  "   and then take the next task: B, the setTimeout callback.",
];
```

Then remove the TODO comment above `MY_PREDICTION`.

### Verify

The panel prints `A C H D E G F B`, then `Your prediction: … ✓` (or ✕ with your guess: no shame, most people put B
before D), then the explanation. Node prints the same eight lines.

### Watch out

**Microtasks can starve the page.** Because the loop drains *every* microtask, including new ones, a microtask that
keeps queueing another microtask never lets the browser paint or handle a click:

```js
function forever() { queueMicrotask(forever); }   // don't run this: the tab freezes
```

The same code with `setTimeout(forever, 0)` would not freeze the page, because each turn is a separate task, and the
browser can render between tasks.

### Challenge (2 min)

Add `setTimeout(() => log("I · task: timeout inside E"), 0)` *inside* the E callback. Where does I print, before or
after B? (After: it is queued later than B, and tasks run in order.)

### In the real world

- **React** batches state updates. Since React 18, several `setState` calls inside one promise callback or timeout
  produce **one** re-render, not several. And `useEffect` callbacks normally run *after* the browser has painted, which
  is why data fetching lives there and not in the component body.
- **Angular** has traditionally used **Zone.js**, which patches `setTimeout`, promises and DOM events so that Angular
  knows when a task or microtask has finished and it is time to run change detection. Newer Angular versions can run
  **zoneless**, where signals tell Angular what changed instead. Either way, the event loop you just watched decides
  when Angular gets to update the screen.

---

## Lab 2 — Promises and async/await: a real fetch, and the four states (30 min)

### Problem

The grid is empty because `fetchJson` is a stub. When you make it real, three new problems arrive with it: the data is
not there on the first render (you need a **loading** state), requests fail (you need an **error** state), and a
search can legitimately find nothing (you need an **empty** state). And there is a trap: `fetch` reports a server error
as a *success* unless you check.

### Concept

**Callbacks came first.** An async function takes a function to call when it is done:

```js
getUser(id, (user) => {
  getOrders(user, (orders) => {
    getInvoice(orders[0], (invoice) => {
      // … and every step needs its own error handling
    });
  });
});
```

That rightward drift is **callback hell**, and the shape is only half the problem. Error handling has to be repeated at
every level, and nothing stops a buggy library from calling your callback twice, or never.

**A Promise is an object that represents a value that is not ready yet.** It is in one of three states: **pending**,
then either **fulfilled** (with a value) or **rejected** (with a reason). Once settled, it never changes again, and its
callbacks run at most once.

```js
fetchJson(url)
  .then((data) => data.products)          // .then returns a NEW promise…
  .then((products) => products.length)    // …so steps chain instead of nesting
  .then((count) => console.log(count))
  .catch((err) => console.error(err))     // one catch for every step above
  .finally(() => console.log("done"));    // runs on both paths
```

Whatever a `.then` callback returns becomes the value of the next promise, and if it returns a promise, the chain waits
for it. That is what flattens the pyramid.

**`async`/`await` is syntax over promises**, not a replacement for them:

- An `async` function **always returns a promise**. `return 42` fulfils it with 42, and `throw err` rejects it.
- `await promise` pauses **that function** until the promise settles, then gives you the value (or throws the reason).
- Errors are handled with ordinary `try` / `catch` / `finally`.

```js
async function load() {
  try {
    const data = await fetchJson(url);
    return data.products;
  } catch (err) {
    console.error(err);
    return [];
  } finally {
    console.log("done");                   // runs on success, on error, even after return
  }
}
```

> **Misconception: "`await` blocks the whole page."** `await` pauses only the async function it is in. The function
> hands a pending promise back to its caller, and the caller carries on:
>
> ```js
> async function loadProducts() {
>   console.log("1. request sent");
>   await wait(100);
>   console.log("3. response arrived");
> }
> loadProducts();
> console.log("2. the caller carries on");     // prints 1, 2, 3
> ```
>
> While a slow request is in flight, the page scrolls, hover effects work, and you can keep typing. What *does* block
> the page is long synchronous work, like the busy loop from Lab 1.

**`fetch` has two phases**, and it only rejects in the first:

1. `await fetch(url)` resolves as soon as the **headers** arrive, with a `Response`. It **rejects only if there is no
   response at all**: the network is down, the DNS lookup failed, CORS blocked it, or the request was aborted.
2. `await response.json()` reads the body and parses it.

A 404 or a 500 *is* a response, so `fetch` **fulfils**. You find out from `response.ok` (true for statuses 200–299)
and `response.status`. Try it in the Console (DevTools allows `await` at the top level):

```js
const res = await fetch("https://dummyjson.com/products/9999");
res.ok;              // false
res.status;          // 404
await res.json();    // { message: "Product with id '9999' not found" }
```

> **Misconception: "`fetch` rejects on HTTP errors."** It does not. Without an `if (!response.ok)` check, a 500's error
> body flows into your app as if it were data. (Libraries like axios, and Angular's `HttpClient`, *do* reject on a bad
> status. `fetch` is lower level.)

One more trap: **error bodies are not always JSON.** Open `https://dummyjson.com/productz`: a 404 with an **HTML** page.
Calling `.json()` on it throws a `SyntaxError` that hides the real problem. So read error bodies defensively.

**A custom error class** lets the rest of the app tell failures apart. `class ApiError extends Error` keeps everything
an `Error` has (message, stack trace, works with `instanceof`) and adds the HTTP status.

### Steps

**A. `src/api/client.js` — `TODO(lab-2.1)`.** Give `ApiError` a constructor:

```js
export class ApiError extends Error {
  constructor(message, status, url) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}
```

`super(message)` must come first: a subclass cannot touch `this` until the parent constructor has run.

**B. `src/api/client.js` — `TODO(lab-2.2)`.** In `fetchJson`, replace the two stub lines (`const response = { ok: true,
status: "stub" };` and `const data = [];`) and their TODO comment with:

```js
    const response = await fetch(network.fail ? FAILING_URL : url, { signal: requestSignal });

    if (!response.ok) {
      // Error bodies are not always JSON (some servers send an HTML page), so never trust them.
      const body = await response.json().catch(() => null);
      throw new ApiError(body?.message ?? `HTTP ${response.status}`, response.status, url);
    }

    const data = await response.json();
```

The surrounding `try`/`catch` is already there: it emits the `success` event after these lines, and the `error` or
`abort` event if anything throws. `network.fail` is the **Break the API** toggle: it swaps the URL for one that always
answers 503.

**C. `src/main.js` — `TODO(lab-2.3)`.** At the bottom of `refresh()`, replace the two lines under the TODO comments
(`const products = await request(signal);` and `setState({ status: "success", products, shown });`) with this. **Keep
the `TODO(lab-4.3)` comment** above it: Lab 4 comes back here.

```js
  setState({ status: "loading", error: null });

  try {
    const products = await request(signal);
    setState({ status: products.length ? "success" : "empty", products, shown });
  } catch (err) {
    if (isAbortError(err)) return; // replaced by a newer request: not an error
    setState({ status: "error", error: err, shown });
  }
```

Three details matter. **`"loading"` is set before the request starts**, so the skeletons appear at once. **`error:
null`** clears a stale error when you retry. **`isAbortError`** will matter in Lab 3: a request *we* cancelled is not a
failure, and must never show the error screen. Then remove the `TODO(lab-2.3)` comment.

### Verify

- Reload: skeletons, then **24 real products**. The count says `24 products · all products`. The Network log shows
  `→ #1 products`, `→ #2 category-list`, then `✓ … 200 · NN ms` for each, and the category menu fills with 24
  categories.
- Tick **Break the API (503)**, pick any category, then pick **All categories** again. (Until Lab 3, only *All
  categories* makes a real request: the category endpoint is still a stub.) You get a red *Could not load products*
  with *Service Unavailable* and a **Retry** button, and `! … 503` in the log. Untick the box and press Retry: the
  products come back.
- Type anything in the search box and press **Enter**: *No products match*. That is the empty state, and correct for
  now, because `searchProducts` is still a stub (Lab 3).
- In the **Network** tab, find the 503 request: it is red there, yet `fetch` did not reject. Your `if` turned it into
  an error.

### Watch out

**`response.json()` without `await`.** You get a pending Promise, not data, and `data.products` is `undefined`. The
empty state appears and nothing looks broken. Check the `await` first.

**Clearing loading at the end of `try`.** If you manage `loading` with a boolean, put `setLoading(false)` in `finally`,
never at the end of `try`: an error would skip it and the spinner would turn forever. A single `status` field avoids
the problem entirely, because setting `"error"` *replaces* `"loading"`.

### Challenge (2 min)

In the Console, compare `await fetch("https://no-such-host.invalid/")` with the 404 above. One rejects with a
`TypeError`, the other fulfils. Which errors would you want to **retry**? Keep your answer for Lab 4.

### In the real world

- **React:** this exact try/catch lives inside `useEffect`, with `useState` for `status`. Note that `useEffect(async ()
  => …)` is a bug: an async function returns a promise, and React expects the effect to return a cleanup function (or
  nothing). Declare the async function inside and call it.
- **Angular:** `HttpClient` does Step B for you. A non-2xx response arrives as an `HttpErrorResponse` in the `error`
  callback, with `.status` and `.error` (the body). Your `ApiError` is a hand-built version of it, and an **HTTP
  interceptor** is where teams put the shared error handling you put in `fetchJson`.

---

## Lab 3 — Parallel and cancellable: Promise.all, AbortController, debounced search (30 min)

### Problem

Three things are wrong, and the Network log shows all of them.

1. **The first load is slower than it needs to be.** Look at the log after a reload: `#2 category-list` does not
   *start* until `#1 products` has *finished*. The two requests do not depend on each other.
2. **Search and category do nothing.** Both endpoints are stubs.
3. **Once search works, it will have a race condition.** Type "ph", pause, type "one". Two requests are in flight. On a
   slow network, if "ph" (a bigger result) comes back **last**, it overwrites "phone". Now the box says *phone* and the
   grid shows results for *ph*. Nothing crashed. The screen is simply wrong.

### Concept

**`await` in sequence adds the times up. `Promise.all` overlaps them.**

```js
// Sequential: ~600 ms. The second request does not start until the first finishes.
const products = await wait(300, "products");
const categories = await wait(300, "categories");

// Parallel: ~300 ms. Both start at once; await the pair.
const [products2, categories2] = await Promise.all([wait(300, "products"), wait(300, "categories")]);
```

(Measured in Node: 601 ms and 301 ms.) The requests *start* when you call the functions. `Promise.all` only waits for
them. The four combinators:

| Combinator | Settles when | Result | Use it for |
|---|---|---|---|
| `Promise.all([...])` | all fulfil, **or the first rejects** | array of values, in input order | Everything is required: products **and** categories |
| `Promise.allSettled([...])` | every one has settled | `[{ status: "fulfilled", value }, { status: "rejected", reason }]` | Some parts are optional: show the page even if recommendations fail |
| `Promise.race([...])` | the **first** one settles, either way | that value or reason | A timeout: `Promise.race([request, timeout(3000)])` |
| `Promise.any([...])` | the first one **fulfils** | that value, or `AggregateError` if all reject | The fastest of several mirrors |

```js
function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms} ms`)), ms));
}
const data = await Promise.race([fetchJson(url), timeout(3000)]);   // rejects after 3 s if fetch is slower
```

Note what `race` does **not** do: the losing request keeps running. The browser still downloads the response, and
nobody listens for it. For real cancellation you need the next tool.

**`AbortController` cancels async work.** It is a pair: the **controller**, which you keep, and its **signal**, which
you hand to whoever does the work.

```js
const controller = new AbortController();
fetch(url, { signal: controller.signal });   // fetch listens to the signal
controller.abort();                          // fetch rejects with a DOMException named "AbortError"
```

The browser really stops the request (the Network tab shows it as *canceled*), and the promise rejects with an
`AbortError`. That is why `refresh()` already ignores `AbortError`: a request you cancelled is not a failure.

**The race-condition fix is one rule: when a new request starts, abort the previous one.** Keep the current controller
in a variable outside the function, and abort it at the start of the next call. The stale response can then never land.

**Debounce and abort solve different problems, and you want both.** `debounce` (Session 3) waits until typing pauses,
so typing "phone" quickly sends **one** request instead of five. It cannot help when you *pause* mid-word, because then
a request is already in flight when the next one starts. Abort handles those.

### Steps

**A. `src/main.js` — `TODO(lab-3.1)`.** In `loadCatalogue`, replace the two sequential `await` lines and their TODO
comment with:

```js
  const [products, categories] = await Promise.all([getProducts({ signal }), getCategories({ signal })]);
```

**B. `src/api/products.js` — `TODO(lab-3.2)`.** Implement both functions, and delete the TODO comment:

```js
export async function searchProducts(query, { signal } = {}) {
  const q = encodeURIComponent(query);
  return unwrap(await fetchJson(`${BASE}/search?q=${q}&limit=24&select=${FIELDS}`, { signal }));
}

export async function getByCategory(slug, { signal } = {}) {
  const category = encodeURIComponent(slug);
  return unwrap(await fetchJson(`${BASE}/category/${category}?limit=24&select=${FIELDS}`, { signal }));
}
```

`encodeURIComponent` turns `"tv & audio"` into `tv%20%26%20audio`. Without it, the `&` would start a new query
parameter. `requestFor()` in `main.js` already calls these: the search endpoint cannot filter by category, so when both
are set it narrows the results with `filterProducts` from Session 2.

**C. `src/main.js` — `TODO(lab-3.3)`.** In `refresh()`, replace the TODO comment above `controller = new
AbortController();` with:

```js
  // A new request makes the previous one stale: cancel it.
  if (els.cancelStale.checked) controller?.abort();
```

The checkbox exists only so you can switch the fix off and see the bug. In a real app it is just `controller?.abort()`.
The `?.` handles the very first call, when there is no controller yet.

**D. `src/main.js` — `TODO(lab-3.4)`.** Replace the `els.search.addEventListener("change", …)` line and the
`TODO(lab-3.4)` comment with a debounced `input` listener. Keep the `TODO(lab-5.3)` comment and the category line.

```js
const runSearch = debounce((value) => {
  const query = value.trim();
  if (query !== state.query) refresh({ query });
}, 350);

els.search.addEventListener("input", (event) => runSearch(event.target.value));
```

The `if` skips a request when nothing really changed, for example when you add a space at the end.

### Verify

- **Parallel:** reload and read the log. `→ #1 products` and `→ #2 category-list` both appear **before** either `✓`.
- **Search and category:** type `phone`: results appear about a third of a second after you stop typing, and the count
  says `search "phone"`. Pick *Smartphones*, then type `iphone`: the count says `"iphone" in Smartphones`.
- **The fix:** tick **Slow network**. Type `ph`, pause for half a second, then type `one`. The log shows
  `✕ #N search?q=ph  aborted`, then `✓ … search?q=phone`. In the Network tab, the `ph` request says *(canceled)*, or
  never appears if it was still in the artificial delay.
- **The bug:** untick **Cancel stale requests** and repeat a few times. Both requests succeed, in whichever order the
  random delays give. Sooner or later the box says *phone* while the count says `search "ph"`. That is the race
  condition. Tick the box again.

### Watch out

**Creating the controller inside the function, and never storing it.** `const controller = new AbortController()` in
`refresh()` gives each call its own controller, and the next call has no way to reach the previous one. It must live
*outside* the function, in `let controller`, exactly like the `timer` inside `debounce`. It is the same closure idea.

**Showing an error for an abort.** Delete the `isAbortError` line and try the slow-network test: the red error screen
flashes every time you type. Aborts are expected. Filter them out.

### Challenge (2 min)

Change `loadCatalogue` to use `Promise.allSettled`, so that the products still show when `category-list` fails. What
do you render in the category menu then?

### In the real world

- **React:** the effect cleanup function is exactly `controller?.abort()`. React runs it before the next effect and on
  unmount:

  ```jsx
  useEffect(() => {
    const controller = new AbortController();
    searchProducts(query, { signal: controller.signal })
      .then(setResults)
      .catch((err) => { if (err.name !== "AbortError") setError(err); });
    return () => controller.abort();          // a new query, or unmount → cancel the old request
  }, [query]);
  ```

  In development, `<StrictMode>` runs effects twice on purpose, and you will see one aborted request in the Network tab.
  That is this cleanup working. **TanStack Query** does all of this for you, and more: it passes a `signal` to your
  `queryFn`, caches by `queryKey`, and dedupes identical requests.
- **Angular:** `switchMap` *is* "abort the previous one". When a new search term arrives, it unsubscribes from the
  previous inner HTTP Observable, and `HttpClient` cancels that request:

  ```ts
  results$ = this.search.valueChanges.pipe(
    debounceTime(350),                         // your debounce
    distinctUntilChanged(),                    // your `if (query !== state.query)`
    switchMap((q) => this.http.get<ProductList>("/products/search", { params: { q } })),
  );
  ```

  Same bug, same fix, and one operator does both halves.

---

## Lab 4 — Resilience: retry with backoff, and timeouts (15 min)

### Problem

Networks fail for a moment all the time: a train goes through a tunnel, a server restarts, a load balancer hiccups.
Today one failed request means an error screen, even when trying again a second later would have worked. And the
opposite problem: a request that **never** answers leaves the skeletons shimmering forever, because `fetch` has no
timeout of its own.

### Concept

**Retry only what might succeed next time.** `isRetryable()` in `client.js` is already written:

| Error | Retry? | Why |
|---|---|---|
| `AbortError` | No | We cancelled it on purpose |
| `ApiError` with 5xx, or 429 | Yes | Server trouble, or "too many requests, slow down" |
| `ApiError` with other 4xx | No | Our request is wrong. Sending it again gives the same answer |
| `TypeError` (network down), `TimeoutError` | Yes | Often gone a moment later |

**Exponential backoff** waits longer after each failure: 400 ms, then 800, then 1600. When a server is struggling,
clients that retry instantly, all together, are what keep it down. Growing gaps give it room to recover. A little
**jitter** (a random extra few milliseconds) stops thousands of clients from retrying in the same instant.

**A wait must be cancellable too.** If the user types a new search while a retry is waiting, the old retry must stop
waiting, not wake up 800 ms later and fire a stale request. That is why `delay(ms, signal)` takes a signal.

**Timeouts with `AbortSignal.timeout(ms)`.** It returns a signal that aborts by itself after `ms`, and a fetch that
uses it rejects with a `DOMException` named **`TimeoutError`** (not `AbortError`, which lets you tell "too slow" apart
from "cancelled"). To honour *both* the user's cancel *and* a timeout, combine them: `AbortSignal.any([a, b])` aborts
when either one does. Unlike `Promise.race`, this really stops the request.

### Steps

**A. `src/api/client.js` — `TODO(lab-4.1)`.** Make `delay` honour its signal. Replace its body:

```js
export function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
```

`signal.reason` is the `AbortError` (or `TimeoutError`) that aborted it, so callers see the same error `fetch` would
throw. The Slow network toggle uses this same `delay`, so an aborted search now stops *during* its artificial wait,
too.

**B. `src/api/client.js` — `TODO(lab-4.2)`.** Replace the body of `withRetry`:

```js
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const wait = baseMs * 2 ** attempt + randomBetween(0, 100);
      onRetry?.({ attempt: attempt + 1, wait, error: err });
      await delay(wait, signal);
    }
  }
```

`return await` matters here: without `await`, a rejected promise would be returned *out of* the `try`, and the `catch`
would never see it.

**C. `src/main.js` — `TODO(lab-4.3)`.** In `refresh()`, change `const products = await request(signal);` into a
retried call, and delete the TODO comment:

```js
    const products = await withRetry(() => request(signal), {
      retries: 2, // 3 attempts in total
      baseMs: 400,
      signal,
      onRetry: ({ attempt, wait }) => appendLogLine(els.netlog, `↻ retry ${attempt} in ${Math.round(wait)} ms`, "retry"),
    });
```

`withRetry` takes a **function** that starts the request, not a promise. A promise is a request that has *already
started*, and it cannot be started again.

**D. `src/api/client.js` — `TODO(lab-4.4)`.** At the top of `fetchJson`, replace `const requestSignal = signal;` and
its TODO comment with:

```js
  // One signal that aborts when the caller cancels OR the timeout fires.
  const requestSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)])
    : AbortSignal.timeout(TIMEOUT_MS);
```

### Verify

- Tick **Break the API**, then pick a category. The log shows three attempts, with purple retry lines and growing gaps:
  `! #N … 503`, `↻ retry 1 in ~450 ms`, `! …`, `↻ retry 2 in ~850 ms`, `! …`, then the error screen. The skeletons stay
  up throughout, because it is still `"loading"`.
- Do it again, but this time untick **Break the API** during the retries and type in the search box. The old chain
  stops at once (no more attempts for the category), and the search succeeds.
- **Timeout:** set `TIMEOUT_MS` to `200` in `client.js`, tick **Slow network**, and pick a category. The artificial
  delay is always longer than 200 ms, so every attempt fails with `! … TimeoutError` and is retried (a timeout is
  retryable), then the error screen appears. Put `TIMEOUT_MS` back to `8000`.

### Watch out

**Retrying requests that change data.** Retrying a `GET` is safe. Retrying a `POST /orders` after a timeout can place
the order twice, because the first one may have succeeded and only the *response* was lost. Only retry
non-idempotent requests when the server supports an idempotency key.

**Passing a promise instead of a function.** `withRetry(request(signal))` "retries" the same failed promise three
times.

### Challenge (2 min)

Cap the backoff: `Math.min(baseMs * 2 ** attempt, 5000)`. Why does a cap matter once `retries` is 10?

### In the real world

- **React:** TanStack Query retries failed queries **3 times by default**, with exponential backoff (1 s, 2 s, 4 s, up
  to 30 s), and pauses retries while the browser is offline. You configure it with `retry` and `retryDelay`. Hand-rolled
  `withRetry` code in a React app is usually a sign that TanStack Query is missing.
- **Angular:** RxJS has both halves as operators:

  ```ts
  this.http.get<ProductList>(url).pipe(
    timeout(8000),                                                 // your AbortSignal.timeout
    retry({ count: 2, delay: (_err, n) => timer(400 * 2 ** (n - 1)) }), // your withRetry
  );
  ```

---

## Lab 5 — Observables: the mental model behind RxJS (15 min)

### Problem

A promise delivers **one** value, once. But a search box does not produce one value: it produces a *stream* of them,
one per keystroke, forever. So does a WebSocket, a timer, and a user's scroll position. And a promise cannot be
cancelled: once you hold it, the work is already running. Angular's `HttpClient`, its forms and its router all speak a
different type, the **Observable**, built for exactly this. Build one in 30 lines and RxJS stops being magic.

### Concept

**An Observable is a function waiting to be called.** You give `createObservable` a *producer*: a function that
receives an **observer** (`{ next, error, complete }`), starts producing values, and returns a **teardown** function.
Nothing happens until someone calls `subscribe`. Subscribing runs the producer. Unsubscribing runs the teardown.

```js
const ticks$ = createObservable((observer) => {
  console.log("producer started");
  let n = 0;
  const id = setInterval(() => {
    n += 1;
    observer.next(n);
    if (n === 3) observer.complete();
  }, 100);
  return () => { clearInterval(id); console.log("teardown: interval cleared"); };
});

console.log("created, nothing has run yet");
ticks$.subscribe({ next: (n) => console.log("tick", n), complete: () => console.log("complete") });
```

Output (run in Node): `created, nothing has run yet` → `producer started` → `tick 1` → `tick 2` → `tick 3` →
`complete` → `teardown: interval cleared`.

| | Promise | Observable |
|---|---|---|
| Values | exactly **one** (or an error) | **zero, one or many**, then maybe complete |
| Starts | **eagerly**, when created | **lazily**, on each `subscribe` |
| Cancel | not possible (you need an `AbortController`) | `subscription.unsubscribe()` runs the teardown |
| Consume | `await` / `.then` | `.subscribe({ next, error, complete })` |

The `$` suffix (`ticks$`, `results$`) is an Angular and RxJS convention meaning "this is an Observable".

### Steps

**A. `src/lib/observable.js` — `TODO(lab-5.1)`.** Replace the stub `return` in `createObservable`, and delete the TODO
comment:

```js
  return {
    subscribe(observerOrNext) {
      // Accept a plain function as shorthand for { next }.
      const observer = typeof observerOrNext === "function" ? { next: observerOrNext } : observerOrNext;

      let closed = false;
      let teardown = null;
      const cleanup = () => {
        if (typeof teardown === "function") teardown();
        teardown = null;
      };

      // After error/complete/unsubscribe, nothing else reaches the observer.
      const safe = {
        next: (value) => { if (!closed) observer.next?.(value); },
        error: (err) => { if (!closed) { closed = true; observer.error?.(err); cleanup(); } },
        complete: () => { if (!closed) { closed = true; observer.complete?.(); cleanup(); } },
      };

      teardown = subscribe(safe);
      if (closed) cleanup(); // the producer finished synchronously

      return {
        unsubscribe() {
          if (closed) return;
          closed = true;
          cleanup();
        },
      };
    },
  };
```

The `safe` wrapper is the *contract* RxJS guarantees: after `error` or `complete`, no more values, and the teardown
always runs exactly once. The `if (closed) cleanup()` line covers a producer that completes before it has even
returned its teardown.

**B. `src/lib/observable.js` — `TODO(lab-5.2)`.** Replace the body of `fromEvent`:

```js
  return createObservable((observer) => {
    const handler = (event) => observer.next(event);
    target.addEventListener(type, handler);
    return () => target.removeEventListener(type, handler);
  });
```

**C. `src/main.js` — `TODO(lab-5.3)`.** Swap the two `addEventListener` lines for subscriptions, and delete the TODO
comment:

```js
fromEvent(els.search, "input").subscribe((event) => runSearch(event.target.value));
fromEvent(els.category, "change").subscribe((event) => refresh({ category: event.target.value }));
```

### Verify

The app behaves **exactly as before**, and that is the point: an event listener *is* an Observable, one you had no
way to unsubscribe from except by keeping a reference to the handler. To see the model, paste the `ticks$` example into
a file next to `src/lib/observable.js`, import `createObservable`, and run it with `node`: you get the output above.
Then store the subscription and call `sub.unsubscribe()` after 150 ms. You see `tick 1`, then the teardown line, and
never `complete`.

### Watch out

**Forgetting to unsubscribe.** A subscription to a DOM event or an interval lives until you unsubscribe. In a single
page that never goes away (like ours) that is fine. In a component that is created and destroyed a hundred times, each
forgotten subscription is a memory leak and a handler that still runs on a destroyed screen.

### Challenge (2 min)

Write `fromRequest(fn)`: an Observable that calls `fn(signal)` with a fresh `AbortController`'s signal, emits the result
with `next`, then `complete`s, and whose teardown calls `controller.abort()`. You have just built the core of Angular's
`HttpClient.get`: lazy, and cancelled on unsubscribe.

### In the real world

- **Angular:** `HttpClient.get<T>()` returns an Observable. Nothing is sent until something subscribes, and
  unsubscribing cancels the request. The **`async` pipe** subscribes for you and unsubscribes when the component is
  destroyed, which is why it is the preferred way to show Observable data:

  ```ts
  // component
  products$ = this.http.get<ProductList>("https://dummyjson.com/products").pipe(map((r) => r.products));
  ```

  ```html
  <!-- template -->
  @for (p of (products$ | async) ?? []; track p.id) { <app-product-card [product]="p" /> }
  ```

  When you subscribe by hand, pair it with `takeUntilDestroyed()` so the subscription ends with the component.
- **React:** React has no Observables built in, but it speaks the same *subscribe/unsubscribe* shape.
  `useSyncExternalStore(subscribe, getSnapshot)` takes exactly the `subscribe` function your Session 3 cart store
  exposes, and every `useEffect` that returns a cleanup is a subscription with a teardown.

---

## Wrap-up — what you can now do

- Predict the output order of any mix of sync code, timers, promises, `await` and `queueMicrotask`, and explain it
  with three rules: sync first, then **all** microtasks, then one task.
- Explain why the page stays responsive during `await`, and what really freezes it.
- Write a `fetch` wrapper that checks `response.ok`, reads error bodies defensively, and throws a typed `ApiError`.
- Model a request as one `status` (`loading`, `success`, `error`, `empty`) instead of a pile of booleans.
- Choose between `Promise.all`, `allSettled`, `race` and `any`, and run independent requests in parallel.
- Cancel stale requests with `AbortController`, and recognise the race condition it prevents.
- Retry the right failures with exponential backoff and jitter, and put a real timeout on a request.
- Build an Observable from scratch, and say how it differs from a promise: many values, lazy, cancellable.

These are not "vanilla JavaScript skills" you leave behind when a framework arrives. `useEffect` cleanup, TanStack
Query, `HttpClient`, `switchMap` and the `async` pipe are all *packaged versions of what you wrote today*.

## Next session

**Session 5 — TypeScript for React & Angular.** You rewrite this live catalogue in strict TypeScript. The `status`
field becomes a **discriminated union** (`{ status: "success"; products: Product[] } | { status: "error"; error:
ApiError } | …`), so the compiler refuses to let you read `products` while loading. `fetchJson` becomes
`fetchJson<T>()`, and you see the same types in React (`useState<T>`) and Angular (`HttpClient.get<T>()`).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Grid always says *No products match*, log says `stub` | `fetchJson` is still the stub | Lab 2, Step B |
| `SyntaxError: Unexpected token '<'` | You called `.json()` on an HTML error page | Check `response.ok` **before** parsing, and use `.json().catch(() => null)` for error bodies |
| Log shows `✓` but the grid is empty | `await response.json()` is missing its `await`, or you returned the envelope instead of `.products` | Check `fetchJson` and `unwrap` |
| Red error screen flashes while typing | Aborts are treated as errors | Keep `if (isAbortError(err)) return;` in `refresh()` |
| Old results replace new ones | The controller is created inside `refresh()` and never aborted, or the box is unticked | `let controller` outside, `controller?.abort()` first |
| Retries continue after a new search | `delay` ignores its `signal`, or `signal` is not passed to `withRetry` | Lab 4, Steps A and C |
| `AbortSignal.any is not a function` | An older browser | Use a current Chrome, Edge, Firefox or Safari (Safari 17.4+) |
| Every request fails, the Network tab shows nothing | You are offline, or a proxy blocks `dummyjson.com` | Open `https://dummyjson.com/products/1` directly in a tab |
| Node puzzle: `Cannot find module` | You are not in `starter/` | `cd` into the folder that contains `src/` |
