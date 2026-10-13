// Example 01 — Basic types, inference, arrays, tuples, objects
// Run: npx tsx 01-basic-types.ts

// --- Primitives -------------------------------------------------------------
let title: string = "embeddings";
let count: number = 42;
let isReady: boolean = true;

// Inference: no annotation needed, TS figures it out
let inferredName = "Ada"; // string
const pi = 3.14; // literal type 3.14 (const never changes)

// --- Arrays & tuples --------------------------------------------------------
const scores: number[] = [0.1, 0.5, 0.9]; // an embedding-like vector
const matrix: number[][] = [
  [1, 2],
  [3, 4],
]; // a 2D array / mini tensor
const point: [number, number] = [1.5, 2.0]; // tuple: fixed length, typed slots
const vocabEntry: [token: string, id: number] = ["cat", 3]; // named tuple

console.log({ title, count, isReady, inferredName, pi });
console.log("scores:", scores, "matrix:", matrix);
console.log("point:", point, "vocabEntry:", vocabEntry);

// --- Object types -----------------------------------------------------------
const config: {
  model: string;
  temperature: number;
  options: { stream: boolean };
} = {
  model: "gpt-4",
  temperature: 0.7,
  options: { stream: true },
};
console.log("config:", config);

// --- unknown vs any ---------------------------------------------------------
let safe: unknown = JSON.parse('{"x": 1}');
// safe.x;  // ❌ would be an error — must narrow first
if (typeof safe === "object" && safe !== null && "x" in safe) {
  console.log("narrowed unknown:", safe);
}

// The following lines are commented because they are intentional errors:
// title = 42;              // ❌ number not assignable to string
// scores.push("high");     // ❌ string not assignable to number
