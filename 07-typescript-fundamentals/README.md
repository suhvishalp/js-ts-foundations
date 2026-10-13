# Module 07 — TypeScript Fundamentals

> JavaScript will happily let you write `response.mesage.contnet` and only blow up at runtime — probably in production, probably while a customer waits. TypeScript catches that as you type. When you're wiring together LLM SDKs, tool-call payloads, and untrusted JSON coming back from a model, a type system is the difference between "the compiler told me" and "the pager told me."

## What you'll learn

- **Why** TypeScript exists and what problems it solves
- The basic types: `string`, `number`, `boolean`, `null`, `undefined`, `any`, `unknown`, `never`, `void`
- Arrays & tuples
- Object types, `interface` vs `type` alias, optional & `readonly` properties
- Union & literal types
- Type **inference** (let TS do the work)
- Type **narrowing**: `typeof`, `in`, `instanceof`, truthiness, discriminated unions
- Typing functions: params, return types, optional/default params, overloads
- Enums — and why `as const` objects are often better
- `as const`, type assertions
- `unknown` vs `any` for **untrusted API/model data**

## Prerequisites

Modules 01–06. You should be comfortable with JS objects, arrays, functions, and destructuring. TypeScript is JavaScript *plus types*, so all your JS knowledge carries over.

## How to run TypeScript

```bash
# One-off run without compiling to disk (recommended for learning):
npx tsx file.ts

# Or type-check + compile then run:
npx tsc file.ts && node file.js

# Just type-check the whole project without emitting files:
npx tsc --noEmit
```

Throughout, code blocks marked with `// ❌ Error:` show what TypeScript rejects **at compile time** — before the code ever runs.

---

## 0. Why TypeScript?

JavaScript is dynamically typed: a variable can hold anything, and mistakes surface only when the offending line executes. TypeScript adds a **static type layer** that the compiler checks *before* running. The types are erased at build time — the code that ships is plain JavaScript — but during development you get:

1. **Bugs caught at author time**, not runtime.
2. **Editor superpowers**: autocomplete, inline docs, safe rename, go-to-definition.
3. **Living documentation**: the types *are* the spec of what a function accepts and returns.
4. **Fearless refactoring**: change a type, and every place that breaks lights up red.

```ts
function greet(name: string): string {
  return "Hello, " + name.toUpperCase();
}

greet("Ada");   // ✅ "Hello, ADA"
greet(42);      // ❌ Error: Argument of type 'number' is not assignable to parameter of type 'string'.
```

In plain JS, `greet(42)` would run and throw `name.toUpperCase is not a function` at runtime. In TS, your editor underlines it *immediately*.

> **🤖 AI/ML relevance:** AI SDK payloads are big and nested — chat messages with roles, tool definitions with JSON-schema parameters, streaming deltas, usage stats. One typo in `finish_reason` vs `finishReason` and your handler silently does nothing. TypeScript models these shapes so the compiler enforces you handle them correctly. As AI apps grow to dozens of message types and tool results, types become the map that keeps you sane.

### 🎬 Real-life scenario: the payload that changed shape

An LLM provider ships a new SDK version. `message.content` used to be a `string`; now it can be `string | ContentBlock[]` (to support images and tool use). In JS, half your app silently breaks — `content.toUpperCase()` throws only on the requests that hit the new shape. In TS, the moment you upgrade, every place that assumed `string` lights up red, and you fix them all in one sitting *before* deploying.

---

## 1. Basic types

You annotate a variable with `: Type`. Often you won't need to (inference, §6), but it's good to know the vocabulary.

```ts
let title: string = "embeddings";
let count: number = 42;          // all numbers: ints, floats, NaN, Infinity
let isReady: boolean = true;
let nothing: null = null;
let notSet: undefined = undefined;
```

### `any` — the escape hatch (avoid it)

`any` turns off type checking for that value. It's contagious and dangerous: it silently disables the very safety you installed TS for.

```ts
let data: any = JSON.parse('{"x": 1}');
data.foo.bar.baz;        // ✅ compiles — but crashes at runtime! any hides everything
data();                  // ✅ compiles — also crashes
```

Treat `any` as a code smell. If you don't know a type, prefer `unknown` (§13).

### `unknown` — the safe unknown

`unknown` means "I don't know what this is yet." Unlike `any`, TS forces you to **check** before you use it.

