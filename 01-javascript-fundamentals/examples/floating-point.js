// examples/floating-point.js
// Why 0.1 + 0.2 !== 0.3, and how to deal with it — crucial for ML.
// Run: node examples/floating-point.js

console.log("0.1 + 0.2 =", 0.1 + 0.2);            // 0.30000000000000004
console.log("=== 0.3 ?", 0.1 + 0.2 === 0.3);      // false

// The senior-engineer fix: compare within a tolerance (epsilon).
function nearlyEqual(a, b, epsilon = 1e-9) {
  return Math.abs(a - b) < epsilon;
}
console.log("nearlyEqual:", nearlyEqual(0.1 + 0.2, 0.3)); // true

// A probability distribution that "should" sum to 1 often won't, exactly.
const probs = [0.1, 0.2, 0.3, 0.4];
const sum = probs.reduce((acc, p) => acc + p, 0); // reduce arrives in Module 06
console.log("\nDistribution sum:", sum);           // 1 (here) — but don't rely on ===
console.log("Sum === 1 ?", sum === 1);
console.log("Sum nearly 1 ?", nearlyEqual(sum, 1));

// NaN: the value that isn't equal to itself.
const bad = 0 / 0;
console.log("\n0/0 =", bad);                       // NaN
console.log("NaN === NaN ?", bad === bad);         // false!
console.log("Number.isNaN(bad) ?", Number.isNaN(bad)); // true — the right test

// One NaN poisons a whole computation (e.g. a dot product):
const vec = [1, 2, NaN, 4];
const total = vec.reduce((a, b) => a + b, 0);
console.log("\nSum with a NaN inside:", total);    // NaN — guard your data!
