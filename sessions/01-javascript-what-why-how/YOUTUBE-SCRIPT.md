# YouTube script — Session 1: JavaScript: What, Why & How

A 13–14 minute demo session recorded by Vishal Shah for the Deesha Tech Academy channel. It teaches something
real (what JavaScript is, how it runs, and how to build an interactive page with plain JavaScript) and shows the
level of the full JS & TS Foundations program.

---

## 1. Video metadata

**Title options**

1. JavaScript Explained: What It Is, Why It's "Weird", and How It Really Runs
2. 0.1 + 0.2 Is Not 0.3: JavaScript Misconceptions, Proven Live (and Your First Interactive Page)
3. Learn JavaScript the Right Way: Engine, Runtime, DOM and Events in One Session

**Thumbnail text** (at most 5 words): `0.1 + 0.2 ≠ 0.3?!`

**YouTube description**

> Why does 0.1 + 0.2 give 0.30000000000000004? Why is typeof null "object"? And how can JavaScript be
> single-threaded without ever freezing?
>
> In this session from the JavaScript & TypeScript Foundations program at Deesha Tech Academy, Vishal Shah
> (Founder & Principal Trainer, 20 years in the industry) proves the biggest JavaScript misconceptions live in the
> browser, explains what an engine and a runtime really are, and then builds ShopScope Lite: a product page rendered
> from data with plain JavaScript, stock badges, and a wishlist powered by a single event listener.
>
> What you'll learn:
> 00:00 The misconception everyone gets wrong
> 00:30 What this session covers
> 01:15 What JavaScript is (and isn't): engine vs runtime
> 03:00 Where JavaScript runs today
> 04:30 The misconceptions playground
> 06:15 Building the product grid with the DOM
> 09:15 The wishlist: events and delegation
> 11:30 Why React and Angular exist
> 12:30 Recap
>
> This is Session 1 of our 5-day JavaScript & TypeScript Foundations program, the preparation track for our React
> and Angular programs.
>
> Register at deeshatechacademy.com
> https://deeshatechacademy.com

**Tags:** javascript, javascript tutorial, learn javascript, javascript for beginners, javascript misconceptions,
0.1 + 0.2, typeof null, javascript engine, v8, event loop, dom tutorial, event delegation, vanilla javascript,
javascript before react, javascript before angular, deesha tech academy, vishal shah

---

## 2. Recording setup

- **Browser (left, about 60% of the screen):** the **solution** app running (`cd solution && npm run dev`), with
  DevTools docked at the bottom, on the **Console** tab. Clear the console before recording.
- **Editor (right, about 40%):** VS Code with the **starter** open. Tabs, in order: `index.html`, `src/lib/format.js`,
  `src/ui/render.js`, `src/main.js`, `src/playground.js`. A second terminal runs the starter's dev server on another
  port (`npm run dev -- --port 5174`) in a second browser tab.
- **A terminal** with `node` available, for the "document is not defined" moment.
- **Font sizes:** editor 20 px, terminal 20 px, browser zoom 125%, DevTools font increased (Cmd/Ctrl + in DevTools).
- **Clean setup:** notifications off, bookmarks bar hidden, a neutral browser profile with no extensions visible.
- **Prepared snippets** (paste, do not type, for anything longer than one line) in a scratch file off screen.

---

## 3. The script

### [00:00–00:30] Cold open hook

**ON SCREEN:** Full-screen browser, DevTools Console only. Type `0.1 + 0.2`, press Enter. Pause on
`0.30000000000000004`. Then type `typeof null`, Enter: `"object"`. Then `"5" == 5`: `true`.

**SAY:**
"Point one plus point two. Every calculator on Earth says point three. JavaScript says... point three, and then a
lot of zeros, and a four. And `typeof null`? 'object'. So is JavaScript broken? No. And by the end of this video
you'll know exactly *why* it does this, how JavaScript really runs, and you'll have built your first interactive
product page with nothing but plain JavaScript."

### [00:30–01:15] Intro

**ON SCREEN:** Switch to the solution app: header, the sixteen cards, the playground panel filling up. Click two
hearts: the counter says "♥ 2 saved".

**SAY:**
"Hi, I'm Vishal Shah, founder and principal trainer at Deesha Tech Academy. This is Session 1 of our JavaScript and
TypeScript Foundations program. Today is about three questions: *what* JavaScript is, *why* it behaves the way it
does, and *how* it runs. And we build this: ShopScope Lite. Sixteen product cards created from data, stock badges,
a wishlist, and a playground that proves the famous JavaScript myths right here in the browser. No frameworks. Just
the language. Let's go."

### [01:15–03:00] What JavaScript is, and how it runs

**ON SCREEN:**
1. On-screen text card: "JavaScript ≠ Java". Then the ECMAScript logo / text "ECMAScript (ECMA-262)".
2. Animated diagram (see B-roll): *your code → engine (parse → bytecode → JIT machine code)*, wrapped in a box
   labelled *runtime*, with two variants: Browser (DOM, fetch, timers) and Node.js (fs, http).
3. Browser console: type `document.title`, Enter: shows the page title.
4. Terminal: type `node`, then `document`, Enter: `ReferenceError: document is not defined`. Then
   `require("fs").existsSync(".")`: `true`. Exit with Ctrl+D.

**SAY:**
"First, the name. JavaScript has nothing to do with Java. It was created at Netscape in 1995, and the name was
marketing, because Java was the hot thing back then. The official standard is called ECMAScript, and a new version
comes out every year.

Now, *how* does it run? Two words to remember: **engine** and **runtime**. The engine is the part that reads and
runs your code. Chrome and Node.js use V8, Firefox uses SpiderMonkey, Safari uses JavaScriptCore. It parses your code,
turns it into bytecode, starts running it right away, and the functions you call a lot get compiled into fast machine
code while the program runs. That's called just-in-time compilation. So 'JavaScript is slow because it's
interpreted'? That myth is about fifteen years out of date.

The runtime is the engine plus everything around it. Watch this. In the browser, `document` works. In Node.js...
`document is not defined`. Because the page, the DOM, isn't part of JavaScript. The browser *gives* it to you. Node
gives you files and servers instead. Same language, different runtime. That one idea clears up a huge amount of
confusion."

**Aha moment:** `document is not defined` in Node.

### [03:00–04:30] Where JavaScript runs today

**ON SCREEN:** The "Where JavaScript runs today" table from the guide, rows revealed one at a time, each with B-roll
(see section 4): React/Angular/Vue logos, a Node.js terminal serving a page, a phone running a React Native app,
VS Code, Slack and Discord windows, a Cloudflare Workers dashboard, a TensorFlow.js webcam demo, an Arduino LED
blinking via Johnny-Five, a Three.js 3D scene, the Chrome extensions page, and a Vite build in the terminal.

**SAY:**
"And if you think JavaScript is only for small scripts on web pages, look at this. Web front ends: React, Angular,
Vue. Servers: Node.js, Deno, Bun. Mobile apps with React Native and Ionic. Desktop apps: VS Code, the editor I'm using
right now, runs on Electron, and so do Slack and Discord. Serverless functions on AWS Lambda and Cloudflare Workers.
AI apps: machine learning in the browser with TensorFlow.js, and chatbots and agents built with Node SDKs. Hardware,
with Johnny-Five. Games and 3D with Phaser and Three.js. Browser extensions. And even the tools that build
JavaScript, like Vite and ESLint. One language, and it reaches all of these. That's why it's worth learning properly."

### [04:30–06:15] The misconceptions playground

**ON SCREEN:**
1. Solution app: point at the JS Playground panel. Scroll through the entries slowly.
2. Editor: open `src/playground.js`. Highlight one experiment object (`code`, `run`, `why`).
3. Console: `"5" === 5` → `false`.
4. Console: `[false, 0, -0, 0n, "", null, undefined, NaN].map(Boolean)` → eight `false`. Then `Boolean([])` → `true`.
5. Point at the `setTimeout` entry: `["A", "B"]`.
6. Paste `const end = Date.now() + 3000; while (Date.now() < end) {}` into the console, press Enter, and try to click
   **Run experiments** and a heart. Nothing responds for three seconds. Then it catches up.

**SAY:**
"Here's the playground. Every line is real: the browser just ran it. And in the code, each experiment is just an
object: the code, a function that runs it, and a one-line explanation.

`typeof null` is 'object' because of a bug in the very first version of JavaScript. People tried to fix it, and it
broke real websites, so it stays. Point one plus point two: that's binary floating point, and Python and Java do
exactly the same thing. For money, work in cents.

Double equals converts types before comparing, so the string five equals the number five. Triple equals doesn't
convert. Rule: always use triple equals.

These eight values are *falsy*. That's the whole list. Everything else is truthy, even an empty array.

And this one is my favourite. JavaScript is single-threaded: one thing at a time. So how does a timer not freeze
the page? Look: set a timer for zero milliseconds, then push A. We get A first, then B. The timer waits outside, and
comes back when the current code is done. Now let me show you what *blocking* looks like. This loop keeps the thread
busy for three seconds. I click... nothing. The page is frozen. That's the difference: waiting for a timer or the
network never does this. Busy code does. We go deep on the event loop in Session 4."

**Aha moment:** the frozen page versus `["A", "B"]`.

### [06:15–09:15] Live-coding the product grid

**ON SCREEN:**
1. Switch to the starter tab: one card, price `9.99`, no badge, no heart.
2. `index.html`: highlight `<div class="grid" id="grid"></div>`. "It's empty."
3. `src/lib/format.js`: replace the stub at `TODO(lab-1.4)` with the `Intl.NumberFormat` version. Replace
   `discountedPrice` (`TODO(lab-1.5)`) and `stockStatus` (`TODO(lab-1.6)`) by pasting from the solution. Show the
   console table updating: `$1,899.99`, `8.94`, `Only 3 left`.
4. `src/ui/render.js`, `TODO(lab-1.7)`: type the price block (`createElement("p")`, the `<s>`, `price.append(...)`).
   Save: the card shows `$8.94` with `$9.99` struck through.
5. `TODO(lab-1.8)`: paste the badge block. Save: a green "In stock" badge.
6. `TODO(lab-1.9)`: paste the heart button, change the last line to `card.append(thumb, body, heart)`. Save.
7. `TODO(lab-1.10)`: type `renderGrid` with the `DocumentFragment` and `for...of`. Save: sixteen cards appear.
8. Point at Powder Canister (Sold out, greyed), Red Nail Polish (Only 3 left), and the Apple card (brand falls back to
   GROCERIES).
9. Right-click a heart → Inspect: show `data-id` and `aria-pressed`.
10. Quick XSS demo: temporarily change `title.textContent` to
    `title.innerHTML = '<img src="x" onerror="alert(\'XSS\')">'`, save, dismiss one alert, undo, save.

**SAY:**
"Now let's build. Here's the starter: one card, and the price is just a raw number. And look at the HTML: the grid is
empty. Everything you'll see is created by JavaScript.

First, format dot js: small pure functions. Numbers in, strings out, no page involved. `Intl.NumberFormat` is built
into JavaScript and knows currency symbols and thousands separators. Never build money strings by hand.

Now the card. `document.createElement` makes an element that isn't on the page yet. We set its text with
`textContent`, and `append` can take a string *and* an element together. Save... there's our sale price, and the old
price struck through.

The badge: `stockStatus` gives us a tone and a label; the tone is a CSS class. The heart is a real button, so the
keyboard and screen readers work with no extra code. And the product id goes into `data-id`.
Remember that; it matters in a minute.

And `renderGrid`: loop over every product with `for...of`, put the cards into a fragment, and add them to the page in
one go. Save. Sixteen cards. Sold out, low stock, and this apple has no brand, so our `||` falls back to the category.
Falsy values, doing real work.

One more thing: why `textContent` and not `innerHTML`? Watch. If a product title contained this... the browser runs
it. That's called cross-site scripting. `textContent` shows it as harmless text. Data always goes in with
`textContent`."

**Aha moment:** the empty `<div id="grid">` becoming sixteen cards, and the XSS alert.

### [09:15–11:30] The wishlist: events and delegation

**ON SCREEN:**
1. Click a heart in the starter: nothing happens.
2. On-screen diagram: a click on the heart bubbling up: button → card → grid → document.
3. `src/main.js`, `TODO(lab-1.11)`: type `const saved = new Set();` and `updateWishlistCount()`.
4. `TODO(lab-1.12)`: type the delegated listener line by line, narrating each line.
5. Save. Click three hearts: red, outlined cards, "♥ 3 saved". Un-click one: "♥ 2 saved". Click an image: nothing, no
   error. Tab to a heart and press Space: it toggles.
6. Highlight the four update lines in the handler (`setAttribute`, `textContent`, `classList.toggle`,
   `updateWishlistCount()`).

**SAY:**
"Hearts don't do anything yet. We could add sixteen click listeners, one per heart. But there's a better way. When you
click something, the event *bubbles* up: the button, then the card, then the grid. So we put **one** listener on the
grid and ask: was that a heart?

The saved products live in a Set: a list that never holds the same id twice. That's our state.

In the listener: `closest('.heart')` finds the heart you clicked, or null if you clicked something else, and then we
just return. We read the id from `dataset`... and notice `Number`: dataset values are always strings. Then flip it in
the Set.

Save. Click, click, click. Three saved. And because the listener is on the grid, it works even for cards we add later.

But look at these four lines. One click, and I had to remember to update the attribute, the icon, the card, and the
counter. Forget one and the screen lies. Hold that thought."

**Aha moment:** one listener handles all sixteen hearts.

### [11:30–12:30] Why React and Angular exist

**ON SCREEN:** Split screen. Left: our imperative handler (the four update lines). Right, top: a React snippet;
right, bottom: an Angular template snippet (both from the guide's Lab 4 "In the real world").

```jsx
<button className="heart" aria-pressed={saved.has(p.id)} onClick={() => toggle(p.id)}>
  {saved.has(p.id) ? "♥" : "♡"}
</button>
```

```html
<button class="heart" [attr.aria-pressed]="saved().has(p.id)" (click)="toggle(p.id)">
  {{ saved().has(p.id) ? '♥' : '♡' }}
</button>
```

**SAY:**
"This is exactly why frameworks exist. What we did today is *imperative*: create this, set that, and remember every
update yourself. In React, you *describe* the button for the current state, and when the state changes, React updates
the page. In Angular, the template reads a signal and Angular keeps it in sync. Same click, same Set, same
`aria-pressed`, but keeping the screen in sync is no longer your job. And because you did it by hand today, you'll
understand exactly what React and Angular are doing for you."

### [12:30–13:00] Recap

**ON SCREEN:** Three bullets animate in over the finished app.

- JavaScript = the language; the runtime (browser or Node.js) adds the page, the network and the timers.
- The "weird" parts are old, consistent rules: floating point, `typeof null`, falsy values. Use `===`.
- The DOM by hand: `createElement` + `textContent`, and one delegated listener for many elements.

**SAY:**
"Three things to take away. JavaScript is the language; the runtime around it gives you the page and the timers. The
weird parts are old, consistent rules, so learn them once, and always use triple equals. And the DOM: create elements,
fill them with `textContent`, and let one listener handle many elements."

### [13:00–13:30] Call to action

**ON SCREEN:** The deeshatechacademy.com URL over the app, then the five-session outline (Session 1 highlighted).

**SAY:**
"This is Session 1 of our 5-day JavaScript and TypeScript Foundations program, the preparation track for our React and
Angular programs at Deesha Tech Academy. Next, we cover modern JavaScript, closures and `this`, async and the event
loop, and TypeScript for React and Angular. Register at deeshatechacademy.com, link in the description. See you in
Session 2."

---

## 4. B-roll, on-screen text, and pinned comment

**B-roll suggestions**

| Segment | B-roll |
|---|---|
| Cold open | Tight zoom on `0.30000000000000004` in the console; a quick "glitch" transition on the trailing `4` |
| What JavaScript is | A 1995-style Netscape Navigator window mock-up; the ECMA-262 spec cover page; the engine/runtime diagram animated in layers |
| Where JavaScript runs | React, Angular and Vue logos; a Node.js server responding in a terminal; a React Native app on a phone; VS Code, Slack and Discord windows side by side; Cloudflare Workers and AWS Lambda consoles; a TensorFlow.js webcam pose demo; an Arduino LED driven by Johnny-Five; a spinning Three.js model and a Phaser game; the Chrome extensions page; a Vite build finishing in the terminal |
| Playground | Slow scroll of the log with the entries fading in; a timer icon going into a "queue" box for the `setTimeout` experiment |
| Grid | A time-lapse of the empty grid filling with sixteen cards; the Elements panel expanding to show created nodes |
| Wishlist | The bubbling animation: a click dot travelling button → card → grid |
| React/Angular | Framework logos next to their snippets |

**On-screen text**

- 00:05 `0.1 + 0.2 = 0.30000000000000004`
- 01:30 `JavaScript ≠ Java`
- 02:00 `Engine = runs the code · Runtime = engine + APIs`
- 02:40 `document is not defined → the DOM comes from the browser`
- 05:00 `Always use ===`
- 05:30 `Falsy: false 0 -0 0n "" null undefined NaN`
- 05:50 `Single-threaded ≠ blocking`
- 08:45 `Data goes in with textContent, not innerHTML`
- 10:00 `Event delegation: one listener, many elements`
- 11:45 `Imperative (you update the DOM) → Declarative (the framework does)`
- 13:05 `Register at deeshatechacademy.com`

**Pinned comment**

> Try this in your browser console right now: `[] + {}`. What did you get, and can you explain why? Answer in the
> replies, and I'll pin the best explanation.
>
> This was Session 1 of the JavaScript & TypeScript Foundations program at Deesha Tech Academy, the preparation track
> for our React and Angular programs. Register at deeshatechacademy.com
