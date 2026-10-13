// Example 01 — Generics: functions, constraints, interfaces, classes
// Run: npx tsx 01-generics.ts

// --- Generic function -------------------------------------------------------
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
console.log(first([1, 2, 3])); // 1   (typed number)
console.log(first(["a", "b"])); // a  (typed string)

// --- Constraint: T must have a numeric length --------------------------------
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
console.log(longest("hi", "hello")); // hello
console.log(longest([1], [1, 2, 3])); // [1,2,3]

// --- Constraint: K must be a key of T (type-safe getter) --------------------
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const model = { name: "gpt-4o", contextWindow: 128000, supportsTools: true };
console.log(getProp(model, "name")); // gpt-4o (string)
console.log(getProp(model, "contextWindow")); // 128000 (number)
// getProp(model, "nope");   // ❌ not a key

// --- Generic interface with a default ---------------------------------------
interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}
const resp: ApiResponse<string[]> = { status: 200, data: ["ok"] };
console.log(resp);

// --- Generic class (a tiny typed container) ---------------------------------
class Container<T> {
  private items: T[] = [];
  add(item: T): void {
    this.items.push(item);
  }
  get(i: number): T | undefined {
    return this.items[i];
  }
  toArray(): T[] {
    return [...this.items];
  }
}
const nums = new Container<number>();
nums.add(1);
nums.add(2);
console.log(nums.toArray()); // [1, 2]
