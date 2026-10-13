// The four error-handling patterns from the lesson, side by side.
// Run: npx tsx examples/error-patterns.ts

// ----- Pattern A: narrow `unknown` in catch (strict makes `e` unknown) -----
function patternA(): void {
  try {
    throw new Error("boom");
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log("A:", e.message); // safe — narrowed to Error
    } else {
      console.log("A:", String(e));
    }
  }
}

// ----- Pattern B: typed custom error classes -----
class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Rate limited; retry after ${retryAfterSeconds}s`);
    this.name = "RateLimitError";
  }
}
function patternB(): void {
  try {
    throw new RateLimitError(5);
  } catch (e) {
    if (e instanceof RateLimitError) {
      console.log(`B: back off ${e.retryAfterSeconds}s`); // field is typed
    } else {
      throw e;
    }
  }
}

// ----- Pattern C: Result type (errors as values) -----
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number> {
  if (b === 0) return { ok: false, error: "division by zero" };
  return { ok: true, value: a / b };
}
function patternC(): void {
  const r = divide(10, 0);
  console.log("C:", r.ok ? r.value : r.error);
}

// ----- Pattern D: discriminated union for domain errors -----
type LlmError =
  | { kind: "timeout"; elapsedMs: number }
  | { kind: "rate_limit"; retryAfter: number }
  | { kind: "http"; status: number };

function describe(err: LlmError): string {
  switch (err.kind) {
    case "timeout":    return `timeout after ${err.elapsedMs}ms`;
    case "rate_limit": return `rate limited, wait ${err.retryAfter}s`;
    case "http":       return `http ${err.status}`;
    // no default needed: TS proves the switch is exhaustive
  }
}
function patternD(): void {
  const errs: LlmError[] = [
    { kind: "timeout", elapsedMs: 3000 },
    { kind: "http", status: 429 },
  ];
  for (const e of errs) console.log("D:", describe(e));
}

patternA();
patternB();
patternC();
patternD();
