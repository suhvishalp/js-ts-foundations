# Session 1 — JavaScript: What, Why & How

**Session guide** · ~120 minutes · you learn what JavaScript really is, why it behaves the way it does, and how it runs, and you ship your first interactive product page

---

## Where you are starting from

Nothing. This session assumes no JavaScript at all, only that you have used a browser and a code editor. If you
already write JavaScript, stay with us: the misconceptions in Lab 1 catch experienced developers too, and the way
you render and update the page by hand today is exactly the work React and Angular take over for you.

The `starter/` folder is a small Vite project with **no framework and no libraries**: plain JavaScript, one
stylesheet, and sixteen products in a data file. It already runs. You will see one product card and a JS Playground
that runs a handful of experiments.

Written for you: `index.html` (the branded header, an empty grid, the playground panel), `src/data/products.js`
(the data), most of `createCard` in `src/ui/render.js` (the image, brand, title and rating), `runPlayground` in
`src/playground.js`, and the playground buttons in `src/main.js`. The functions in `src/lib/format.js` are stubs
that return safe defaults, so nothing crashes while you work.

**Twelve `TODO(lab-1.x)` markers** say where your code goes. They are numbered `1.1` to `1.12` in the order you meet
them (the `1` is the session number). Search for `TODO(lab-1.` if you get lost.

## What you ship today

**ShopScope Lite: your first interactive product page.** Sixteen product cards created by JavaScript from an array
of plain objects, each with a thumbnail, brand, title, a sale price with the original struck through, and a stock
badge that turns amber when five or fewer are left and red when the product is sold out. Every card has a heart;
clicking it saves the product, and a "♥ N saved" counter in the toolbar keeps up. Beside the grid, a **JS Playground**
runs eleven experiments live and explains each result: the misconceptions, proven or disproven in your own browser.

By the end you will be able to answer, without hesitating:

- What JavaScript is, what it is not, and why it is called "JavaScript" at all
- What an engine is, what a runtime is, and why `document` exists in Chrome but not in Node.js
- How JavaScript can be single-threaded and still never freeze while it waits
- Why `0.1 + 0.2` is not `0.3`, why `typeof null` is `"object"`, and why you always write `===`
- The seven primitive types, and the complete list of falsy values
- The difference between a function declaration and a function expression
- Why `textContent` is safe and `innerHTML` can be dangerous
- What event delegation is, and why one listener beats sixteen

> **JavaScript is a small, strange, very consistent language running inside a much bigger program.** The language
> gives you values, functions and objects. The *runtime* around it (the browser, or Node.js) gives you the page, the
> network and the timers. Almost every "JavaScript is weird" moment is one of those two things you had not met yet.

---

## Before the session (10 minutes)

**Option A: in the browser (nothing to install).** Open the `starter/` folder of this session in StackBlitz, using
the link your trainer shares. Wait for the install to finish and the preview to show the header and one product card.
Bookmark the tab once its address changes to `stackblitz.com/edit/…`: that is your copy.

**Option B: locally.** You need Node.js 22 or newer (`node -v`).

```bash
cd sessions/01-javascript-what-why-how/starter
npm install
npm run dev          # open http://localhost:5173
```

Either way, open the browser's developer tools now (**F12**, or **Cmd+Option+I** on a Mac, or right-click → *Inspect*)
and find the **Console** tab. You will type into it all session.

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
| **In the real world** | Where this shows up on a real team, in React and in Angular |

If you fall behind, open the same file in `../solution/` and compare. The solution is exactly what the steps build.

---

## Orientation — what is in the box (5 min)

```
starter/
├── index.html              ← the header, an EMPTY <div id="grid">, and the playground panel
├── package.json            ← one dev dependency: vite. That is the whole toolchain.
└── src/
    ├── main.js             ← the entry point: finds elements, renders, wires events
    ├── base.css            ← the course design system (shared by all five sessions)
    ├── style.css           ← this session's extra styles
    ├── data/products.js    ← 16 real products, shaped like the DummyJSON API
    ├── lib/format.js       ← formatPrice, discountedPrice, stockStatus (Lab 2)
    ├── ui/render.js        ← createCard, renderGrid (Lab 3)
    └── playground.js       ← the misconception experiments (Lab 1)
```

Three things to notice before we start:

**The grid in `index.html` is empty.** Open it: `<div class="grid" id="grid"></div>`. Everything you see inside
that grid is created by JavaScript while the page runs. That is the idea behind every single-page app, including the
ones built with React and Angular.

