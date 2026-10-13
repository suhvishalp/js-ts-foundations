// Exercise 4 — The Result type
// Run: npx tsx solutions/exercise-04-result.ts

// A Result makes failure part of the return type. The caller CANNOT reach the
// value without first checking `ok`, because TypeScript narrows the union.
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parseDimension(input: string): Result<number> {
  const n = Number(input);
  // Number("abc") === NaN, Number("") === 0, Number("3.5") === 3.5 — guard all.
  if (!Number.isInteger(n)) {
    return { ok: false, error: `"${input}" is not an integer` };
  }
  if (n <= 0) {
    return { ok: false, error: `dimension must be positive, got ${n}` };
  }
  if (n > 4096) {
    return { ok: false, error: `dimension ${n} exceeds max of 4096` };
  }
  return { ok: true, value: n };
}

// Helper to print either branch cleanly.
function report(input: string): void {
  const r = parseDimension(input);
  if (r.ok) {
    // Inside this branch, r.value is `number` — r.error does not exist here.
    console.log(`OK   ${input} -> ${r.value}`);
  } else {
    // Inside this branch, r.error is `string` — r.value does not exist here.
    console.log(`ERR  ${input} -> ${r.error}`);
  }
}

report("768"); // OK   768 -> 768
report("0");   // ERR  0 -> dimension must be positive, got 0
report("abc"); // ERR  abc -> "abc" is not an integer
