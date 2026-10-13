// memoize.js — runnable with:  node memoize.js
//
// A general-purpose memoize built on a closure-captured cache, plus a
// domain-specific "embedding" example that shows the cost savings.

// ---------------------------------------------------------------------------
// Generic memoize: wraps any pure function so repeated inputs are cached.
//   - `fn`    : the (pure!) function to memoize
//   - `keyFn` : maps arguments to a cache key (defaults to the first arg)
// The `cache` Map lives in the closure and persists across calls.
// ---------------------------------------------------------------------------
function memoize(fn, keyFn = (...args) => args[0]) {
  const cache = new Map();

  return function (...args) {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key); // cache hit: skip the expensive work
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// ---------------------------------------------------------------------------
// Example: memoizing an expensive embedder.
// We count real invocations so the savings are visible.
// ---------------------------------------------------------------------------
let realCalls = 0;
function expensiveEmbed(text) {
  realCalls += 1;
  // Stand-in for a model forward pass / API call: a deterministic pseudo-vector.
  const vec = [];
  for (let i = 0; i < 4; i++) {
    let acc = i + 1;
    for (const ch of text) acc = (acc * 31 + ch.charCodeAt(0)) % 1000;
    vec.push(acc);
  }
  return vec;
}

const embed = memoize(expensiveEmbed);

console.log(embed("hello")); // computes  => e.g. [ ... ]
console.log(embed("hello")); // cached (same array reference)
console.log(embed("world")); // computes
console.log(embed("hello")); // cached
console.log("real embed calls:", realCalls); // => 2  (only "hello" and "world")

// ---------------------------------------------------------------------------
// Example with a multi-argument key: cache by BOTH text and model name.
// ---------------------------------------------------------------------------
let pairCalls = 0;
const embedWithModel = memoize(
  (text, model) => {
    pairCalls += 1;
    return `${model}:${text.length}`;
  },
  (text, model) => `${model}::${text}` // composite key
);

embedWithModel("cat", "small");
embedWithModel("cat", "small"); // cached
embedWithModel("cat", "large"); // different model => recomputed
console.log("pair calls:", pairCalls); // => 2

// Export for reuse in solutions (works when imported via require)
module.exports = { memoize };
