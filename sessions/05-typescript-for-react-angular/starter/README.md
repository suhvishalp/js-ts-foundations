# ShopScope Lite — typed (Session 5 starter)

The starting point for **Session 5 · TypeScript for React & Angular**. It is Session 4's live
DummyJSON catalogue, already converted to `.ts` files with strict mode on. The logic works; the
types are loose (`any`, `status: string`, `Promise<any>`). Sixteen `TODO(lab-5.x)` markers show
where the real types go.

```bash
npm install
npm run dev        # the app runs today
npm run typecheck  # passes today, because `any` switches the checks off
npm run build      # typecheck, then a production build
```

Find every marker with `grep -rn "TODO(lab-5" src`. `examples/` holds React and Angular
reference files for Lab 5 (not compiled). The session guide is `../README.md`.
