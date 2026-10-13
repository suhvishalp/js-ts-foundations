# Module 09 — Exercises

Work top to bottom; each builds a little on the last. Try every task before
peeking at `solutions/`. Run your `.ts` files with `npx tsx <file>.ts`.

> Setup once: `mkdir m09 && cd m09 && npm init -y && npm install zod && npm install -D typescript tsx @types/node`, add `"type": "module"` to `package.json`, and create a `tsconfig.json` with `strict: true`.

---

## Exercise 1 — Bootstrap a strict project (warm-up)

**Scenario:** You're starting a new AI tool and want the compiler working for you
from line one.

**Requirements:**
1. Create a fresh project with `package.json` (`"type": "module"`) and a
   `tsconfig.json` targeting `ES2022`, `module`/`moduleResolution` = `NodeNext`,
   and `strict: true`.
2. Write `src/index.ts` that logs a greeting.
3. Run it two ways: with `tsx`, and by compiling with `tsc` then running the
   emitted JS from `dist/`.

**Hint:** You'll need `outDir` and `rootDir` set for the `tsc` path to produce a
clean `dist/`.

---

## Exercise 2 — Read the config

**Scenario:** A teammate hands you a `tsconfig.json` and you need to reason about it.

**Requirements:** In a comment block, explain in one sentence each what these do:
`target`, `module`, `strict`, `esModuleInterop`, `outDir`, `paths`. Then answer:
why does `import { x } from "./util.js"` reference `.js` when the file is
`util.ts`?

**Hint:** Re-read Section 3. The import points at the *emitted* path.

---

## Exercise 3 — Type an untyped library

**Scenario:** You depend on a fictional untyped package `tiny-tokenizer` that
exports `encode(text: string): number[]` and `decode(ids: number[]): string`.

**Requirements:**
1. Write `types/tiny-tokenizer.d.ts` with a `declare module` block describing it.
2. In a source file, `import { encode } from "tiny-tokenizer"` and show that the
   return type is `number[]` (assign it to a typed variable).

**Hint:** You don't need the package installed — the declaration is enough for
the compiler. Use `declare module "tiny-tokenizer" { ... }`.

---

## Exercise 4 — The `Result` type

**Scenario:** You're parsing user-supplied vector dimensions from CLI text and
don't want to throw for ordinary bad input.

**Requirements:**
1. Define `type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }`.
2. Write `parseDimension(input: string): Result<number>` that accepts only
   positive integers ≤ 4096.
3. Call it with `"768"`, `"0"`, and `"abc"` and handle each branch, printing the
   value or the error.

**Hint:** Narrow on `r.ok` before touching `r.value` or `r.error`.

---

## Exercise 5 — Discriminated-union errors (AI/ML themed)

**Scenario:** Model your LLM client's failure modes explicitly.

**Requirements:**
1. Define `type LlmError` as a discriminated union with variants: `timeout`
   (`elapsedMs: number`), `rate_limit` (`retryAfter: number`), `bad_output`
   (`raw: string`), and `http` (`status: number`).
2. Write `isRetryable(err: LlmError): boolean` — timeouts and rate limits are
   retryable; the others are not.
3. Write `describe(err: LlmError): string` using a `switch` on `err.kind` with
   **no `default` branch**. Confirm that if you comment out one `case`, the
   compiler complains.

**Hint:** For the exhaustiveness check, ensure the function's return type is
`string` and every branch returns — TS will flag a missing case.

---

## Exercise 6 — Your first Zod schema

**Scenario:** Validate a config object loaded from JSON.

**Requirements:**
1. Define a Zod schema `AppConfigSchema` with: `model` (non-empty string),
   `maxTokens` (int, 1–128000), `temperature` (number 0–2, optional), and
   `retries` (int ≥ 0, default 3).
2. Derive `type AppConfig = z.infer<typeof AppConfigSchema>`.
3. `.parse` a valid object and a `.safeParse` an invalid one; print the issues on
   failure.

**Hint:** Use `.default(3)` for `retries` and `.optional()` for `temperature`.
Note how `.default` changes the *input* type (optional) vs *output* type
(present).

---

## Exercise 7 — Validate LLM structured output (core AI/ML task)

**Scenario:** An LLM is asked to classify a support ticket into structured JSON.

**Requirements:**
1. Define `TicketTagSchema`: `category` (enum: `"bug" | "feature" | "billing" |
   "other"`), `priority` (enum: `"low" | "medium" | "high"`), `features`
   (array of strings, max 5), `needsHuman` (boolean).
2. Write `parseTicketTag(raw: string): TicketTag` that first `JSON.parse`s the
   raw text (throwing a clear error if that fails) then validates with Zod.
3. Test with: valid JSON, non-JSON text (`"Sorry, I can't do that"`), and JSON
   with an invalid `priority` (`"urgent"`). Each should behave correctly.

**Hint:** Two failure layers — is it JSON at all, then is it the right shape. Give
each its own clear error message.

---

## Exercise 8 — Retry-on-invalid loop (stretch, AI/ML themed)

**Scenario:** Combine everything. Simulate an LLM that sometimes returns invalid
output, and retry with the validation error fed back in.

**Requirements:**
1. Reuse `TicketTagSchema` from Exercise 7.
2. Write `fakeLlm(prompt: string): string` that returns invalid JSON on the first
   call and valid JSON once the prompt contains the word `"INVALID"` (simulating
   a corrected retry).
3. Write `extractWithRetry(text: string, maxAttempts = 3)` that: calls the model,
   `.safeParse`s the result, and on failure re-calls the model with the ZodError
   message appended to the prompt — up to `maxAttempts`. Return a `Result`.

**Hint:** Use `.safeParse`, and on `!result.success`, build the next prompt as
`` `${basePrompt}\nYour last output was INVALID: ${result.error.issues.map(i => i.message).join(", ")}` ``.

---

## Exercise 9 — Refactor to a typed config module (stretch)

**Scenario:** Centralize configuration behind a validated boundary.

**Requirements:**
1. Create `src/config.ts` that reads a plain object (pretend it came from a file),
   validates it with a Zod schema, and exports a typed, frozen `config`.
2. Throw a clear, aggregated error listing *all* validation issues if the config
   is invalid (not just the first).
3. Import `config` elsewhere and show it's fully typed.

**Hint:** `.safeParse` then, on failure, `error.issues.map(i => `${i.path.join(".")}: ${i.message}`)`.
