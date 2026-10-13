# ShopScope Lite — cart & store (Session 3 solution)

The finished app for **Session 3 — Functions, Closures, `this` & Immutability** of
*JavaScript & TypeScript Foundations* (Deesha Tech Academy).

Session 2's search, category filter and sort, with the search now debounced, plus
a cart built twice behind one interface:

- `src/store/createCartStore.js`: a closure-based store (React-hook style)
- `src/store/CartService.js`: a class with private fields (Angular service style)

Switch between them in the cart panel; every change logs a reference check.

```bash
npm install
npm run dev      # http://localhost:5173
```

Node 22 or newer. The session guide is `../README.md`.
