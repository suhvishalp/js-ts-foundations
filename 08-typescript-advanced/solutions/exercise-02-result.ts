// Exercise 2 — Generic Result<T> for type-safe error handling
// Run: npx tsx exercise-02-result.ts

// A generic discriminated union. `ok` is the tag; T is the success type,
// E the error type (defaults to string). Callers MUST check `ok` before
// accessing value/error, so failures can't be silently ignored.
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

// Returns Result<never, E>: there is no success value on the error path,
// and `never` is assignable to any T, so this composes with any Result<T>.
function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Parse JSON without throwing; the caller decides how to handle failure.
function safeParse<T>(raw: string): Result<T> {
  try {
    return ok(JSON.parse(raw) as T);
  } catch {
    return err("Invalid JSON");
  }
}

// --- Demo -------------------------------------------------------------------
const good = safeParse<{ id: number }>('{"id": 7}');
if (good.ok) {
  console.log("value:", good.value.id); // good.value is { id: number }
} else {
  console.log("error:", good.error);
}

const bad = safeParse<{ id: number }>("not json");
console.log(bad.ok ? bad.value : `failed: ${bad.error}`); // failed: Invalid JSON

export { Result, ok, err, safeParse };
