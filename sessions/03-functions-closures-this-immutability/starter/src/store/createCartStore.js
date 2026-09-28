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
  // TODO(lab-3.7): private state. `let lines = freezeLines(initialLines);`, a Set of listeners,
  // and a setLines(next) that skips same-reference updates, swaps `lines`, and calls
  // every listener with (lines, prev). Then make getState and subscribe use them.

  return {
    getState: () => initialLines,
    subscribe: () => () => {},
    // TODO(lab-3.8): each action is one line: setLines(someUpdate(lines, ...)).
    add: () => {},
    increment: () => {},
    decrement: () => {},
    remove: () => {},
    clear: () => {},
  };
}
