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
    // TODO(lab-1.1): write the puzzle: sync logs, a setTimeout 0, an async function
    // with an await, a two-step Promise.then chain and a queueMicrotask.
    // Call resolve() inside the setTimeout callback. Until then, placeholders:
    log("A · ?");
    log("B · ?");
    log("C · ?");
    setTimeout(resolve, 0);
  });
}

/** Your guess, as letters. Lab 1 compares it with what really happens. */
// TODO(lab-1.2): write your prediction BEFORE you run the puzzle. After running it,
// replace EXPLANATION with the rules, one line each.
export const MY_PREDICTION = ["A", "B", "C", "D", "E", "F", "G", "H"];

/** Printed under the output, one line per rule. */
export const EXPLANATION = ["(Lab 1: explain the order here, one rule per line.)"];