**`index.html` loads one script:** `<script type="module" src="/src/main.js">`. `type="module"` lets files
`import` from each other, and it switches on *strict mode*, which turns some silent mistakes into real errors.

**Vite is the only tool.** `npm run dev` starts a development server that reloads the page when you save.
`npm run build` bundles everything into `dist/` for production. Vite does not change your JavaScript's meaning; it
serves it to the browser.

---

## Lab 1 — What JavaScript is, how it runs, and the misconceptions playground (20 min)

### Problem

Most people meet JavaScript through rumours: *it's basically Java*, *it's a toy for small scripts*, *it's slow because
it's interpreted*, *it's weird*. Each rumour makes the language harder to learn, because you keep expecting it to
behave like something it is not. Today we replace rumours with proofs you run yourself.

### Concept

**What JavaScript is.** A programming language created by Brendan Eich at Netscape in 1995 to make web pages
interactive. It is standardised as **ECMAScript** (the ECMA-262 specification), and a new edition ships every year.
It is **dynamically typed** (values have types; variables do not), it treats **functions as values** you can store
and pass around, and it is **multi-paradigm**: you can write it in a functional style, an object-oriented style, or
both.

**What JavaScript is not.** It is not a library, not a framework, and not a browser feature. React, Angular and
Node.js are all *written in or for* JavaScript; none of them *is* JavaScript.

#### How JavaScript runs

```
your code ──► ENGINE: parse → bytecode → run; hot code JIT-compiled to machine code
                 │
                 └── lives inside a RUNTIME, which adds the APIs:
                        Browser: document (the DOM), fetch, setTimeout, localStorage …
                        Node.js: fs (files), http (servers), process …
```

- **The engine** reads and executes JavaScript. **V8** runs in Chrome, Edge, Node.js and Deno. **SpiderMonkey** runs
  in Firefox. **JavaScriptCore** runs in Safari (and in the Bun runtime).
- **The runtime** is the engine plus everything around it. The *language* has no idea what a web page is.
  `document` exists in the browser because the browser provides it; Node.js provides `fs` instead. Some APIs, like
  `setTimeout` and `fetch`, exist in both, but they still come from the runtime, not the language.
- **Parse → compile → execute.** The engine parses your code into a tree, compiles it to compact **bytecode**, and
  starts running it straight away. While it runs, the engine watches which functions are "hot" (called a lot) and
  compiles those into optimised **machine code**. That is **JIT (just-in-time) compilation**. V8's interpreter is
  called Ignition; its optimising compilers are Sparkplug, Maglev and TurboFan.
- **The call stack and the event loop, at a glance.** JavaScript runs your code on **one thread**, one function at a
  time, tracked on the *call stack*. Slow work (a timer, a network request) is handed to the runtime. When it
  finishes, its callback waits in a *queue*, and the **event loop** moves it onto the stack as soon as the stack is
  empty. One thread, but it never sits and waits. Session 4 takes this apart properly.

#### The misconceptions, each with a proof

| Belief | The truth | Proof you can run |
|---|---|---|
| "JavaScript is Java for the browser." | Unrelated languages. The name was a 1995 marketing decision, when Java was fashionable. | `const add = (a, b) => a + b; add("1", 2)` gives `"12"`. No class, no compiler, no declared types: nothing like Java. |
| "JavaScript is only for small scripts." | It runs VS Code, Slack and Discord on the desktop, and powers servers at companies of every size. | See the table below. VS Code is written in TypeScript, which compiles to JavaScript. |
| "Single-threaded means it freezes while it waits." | Single-threaded **and non-blocking**. Waiting happens in the runtime, not on your thread. | The playground's `setTimeout(…, 0)` experiment prints `["A", "B"]`: the timer waits for the current code, even at 0 ms. |
| "JavaScript is interpreted, so it's slow." | Modern engines interpret first and JIT-compile hot code to machine code. | In Node: `node --print-bytecode --print-bytecode-filter=add -e "function add(a,b){return a+b} add(1,2)"` prints the bytecode V8 generated. |
| "`typeof null` should be `"null"`." | It is `"object"`: a bug from the first version. A fix was proposed and rejected, because it broke real websites. | `typeof null` → `"object"`. Check for null with `value === null`. |
| "`==` and `===` are the same." | `==` converts types before comparing (*coercion*); `===` never does. | `"5" == 5` → `true`, `"5" === 5` → `false`. **Always use `===`.** |
| "Everything in JavaScript is an object." | Seven types are **primitives**, not objects. | In a module (strict mode), `"shop".owner = "me"` throws `TypeError: Cannot create property 'owner' on string 'shop'`. |
| "`0.1 + 0.2 !== 0.3` means JavaScript can't do maths." | Every language that uses binary floating point (IEEE 754) does this: Python, Java, C. | `0.1 + 0.2` → `0.30000000000000004`. Work in cents, or round, before comparing money. |

