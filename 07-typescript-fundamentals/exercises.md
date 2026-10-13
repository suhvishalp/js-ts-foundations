# Module 07 — Exercises

Run with `npx tsx file.ts` (or `npx tsc --noEmit` to type-check only). Try each before checking `solutions/`. Many are deliberately AI/ML-shaped.

---

## Exercise 1 — Annotate the basics

**Scenario:** Warm up on type annotations.

**Requirements:**
- Declare typed variables: a `string` model name, a `number` temperature, a `boolean` stream flag, and a `number[]` of token ids.
- Write `describeConfig(model: string, temperature: number): string` returning a summary.
- Deliberately try assigning a `number` to the model variable and confirm the compiler complains (then remove it).

**Hint:** `let x: number[] = []` for the empty typed array.

---

## Exercise 2 — Type an LLM message and conversation

**Scenario:** The message shape at the heart of every chat app.

**Requirements:**
- Define a `Role` literal union: `"system" | "user" | "assistant" | "tool"`.
- Define an `interface ChatMessage` with `role: Role`, `content: string`, and optional `name?: string`.
- Create a `conversation: ChatMessage[]` with a system + user message.
- Write `addUserMessage(convo: ChatMessage[], text: string): ChatMessage[]` that returns a **new** array with a user message appended (don't mutate).

**Hint:** Spread: `return [...convo, { role: "user", content: text }]`.

---

## Exercise 3 — interface vs type + readonly/optional

**Scenario:** Model an LLM request config.

**Requirements:**
- Define `RequestConfig` with required `model: string`, `readonly apiKey: string`, and optional `temperature?`, `maxTokens?`, `stream?`.
- Write `withDefaults(cfg: RequestConfig)` that returns a new object filling defaults (`temperature ?? 0.7`, `maxTokens ?? 1024`, `stream ?? false`) while keeping `model` and `apiKey`.
- Confirm reassigning `apiKey` is a compile error.

**Hint:** Use `??` for defaults. Return a fresh object with all fields resolved.

---

## Exercise 4 — Narrowing with typeof and truthiness

**Scenario:** A helper that formats a value that might be a string, number, or null.

**Requirements:**
- Write `formatValue(v: string | number | null): string`.
- If `null` → `"N/A"`. If `string` → uppercased. If `number` → fixed to 2 decimals.
- No `any`, no `as`. Rely on narrowing.

**Hint:** Check `v === null` first, then `typeof v === "string"`, else it's `number`.

---

## Exercise 5 — Discriminated union for tool results (AI/ML)

**Scenario:** An agent runs tools; each run produces one of several result kinds.

**Requirements:**
- Define `ToolResult` as a discriminated union with a `kind` tag: `"success"` (has `output: string`), `"error"` (has `message: string`), `"pending"` (has `startedAt: number`).
- Write `renderResult(r: ToolResult): string` using a `switch` on `kind`.
- Add an exhaustive `never` default so a future new kind forces a compile error.
- Bonus: add a `"timeout"` variant and observe the error until you handle it.

**Hint:** `const _exhaustive: never = r;` in `default`.

---

## Exercise 6 — Type guard for untrusted model JSON (AI/ML)

**Scenario:** You asked a model for `{sentiment, confidence}` JSON and can't trust the shape.

**Requirements:**
- Define `type Sentiment = { sentiment: "positive" | "negative"; confidence: number }`.
- Write a type guard `isSentiment(x: unknown): x is Sentiment`.
- Write `parseSentiment(raw: string): Sentiment | null` that `JSON.parse`s inside a try/catch, validates with the guard, and returns the value or `null`.
- Feed it valid JSON, malformed JSON, and JSON with a wrong-typed field; confirm only the valid one returns an object.

**Hint:** Start the parse result as `unknown`. Never use `as` to skip validation.

---

## Exercise 7 — as const registry and derived union (AI/ML)

**Scenario:** A model registry that's both a runtime object and a type.

**Requirements:**
- Create `const MODELS = { fast: "gpt-4o-mini", smart: "gpt-4o", cheap: "o1-mini" } as const`.
- Derive `type ModelKey` (the keys) and `type ModelId` (the values) from it.
- Write `resolveModel(key: ModelKey): ModelId` returning `MODELS[key]`.
- Confirm `resolveModel("turbo")` is a compile error.

**Hint:** `type ModelKey = keyof typeof MODELS;` and `type ModelId = (typeof MODELS)[ModelKey];`.

---

## Exercise 8 — Typed functions: optional, default, overload

**Scenario:** An `embed` helper with defaults and a stringify helper with overloads.

**Requirements:**
- Write `embed(text: string, model?: string)` defaulting `model` to `"text-embedding-3-small"`, returning `{ text, model, dims: number }` (use `text.length` as a stand-in for dims).
- Write overloaded `serialize`: `serialize(x: string): string` returns it unchanged; `serialize(x: object): string` returns `JSON.stringify(x)`.
- Call both signatures and confirm the types are correct.

**Hint:** Two overload signatures above one implementation signature that accepts `string | object`.

---

## Exercise 9 — Narrowing with `in` on an API result (AI/ML)

**Scenario:** An API returns either data or an error object.

**Requirements:**
- Define `type ApiResult = { data: number[] } | { error: string; code: number }`.
- Write `unwrap(res: ApiResult): number[]` that returns `data` on success and throws `Error(`${code}: ${error}`)` otherwise.
- Use `"data" in res` (or `"error" in res`) to narrow — no `as`.

**Hint:** After `if ("error" in res)`, TS knows `res` has `error` and `code`.

---

## Exercise 10 — unknown vs any (prove the difference)

**Scenario:** Demonstrate why `unknown` is safer than `any`.

**Requirements:**
- Write `viaAny(json: string): any` and `viaUnknown(json: string): unknown`, both just `JSON.parse`.
- Show (in comments) that `viaAny(...).a.b.c` compiles but is unsafe.
- Then safely extract a `count: number` field from the `viaUnknown` result using narrowing, returning `count` or `0`.

**Hint:** Guard with `typeof result === "object" && result !== null && "count" in result && typeof result.count === "number"`.
