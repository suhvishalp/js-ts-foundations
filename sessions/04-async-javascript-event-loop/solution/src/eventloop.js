/**
 * The event-loop ordering puzzle.
 *
 * No DOM in here on purpose: the same function runs in the browser (the
 * "Event loop order" button) and in Node:
 *   node -e "import('./src/eventloop.js').then((m) => m.runEventLoopPuzzle(console.log))"
 *
 * `log` is called once per line. The returned promise resolves after the
 * last line (the setTimeout callback), so the caller can print a summary.
 */
export function runEventLoopPuzzle(log) {
  return new Promise((resolve) => {
    log("A · sync: script start");

    setTimeout(() => {
      log("B · task: setTimeout 0");
      resolve();
    }, 0);

    async function load() {
      log("C · sync: inside the async function");
      await null;
      log("D · microtask: after await");
    }
    load();

    Promise.resolve()
      .then(() => log("E · microtask: then #1"))
      .then(() => log("F · microtask: then #2"));

    queueMicrotask(() => log("G · microtask: queueMicrotask"));

    log("H · sync: script end");
  });
}

/** Your guess, as letters. Lab 1 compares it with what really happens. */
export const MY_PREDICTION = ["A", "C", "H", "D", "E", "G", "F", "B"];

/** Printed under the output, one line per rule. */
export const EXPLANATION = [
  "1. Synchronous code runs to completion first: A, C, H.",
  "   An async function runs synchronously until its first await, so C is sync.",
  "2. Then the microtask queue drains completely, in the order jobs were queued:",
  "   D (queued by await), E (then #1), G (queueMicrotask).",
  "   Running E queues F, and F runs in the same drain, before any task.",
  "3. Only when the microtask queue is empty may the browser render,",
  "   and then take the next task: B, the setTimeout callback.",
];
