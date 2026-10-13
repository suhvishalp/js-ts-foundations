# Course spec: JavaScript & TypeScript Foundations (for React and Angular)

The single source of truth for how every session in this repo is built. Anyone adding or editing a session follows this.

**Course:** *JavaScript & TypeScript Foundations: the 5-day preparation track for React and Angular*
**Academy:** Deesha Tech Academy (https://deeshatechacademy.com) · **Trainer:** Vishal Shah (Founder & Principal Trainer, 20 years in the industry)
**Promise to participants:** after five sessions you understand *what* JavaScript is, *why* it behaves the way it does, and *how* to use modern JavaScript and TypeScript confidently in React and Angular projects.

> **Never** mention pricing, cost or discounts anywhere in this repo. The course is positioned as a premium preparation track.

## The five sessions

| # | Folder | Title | Level | App you build (ShopScope Lite) |
|---|---|---|---|---|
| 1 | `sessions/01-javascript-what-why-how` | JavaScript: What, Why & How | Beginner | Your first interactive product page: cards rendered from data, stock badges, a wishlist you keep in sync by hand |
| 2 | `sessions/02-modern-javascript-es6` | Modern JavaScript (ES6+) | Beginner | Search, category filters, sorting and a live stats bar, built with array methods and modules |
| 3 | `sessions/03-functions-closures-this-immutability` | Functions, Closures, `this` & Immutability | Advanced (React/Angular) | A real cart, implemented twice: a closure-based store (React hook style) and a class service (Angular service style); debounced search |
| 4 | `sessions/04-async-javascript-event-loop` | Async JavaScript & the Event Loop | Advanced (React/Angular) | A live catalogue from the DummyJSON API: loading/error/empty states, cancellable searches, retries, a network log and an event-loop demo |
| 5 | `sessions/05-typescript-for-react-angular` | TypeScript for React & Angular | Advanced (React/Angular) | The live catalogue rewritten in strict TypeScript, plus reference React and Angular files showing the same types in each framework |

The app theme is ShopScope Lite, the same product explorer learners build in the ReactJS Developer Program, so this track leads straight into it. **The starter of session N+1 continues from session N's solution** (the same file names and structure, extended).

## Folder layout (every session)

```
sessions/0N-slug/
  README.md          ← the session guide (format below)
  YOUTUBE-SCRIPT.md  ← script for recording a promotional demo session for YouTube
  starter/           ← runnable project with TODO(lab-N.x) markers; must build
  solution/          ← the finished project; must build; polished (brag-ready)
```

Each `starter/` and `solution/` is a self-contained Vite project:

```
package.json   ("type": "module", engines node >=22, scripts: dev / build / preview; devDependencies: "vite": "8.3.0" [+ "typescript": "5.9.3" in session 5])
index.html     (<title>, <meta name="description">, the branded .session-header, then <main>)
src/main.js    (session 5: src/main.ts)
src/base.css   (copy of shared/base.css, unmodified)
src/style.css  (session-specific styles only)
src/...        (lib/, ui/, data/ as the session needs)
README.md      (short: what this is, `npm install && npm run dev`)
.gitignore     (node_modules, dist)
```

- **Data:** sessions 1–3 copy `shared/products.js` to `src/data/products.js`, unmodified. Sessions 4–5 fetch the live API at `https://dummyjson.com` (no key needed), using the same product shape.
- **Styling:** use the classes in `shared/base.css` (`.session-header`, `.chip.js/.ts/.react/.angular`, `.toolbar`, `.grid`, `.card`, `.badge.ok/.low/.out`, `.heart`, `.layout`, `.panel`, `.log`, `.concept`, `.state`, `.skeleton`, `.btn`, `.count`). Session-specific additions go in `src/style.css`.
- **Brag-ready header** (solution/index.html): `.eyebrow` "Session N · JS & TS Foundations", `<h1>` session title, `<p>` a one-line promise, and `.chips` naming the concepts. Keep a professional tone: this page is what a launch video will show.
- **No frameworks, no extra dependencies.** Plain JavaScript (sessions 1–4) and TypeScript (session 5), plus Vite.
- **Starters must build and run.** Stubs return safe defaults. The page renders, and the TODOs are where the behaviour goes. Mark every edit site `// TODO(lab-N.x): …`.

## Session guide format (README.md), mirroring the React demos

```
# Session N — <Title>
**Session guide** · ~120 minutes · <one-line promise>
---
## Where you are starting from        (what's in starter/, what's written for you, how many TODOs)
## What you ship today                 (the app; then "By the end you will be able to answer, without hesitating:" + 6–8 bullets)
> one blockquote with the session's key idea
## Before the session (10 minutes)     (StackBlitz: open the starter folder; or local: cd starter && npm install && npm run dev)
## How this guide works                (Problem → Concept → Steps → Verify → Watch out → Challenge → In the real world)
## Orientation — what is in the box (5 min)
## Lab 1 — <name> (NN min)
### Problem  ### Concept  ### Steps  ### Verify  ### Watch out  ### Challenge (2 min)  ### In the real world
... 4–5 labs ...
## Wrap-up — what you can now do
## Next session
## Troubleshooting
```

- **Concept sections** explain *what*, *why* and *how*, with short code examples and a "Misconception" callout where one applies.
- **Steps** are numbered and exact: which file, which TODO, the code to write. Code blocks must match the solution.
- **In the real world** (sessions 3–5 especially) connects each lab explicitly to **React** *and* **Angular**. Examples: closures → hooks and stale state; immutability → React re-renders and Angular OnPush; `this` → Angular class methods and event bindings; Observables → Angular HttpClient and RxJS; AbortController → React `useEffect` cleanup; TypeScript → typed props and `useState<T>`, and typed services, `@Input()` and `HttpClient.get<T>()`.
- **Tone:** warm and encouraging, so beginners feel comfortable; precise, so experienced people respect it. Explain *why* before *how*.
- **Length:** roughly 450–800 lines.

## YOUTUBE-SCRIPT.md format (a recorded promotional demo session)

A script Vishal records as a 10–14 minute YouTube demo session that teaches something real and makes people want the full course. Sections:

1. **Video metadata:** 3 title options, a thumbnail text (at most 5 words), and a YouTube description (with deeshatechacademy.com and a "Register at deeshatechacademy.com" line) and tags.
2. **Recording setup:** what to have open (the solution app in the browser, the starter in the editor), screen layout, font size.
3. **The script, as a timestamped table or sections:** `[mm:ss–mm:ss] Segment name`, then **ON SCREEN** (exact actions: which file, what to type, what to click) and **SAY** (natural spoken lines in plain, conversational English; no jargon without explanation).
   - Cold open hook (0:00–0:30): a surprising question or live demo moment, e.g. a misconception proven wrong on screen.
   - Intro: Vishal, Deesha Tech Academy, what this session covers, what we'll build.
   - 3–4 demo segments, each building part of the app live, each with one "aha" moment.
   - A React/Angular connection segment (sessions 3–5: show exactly where this appears in real React and Angular code).
   - Recap in three bullets.
   - Call to action: "This is Session N of our 5-day JavaScript & TypeScript Foundations program, the preparation track for our React and Angular programs at Deesha Tech Academy. Register at deeshatechacademy.com, link in the description." Never mention pricing or cost.
4. **B-roll and on-screen text suggestions**, and **pinned comment** text.

## Accuracy rules
- Every claim about JavaScript/TypeScript behaviour must be correct: run it if unsure.
- Code in guides must match the solution files.
- Verify `npm install && npm run build` passes in **both** `starter/` and `solution/`, then delete `node_modules/` and `dist/`.