```ts
let data: unknown = JSON.parse('{"x": 1}');

// data.x;               // ❌ Error: 'data' is of type 'unknown'.
if (typeof data === "object" && data !== null && "x" in data) {
  console.log(data);     // now narrowed; safe to inspect
}
```

`unknown` is your best friend for anything crossing a trust boundary — API responses, file contents, and especially LLM output.

### `void` and `never`

- `void` — a function returns nothing meaningful.
- `never` — a value that can *never* occur (a function that always throws, or the "impossible" branch of an exhaustive check).

```ts
function log(msg: string): void {
  console.log(msg);              // returns undefined; caller shouldn't use it
}

function fail(msg: string): never {
  throw new Error(msg);          // never returns normally
}
```

`never` looks academic now, but it powers **exhaustiveness checking** — one of TS's best features for AI apps (see §8 discriminated unions).

> **🤖 AI/ML relevance:** Parsed model output should start life as `unknown`, not `any`. A model can return malformed JSON, extra fields, or the wrong shape entirely. `unknown` forces you to validate before trusting — turning "silent wrong behavior" into "explicit handled error."

---

## 2. Arrays & tuples

```ts
const scores: number[] = [0.1, 0.5, 0.9];
const labels: string[] = ["cat", "dog"];
const matrix: number[][] = [[1, 2], [3, 4]];   // 2D array

// Alternative generic syntax (identical meaning):
const ids: Array<number> = [1, 2, 3];

scores.push(0.7);      // ✅
scores.push("high");   // ❌ Error: not assignable to number
```

A **tuple** is a fixed-length array where each position has its own type. Great for pairs and coordinates.

```ts
const point: [number, number] = [1.5, 2.0];        // x, y
const entry: [string, number] = ["cat", 3];        // token, count

// A common real shape: named tuple for clarity
const embeddingPair: [id: string, vector: number[]] = ["doc1", [0.1, 0.2, 0.3]];
```

> **🤖 AI/ML relevance:** `number[]` is how you type an **embedding vector**; `number[][]` types a **batch of embeddings** or a **tensor slice**. Tuples type `[token, id]` vocabulary pairs and `[x, y]` data points cleanly. When you later reach for real tensor libraries, these array types are the foundation.

---

## 3. Object types

You describe the shape of an object inline, or (better) name it.

```ts
// Inline object type
const user: { name: string; age: number } = { name: "Ada", age: 36 };

// Nested
const config: {
  model: string;
  temperature: number;
  options: { stream: boolean };
} = {
  model: "gpt-4",
  temperature: 0.7,
  options: { stream: true },
};

config.temperature = 1.2;   // ✅
config.temp = 1.2;          // ❌ Error: 'temp' does not exist... (typo caught!)
```

Inline types get unwieldy fast. Name them with `interface` or `type` (next).

---

## 4. `interface` vs `type` alias

Both name a shape. You'll see both everywhere; here's how to choose.

```ts
interface User {
  name: string;
  age: number;
}

type UserT = {
  name: string;
  age: number;
};

const a: User = { name: "Ada", age: 36 };
const b: UserT = { name: "Alan", age: 41 };
```

For plain object shapes they're interchangeable. Differences:

**`interface` can be extended and re-opened (declaration merging):**

```ts
interface Animal { name: string; }
interface Animal { legs: number; }   // merges! Animal now has both
const dog: Animal = { name: "Rex", legs: 4 };

interface Dog extends Animal { breed: string; }
```

**`type` is more flexible — it can alias anything, not just objects:**

```ts
type ID = string | number;                 // union — interfaces can't do this
type Pair = [number, number];              // tuple
type Vector = number[];                     // array
type Handler = (event: string) => void;     // function type
type Point = { x: number } & { y: number }; // intersection
```

**Practical rule:** use `interface` for object shapes you might extend (public APIs, models), and `type` for unions, tuples, functions, and composed types. Many teams just use `type` for everything for consistency — both are fine.

### Optional & readonly properties

```ts
interface RequestConfig {
  model: string;
  temperature?: number;        // optional: may be omitted
  readonly apiKey: string;     // can't be reassigned after creation
}

const cfg: RequestConfig = { model: "gpt-4", apiKey: "sk-..." };
console.log(cfg.temperature);  // undefined — that's allowed, it's optional
cfg.temperature = 0.5;         // ✅
cfg.apiKey = "sk-new";         // ❌ Error: Cannot assign to 'apiKey' (readonly)
```

`?` makes a property optional (its type becomes `T | undefined`). `readonly` prevents reassignment after construction — perfect for config and IDs that must never change mid-flight.

