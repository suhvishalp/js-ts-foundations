// Exercise 5 — Discriminated union for tool results with exhaustiveness checking
// Run: npx tsx exercise-05-tool-result.ts

// Each variant shares a literal "kind" tag. Switching on it narrows precisely,
// so within each case only that variant's fields are accessible.
type ToolResult =
  | { kind: "success"; output: string }
  | { kind: "error"; message: string }
  | { kind: "pending"; startedAt: number }
  | { kind: "timeout"; afterMs: number }; // bonus variant

function renderResult(r: ToolResult): string {
  switch (r.kind) {
    case "success":
      return `✓ ${r.output}`; // only 'success' has .output
    case "error":
      return `✗ ${r.message}`; // only 'error' has .message
    case "pending":
      return `… running since ${new Date(r.startedAt).toISOString()}`;
    case "timeout":
      return `⏱ timed out after ${r.afterMs}ms`;
    default:
      // Exhaustiveness guard: if a new variant is added to ToolResult and we
      // forget a case, `r` won't narrow to `never` here and TS raises an error.
      const _exhaustive: never = r;
      return _exhaustive;
  }
}

// --- Demo -------------------------------------------------------------------
console.log(renderResult({ kind: "success", output: "42 rows returned" }));
console.log(renderResult({ kind: "error", message: "connection refused" }));
console.log(renderResult({ kind: "pending", startedAt: Date.now() }));
console.log(renderResult({ kind: "timeout", afterMs: 30000 }));

// TRY THIS: remove the "timeout" case above and TS will flag the `never`
// assignment, pointing you at exactly the unhandled variant.

export { ToolResult, renderResult };
