// solutions/exercise-03.js — Generic memoize for embeddings
// Run with:  node exercise-03.js

// `memoize` wraps a PURE function `fn` so repeated calls with the same key
// return a cached result instead of recomputing.
//   - keyFn maps arguments to a cache key; defaults to the first argument.
//   - The Map lives in the closure, so state is private and persists.
function memoize(fn, keyFn = (...args) => args[0]) {
  const cache = new Map();

  return function (...args) {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key); // cache hit
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// --- Demonstration ---------------------------------------------------------
// A fake embedder that counts how often it actually runs.
let realCalls = 0;
function fakeEmbed(text) {
  realCalls += 1;
  // Deterministic stand-in vector so results are reproducible.
  return [text.length, [...text].reduce((s, c) => s + c.charCodeAt(0), 0)];
}

const embed = memoize(fakeEmbed);

console.log(embed("hello")); // computes  => [5, 532]
console.log(embed("hello")); // cached
console.log(embed("world")); // computes
console.log(embed("hello")); // cached
console.log(embed("world")); // cached

console.log("real embed calls:", realCalls); // => 2 (only two unique inputs)

// Bonus: composite key memoization (cache by text AND model).
let pairCalls = 0;
const embedModel = memoize(
  (text, model) => {
    pairCalls += 1;
    return `${model}#${text.length}`;
  },
  (text, model) => `${model}::${text}`
);
embedModel("cat", "sm");
embedModel("cat", "sm"); // cached
embedModel("cat", "lg"); // different model => recompute
console.log("pair calls:", pairCalls); // => 2

module.exports = { memoize };
