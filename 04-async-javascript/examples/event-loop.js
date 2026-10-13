// event-loop.js
// Run with: node event-loop.js
//
// This file demonstrates the exact ordering of synchronous code,
// microtasks (Promise callbacks / queueMicrotask) and macrotasks
// (setTimeout / setInterval / setImmediate).
//
// Mental model:
//   1. The call stack runs ALL synchronous code first, top to bottom.
//   2. When the stack is empty, the engine drains the ENTIRE microtask
//      queue (Promise .then/.catch/.finally callbacks, queueMicrotask,
//      and the "await" continuation).
//   3. Only then does it take ONE macrotask (e.g. one setTimeout callback)
//      off the macrotask queue, run it, and then drain microtasks again.
//   4. Repeat forever. This is "the event loop".

console.log('1: sync start');

setTimeout(() => {
  console.log('5: setTimeout (macrotask)');
}, 0);

Promise.resolve().then(() => {
  console.log('3: promise.then (microtask)');
});

queueMicrotask(() => {
  console.log('4: queueMicrotask (microtask)');
});

console.log('2: sync end');

// -----------------------------------------------------------------------------
// Expected output (exact order):
//
//   1: sync start
//   2: sync end
//   3: promise.then (microtask)
//   4: queueMicrotask (microtask)
//   5: setTimeout (macrotask)
//
// Why:
//   - "1" and "2" are synchronous, so they run first, in order.
//   - The setTimeout callback is a MACROTASK; it waits until every microtask
//     has run, so it prints LAST even though its delay is 0ms.
//   - "3" and "4" are MICROTASKS. They run after the synchronous code finishes
//     but before any macrotask. They run in the order they were queued.
// -----------------------------------------------------------------------------

// A second, richer demonstration mixing async/await into the picture.
// We schedule this on a later macrotask so its output does not interleave
// with the block above (making the lesson easier to read).
setTimeout(() => {
  console.log('\n--- async/await ordering demo ---');

  async function demo() {
    console.log('A: inside demo, before await (sync)');
    await null; // "await" schedules everything after it as a MICROTASK
    console.log('C: inside demo, after await (microtask)');
  }

  console.log('start demo block (sync)');
  demo();
  console.log('B: after calling demo() (sync)');

  Promise.resolve().then(() => console.log('D: trailing microtask'));

  // Expected order for THIS block:
  //   start demo block (sync)
  //   A: inside demo, before await (sync)
  //   B: after calling demo() (sync)
  //   C: inside demo, after await (microtask)
  //   D: trailing microtask
  //
  // Everything up to the first `await` runs synchronously. The code AFTER
  // the await is queued as a microtask, so "B" (which is still synchronous
  // in the caller) runs before "C".
}, 10);
