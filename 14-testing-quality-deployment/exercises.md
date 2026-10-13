# Module 14 — Exercises

Build these in a TypeScript project with Vitest installed (`npm install --save-dev vitest typescript tsx`, `"type": "module"` in `package.json`, a `"test": "vitest run"` script). Solutions for a subset are in [`solutions/`](solutions/). Do them in order — each layers on the last.

> Reminder from the module: **unit tests never touch the network.** Every LLM/embedding call in these exercises is mocked or injected.

---

### Exercise 1 — Test a pure function (dot product)
**Scenario:** Your embeddings library needs a `dotProduct(a, b)` helper. You'll TDD it — write the tests first.

**Requirements:**
- Implement `dotProduct(a: number[], b: number[]): number` in `src/math.ts`.
- Write `src/math.test.ts` covering: a known result (`[1,2,3]·[4,5,6] === 32`), the zero vector (`=== 0`), and a **length-mismatch error**.
- All tests pass with `npm test`.

**Hint:** `toBe` is fine for integer math; save `toBeCloseTo` for when floats are involved. Assert the throw with `expect(() => dotProduct([1],[1,2])).toThrow()`.

---

### Exercise 2 — Float tolerance & normalization
**Scenario:** You add `normalize(v)` (divide each component by the vector's magnitude) so all embeddings become unit length.

**Requirements:**
- Implement `normalize(v: number[]): number[]`.
- Test that the magnitude of the result is **≈ 1** (use `toBeCloseTo`).
- Test that `normalize([3, 4])` is `≈ [0.6, 0.8]`.
- Test that normalizing the zero vector doesn't throw and returns all zeros (your choice — document it in a comment).

**Hint:** Magnitude = `Math.sqrt(v.reduce((s, x) => s + x*x, 0))`. Assert element-wise with a loop of `toBeCloseTo`.

---

### Exercise 3 — Invariant tests for a token-aware chunker
**Scenario:** You wrote a chunker but want tests that survive future refactors.

**Requirements:**
- Given `chunkText(text, size, overlap)` (from the module, or your own), write tests asserting **invariants**, not exact strings:
  - No chunk exceeds `size`.
  - The chunks together cover every character (nothing dropped).
  - Consecutive chunks overlap by exactly `overlap`.
  - Invalid args (`size <= 0`, `overlap >= size`) throw.
- Add one **edge case**: empty string input returns an empty array (or one empty chunk — decide and test your choice).

**Hint:** Reconstruct coverage from `chunks.at(-1).end`. For overlap, compare the tail of chunk `i` to the head of chunk `i+1`.

---

### Exercise 4 — Mock an LLM call with dependency injection
**Scenario:** A `classifyIntent(text, model)` function asks an LLM to label a user message as `"question" | "command" | "chitchat"`.

**Requirements:**
- Define a `ChatModel` interface (`complete(prompt: string): Promise<string>`).
- Implement `classifyIntent` so it builds a prompt, calls `model.complete`, and returns the trimmed lowercased label.
- Test with a `vi.fn()` fake that returns `"Question"`; assert the result is `"question"` **and** that the model was called with a prompt containing the input text.
- Test that an unexpected label from the model (e.g. `"banana"`) is coerced to a safe default `"chitchat"`.

**Hint:** `const fake: ChatModel = { complete: vi.fn(async () => "Question") }` and `expect(fake.complete).toHaveBeenCalledWith(expect.stringContaining(text))`.

---

### Exercise 5 — Test async errors and empty-input guards
**Scenario:** Harden `summarize(text, model)` from the module.

**Requirements:**
- Make `summarize` throw on empty/whitespace input **before** calling the model.
- Test the rejection with `await expect(summarize("  ", fake)).rejects.toThrow(/empty/)`.
- Test that on empty input the model is **never** called (`expect(fake.complete).not.toHaveBeenCalled()`).
- Test the happy path returns the model's answer.

**Hint:** For rejections, always `await expect(...).rejects`. Use a fresh `vi.fn()` per test or `vi.clearAllMocks()` in `beforeEach`.

---

### Exercise 6 — Schema-based testing of structured output
**Scenario:** `extractTodos(text, model)` asks an LLM to return a JSON array of `{ task: string, priority: "low"|"med"|"high" }`.

**Requirements:**
- Define a Zod schema for the output and parse the model's response inside `extractTodos`.
- In the test, inject a fake returning valid JSON; assert the result **parses against the schema** and has the expected length.
- Add a test where the fake returns **malformed JSON**; assert `extractTodos` throws a clear, wrapped error (not a raw `SyntaxError`).

**Hint:** `z.array(z.object({ task: z.string(), priority: z.enum(["low","med","high"]) }))`. Wrap `JSON.parse` in try/catch and rethrow with context.

---

### Exercise 7 — Retry wrapper with backoff (and test it deterministically)
**Scenario:** Add resilience: `withRetries(fn, opts)` retries on 429/5xx but not on 400/401.

**Requirements:**
- Implement `withRetries` (see the module for the shape).
- Test that a fn failing **twice** with a 503 then succeeding returns the success value and was called 3 times.
- Test that a 400 error is **not** retried (called exactly once, error rethrown).
- Make the test **fast**: use `vi.useFakeTimers()` so you don't actually wait for backoff delays.

**Hint:** With fake timers, call the function, then `await vi.runAllTimersAsync()` to flush the `setTimeout` delays. Restore with `vi.useRealTimers()` in `afterEach`.

---

### Exercise 8 — Observability decorator + golden-set eval
**Scenario:** Wrap a model with logging, and build a tiny offline eval.

**Requirements:**
- Implement `withObservability(inner, model)` returning a `ChatModel` that logs `{ latencyMs, inTok, outTok }` (estimate tokens as `chars/4`). Use dependency injection for the logger so you can assert on it.
- Test that a successful call logs a response event with a numeric `latencyMs`, and an error call logs an error event and rethrows.
- Build a `goldenSet` of 3 `{ input, mustContain }` cases and a `runEval(model, set)` function returning a pass rate. Test `runEval` against a **fake** model that returns canned answers (no real API).

**Hint:** Inject `log: { info: vi.fn(), error: vi.fn() }`. For latency, assert `expect.any(Number)` inside the logged object via `expect(log.info).toHaveBeenCalledWith(expect.objectContaining({ latencyMs: expect.any(Number) }), "llm.response")`.

---

### Exercise 9 — Config validation with Zod (fail fast)
**Scenario:** Your service must refuse to start with bad config.

**Requirements:**
- Write `loadConfig(env: Record<string, string | undefined>)` that validates `OPENAI_API_KEY` (required), `PORT` (coerced number, default 3000), and `LOG_LEVEL` (enum, default `"info"`) with Zod.
- Test that valid env parses and applies defaults.
- Test that missing `OPENAI_API_KEY` throws with a helpful message.
- Test that `PORT="abc"` throws.

**Hint:** Pass `env` in (don't read `process.env` directly) so the function is pure and testable. `z.coerce.number()` handles the string→number conversion.

---

### Exercise 10 — Wire up CI locally
**Scenario:** Reproduce the CI pipeline on your machine before pushing.

**Requirements:**
- Add scripts: `typecheck` (`tsc --noEmit`), `lint` (`eslint .`), `test` (`vitest run`).
- Create a `.github/workflows/ci.yml` that runs install → typecheck → lint → test on push and PR.
- Run all three scripts locally and make them green.
- Bonus: add a `workflow_dispatch`-only job that runs a `npm run eval` step using a `${{ secrets.OPENAI_API_KEY }}` (you don't need a real key to write the YAML correctly).

**Hint:** Copy the workflow from the module and adapt the script names. Verify locally with `npm run typecheck && npm run lint && npm test`.