> **Misconception:** "JavaScript is weird." Mostly, it is *old*. Every one of those surprises was decided decades ago,
> and the rule that the web must never break means they can never be removed. So we learn them once, and use `===`.

#### Where JavaScript runs today

| Where | What people build | Real names |
|---|---|---|
| 🌐 Web front ends | Interactive apps in the browser | React, Angular, Vue |
| 🖥️ Servers | APIs, websites, real-time services | Node.js, Deno, Bun |
| 📱 Mobile | Native iOS and Android apps from one codebase | React Native, Ionic |
| 💻 Desktop | Full desktop applications | Electron: VS Code, Slack, Discord |
| ☁️ Serverless and edge | Functions that run on demand, close to the user | AWS Lambda (Node.js runtime), Cloudflare Workers |
| 🤖 AI apps | Models in the browser; chatbots and agents on the server | TensorFlow.js; LLM apps built with official Node.js SDKs |
| 🔌 IoT and hardware | Robots, sensors, microcontrollers | Johnny-Five (Arduino, Raspberry Pi) |
| 🎮 Games and 3D | Browser games, 3D product viewers, visualisations | Phaser, Three.js |
| 🧩 Browser extensions | Ad blockers, password managers, dev tools | Chrome and Firefox extensions |
| 🛠️ Build tooling | The tools that build and check JavaScript itself | Vite, ESLint |

One language, learned once, reaches every row of that table. That is the *why* of this whole course.

### Steps

**A. Meet the console.** In DevTools → **Console**, type each line and press Enter:

```js
typeof null
0.1 + 0.2
"5" == 5
"5" === 5
```

The console evaluates each *expression* and shows its value. It is the fastest way to answer "what does JavaScript
actually do here?" for the rest of your career.

**B. Read the playground.** Open `src/playground.js`. Each experiment is a plain **object** with three properties:

- `code`: the text we show on screen,
- `run`: a **function** that really runs that code and returns the result,
- `why`: one line of explanation.

`runPlayground(logEl)` (already written, below the array) loops over the experiments, calls each `run`, and prints the
result into the dark log panel. Your job is to add the missing experiments.

**C. `src/playground.js` — `TODO(lab-1.1)`.** Replace the TODO comment with two experiments:

```js
  {
    code: '"5" == 5',
    run: () => "5" == 5,
    why: "== converts the types first (coercion), then compares. The rules are long and surprising.",
  },
  {
    code: '"5" === 5',
    run: () => "5" === 5,
    why: "=== compares type AND value, with no conversion. Use === every time.",
  },
```

Notice the quotes: the `code` string uses single quotes on the outside so it can contain double quotes on the inside.

**D. `src/playground.js` — `TODO(lab-1.2)`.** Replace it with:

```js
  {
    code: "[] + {}",
    run: () => [] + {},
    why: '+ turns objects into strings first: "" + "[object Object]". Not a bug; a rule worth knowing.',
  },
  {
    code: "typeof function () {}",
    run: () => typeof function () {},
    why: "Functions are objects you can call. typeof gives them their own label, and you can pass them around like any value.",
  },
```

**E. `src/playground.js` — `TODO(lab-1.3)`.** Replace it with the falsy list and the truthy surprises (we explain
truthy and falsy properly in Lab 2):

```js
  {
    code: '[false, 0, -0, 0n, "", null, undefined, NaN].map(Boolean)',
    run: () => [false, 0, -0, 0n, "", null, undefined, NaN].map(Boolean),
    why: "The complete list of falsy values. Everything else is truthy.",
  },
  {
    code: 'Boolean("0") && Boolean([]) && Boolean({})',
    run: () => Boolean("0") && Boolean([]) && Boolean({}),
    why: 'The string "0", an empty array and an empty object are all truthy. Check .length when you mean "empty".',
  },
```

### Verify

Save. The page reloads and the playground runs eleven experiments, fading in one by one. Check these results:

| Experiment | Result |
|---|---|
| `"5" == 5` / `"5" === 5` | `true` / `false` |
| `[] + {}` | `"[object Object]"` |
| `typeof function () {}` | `"function"` |
| the falsy list | eight `false`s |
| `setTimeout(…)` | `["A", "B"]` |

