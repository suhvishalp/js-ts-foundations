# YouTube script — Session 4: Async JavaScript & the Event Loop

A 12–13 minute recorded demo session. It teaches the event loop, `fetch`, promises and `AbortController` for real,
using the ShopScope Lite live catalogue, and shows the same ideas in React's `useEffect` and Angular's `switchMap`.

---

## 1. Video metadata

**Title options**

1. Guess the Order: The JavaScript Event Loop Puzzle Most Developers Get Wrong
2. The Event Loop, fetch and AbortController: the Async JavaScript Behind React and Angular
3. Your Search Box Has a Race Condition (and How React and Angular Fix It)

**Thumbnail text (max 5 words):** GUESS THE ORDER

**YouTube description**

> Eight console logs: sync code, a setTimeout of zero, a promise chain, an await and a queueMicrotask. What order do
> they print in? Most developers get it wrong, and the reason is the key to everything async in JavaScript.
>
> In this session we solve the event-loop puzzle live, then use what it teaches to build a live product catalogue
> against a real API: loading and error states, a fetch wrapper that catches the errors fetch lets through, parallel
> requests with Promise.all, and a search box that cancels stale requests with AbortController. We make the race
> condition happen on a slow network, fix it, and then show the exact same fix in React's useEffect and Angular's
> switchMap.
>
> Chapters
> 00:00 Guess the order
> 00:40 What we're building
> 01:20 The puzzle, explained: call stack, tasks and microtasks
> 04:00 A live catalogue with fetch (and the error fetch won't throw)
> 06:45 The race condition, and AbortController
> 09:15 React useEffect and Angular switchMap do exactly this
> 11:45 Recap
>
> This is Session 4 of JavaScript & TypeScript Foundations, the 5-day preparation track for the React and Angular
> programs at Deesha Tech Academy, taught by Vishal Shah (20 years in the industry).
>
> Register at deeshatechacademy.com
> https://deeshatechacademy.com

**Tags:** javascript event loop, microtask vs macrotask, setTimeout 0, promise then order, async await explained,
queueMicrotask, javascript fetch api, fetch 404 not rejecting, response.ok, promise.all, abortcontroller, cancel fetch
request, race condition javascript, debounce search, react useeffect cleanup, react useeffect fetch, tanstack query,
angular httpclient, rxjs switchmap, rxjs observable, deesha tech academy, vishal shah

---

## 2. Recording setup

- **Browser (left, about 60% of the screen):** the *solution* app running with `npm run dev` at
  `http://localhost:5173`. DevTools docked at the bottom with the **Console** tab open and cleared. The **Network** tab
  is one click away.
- **Editor (right, about 40%):** the *solution* folder open, with these tabs in order: `src/eventloop.js`,
  `src/api/client.js`, `src/main.js`, and a scratch tab holding the React and Angular snippets from Segment 4.
- **Before you hit record:**
  - In `src/eventloop.js`, change `MY_PREDICTION` to the common wrong guess: `["A", "C", "H", "B", "D", "E", "F", "G"]`.
    The cold open needs a ✕.
  - In `src/api/client.js`, comment out the `if (!response.ok) { … }` block in `fetchJson` (four lines plus the
    comment) and save. Segment 2 needs the bug.
  - All three toggles as they load: **Slow network** off, **Cancel stale requests** on, **Break the API** off.
    Clear the Network log.
- **Font size:** editor 18–20 px, browser zoom 125%, DevTools font bumped (`Ctrl/Cmd +` inside DevTools). Hide the
  bookmarks bar and turn notifications off.
- **Terminal:** a small terminal in the `solution/` folder, for one Node command in Segment 1.

---

## 3. The script

### [00:00–00:40] Cold open: guess the order

**ON SCREEN**
- Editor, full screen: `src/eventloop.js`, the body of `runEventLoopPuzzle` (lines A to H). Slowly scroll so every line
  is visible.
- On-screen text: **Pause the video. Guess the order.**

**SAY**
> "Eight log lines, A to H. There's a setTimeout with zero milliseconds, an async function with an await, a promise
> chain and a queueMicrotask. Question: in what order do they print? Pause the video and write down your answer.
> Seriously, write it down."

**ON SCREEN**
- Cut to the browser. Click **Run puzzle** in the *Event loop order* panel. The lines appear: `A C H D E G F B`.
- Point at `Your prediction: A C H B D E F G ✕`.

**SAY**
> "A, C, H, D, E, G, F... and B, the setTimeout zero, comes dead last. If you put B fourth, like my guess here, you're
> in very good company: it's a really common answer, and it's wrong. By the end of this video you'll know exactly why, and why
> it matters for every React and Angular app you'll ever build."

---

### [00:40–01:20] Intro

**ON SCREEN**
- Browser, header visible: "Async JavaScript & the Event Loop". Scroll slowly past the grid, the toggles and the three
  side panels.

**SAY**
> "I'm Vishal Shah from Deesha Tech Academy. This is Session 4 of our JavaScript and TypeScript Foundations track.
> Today: how JavaScript really schedules your code, and then we use that to build a live catalogue against a real API:
> loading and error states, parallel requests, and a search box that cancels its own stale requests. We'll create a
> real race condition on a slow network, watch it break, and fix it. Then I'll show you that React and Angular solve it
> in exactly the same way."

---

### [01:20–04:00] Segment 1: The puzzle, explained

**ON SCREEN**
- Editor: `src/eventloop.js`. Highlight line A and line H.

**SAY**
> "Rule one. JavaScript has one thread and one call stack. Synchronous code runs first, all of it, top to bottom. So A
> prints first. Then setTimeout: that doesn't run anything. It hands a timer to the browser and moves on."

**ON SCREEN**
- Highlight the `load` function: `log("C …")`, then `await null`.

**SAY**
> "Now here's the first surprise. We call `load()`. An async function runs synchronously until its first await. So C
> prints right now, in the synchronous part. When we hit `await`, the function pauses, and 'the rest of load' goes into
> a queue. That's D."

**ON SCREEN**
- Highlight the `.then` chain, then `queueMicrotask`, then `log("H …")`.
- On-screen text: **Sync first: A · C · H**

**SAY**
> "The first `.then` is queued: E. F isn't queued yet: it's waiting for E. queueMicrotask queues G. And H prints. So
> the synchronous part is A, C, H."

**ON SCREEN**
- Show a simple diagram (B-roll or drawn on screen): **Call stack** | **Web APIs (timer)** | **Microtask queue: D E G**
  | **Task queue: B**.

**SAY**
> "Rule two, and this is the whole puzzle: there are two queues. Promise callbacks, the code after an await, and
> queueMicrotask go into the microtask queue. Timer callbacks and click handlers go into the task queue. After every
> task, and the script itself counts as a task, the event loop drains the entire microtask queue. Every single one.
> So D, E, G. And running E queues F, at the back of the line, and F still runs in the same drain."

**ON SCREEN**
- On-screen text: **Then ALL microtasks: D · E · G · F**, then **Then ONE task: B**.

**SAY**
> "Rule three: only when the microtask queue is completely empty can the browser paint the screen and pick up the next
> task. That's B, our setTimeout zero. Zero doesn't mean 'now'. It means 'no sooner than zero, and after everything
> else has finished'."

**ON SCREEN**
- Terminal: run `node -e "import('./src/eventloop.js').then((m) => m.runEventLoopPuzzle(console.log))"`. The same eight
  lines appear.

**SAY**
> "And this isn't a browser quirk. Same file, in Node: identical order. That's how JavaScript runtimes work. One more
> thing to take away: none of this ran on another thread. `async` changes *when* your code runs, never *where*."

---

### [04:00–06:45] Segment 2: A live catalogue with fetch

**ON SCREEN**
- Editor: `src/api/client.js`, scroll to `fetchJson`. Highlight `await fetch(…)` and `await response.json()`.

**SAY**
> "Now let's put this to work. Every request in this app goes through one function, fetchJson. It calls fetch, awaits
> the response, parses the JSON. And while we're awaiting, the page doesn't freeze: await pauses this one function,
> and the event loop carries on handling your clicks and scrolls."

**ON SCREEN**
- Editor: `src/main.js`, `loadCatalogue`. Highlight `Promise.all([getProducts(…), getCategories(…)])`.
- Browser: reload. Skeleton cards shimmer, then 24 products. Point at the Network log: `→ #1 products`,
  `→ #2 category-list`, then two `✓` lines.

**SAY**
> "On load we need two things, products and categories, and they don't depend on each other. So we start both at once
> with Promise.all. Look at the log: both requests start before either one finishes. Total time is the slower of the
> two, not the sum. And while we wait, skeleton cards, because our state has a status: loading, success, error or
> empty. Exactly one at a time."

**ON SCREEN**
- Browser: tick **Break the API (503)**. Pick *Laptops* in the category menu.
- The grid says **No products match**. Point at the log: a green `✓ #N category/laptops  503 · N ms`.

**SAY**
> "Now let's break the server. Every request now gets a 503, Service Unavailable. And my app says... 'No products
> match'. That is a lie. The server is down, and we're telling the user their search was bad. And look at the log: a
> green tick, on a 503. How?"

**ON SCREEN**
- Console: type `const res = await fetch("https://dummyjson.com/products/9999");` then `res.ok` → `false`, then
  `res.status` → `404`.
- On-screen text: **fetch only rejects when there's NO response**

**SAY**
> "Because fetch does not reject on HTTP errors. A 404 or a 500 is still a response, so the promise fulfils. fetch only
> rejects when there's no response at all: you're offline, or the request was cancelled. You have to check
> `response.ok` yourself."

**ON SCREEN**
- Editor: uncomment the `if (!response.ok) { … }` block and save. Highlight `throw new ApiError(…)` and
  `.json().catch(() => null)`.

**SAY**
> "So: if the response isn't OK, throw our own ApiError with the status. And read the error body defensively, because
> some servers send an HTML page, not JSON."

**ON SCREEN**
- Browser: pick *Smartphones*. The log shows `! … 503`, `↻ retry 1 in ~450 ms`, `! …`, `↻ retry 2 in ~850 ms`, `! …`,
  then the red **Could not load products** with a **Retry** button.
- Untick **Break the API**, click **Retry**: products appear.

**SAY**
> "Now look. It fails, waits about 400 milliseconds, tries again, waits twice as long, tries a third time, and only then
> shows an honest error with a Retry button. That's exponential backoff. Fix the server, press Retry, and we're back."

---

### [06:45–09:15] Segment 3: The race condition, and AbortController

**ON SCREEN**
- Browser: tick **Slow network**. Untick **Cancel stale requests**. Clear the Network log.

**SAY**
> "Now the bug that ships to production all the time, because on a fast laptop you'll never see it. I've turned on a
> slow network: every request gets a random delay between 300 milliseconds and a second and a half. And I've switched
> off our fix."

**ON SCREEN**
- Type `ph` in the search box, pause about half a second, type `one`. Watch the log: `→ search?q=ph`,
  `→ search?q=phone`, then the two `✓` lines in either order. Repeat until the `ph` response lands **last**.
- Zoom on the result: the box says **phone**, the count says **search "ph"**.

**SAY**
> "I type 'ph', pause, and finish 'phone'. Two requests in flight. The debounce didn't help, because I paused. And
> sometimes the first request, 'ph', comes back last... and there it is. The box says 'phone', the grid shows results
> for 'ph'. No error, no crash. The screen is just wrong. That's a race condition."

**ON SCREEN**
- Editor: `src/main.js`, `refresh()`. Highlight `let controller = null;`, then `controller?.abort();`, then
  `controller = new AbortController();` and `{ signal }`.

**SAY**
> "The fix is one rule: when a new request starts, cancel the previous one. An AbortController is a pair: the
> controller, which we keep outside the function, and its signal, which we pass down to fetch. When the next search
> starts, we call abort on the old controller. The browser actually stops the request, and fetch rejects with an
> AbortError, which we deliberately ignore, because cancelling isn't a failure."

**ON SCREEN**
- Browser: tick **Cancel stale requests**. Clear the log. Type `ph`, pause, type `one`.
- The log shows `✕ #N search?q=ph  aborted`, then `✓ search?q=phone`. Switch to the Network tab: the `ph` request
  says **(canceled)**.
- On-screen text: **New request → abort the old one**

**SAY**
> "Same test. Look at the log: 'ph', aborted, in yellow. 'phone', success. And in DevTools, the browser marks it
> cancelled. Now the stale response can never land, whatever order the network delivers them in. Debounce means fewer
> requests; abort means the ones that do overlap can't hurt you. You want both."

---

### [09:15–11:45] Segment 4: React useEffect and Angular switchMap do exactly this

**ON SCREEN**
- Editor: the scratch tab. Paste the React snippet:

  ```jsx
  useEffect(() => {
    const controller = new AbortController();
    searchProducts(query, { signal: controller.signal })
      .then(setResults)
      .catch((err) => { if (err.name !== "AbortError") setError(err); });
    return () => controller.abort();
  }, [query]);
  ```

- Highlight `return () => controller.abort();`.

**SAY**
> "Here's React. An effect that runs whenever the query changes. Same AbortController, same signal, same 'ignore
> AbortError'. And the cleanup function, the thing you return, is our abort. React runs it before the next effect and
> when the component unmounts. That's our fix, line for line. If you've ever wondered why React's StrictMode shows an
> aborted request in development, that's this cleanup being tested."

**ON SCREEN**
- Paste the TanStack Query snippet:

  ```jsx
  const { data, status } = useQuery({
    queryKey: ["search", query],
    queryFn: ({ signal }) => searchProducts(query, { signal }),
  });
  ```

**SAY**
> "In real React apps, TanStack Query packages all of it: it hands you the signal, it retries three times with
> backoff, and it gives you a status. Loading, error, success. Sound familiar?"

**ON SCREEN**
- Paste the Angular snippet:

  ```ts
  results$ = this.search.valueChanges.pipe(
    debounceTime(350),
    distinctUntilChanged(),
    switchMap((q) => this.http.get<ProductList>("/products/search", { params: { q } })),
  );
  ```

- Highlight `debounceTime`, then `switchMap`.

**SAY**
> "And Angular. The search box is a stream of values: an Observable. debounceTime is our debounce. distinctUntilChanged
> skips repeats. And switchMap is the star: when a new search term arrives, it unsubscribes from the previous HTTP
> request, and Angular's HttpClient cancels it. switchMap is 'abort the old one', as a single operator. Different
> syntax, same event loop, same idea."

**ON SCREEN**
- Split screen: our `refresh()` on the left, the React and Angular snippets stacked on the right, with
  `controller?.abort()`, `return () => controller.abort()` and `switchMap` highlighted in the same colour.

**SAY**
> "That's why we learn this in plain JavaScript first. Once you've built it yourself, useEffect cleanup and switchMap
> aren't magic words to memorise. They're a feature you already understand."

---

### [11:45–12:15] Recap

**ON SCREEN**
- Three bullets appear one at a time over the app:
  1. Sync first, then **all** microtasks, then **one** task
  2. `fetch` doesn't reject on 404/500: check `response.ok`
  3. New request? **Abort the old one** (useEffect cleanup · switchMap)

**SAY**
> "Three things. One: synchronous code first, then every microtask, then one task. That's why setTimeout zero came
> last. Two: fetch doesn't reject on HTTP errors, so check response.ok. Three: when a new request makes the old one
> stale, abort it. That's useEffect cleanup in React and switchMap in Angular."

---

### [12:15–12:45] Call to action

**ON SCREEN**
- End card: Deesha Tech Academy logo, "deeshatechacademy.com", the five session titles with Session 4 highlighted.

**SAY**
> "This is Session 4 of our 5-day JavaScript & TypeScript Foundations program, the preparation track for our React and
> Angular programs at Deesha Tech Academy. Register at deeshatechacademy.com, link in the description. In the full
> session you also build retries with backoff, request timeouts, and your own Observable from scratch. Next session:
> TypeScript for React and Angular. See you there."

---

## 4. B-roll, on-screen text and pinned comment

**B-roll suggestions**
- A slow zoom on `Your prediction: … ✕` during the cold open.
- An animated diagram of the event loop: the call stack emptying, D, E and G dropping out of the microtask queue one by
  one, F joining at the back, and only then B leaving the task queue.
- The Network log filling during the slow-network test, with the yellow `✕ aborted` line highlighted.
- The DevTools Network tab showing a request marked **(canceled)**.
- The skeleton cards shimmering, then the grid filling in.
- The purple retry lines appearing with growing gaps while **Break the API** is on.

**On-screen text suggestions**
- 00:10 — Pause. Guess the order.
- 01:40 — One thread · one call stack
- 02:20 — An async function is sync until its first `await`
- 03:00 — Microtasks: ALL of them, after every task
- 03:30 — `setTimeout(fn, 0)` = "no sooner than 0 ms"
- 04:40 — `Promise.all`: overlap, don't queue
- 05:30 — fetch only rejects when there's NO response
- 06:20 — Retry: 400 ms → 800 ms → error
- 07:50 — Race condition: the slow response lands last
- 08:40 — New request → abort the old one
- 09:40 — useEffect cleanup = `controller.abort()`
- 10:50 — `switchMap` = abort the previous request

**Pinned comment**
> Quick challenge from the video: inside the E callback, add
> `setTimeout(() => log("I · task: timeout inside E"), 0)`. Does I print before or after B, and why? Answer in the
> replies.
>
> This is Session 4 of JavaScript & TypeScript Foundations, the preparation track for our React and Angular programs.
> Register at deeshatechacademy.com
