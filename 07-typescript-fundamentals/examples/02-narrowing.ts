// Example 02 — All the narrowing techniques in one place
// Run: npx tsx 02-narrowing.ts

// --- typeof (primitives) ----------------------------------------------------
function format(value: string | number): string {
  if (typeof value === "string") return value.toUpperCase();
  return value.toFixed(2);
}
console.log(format("hi")); // HI
console.log(format(3.14159)); // 3.14

// --- truthiness (null/undefined) --------------------------------------------
function greet(name: string | null): string {
  return name ? name.toUpperCase() : "ANONYMOUS";
}
console.log(greet("ada")); // ADA
console.log(greet(null)); // ANONYMOUS

// --- `in` (property presence) -----------------------------------------------
type SuccessResponse = { data: string };
type ErrorResponse = { error: string };
function handle(res: SuccessResponse | ErrorResponse): string {
  if ("data" in res) return `OK: ${res.data}`;
  return `FAIL: ${res.error}`;
}
console.log(handle({ data: "42 rows" })); // OK: 42 rows
console.log(handle({ error: "timeout" })); // FAIL: timeout

// --- instanceof (classes) ---------------------------------------------------
function describe(x: Date | string): string {
  return x instanceof Date ? x.toISOString() : x;
}
console.log(describe("just a string"));

// --- discriminated union + exhaustive switch (the big one) ------------------
type StreamEvent =
  | { type: "token"; text: string }
  | { type: "tool_call"; name: string }
  | { type: "done"; totalTokens: number };

function onEvent(e: StreamEvent): string {
  switch (e.type) {
    case "token":
      return `token: ${e.text}`;
    case "tool_call":
      return `tool: ${e.name}`;
    case "done":
      return `done (${e.totalTokens} tokens)`;
    default:
      const _exhaustive: never = e; // compile error if a case is missing
      return _exhaustive;
  }
}
console.log(onEvent({ type: "token", text: "Hello" }));
console.log(onEvent({ type: "tool_call", name: "search" }));
console.log(onEvent({ type: "done", totalTokens: 128 }));