Click **Run experiments** again: the log clears and re-runs. Now try the "single-threaded" proof for real. Paste this
into the console, press Enter, and immediately try to click **Run experiments**:

```js
const end = Date.now() + 3000; while (Date.now() < end) {}
```

For three seconds the page ignores you. That loop keeps the one thread busy, so the event loop never gets a turn.
Timers and network requests do not do this, because they wait *outside* your thread.

### Watch out

**A missing comma between objects.** Every experiment object ends with `},`. Forget one and Vite shows a red error
overlay naming the line. Read the line number; it is almost always the object just above.

**Quotes inside quotes.** `code: ""5" == 5"` ends the string after the first `"`, and Vite reports an
*Unexpected token*. Wrap a string that contains double quotes in single quotes (`'"5" == 5'`), or the other way round.

### Challenge (2 min)

Add an experiment for `typeof NaN` ("not a number" is, in fact, a `"number"`) and one for `NaN === NaN` (`false`:
the only value not equal to itself; test with `Number.isNaN(value)`).

### In the real world

Everything you write in React or Angular ends up as plain JavaScript running on the same engines. JSX is compiled to
JavaScript function calls; Angular templates are compiled to JavaScript too; TypeScript's types are erased before the
code runs. When a React or Angular app misbehaves, the cause is very often one of today's rules: a `==` that
coerced, a `0` that was falsy, a floating-point total. Frameworks change how you *organise* code, never how
JavaScript *behaves*.

---

## Lab 2 — Values, types & functions: `format.js` (25 min)

### Problem

Look at the card: its price says `9.99`. No currency, no discount, and the stock badge is missing. The three
functions in `src/lib/format.js` are stubs. Open DevTools → Console: the table printed by `main.js` shows
`formatPrice(1899.99)` returning `"1899.99"`, and `stockStatus(3).label` saying `"In stock"`, which is wrong.

### Concept

**Seven primitive types, plus objects.**

| Type | Examples | `typeof` |
|---|---|---|
| string | `"Mascara"`, `'Dior'`, `` `Only ${n} left` `` | `"string"` |
| number | `9.99`, `-3`, `NaN`, `Infinity` | `"number"` |
| bigint | `10n` | `"bigint"` |
| boolean | `true`, `false` | `"boolean"` |
| undefined | a variable with no value yet | `"undefined"` |
| null | "deliberately nothing" | `"object"` (the 1995 bug) |
| symbol | `Symbol("id")`, a unique key | `"symbol"` |
| **object** | `{ price: 9.99 }`, `[1, 2]`, functions, dates | `"object"` (functions: `"function"`) |

Primitives are **values**: they cannot be changed, only replaced. Objects (including arrays and functions) are
**references**: two variables can point at the same object. Arrays report `typeof [] === "object"`; use
`Array.isArray(value)` to tell them apart.

**`const` by default, `let` when you must reassign, `var` never.** `const` means the *variable* cannot be reassigned,
not that the object inside cannot change. `let` and `const` are **block-scoped** (they live inside the nearest `{ }`).
`var` is function-scoped, can be redeclared, and is readable (as `undefined`) before its line runs. Those three
behaviours caused years of bugs, which is why `let` and `const` arrived in 2015.

**Operators you will use daily:** arithmetic `+ - * / %`; comparison `=== !== < <= > >=`; logical `&&`, `||`, `!`;
and the conditional (ternary) `condition ? a : b`. Careful: `+` also joins strings, and if either side is a string
it joins: `"1" + 2` is `"12"`.

**Truthy and falsy.** Wherever JavaScript expects a boolean (an `if`, `&&`, `||`, `!`), it converts the value.
Exactly eight values become `false`:

```
false   0   -0   0n   ""   null   undefined   NaN
```

Everything else is truthy, including `"0"`, `"false"`, `[]` and `{}`. That is why `render.js` can write
`product.brand || product.category`: one product has no `brand` (it is `undefined`, falsy), so `||` falls back to the
category.

**Functions: declaration versus expression.**

```js
// Declaration: hoisted, so you can call it above the line where it is written.
function formatPrice(amount) { return usd.format(amount); }

// Expression: a function stored in a variable. Exists only after this line runs.
const double = function (n) { return n * 2; };

// Arrow function: a shorter expression. One expression after => is returned automatically.
const half = (n) => n / 2;
```

