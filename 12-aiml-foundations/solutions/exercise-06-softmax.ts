/**
 * Solution — Exercise 6: Numerically stable softmax.
 *
 * Shows why the naive formula produces NaN on large inputs and how the
 * "subtract the max" trick fixes it without changing the result.
 *
 * Run: npx tsx solutions/exercise-06-softmax.ts
 */
import { pathToFileURL } from "node:url";

/** Naive softmax — overflows: Math.exp(1000) === Infinity, Infinity/Infinity = NaN. */
export function softmaxNaive(logits: number[]): number[] {
  const exps = logits.map((x) => Math.exp(x));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/**
 * Stable softmax: subtract the max first. Shifting every input by a constant
 * cancels in the division, so the distribution is identical — but now the
 * largest exponent is exp(0) = 1, safely in range.
 */
export function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log("naive([1000,1001,1002]) =", softmaxNaive([1000, 1001, 1002]));
  // [ NaN, NaN, NaN ]  ❌

  const stable = softmax([1000, 1001, 1002]);
  console.log("stable([1000,1001,1002]) =", stable.map((p) => p.toFixed(3)));
  // [ '0.090', '0.245', '0.665' ]  ✅

  const sum = stable.reduce((a, b) => a + b, 0);
  console.log("sums to ~1.0 =", Math.abs(sum - 1) < 1e-9); // true

  // Sanity check: stable and naive agree on small inputs.
  console.log("agree on small inputs:", softmax([1, 2, 3]).map((p) => p.toFixed(3)));
}
