/**
 * Solution — Exercise 1: Vector toolkit.
 *
 * A reusable, well-typed vector-math module. Every function accepts
 * `ArrayLike<number>` so it works identically for `number[]` and `Float32Array`.
 *
 * Run: npx tsx solutions/exercise-01-vec.ts
 */
import { pathToFileURL } from "node:url";

/** Guard: both vectors must have the same number of dimensions. */
function assertSameLength(a: ArrayLike<number>, b: ArrayLike<number>): void {
  if (a.length !== b.length) {
    throw new Error(`Vectors must be same length: ${a.length} vs ${b.length}`);
  }
}

/** Dot product: sum of element-wise products. The workhorse operation. */
export function dot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  assertSameLength(a, b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/** L2 norm (length) of a vector: sqrt(sum of squares). */
export function magnitude(a: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * a[i];
  return Math.sqrt(sum);
}

/**
 * Cosine similarity in [-1, 1]. Returns 0 (not NaN) if either vector is zero,
 * because a zero vector has no direction and the angle is undefined.
 */
export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  assertSameLength(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dot(a, b) / (magA * magB);
}

/** Euclidean (L2) distance: length of (a - b). 0 = identical, larger = farther. */
export function euclideanDistance(a: ArrayLike<number>, b: ArrayLike<number>): number {
  assertSameLength(a, b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** Scale a vector to unit length while preserving direction. */
export function normalize(a: number[]): number[] {
  const mag = magnitude(a);
  if (mag === 0 || !Number.isFinite(mag)) return a.slice(); // never divide by 0/NaN
  return a.map((x) => x / mag);
}

// --- self-test -------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log("dot([1,2,3],[4,5,6]) =", dot([1, 2, 3], [4, 5, 6])); // 32
  console.log("magnitude([3,4]) =", magnitude([3, 4])); // 5
  console.log(
    "cosine(dog, puppy) =",
    cosineSimilarity([0.9, 0.1, 0.0], [0.85, 0.15, 0.02]).toFixed(3), // ~0.997
  );
  console.log(
    "cosine(zero, x) =",
    cosineSimilarity([0, 0, 0], [1, 2, 3]), // 0, not NaN
  );
  console.log("euclidean([0,0],[3,4]) =", euclideanDistance([0, 0], [3, 4])); // 5
  console.log("normalize([3,4]) =", normalize([3, 4])); // [0.6, 0.8]
}