> **🤖 AI/ML relevance:** LLM request configs are full of optional knobs — `temperature?`, `maxTokens?`, `topP?`, `stopSequences?` — with a few required fields (`model`, `messages`). Modeling these with optional properties means the compiler lets callers omit knobs but *demands* the essentials. Mark `apiKey` and immutable IDs `readonly` so they can't be mutated by accident downstream.

### 🎬 Real-life scenario: typing an LLM message

The canonical shape you'll type in nearly every AI app:

```ts
type Role = "system" | "user" | "assistant" | "tool";

interface ChatMessage {
  role: Role;
  content: string;
  name?: string;             // optional: only for tool/function messages
}

const conversation: ChatMessage[] = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "What is a vector embedding?" },
];

conversation.push({ role: "user", content: "..." });     // ✅
conversation.push({ role: "usr", content: "..." });       // ❌ 'usr' not assignable to Role
```

That `Role` union (next section) turns a whole class of typos into compile errors.

---

## 5. Union & literal types

A **union** (`A | B`) means "one of these types." A **literal type** narrows to specific *values*, not just a category.

```ts
type Status = "pending" | "success" | "error";   // literal union
let s: Status = "success";   // ✅
s = "done";                   // ❌ Error: '"done"' is not assignable to 'Status'

type ID = string | number;    // type union
let id: ID = "abc";           // ✅
id = 123;                     // ✅
id = true;                    // ❌ boolean not allowed
```

Literal unions are how you model a fixed set of valid options — far safer than a loose `string`, because typos and invalid values are rejected, and your editor autocompletes the valid choices.

```ts
// Combining literals with other types
type Temperature = number | "default";
function setTemp(t: Temperature) { /* ... */ }
setTemp(0.7);        // ✅
setTemp("default");  // ✅
setTemp("hot");      // ❌
```

> **🤖 AI/ML relevance:** Literal unions model the finite vocabularies all over LLM APIs: `role`, `finish_reason` (`"stop" | "length" | "tool_calls" | "content_filter"`), `tool_choice` (`"auto" | "none" | "required"`), response formats, model names. Every one of these becomes a self-documenting, typo-proof type.

---

## 6. Type inference — let TypeScript do the work

You usually **don't** need to annotate. TS infers types from values. Idiomatic TS is often lighter on annotations than beginners expect.

```ts
let n = 42;              // inferred: number
let name = "Ada";        // inferred: string
const pi = 3.14;         // inferred: 3.14 (literal! const never changes)

const nums = [1, 2, 3];  // inferred: number[]
const doubled = nums.map(x => x * 2);  // x: number, result: number[] — all inferred

// Return types are inferred too:
function add(a: number, b: number) {   // returns number (inferred)
  return a + b;
}
```

