/**
 * Cart store, "React-hook style": a function that closes over private state
 * and returns the functions allowed to touch it. No class, no `this`, so every
 * function can be passed around on its own and still work.
 *
 * The shape (getState + subscribe) is exactly what React's
 * useSyncExternalStore(subscribe, getSnapshot) expects.
 */
import { addLine, changeQty, removeLine, freezeLines } from "../lib/cart.js";

export function createCartStore(initialLines = []) {
  let lines = freezeLines(initialLines);
  const listeners = new Set();

  // The ONE place state changes. Every action goes through here.
  function setLines(next) {
    if (next === lines) {
      return; // same reference = nothing changed, so nobody needs to hear about it
    }
    const prev = lines;
    lines = freezeLines(next);
    listeners.forEach((listener) => listener(lines, prev));
  }

  return {
    getState: () => lines,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    add: (product) => setLines(addLine(lines, product)),
    increment: (id) => setLines(changeQty(lines, id, +1)),
    decrement: (id) => setLines(changeQty(lines, id, -1)),
    remove: (id) => setLines(removeLine(lines, id)),
    clear: () => setLines(lines.length === 0 ? lines : []),
  };
}
