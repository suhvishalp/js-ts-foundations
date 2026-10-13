// Exercise 8 — Generic type guard isDefined + filter narrowing
// Run: npx tsx exercise-08-is-defined.ts

// The `v is T` return type is a TYPE PREDICATE. When used as a filter callback,
// it doesn't just remove null/undefined at runtime — it narrows the array's
// element type at compile time, so the result is T[] not (T | null)[].
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Simulate mapping documents to embeddings where some failed and returned null.
const maybeEmbeddings: (number[] | null)[] = [
  [0.1, 0.2, 0.3],
  null,
  [0.4, 0.5, 0.6],
  null,
  [0.7, 0.8, 0.9],
];

// Without the predicate, `clean` would be (number[] | null)[] and every later
// use would need a null check. With it, `clean` is number[][].
const clean: number[][] = maybeEmbeddings.filter(isDefined);

console.log("kept", clean.length, "of", maybeEmbeddings.length); // kept 3 of 5
console.log(clean);

// Now downstream code needs NO null handling:
const dims = clean.map(v => v.length);
console.log("dims:", dims); // [3, 3, 3]

export { isDefined };