Functions are values: you can put them in objects (the playground's `run`), pass them to other functions
(`addEventListener("click", handler)`), and return them. **Default parameters** fill in missing arguments:
`discountedPrice(price, discountPercentage = 0)` works even when called with one argument.

**Template literals** use backticks and `${}` to drop any expression into a string: `` `Only ${stock} left` ``.

**Pure functions.** Every function in `format.js` takes values in and returns a value out. It touches no DOM, no
global variable, nothing else. Same input, same output, every time. That makes them trivial to test and easy to reuse.

> **Misconception:** "`0.1 + 0.2` is only a JavaScript problem." Any language using binary floating point does it.
> For display, round once, at the end; `discountedPrice` rounds to cents with `Math.round(x * 100) / 100`, and
> `Intl.NumberFormat` handles the rest.

### Steps

**A. `src/lib/format.js` — `TODO(lab-1.4)`.** Delete the TODO line and replace `formatPrice` with:

```js
// One formatter, created once when the module loads, not on every call.
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** 1899.99 → "$1,899.99". Never build money strings by hand. */
export function formatPrice(amount) {
  return usd.format(amount);
}
```

`Intl.NumberFormat` is built into JavaScript. It knows currency symbols, thousands separators and rounding for every
locale. Creating it once, outside the function, avoids rebuilding it for every card.

**B. `src/lib/format.js` — `TODO(lab-1.5)`.** Delete the TODO line and replace `discountedPrice`:

```js
/** The API gives a list price and a percentage; the sale price is derived. */
export function discountedPrice(price, discountPercentage = 0) {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}
```

Read it inside out: `discountPercentage / 100` turns `10.48` into `0.1048`; `1 - …` is the fraction you pay;
`* 100`, `Math.round`, `/ 100` rounds to whole cents.

**C. `src/lib/format.js` — `TODO(lab-1.6)`.** Delete the TODO line and replace `stockStatus`:

```js
/** Turns a stock number into a badge: which colour, and what it says. */
export function stockStatus(stock) {
  if (stock === 0) {
    return { tone: "out", label: "Sold out" };
  }
  if (stock <= 5) {
    return { tone: "low", label: `Only ${stock} left` };
  }
  return { tone: "ok", label: "In stock" };
}
```

It returns an **object** with two properties: `tone` matches a CSS class in `base.css` (`.badge.ok`, `.badge.low`,
`.badge.out`), and `label` is what people read. The order of the `if`s matters: check `0` before `<= 5`, or a sold-out
product would say "Only 0 left".

### Verify

Save, then look at DevTools → Console. The table now reads:

| call | result |
|---|---|
| `formatPrice(1899.99)` | `$1,899.99` |
| `discountedPrice(9.99, 10.48)` | `8.94` |
| `stockStatus(3).label` | `Only 3 left` |

The card still shows `9.99`: `render.js` does not use these functions yet. That is Lab 3.

### Watch out

**`stock == 0` versus `stock === 0`.** With `==`, `"" == 0` and `"0" == 0` are both `true`. Data from forms and URLs
arrives as strings; `===` refuses to guess.

**Forgetting `return`.** A function without `return` gives back `undefined`. If the console table shows `undefined`,
look for a missing `return`, or for curly braces after an arrow (`(n) => { n * 2 }` returns nothing;
`(n) => n * 2` returns the double).

### Challenge (2 min)

Feel the difference between a declaration and an expression. Type each line into the console (each in a fresh tab,
because the console remembers names between lines):

```js
square(3); function square(n) { return n * n; }        // 9: declarations are hoisted
cube(3); const cube = (n) => n * n * n;                 // ReferenceError: not yet defined
```

### In the real world

These three functions move into React and Angular unchanged, because they know nothing about the page. In **React**,
a component calls them while rendering: `<p className="price">{formatPrice(sale)}</p>`. In **Angular**, you would call
them from a component or wrap one in a *pipe* (`{{ product.price | currency }}` is Angular's built-in version of
`formatPrice`). Keeping logic pure and separate from the DOM is the habit that makes code portable between
frameworks, and testable without a browser.

---

## Lab 3 — The DOM: render the grid (25 min)

### Problem

One card, showing `9.99`, with no badge and no heart. The other fifteen products are in the data file but not on the
page.

### Concept

**The DOM (Document Object Model)** is the browser's live tree of objects representing the page. `index.html` is only
the *starting* tree; JavaScript can read it and change it at any time, and the screen updates to match. The DOM is a
runtime API: it belongs to the browser, not to the JavaScript language.

The methods you need today:

| Method | What it does |
|---|---|
| `document.querySelector("#grid")` | Finds the first element matching a CSS selector (or `null`) |
| `document.createElement("article")` | Creates a new element, not yet on the page |
| `el.textContent = "…"` | Sets the element's text. Always treated as text. |
| `el.className = "card"` / `el.classList.toggle("is-out", flag)` | Sets classes / adds or removes one class |
| `el.dataset.id = 7` | Writes `data-id="7"`: your own data, stored on the element |
| `el.setAttribute("aria-pressed", "false")` | Sets any attribute |
| `parent.append(a, b, "text")` | Adds children (elements *or* strings) to the end |
| `parent.replaceChildren(x)` | Removes all children, then adds `x` |

**`textContent` versus `innerHTML`, and why it matters.** `innerHTML` parses a string *as HTML*. If any part of that
string comes from data (a product title, a user's review, a URL), someone can put markup in it:

```js
const title = '<img src="x" onerror="alert(document.cookie)">';
card.innerHTML = `<h3>${title}</h3>`;   // the image fails to load, and the attacker's code runs
h3.textContent = title;                 // shows the text, harmlessly
```

That attack is called **cross-site scripting (XSS)**. The rule: **data goes in with `textContent`**. That is why
`createCard` builds every node with `createElement` and fills it with `textContent`.

**`for...of`** loops over the *values* of an array (or any iterable): `for (const product of products) { … }`. It
reads like English and supports `break` and `continue`.

**A `DocumentFragment`** is an invisible container. You append sixteen cards to it, then put the fragment into the
grid in **one** operation, so the browser updates the page once instead of sixteen times.

### Steps

**A. `src/ui/render.js` — `TODO(lab-1.7)`.** Replace the TODO line and the three `price` lines under it with:

```js
  // The sale price, then the original struck through.
  const price = document.createElement("p");
  price.className = "price";
  const original = document.createElement("s");
  original.textContent = formatPrice(product.price);
  price.append(formatPrice(discountedPrice(product.price, product.discountPercentage)), original);
```

`append` accepts a string *and* an element in the same call: the sale price becomes a text node, followed by the
`<s>` element. `base.css` already styles `.price s` small and grey.

**B. `src/ui/render.js` — `TODO(lab-1.8)`.** Replace the TODO line and the empty `badge` line with:

```js
  // The stock badge: tone picks the colour class, label is what people read.
  const status = stockStatus(product.stock);
  const badge = document.createElement("span");
  badge.className = `badge ${status.tone}`;
  badge.textContent = status.label;
  card.classList.toggle("is-out", status.tone === "out");
```

`classList.toggle(name, condition)` adds the class when the condition is `true` and removes it when `false`.
`style.css` greys out the image of an `.is-out` card.

**C. `src/ui/render.js` — `TODO(lab-1.9)`.** Replace the TODO line with the heart:

```js
  // The heart carries the product id in data-id, so ONE listener on the grid can tell hearts apart.
  const heart = document.createElement("button");
  heart.type = "button";
  heart.className = "heart";
  heart.dataset.id = product.id;
  heart.setAttribute("aria-pressed", "false");
  heart.setAttribute("aria-label", `Save ${product.title} to your wishlist`);
  heart.textContent = "♡";
```

Then add `heart` to the card. Change the last `append` line from `card.append(thumb, body);` to:

```js
  card.append(thumb, body, heart);
```

Why a `<button>`? It is focusable with the keyboard and announced by screen readers, with no extra code.
`aria-pressed` tells assistive technology it is a toggle, and `base.css` turns the heart red when it is `"true"`.

**D. `src/ui/render.js` — `TODO(lab-1.10)`.** Replace the body of `renderGrid` with:

```js
export function renderGrid(gridEl, products) {
  const fragment = document.createDocumentFragment();
  for (const product of products) {
    fragment.append(createCard(product));
  }
  gridEl.replaceChildren(fragment);
}
```

`main.js` already calls `renderGrid(grid, products)`, so there is nothing to change there.

### Verify

- Sixteen cards. The first says **$8.94** with ~~$9.99~~ beside it.
- **Powder Canister** has a red *Sold out* badge and a greyed image. **Red Nail Polish** says *Only 3 left* and
  **Dolce Shine Eau de** says *Only 4 left*, both amber. Everything else is green *In stock*.
- The **Apple** card shows `GROCERIES` as its brand: it has no `brand` field, so `||` fell back to the category.
- Right-click a heart → **Inspect**: `<button type="button" class="heart" data-id="1" aria-pressed="false" …>♡</button>`.
  Every card, every attribute, created by your code; none of it is in `index.html`.

### Watch out

**`Cannot read properties of null`** means `querySelector` found nothing, usually a typo in the selector (`"grid"`
instead of `"#grid"`) or a script that ran before the element existed. Module scripts run after the HTML is parsed,
so here it is almost always the typo.

**`price.textContent = …` after `append`.** Setting `textContent` *replaces all children*, including the `<s>`
you just appended. Build with `append`, or set text first and append after.

### Challenge (2 min)

In `createCard`, temporarily change `title.textContent = product.title` to
`title.innerHTML = '<img src="x" onerror="alert(\'XSS\')">'`. Save, watch sixteen alerts, and change it back. You
will never forget why data goes through `textContent`.

### In the real world

You just wrote the *imperative* version: "create this element, set this class, append it there". Now picture keeping
sixteen cards correct as prices, stock and filters change. **This is exactly the work frameworks take over.** They
let you write *declaratively*: describe what the page should look like for the current data, and let the framework
work out the DOM operations.

```jsx
// React (JSX)
{products.map((p) => <ProductCard key={p.id} product={p} />)}
```

```html
<!-- Angular (template) -->
@for (p of products; track p.id) {
  <app-product-card [product]="p" />
}
```

Both escape text by default, so the XSS above cannot happen by accident. In React the escape hatch is literally named
`dangerouslySetInnerHTML`; Angular sanitises anything bound to `[innerHTML]`. Under the hood, both still call
`createElement`, `textContent` and `append`: you now know what they are doing for you.

---

## Lab 4 — Events & state by hand: the wishlist with delegation (25 min)

### Problem

Click a heart. Nothing happens. The toolbar says "♥ 0 saved" forever. We need to remember which products are saved
(the **state**) and keep three things on screen in sync with it: the heart's icon and `aria-pressed`, the card's
outline, and the counter.

### Concept

**Events.** The browser fires an *event* when something happens: a click, a key press, a form submit.
`element.addEventListener("click", handler)` registers a function to call. The handler receives an **event object**;
`event.target` is the exact element that was clicked.

**Bubbling.** After an event fires on the element you clicked, it travels *up* through every ancestor: the `<button>`,
then the `.card`, then the `.grid`, all the way to `document`. Any ancestor can listen.

**Event delegation.** Instead of sixteen listeners (one per heart), put **one** listener on the grid and ask, on each
click, "was this a heart?":

- **Fewer listeners**, less memory, less to clean up.
- **It works for elements that do not exist yet.** Re-render the grid, add products later: the listener on the grid
  still catches their clicks. Per-card listeners would have to be re-attached every time.

`event.target.closest(".heart")` walks up from the clicked element and returns the nearest ancestor (or the element
itself) that matches, or `null`.

**State by hand.** We keep the saved ids in a **`Set`**, a collection that never holds the same value twice, with
`has`, `add`, `delete` and `size`. The Set is the *single source of truth*. After every change, we update the screen
ourselves. Forget one of those updates and the screen lies. Hold that thought.

**`dataset` values are always strings.** `heart.dataset.id` is `"7"`, not `7`. Our product ids are numbers, so we
convert with `Number(…)`. Otherwise `saved.has("7")` would never match a number `7` (a Set compares with the same rules
as `===`).

### Steps

**A. `src/main.js` — `TODO(lab-1.11)`.** Replace both TODO comment lines with the state and the counter update:

```js
const saved = new Set(); // product ids; a Set never holds the same id twice

function updateWishlistCount() {
  wishlistCount.textContent = `♥ ${saved.size} saved`;
  wishlistCount.classList.toggle("has-items", saved.size > 0);
}
```

**B. `src/main.js` — `TODO(lab-1.12)`.** Replace both TODO comment lines with the one delegated listener:

```js
// ONE listener on the grid handles every heart, including hearts added later (event delegation).
grid.addEventListener("click", (event) => {
  const heart = event.target.closest(".heart");
  if (!heart) return; // the click was somewhere else on the grid

  const id = Number(heart.dataset.id); // dataset values are always strings
  if (saved.has(id)) {
    saved.delete(id);
  } else {
    saved.add(id);
  }

  const isSaved = saved.has(id);
  heart.setAttribute("aria-pressed", String(isSaved));
  heart.textContent = isSaved ? "♥" : "♡";
  heart.closest(".card").classList.toggle("is-saved", isSaved);
  updateWishlistCount();
});
```

Read it top to bottom: *find the heart, or leave · work out which product · flip it in the state · make the screen
match the state*.

### Verify

- Click three hearts: each turns red and solid (♥), its card gets a soft red outline, and the toolbar reads
  **♥ 3 saved** in red.
- Click one again: it empties, and the count drops to 2.
- Click a card's *image* or *title*: nothing happens, and there is no error. `closest(".heart")` returned `null`
  and we returned early.
- Press **Tab** until a heart is focused, then **Enter** or **Space**: it toggles. A `<button>` gives you keyboard
  support at no cost.
- In the Elements panel, watch `aria-pressed` flip between `"false"` and `"true"` as you click.

### Watch out

**Forgetting `Number(…)`.** The wishlist still *seems* to work, because you store and check the same string
`"7"` every time. It breaks the moment other code asks with the real id: `saved.has(product.id)` checks for the
number `7` and finds nothing. Log `typeof heart.dataset.id` to see the string, and convert at the boundary.

**Listening on `document.querySelectorAll(".heart")` instead.** It works today, then silently breaks the day the grid
re-renders (Session 2 adds filters that do exactly that), because the new hearts have no listeners.

### Challenge (2 min)

Add a "Clear" behaviour: when the counter (`#wishlist-count`) is clicked, empty the Set, reset every
`.heart[aria-pressed="true"]` and every `.is-saved` card, and update the count. Count how many places you had to
touch. That number is the argument for the next section.

### In the real world

Look at what one click required: update the Set, then **remember** to update `aria-pressed`, the icon, the card class
and the counter. Four manual updates for one fact. Add a "saved items" drawer and a heart on a product detail page,
and every one of them must also be remembered, in every handler, forever. Most UI bugs are one forgotten update.

Frameworks invert this. You change the **state**; the framework re-renders whatever depends on it.

```jsx
// React: state + declarative UI. React itself delegates events at the root for you.
const [saved, setSaved] = useState(new Set());
<button className="heart" aria-pressed={saved.has(p.id)} onClick={() => toggle(p.id)}>
  {saved.has(p.id) ? "♥" : "♡"}
</button>
```

```html
<!-- Angular: a signal holds the state; the template re-evaluates when it changes. -->
<button class="heart" [attr.aria-pressed]="saved().has(p.id)" (click)="toggle(p.id)">
  {{ saved().has(p.id) ? '♥' : '♡' }}
</button>
```

Same event, same Set, same `aria-pressed`, but "make the screen match the state" is no longer your job. You did it by
hand today, so you will know exactly what React's re-render and Angular's change detection are doing for you.

---

## Wrap-up — what you can now do

- [x] Explain what JavaScript is, what ECMAScript is, and why JavaScript is not Java
- [x] Tell an engine (V8, SpiderMonkey, JavaScriptCore) from a runtime (browser, Node.js)
- [x] Describe parse → bytecode → JIT, and the call stack and event loop in one sentence each
- [x] Prove `typeof null`, `0.1 + 0.2`, `==` versus `===` and the falsy list in the console
- [x] Name the seven primitives, and choose `const`, then `let`, never `var`
- [x] Write function declarations, expressions and arrows, with default parameters
- [x] Build DOM nodes with `createElement`, fill them safely with `textContent`, and add them with `append`
- [x] Use `classList`, `dataset` and ARIA attributes
- [x] Handle every heart with one delegated listener, and keep state and screen in sync by hand

**One question to bring to Session 2:** ShopScope needs a search box, category filters and sorting. Each one
re-renders the grid. With what you know today, how would you do it, and what happens to your saved hearts when the
grid re-renders?

## Next session

**Session 2 — Modern JavaScript (ES6+).** Destructuring, spread, modules, and the array methods (`map`, `filter`,
`reduce`, `sort`) that turn today's grid into a searchable, filterable, sortable catalogue with a live stats bar.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Red error overlay in the browser | A syntax error. The overlay names the file and line; look for a missing comma, bracket or quote on or just above it. |
| Blank grid, error in the console | Read the first red line in DevTools → Console. `Cannot read properties of null` means a `querySelector` found nothing. |
| `formatPrice is not defined` | A missing `import` at the top of the file, or a missing `export` in `format.js`. |
| Prices show `NaN` | A misspelt property, e.g. `product.discountPercent`. Compare with `src/data/products.js`. |
| `saved.has(product.id)` is always `false` | The Set holds strings. Use `Number(heart.dataset.id)`. See Lab 4 → Watch out. |
| Clicking a heart does nothing | Is `heart.className` exactly `"heart"`? Is the listener on `grid`, not on a heart? |
| `npm run dev` fails | Check `node -v` is 22 or newer, and that you ran `npm install` inside `starter/`. |
| Changes do not appear | Did you save? Is the dev server still running? In StackBlitz, reload the preview. |
