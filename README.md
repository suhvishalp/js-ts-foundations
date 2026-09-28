# JavaScript & TypeScript Foundations

**The 5-day preparation track for React and Angular** · by [Deesha Tech Academy](https://deeshatechacademy.com)

Understand **what** JavaScript is, **why** it behaves the way it does, and **how** to use modern JavaScript and TypeScript confidently in real React and Angular projects.

Across the five sessions you build one app step by step: **ShopScope Lite**, a product explorer. It starts as a page of cards rendered by hand and ends as a live, strictly typed catalogue with cancellable search and a cart. It's the same product domain you'll use in the ReactJS and Angular programs, so you arrive already at home.

> Open [`index.html`](index.html) in a browser for the course overview.

---

## The sessions

| # | Session | Level | What you build | Key ideas |
|---|---|---|---|---|
| 1 | [JavaScript: What, Why & How](sessions/01-javascript-what-why-how/) | Beginner | Your first interactive product page, with stock badges and a wishlist | Engines & runtimes, where JS runs today, types & values, misconceptions, the DOM, events |
| 2 | [Modern JavaScript (ES6+)](sessions/02-modern-javascript-es6/) | Beginner | Search, category filters, sorting and a live stats panel | `let`/`const`, destructuring, spread/rest, `?.` / `??`, map/filter/reduce, Set, modules |
| 3 | [Functions, Closures, `this` & Immutability](sessions/03-functions-closures-this-immutability/) | Advanced · React & Angular | A cart built twice: a hook-style closure store and an Angular-style class service; debounced search | Closures, stale state, `this` binding, classes, reference equality, immutable updates |
| 4 | [Async JavaScript & the Event Loop](sessions/04-async-javascript-event-loop/) | Advanced · React & Angular | A live catalogue from the DummyJSON API, with cancellable search, retries and a network log | Event loop, microtasks, promises, async/await, fetch, AbortController, Observables |
| 5 | [TypeScript for React & Angular](sessions/05-typescript-for-react-angular/) | Advanced · React & Angular | The live catalogue in strict TypeScript, plus typed React and Angular reference code | Inference, unions & narrowing, discriminated unions, generics, utility types, strict mode |

Every session folder contains:

```
README.md          the session guide: labs in Problem → Concept → Steps → Verify → Watch out → In the real world
YOUTUBE-SCRIPT.md  a timestamped script for recording a demo session for YouTube
starter/           the runnable project you start from, with TODO(lab-N.x) markers
solution/          the finished project
```

## Running a session

You need **Node.js 22 or newer**.

```bash
cd sessions/01-javascript-what-why-how/starter
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173), then follow the session's `README.md`. Stuck? Compare your work with `solution/`.

Prefer the browser? Open any `starter/` folder in [StackBlitz](https://stackblitz.com): it runs with no local setup.

## Who this is for

- You're joining a React or Angular program and want solid JavaScript first.
- You've written some JavaScript by copying examples, and now want to understand *why* it works.
- You know another language (Java, C#, Python) and want to learn how JavaScript really differs.

No framework knowledge is assumed. Sessions 1 and 2 start from zero, at a comfortable pace.

## Repository layout

```
index.html, styles.css   course landing page (static, open directly)
COURSE-SPEC.md           how every session is structured (for contributors)
shared/                  design system (base.css) and the offline product data
sessions/                the five sessions
```

## Register

This track is the preparation course for the **React** and **Angular** programs at Deesha Tech Academy.
**Register at [deeshatechacademy.com](https://deeshatechacademy.com).**

---

Trainer: **Vishal Shah**, Founder & Principal Trainer, Deesha Tech Academy (20 years in the industry).
Product data and API: [DummyJSON](https://dummyjson.com).
