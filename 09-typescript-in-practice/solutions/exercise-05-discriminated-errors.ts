// Exercise 5 — Discriminated-union errors (AI/ML themed)
// Run: npx tsx solutions/exercise-05-discriminated-errors.ts

// Each failure mode is its own variant. The `kind` field is the DISCRIMINANT:
// checking it narrows the type so the other fields become accessible.
type LlmError =
  | { kind: "timeout"; elapsedMs: number }
  | { kind: "rate_limit"; retryAfter: number }
  | { kind: "bad_output"; raw: string }
  | { kind: "http"; status: number };

// Categorize failures: transient (retry) vs terminal (don't).
function isRetryable(err: LlmError): boolean {
  switch (err.kind) {
    case "timeout":
    case "rate_limit":
      return true;
    case "bad_output":
    case "http":
      return false;
  }
}

// Note: no `default` branch. Because the return type is `string` and every
// variant is handled, TS is satisfied. If you add a new variant to LlmError
// (say `{ kind: "auth" }`) and forget a case here, the compiler errors with
// "Function lacks ending return statement" — exhaustiveness for free.
function describe(err: LlmError): string {
  switch (err.kind) {
    case "timeout":
      return `Timed out after ${err.elapsedMs}ms`;
    case "rate_limit":
      return `Rate limited; wait ${err.retryAfter}s before retrying`;
    case "bad_output":
      return `Model returned unparseable output: ${err.raw.slice(0, 40)}`;
    case "http":
      return `HTTP error ${err.status}`;
  }
}

const errors: LlmError[] = [
  { kind: "timeout", elapsedMs: 30_000 },
  { kind: "rate_limit", retryAfter: 12 },
  { kind: "bad_output", raw: "Sure! Here is the answer..." },
  { kind: "http", status: 500 },
];

for (const err of errors) {
  console.log(`[retryable=${isRetryable(err)}] ${describe(err)}`);
}

// Optional stricter exhaustiveness: an `assertNever` in a default branch turns a
// missing case into a *compile error* right at the switch, not a runtime slip.
function describeStrict(err: LlmError): string {
  switch (err.kind) {
    case "timeout":    return "timeout";
    case "rate_limit": return "rate_limit";
    case "bad_output": return "bad_output";
    case "http":       return "http";
    default: {
      const _exhaustive: never = err; // errors here if a case is missing
      return _exhaustive;
    }
  }
}
void describeStrict; // silence "unused" — shown for reference
