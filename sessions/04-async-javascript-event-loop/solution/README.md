# Session 4 solution — ShopScope Lite, live catalogue

The finished app: products and categories from https://dummyjson.com loaded in
parallel, loading/error/empty states, a debounced search that cancels stale
requests with AbortController, retry with exponential backoff, a Network log,
a tiny Observable, and an event-loop puzzle you can run.

```bash
npm install
npm run dev        # http://localhost:5173
```

Try it: tick **Slow network**, type quickly in the search box, and watch the
Network log. Then untick **Cancel stale requests** to see the race condition.
The session guide is `../README.md`.
