/**
 * Example: the four core vector operations, with commentary.
 *
 * No dependencies. Run: npx tsx examples/cosine-similarity.ts
 */

function dot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) throw new Error("length mismatch");
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function magnitude(a: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s);
}

function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const ma = magnitude(a);
  const mb = magnitude(b);
  if (ma === 0 || mb === 0) return 0; // undefined direction → 0, never NaN
  return dot(a, b) / (ma * mb);
}

function euclideanDistance(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) throw new Error("length mismatch");
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

// Toy 3-D "embeddings"
const dog = [0.9, 0.1, 0.0];
const puppy = [0.85, 0.15, 0.02];
const spreadsheet = [0.0, 0.05, 0.95];

console.log("=== Dot product ===");
console.log("dog · puppy       =", dot(dog, puppy).toFixed(4));
console.log("dog · spreadsheet =", dot(dog, spreadsheet).toFixed(4));

console.log("\n=== Magnitude ===");
console.log("|dog| =", magnitude(dog).toFixed(4));

console.log("\n=== Cosine similarity (angle; ignores length) ===");
console.log("dog ~ puppy       =", cosineSimilarity(dog, puppy).toFixed(4)); // ~0.997
console.log("dog ~ spreadsheet =", cosineSimilarity(dog, spreadsheet).toFixed(4)); // ~0.058

console.log("\n=== Cosine ignores magnitude ===");
const big = dog.map((x) => x * 100); // same direction, 100x longer
console.log("dog ~ (100·dog) cosine   =", cosineSimilarity(dog, big).toFixed(4)); // 1.0000
console.log("dog ~ (100·dog) euclidean=", euclideanDistance(dog, big).toFixed(4)); // large
// Cosine sees the same direction (1.0); euclidean sees a big positional gap.
