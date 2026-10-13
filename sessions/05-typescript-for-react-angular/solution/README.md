# ShopScope Lite — typed (Session 5 solution)

The finished app for **Session 5 · TypeScript for React & Angular**: Session 4's live
DummyJSON catalogue rewritten in strict TypeScript. Discriminated request state with an
exhaustive render, a generic `fetchJson<T>()` and `createStore<T>()`, type guards at the
network boundary, a typed DOM, and a "Type safety" panel showing three bugs the compiler caught.

```bash
npm install
npm run dev        # Vite dev server (strips types, does not check them)
npm run typecheck  # tsc --noEmit: the actual type check
npm run build      # typecheck, then a production build
```

`examples/` holds React and Angular reference files that use the same types; see
`examples/README.md`. The session guide is `../README.md`.
