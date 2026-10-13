// Solution to Exercise 1 — Predict the print order
// Run with: node exercise-01.js

console.log('a');
setTimeout(() => console.log('b'), 0);
Promise.resolve()
  .then(() => console.log('c'))
  .then(() => console.log('d'));
queueMicrotask(() => console.log('e'));
console.log('f');

// -----------------------------------------------------------------------------
// Exact print order:
//   a
//   f
//   c
//   e
//   d
//   b
//
// Line-by-line reasoning:
//   'a' -> synchronous, runs immediately (1st).
//   'f' -> synchronous, the last sync statement, runs before ANY async (2nd).
//   'c' -> microtask from the first .then; runs once sync is done. At this
//          moment the microtask queue holds [c, e] (the second .then is not
//          queued yet — it only queues after 'c' resolves). Runs 3rd.
//   'e' -> queueMicrotask was queued after the first .then but before 'c' ran,
//          so it sits behind 'c'. Runs 4th.
//   'd' -> the second .then is queued only when 'c' completes, so it lands at
//          the BACK of the microtask queue, after 'e'. Runs 5th.
//   'b' -> setTimeout is a MACROTASK; it waits for the entire microtask queue
//          to drain first, so despite the 0ms delay it runs LAST (6th).
//
// Key lesson: chained .then callbacks are queued LAZILY — each link is only
// enqueued when the previous link resolves. That's why 'e' (queued eagerly)
// beats 'd' (queued only after 'c' ran), even though 'd' appears "first".
// -----------------------------------------------------------------------------
