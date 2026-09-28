/**
 * Closures from scratch. Each function below RETURNS a function (or functions)
 * that keeps using variables from the call that created it, long after that
 * call has returned. React hooks and Angular's RxJS operators are built on this.
 */

/** A counter factory. Every call gets its own private `count`; nothing outside can touch it. */
export function makeCounter(start = 0) {
  // TODO(lab-3.1): declare `let count = start;` and return { increment, reset, value }
  // as arrow functions that read and change `count`. Right now the counter never moves.
  return {
    increment: () => start,
    reset: () => {},
    value: () => start,
  };
}

/**
 * Caches results by argument. The `cache` Map lives in the closure: one per
 * memoized function, invisible to everyone else. Works for one argument, and
 * compares it the way a Map does: primitives by value, objects by REFERENCE.
 */
export function memoize(fn) {
  // TODO(lab-3.2): create a Map, return (arg) => { cache hit? return it : compute, store, return }.
  // Returning `fn` unchanged is a safe default: correct results, no caching.
  return fn;
}

/**
 * Waits until calls stop for `ms` milliseconds, then runs `fn` once with the
 * latest arguments. `timer` is shared by every call to the returned function,
 * which is exactly what lets a new keystroke cancel the previous one.
 */
export function debounce(fn, ms) {
  // TODO(lab-3.3): keep a `timer` in the closure; each call clears it and sets a new
  // setTimeout for `ms`. Returning `fn` unchanged means "run on every call" (no debounce).
  return fn;
}
