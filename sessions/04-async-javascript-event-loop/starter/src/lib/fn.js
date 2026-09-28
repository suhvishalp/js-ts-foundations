/**
 * Closures from scratch. Each function below RETURNS a function (or functions)
 * that keeps using variables from the call that created it, long after that
 * call has returned. React hooks and Angular's RxJS operators are built on this.
 */

/** A counter factory. Every call gets its own private `count`; nothing outside can touch it. */
export function makeCounter(start = 0) {
  let count = start;
  return {
    increment: () => {
      count += 1;
      return count;
    },
    reset: () => {
      count = start;
    },
    value: () => count,
  };
}

/**
 * Caches results by argument. The `cache` Map lives in the closure: one per
 * memoized function, invisible to everyone else. Works for one argument, and
 * compares it the way a Map does: primitives by value, objects by REFERENCE.
 */
export function memoize(fn) {
  const cache = new Map();
  return (arg) => {
    if (cache.has(arg)) {
      return cache.get(arg);
    }
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

/**
 * Waits until calls stop for `ms` milliseconds, then runs `fn` once with the
 * latest arguments. `timer` is shared by every call to the returned function,
 * which is exactly what lets a new keystroke cancel the previous one.
 */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