**Where to annotate anyway:**
- **Function parameters** — these are rarely inferable, so annotate them.
- **Public API boundaries / exported function return types** — explicit is clearer and locks the contract.
- **Empty containers** — `const items: string[] = []` (TS can't infer element type from `[]`).

**Where to skip:** local variables initialized with a value, and obvious return types. Let inference reduce noise.

```ts
// Over-annotated (noisy):
const total: number = nums.reduce((sum: number, n: number): number => sum + n, 0);

// Idiomatic (inference does the rest):
const total = nums.reduce((sum, n) => sum + n, 0);
```

> **🤖 AI/ML relevance:** Inference flows through data pipelines. Type the input array once and every `.map`/`.filter`/`.reduce` result is typed automatically — so a reshaping bug three transforms deep still gets caught, without you annotating each step.

---

## 7. Type narrowing — proving what a value is

A value of a union type could be several things. **Narrowing** is how you convince the compiler (and yourself) which one it is in a given branch, unlocking the safe operations for that type.

### `typeof` narrowing (for primitives)

```ts
function format(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase();   // here TS knows value is string
  }
  return value.toFixed(2);        // here it must be number
}
console.log(format("hi"));  // "HI"
console.log(format(3.14159)); // "3.14"
```

### Truthiness narrowing (for null/undefined)

```ts
function greet(name: string | null) {
  if (name) {
    console.log(name.toUpperCase()); // name is string here (null filtered out)
  } else {
    console.log("Anonymous");
  }
}
```

### `in` narrowing (does the object have this property?)

```ts
type SuccessResponse = { data: string };
type ErrorResponse = { error: string };

function handle(res: SuccessResponse | ErrorResponse) {
  if ("data" in res) {
    console.log("OK:", res.data);   // narrowed to SuccessResponse
  } else {
    console.log("Failed:", res.error); // narrowed to ErrorResponse
  }
}
```

### `instanceof` narrowing (for classes)

```ts
function describe(x: Date | string) {
  if (x instanceof Date) {
    return x.toISOString();   // x is Date
  }
  return x;                   // x is string
}
```

### Discriminated unions — the pattern that scales

Give each variant a shared **literal "tag" field**. Switching on that tag narrows perfectly and enables exhaustiveness checking. This is the single most important pattern in this module for AI work.

```ts
type ToolResult =
  | { kind: "success"; output: string }
  | { kind: "error"; message: string }
  | { kind: "pending"; startedAt: number };

function render(result: ToolResult): string {
  switch (result.kind) {
    case "success":
      return `✓ ${result.output}`;       // only success has .output
    case "error":
      return `✗ ${result.message}`;      // only error has .message
    case "pending":
      return `… started ${result.startedAt}`;
    default:
      // If we ever add a new kind and forget a case, TS errors HERE:
      const _exhaustive: never = result;
      return _exhaustive;
  }
}

console.log(render({ kind: "success", output: "42 rows" })); // ✓ 42 rows
```

The `never` in `default` is the magic: if you later add `{ kind: "timeout"; ... }` to `ToolResult` and forget to handle it, `result` won't be `never` there, and TS raises an error — forcing you to handle every case. This is **exhaustiveness checking**, and it's how you keep large AI apps correct as the number of message/tool/event types grows.

> **🤖 AI/ML relevance:** Tool/function-calling results, streaming chunk types (`{type: "content"} | {type: "tool_call"} | {type: "done"}`), and agent step outcomes are *textbook* discriminated unions. Switching on the tag with an exhaustive `never` default means adding a new event type can't silently slip through unhandled — the compiler makes you update every handler.

### 🎬 Real-life scenario: handling a streaming response

An LLM streams events; each has a `type`. A discriminated union plus exhaustive switch guarantees you handle every event kind, and future-proofs you against new ones.

```ts
type StreamEvent =
  | { type: "token"; text: string }
  | { type: "tool_call"; name: string; args: string }
  | { type: "done"; usage: { totalTokens: number } };

function onEvent(e: StreamEvent) {
  switch (e.type) {
    case "token":     process.stdout.write(e.text); break;
    case "tool_call": console.log(`\n[calling ${e.name}]`); break;
    case "done":      console.log(`\n(${e.usage.totalTokens} tokens)`); break;
  }
}
```

---

## 8. Typing functions

```ts
// Params and return type
function multiply(a: number, b: number): number {
  return a * b;
}

// Optional parameter (must come after required ones)
function createUser(name: string, age?: number): string {
  return age ? `${name} (${age})` : name;
}
createUser("Ada");       // ✅ "Ada"
createUser("Ada", 36);   // ✅ "Ada (36)"

// Default parameter
function embed(text: string, model: string = "text-embedding-3-small") {
  return `${model}:${text}`;
}
embed("hello");                     // uses default model
embed("hello", "custom-model");     // overrides it

// Function type as a value (callbacks)
type Transformer = (input: string) => string;
const upper: Transformer = s => s.toUpperCase();

// Rest params
function sum(...nums: number[]): number {
  return nums.reduce((a, n) => a + n, 0);
}
sum(1, 2, 3, 4); // 10
```

### Overloads (basics)

Overloads let one function present multiple typed signatures. Use sparingly — often a union parameter is simpler — but they shine when the return type depends on the argument type.

```ts
function parse(input: string): object;
function parse(input: string, asArray: true): unknown[];
function parse(input: string, asArray?: boolean): object | unknown[] {
  const result = JSON.parse(input);
  return asArray ? [result] : result;
}

const obj = parse('{"a":1}');        // typed as object
const arr = parse('{"a":1}', true);  // typed as unknown[]
```

> **🤖 AI/ML relevance:** You'll type lots of higher-order functions in ML pipelines — transformers, predicates, reducers — as function types (`(row: Row) => Feature`). Default params model SDK defaults (`model`, `temperature`) cleanly. Overloads are how well-typed SDKs make `stream: true` return an async iterator while `stream: false` returns a single response.

---

## 9. Enums vs `as const` objects

TypeScript has `enum`, but modern code often prefers a `const` object with `as const`. Here's both, and why.

```ts
// enum
enum LogLevel {
  Debug,   // 0
  Info,    // 1
  Warn,    // 2
  Error,   // 3
}
const lvl: LogLevel = LogLevel.Warn; // 2
```

Numeric enums have quirks: they generate runtime code, allow reverse mapping, and `LogLevel.Warn` is really just `2` (so an invalid `5` can sneak in). String enums are safer but still emit runtime objects.

The often-preferred alternative — a frozen const object plus a derived union type:

```ts
const LogLevel = {
  Debug: "debug",
  Info: "info",
  Warn: "warn",
  Error: "error",
} as const;

// Derive a union type of the VALUES:
type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];
// => "debug" | "info" | "warn" | "error"

const lvl: LogLevel = LogLevel.Warn;   // "warn"
function setLevel(l: LogLevel) { /* ... */ }
setLevel("info");   // ✅ works with the literal too
setLevel("trace");  // ❌ not a valid level
```

**Why prefer `as const` objects?** They're plain JS (no special runtime), the values are readable strings, they play nicely with JSON and external APIs, and you get the same type safety. Reach for `enum` only when a team convention requires it.

> **🤖 AI/ML relevance:** The `as const` object pattern is ideal for fixed model registries, provider names, and role/finish-reason sets — the values are real strings you'll send over the wire to an API, and the derived union keeps them typo-proof in code.

---

## 10. `as const` and type assertions

### `as const` — freeze literals into their narrowest type

Without `as const`, TS widens literals to general types. With it, everything becomes deeply `readonly` and narrowed to exact literal values.

```ts
const config1 = { model: "gpt-4", temp: 0.7 };
// type: { model: string; temp: number }  <- widened

const config2 = { model: "gpt-4", temp: 0.7 } as const;
// type: { readonly model: "gpt-4"; readonly temp: 0.7 }  <- exact literals, readonly

const roles = ["user", "assistant"] as const;
// type: readonly ["user", "assistant"]  (a tuple of literals, not string[])
type RoleFromArray = (typeof roles)[number]; // "user" | "assistant"
```

`as const` is the bridge from runtime values to precise types — the trick behind deriving unions from arrays/objects (see §9 and Module 08).

### Type assertions (`as`) — "trust me, I know the type"

An assertion tells TS to treat a value as a given type. It does **no runtime check** — it's a promise you make to the compiler. Use it rarely and carefully.

```ts
const el = document.getElementById("app") as HTMLInputElement;
// You're asserting it's an input; if it's actually a div, .value is undefined at runtime.

const data = JSON.parse(raw) as { name: string };  // ⚠️ no validation happens!
```

The last line is a trap: `as` does **not** verify the JSON actually has `name`. For untrusted data, *validate* instead of asserting (next section, and Zod in later modules). A good rule: if you're reaching for `as` on external data, you probably want narrowing or validation.

> **🤖 AI/ML relevance:** It's tempting to write `JSON.parse(modelOutput) as MyToolArgs` — don't. Model output is untrusted; `as` just silences the compiler while the runtime bug remains. Assertions are fine for things *you* control (DOM elements, `as const`), dangerous for things a model or network produced.

---

## 11. `unknown` vs `any` for untrusted data (the crucial one)

This deserves its own section because it's the type decision you'll make most often in AI apps.

```ts
// ❌ any: compiler stops helping; runtime crashes are back
function parseAny(json: string): any {
  return JSON.parse(json);
}
const a = parseAny('{"role":"user"}');
a.role.toUpperCase();   // compiles; crashes if role is missing/not a string

// ✅ unknown: compiler forces you to check before use
function parseSafe(json: string): unknown {
  return JSON.parse(json);
}
const u = parseSafe('{"role":"user"}');
// u.role;   // ❌ Error: 'u' is of type 'unknown'

// You must narrow first:
if (
  typeof u === "object" && u !== null &&
  "role" in u && typeof (u as { role: unknown }).role === "string"
) {
  console.log((u as { role: string }).role.toUpperCase()); // safe now
}
```

Writing those checks by hand is verbose — which is exactly why runtime validators like **Zod** exist (Module 09). But the principle stands: **data crossing a trust boundary starts as `unknown`, and you earn the right to use it by validating.**

### A reusable type guard

You can package a check into a **type predicate** function (`x is T`) so narrowing is reusable and readable:

```ts
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function isChatMessage(x: unknown): x is ChatMessage {
  return (
    typeof x === "object" && x !== null &&
    "role" in x && "content" in x &&
    typeof (x as any).content === "string"
  );
}

const raw: unknown = JSON.parse('{"role":"user","content":"hi"}');
if (isChatMessage(raw)) {
  console.log(raw.content.toUpperCase()); // raw is ChatMessage here — fully typed
}
```

After `isChatMessage(raw)` returns true, TS treats `raw` as a `ChatMessage` for the rest of the block. (We go deeper on `is` predicates and generics in Module 08.)

> **🤖 AI/ML relevance:** When you ask a model for JSON ("respond with `{sentiment, confidence}`"), it *usually* complies — but sometimes wraps it in prose, omits a field, or returns a number as a string. Typing the parse result as `unknown` and validating with a type guard (or Zod) turns "silent downstream corruption" into a clean, catchable error at the boundary. This single habit prevents a large fraction of AI-app bugs.

### 🎬 Real-life scenario: trusting model JSON

You prompt: *"Classify sentiment. Reply with only JSON: {sentiment: 'positive'|'negative', confidence: number}."* The model mostly obeys, but occasionally adds a markdown fence or a stray sentence.

```ts
type Sentiment = { sentiment: "positive" | "negative"; confidence: number };

function isSentiment(x: unknown): x is Sentiment {
  return (
    typeof x === "object" && x !== null &&
    "sentiment" in x && "confidence" in x &&
    ((x as any).sentiment === "positive" || (x as any).sentiment === "negative") &&
    typeof (x as any).confidence === "number"
  );
}

function parseSentiment(modelOutput: string): Sentiment | null {
  try {
    const parsed: unknown = JSON.parse(modelOutput);
    return isSentiment(parsed) ? parsed : null;   // validated, or null to handle
  } catch {
    return null;  // not even valid JSON
  }
}

console.log(parseSentiment('{"sentiment":"positive","confidence":0.92}'));
// { sentiment: 'positive', confidence: 0.92 }
console.log(parseSentiment("Sure! The sentiment is positive."));
// null  <- handled gracefully instead of crashing
```

---

## Common pitfalls

- **Reaching for `any` when stuck.** It disables checking and spreads. Use `unknown` and narrow, or model the type properly.
- **`as` on untrusted data.** `JSON.parse(x) as T` does *no* runtime check — it just lies to the compiler. Validate instead.
- **Over-annotating.** Let inference work. Annotate parameters and public boundaries; skip obvious locals.
- **Forgetting optional properties are `T | undefined`.** `config.temperature` might be `undefined`; narrow before using it (`config.temperature ?? 0.7`).
- **Confusing literal and general types.** `let s = "success"` is `string`; you need `as const` or an explicit literal-union type to keep it narrow.
- **Numeric enum surprises.** `LogLevel.Warn` is `2`, and invalid numbers can sneak in. Prefer `as const` objects (or string enums) for values that leave your program.
- **Non-exhaustive switches on unions.** Add a `never` default so adding a new variant forces you to handle it everywhere.
- **Thinking types exist at runtime.** They're erased after compilation. You can't `if (x instanceof MyInterface)` — interfaces don't exist at runtime. Use `in`/`typeof`/type guards instead.

## Recap

- TypeScript is JS + a compile-time type layer: catch bugs, get autocomplete, self-document, refactor fearlessly. Types are erased at runtime.
- Know the basics (`string`/`number`/`boolean`/`null`/`undefined`), and especially `any` (avoid) vs `unknown` (safe) vs `never`/`void`.
- Model data with object types, `interface` vs `type`, optional (`?`) and `readonly` properties.
- Union & literal types model finite valid options (roles, statuses) and make typos compile errors.
- Lean on inference; annotate parameters and public boundaries.
- Narrow unions with `typeof`, `in`, `instanceof`, truthiness, and — the big one — **discriminated unions** with exhaustive `never` checks.
- Type functions fully; use `as const` to derive precise types, and prefer `as const` objects over enums.
- Untrusted/model data is `unknown` until validated with a type guard — never `any`, never blind `as`.

## Next

Continue to **[Module 08 — TypeScript Advanced](../08-typescript-advanced/README.md)**, where generics, utility types, mapped/conditional types, and `satisfies` let you build reusable, precisely-typed AI abstractions — a generic `Result<T>`, an API client, and a fully typed tool registry.

Practice first: work through [`exercises.md`](exercises.md); solutions in [`solutions/`](solutions/), runnable examples in [`examples/`](examples/).
