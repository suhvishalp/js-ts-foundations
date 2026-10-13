// Exercise 3 — Dataset statistics in one pass (reduce)
// Run: node exercise-03-describe.js

/**
 * Compute summary statistics for a numeric column in a SINGLE reduce pass.
 * Returns { count, sum, mean, min, max }.
 */
function describe(values) {
  // Guard the empty case up front — we can't divide by zero for the mean,
  // and Infinity/-Infinity seeds would leak out as min/max.
  if (values.length === 0) {
    return { count: 0, sum: 0, mean: 0, min: null, max: null };
  }

  // One pass computes count, sum, min and max together. This is more
  // efficient than four separate traversals and demonstrates reducing
  // into an OBJECT accumulator.
  const agg = values.reduce(
    (acc, v) => ({
      count: acc.count + 1,
      sum: acc.sum + v,
      min: Math.min(acc.min, v),
      max: Math.max(acc.max, v),
    }),
    { count: 0, sum: 0, min: Infinity, max: -Infinity }
  );

  // Derive the mean once, at the end, from the accumulated sum/count.
  return { ...agg, mean: agg.sum / agg.count };
}

// --- Demo -------------------------------------------------------------------
console.log(describe([10, 20, 30, 40, 50]));
// { count: 5, sum: 150, min: 10, max: 50, mean: 30 }

console.log(describe([]));
// { count: 0, sum: 0, mean: 0, min: null, max: null }

console.log(describe([42]));
// { count: 1, sum: 42, min: 42, max: 42, mean: 42 }

module.exports = { describe };
