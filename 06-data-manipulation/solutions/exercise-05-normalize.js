// Exercise 5 — Min-max & z-score normalization (AI/ML feature scaling)
// Run: node exercise-05-normalize.js

/**
 * Min-max scaling: linearly maps values into the [0, 1] range.
 * min -> 0, max -> 1, everything else proportionally in between.
 */
function minMax(values) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // If every value is identical, range is 0 and dividing gives NaN.
  // Convention: return all zeros for a constant feature.
  if (range === 0) return values.map(() => 0);

  return values.map(v => (v - min) / range);
}

/**
 * Z-score standardization: shifts to mean 0 and scales to std 1.
 * Preferred by most classic ML models when data is roughly normal.
 */
function zScore(values) {
  const n = values.length;
  if (n === 0) return [];

  // Phase 1: aggregate (mean, then variance) with reduce.
  const mean = values.reduce((a, v) => a + v, 0) / n;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  // Guard: constant feature -> std 0 -> divide-by-zero.
  if (std === 0) return values.map(() => 0);

  // Phase 2: per-element transform with map.
  return values.map(v => (v - mean) / std);
}

// --- Demo -------------------------------------------------------------------
console.log(minMax([10, 20, 30, 40, 50]));
// [ 0, 0.25, 0.5, 0.75, 1 ]

console.log(minMax([7, 7, 7])); // constant -> all zeros
// [ 0, 0, 0 ]

console.log(zScore([10, 20, 30, 40, 50]).map(x => x.toFixed(2)));
// [ '-1.41', '-0.71', '0.00', '0.71', '1.41' ]

// IMPORTANT (data leakage): in real training you fit min/max/mean/std on the
// TRAINING set, store them, and reuse those same numbers to transform the
// test/inference data. Never re-fit on test data.

module.exports = { minMax, zScore };
