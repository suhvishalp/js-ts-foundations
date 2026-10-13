# Module 08 — Exercises

Run with `npx tsx file.ts`; type-check with `npx tsc --noEmit`. Some tasks are about making the *compiler* happy — the payoff is red squiggles disappearing. Try before checking `solutions/`.

---

## Exercise 1 — Generic utilities

**Scenario:** Build small reusable generic helpers.

**Requirements:**
- `first<T>(arr: T[]): T | undefined` — first element.
- `last<T>(arr: T[]): T | undefined` — last element.
- `pluck<T, K extends keyof T>(arr: T[], key: K): T[K][]` — extract one property from each object.
- `pluck([{id:1},{id:2}], "id")` → `[1, 2]`, typed as `number[]`.

**Hint:** Constrain `K extends keyof T` and return `T[K][]`.

---

## Exercise 2 — Generic `Result<T>` (AI/ML)

**Scenario:** Type-safe success/failure without throwing — for LLM/tool calls.

**Requirements:**
- Define `type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }`.
- Write `ok<T>(value: T): Result<T>` and `err<E>(error: E): Result<never, E>`.
- Write `safeParse<T>(raw: string): Result<T>` that JSON-parses in try/catch.
- Consume it: on `ok`, log `value`; on failure, log `error`. Show the compiler narrows each branch.

**Hint:** Discriminate on the `ok` boolean literal.

---

## Exercise 3 — Utility types on a User model

**Scenario:** Derive related types from one base interface.

**Requirements:**
- Given `interface User { id: number; name: string; email: string; age: number }`, derive:
  - `NewUser` = User without `id` (Omit).
  - `UserUpdate` = all fields optional (Partial).
  - `UserPreview` = only `id` and `name` (Pick).
  - `UserMap` = `Record<number, User>` (id → user).
- Write `applyUpdate(user: User, update: UserUpdate): User` merging changes immutably.

**Hint:** `{ ...user, ...update }` for the merge.

---

## Exercise 4 — keyof + indexed access accessor

**Scenario:** A type-safe getter.

**Requirements:**
- Write `getProp<T, K extends keyof T>(obj: T, key: K): T[K]`.
- Write `getProps<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>` returning a sub-object.
- Confirm `getProp(model, "name")` is typed as the property's type and an unknown key errors.

**Hint:** Build the sub-object by reducing over `keys`.

---

## Exercise 5 — Mapped type: Nullable and DeepReadonly (partial)

**Scenario:** Write your own mapped types.

**Requirements:**
- `Nullable<T>` — every property becomes `T[K] | null`.
- `Mutable<T>` — strips `readonly` from every property (use `-readonly`).
- Bonus: `Stringify<T>` — every property type becomes `string`.
- Demonstrate each on a small interface.

**Hint:** `{ [K in keyof T]: ... }`; the modifier `-readonly` removes readonly.

---

## Exercise 6 — Conditional type with infer (AI/ML)

**Scenario:** Extract inner types from wrappers.

**Requirements:**
- `Unwrap<T>` — if `T` is `Promise<R>`, give `R`, else `T`.
- `ElementType<T>` — if `T` is `E[]`, give `E`, else `T`.
- `EmbeddingElement<T>` — given `number[][]`, produce `number[]` (one embedding); given `number[]`, produce `number`.
- Add `type` tests using assignments to prove the results.

**Hint:** `T extends Promise<infer R> ? R : T`.

---

## Exercise 7 — Template literal event names

**Scenario:** Type an event system.

**Requirements:**
- Given `type Entity = "message" | "tool" | "agent"` and `type Phase = "start" | "end" | "error"`, build `EventName = `${Entity}:${Phase}``.
- Write `emit(event: EventName, payload: unknown): void` that logs.
- Confirm `emit("tool:start", {})` works and `emit("tool:paused", {})` errors.

**Hint:** Template literal type over two unions produces all combinations.

---

## Exercise 8 — Generic type guard `isDefined` + filter (AI/ML)

**Scenario:** Clean nulls from an array of maybe-embeddings while narrowing the type.

**Requirements:**
- Write `isDefined<T>(v: T | null | undefined): v is T`.
- Given `const maybe: (number[] | null)[]`, produce `number[][]` via `filter(isDefined)`.
- Confirm the result type has no `null` (hover it / assign to a `number[][]`).

**Hint:** The predicate return type `v is T` is what makes `filter` narrow the element type.

---

## Exercise 9 — satisfies for a model registry (AI/ML)

**Scenario:** Validate a registry's shape but keep exact keys/values.

**Requirements:**
- Define `interface ModelInfo { contextWindow: number; supportsTools: boolean }`.
- Create `const MODELS = { ... } satisfies Record<string, ModelInfo>` with 2–3 real models.
- Show that `MODELS["gpt-4o"].contextWindow` autocompletes/typed as number, an unknown key errors, and omitting `supportsTools` in an entry errors.
- Contrast (in comments) with a plain `: Record<string, ModelInfo>` annotation losing key precision.

**Hint:** `satisfies` goes after the value, not before.

---

## Exercise 10 — Type-safe tool registry (capstone, AI/ML)

**Scenario:** Build the LLM tool-calling registry from README §11.

**Requirements:**
- Define `interface ToolDef<TArgs, TResult>` with `description` and `handler: (args: TArgs) => TResult | Promise<TResult>`.
- Create a `tools` object with at least `search` (`{query: string; topK: number}`) and `calculator` (`{expression: string}`).
- Derive `ToolName`, `ArgsOf<N>`, `ResultOf<N>`.
- Write `async callTool<N extends ToolName>(name: N, args: ArgsOf<N>): Promise<ResultOf<N>>`.
- Demonstrate correct calls and (in comments) at least three compile errors: missing arg field, wrong tool name, wrong arg type.

**Hint:** `ArgsOf<N> = Parameters<(typeof tools)[N]["handler"]>[0]`; `ResultOf<N> = Awaited<ReturnType<(typeof tools)[N]["handler"]>>`.
