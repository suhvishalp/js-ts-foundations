# Module 08 — TypeScript Advanced

> This is where TypeScript stops being "JavaScript with labels" and becomes a tool for building **reusable, precisely-typed abstractions**. Generics let one function work for every type without losing type safety. Utility and mapped types let you derive new types from existing ones instead of hand-maintaining copies. Conditional and template literal types let the compiler *compute*. By the end you'll model an LLM tool-calling schema where the argument types are inferred automatically — the kind of API that makes an AI SDK a joy to use.

## What you'll learn

- **Generics**: functions, interfaces, classes, constraints (`extends`), defaults
- **Utility types**: `Partial`, `Required`, `Pick`, `Omit`, `Record`, `Readonly`, `ReturnType`, `Parameters`, `Awaited`
- `keyof` & **indexed access types** (`T[K]`)
- **Mapped types** (transform every property)
- **Conditional types** with `infer`
- **Template literal types**
- **Discriminated unions at scale**
- **Type guards & `is` predicates** (generic versions)
- The **`satisfies`** operator
- **Modeling an LLM tool/function-calling schema** with generics + inference

## Prerequisites

Module 07 (unions, literals, narrowing, `as const`, interfaces vs types, `unknown`). Comfort reading type annotations. We build steadily, so don't skip ahead.

## Running the code

```bash
npx tsx file.ts          # run
npx tsc --noEmit         # type-check the project
```

Many examples are about *types*, so the interesting output is often what the **compiler** accepts or rejects. Hover types in your editor to see them — that's half the learning.

---

## 1. Generics — write once, type-safe for every type

A generic is a **type parameter**: a placeholder type filled in when the function/class is used. It lets you write reusable code without falling back to `any` (which throws away safety).

### The problem generics solve

```ts
// Without generics you either lose type info...
function firstAny(arr: any[]): any {
  return arr[0];
}
const x = firstAny([1, 2, 3]); // x: any  😞 (no autocomplete, no checks)

// ...or write one copy per type (unmaintainable).
```

### The generic solution

```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const n = first([1, 2, 3]);        // n: number  ✅
const s = first(["a", "b"]);       // s: string  ✅
const m = first([{ id: 1 }]);      // m: { id: number }  ✅
```

`<T>` declares a type variable. TS **infers** `T` from the argument at each call site — you rarely pass it explicitly. One function, full type safety for every element type.

### Generics with multiple type parameters

```ts
function pair<K, V>(key: K, value: V): [K, V] {
  return [key, value];
}
const p = pair("count", 42);       // [string, number]
```

### Constraints with `extends` — "T, but at least this shape"

Sometimes a generic must have certain properties. `extends` constrains it.

```ts
// T can be anything that has a numeric `length`
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

longest("hi", "hello");        // ✅ strings have length → "hello"
longest([1, 2], [1, 2, 3]);    // ✅ arrays have length → [1,2,3]
longest(10, 20);               // ❌ number has no `length`
```

### Constraining a key to belong to an object (very common)

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Ada", age: 36 };
const name = getProp(user, "name");  // typed as string
const age = getProp(user, "age");    // typed as number
getProp(user, "email");              // ❌ "email" is not a key of user
```

`K extends keyof T` says "K must be one of T's keys," and `T[K]` (indexed access, §4) returns that key's value type. This tiny function is the seed of type-safe object access everywhere.

### Generic defaults

```ts
interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

const r1: ApiResponse = { status: 200, data: "anything" };          // T defaults to unknown
const r2: ApiResponse<string[]> = { status: 200, data: ["a", "b"] }; // T = string[]
```

> **🤖 AI/ML relevance:** Generics are how you build **one API client** that types every endpoint's response, **one `Result<T>`** wrapper for every operation, and **one embedding container** that works for any metadata shape. Instead of duplicating types per model or per endpoint, you parameterize once. This is the backbone of every good AI SDK.

### 🎬 Real-life scenario: a generic `Result<T>` (no more throwing)

Rather than throwing (which loses type info about the error), model success/failure explicitly with a generic discriminated union. Callers must handle both, and the success value is fully typed.

```ts
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}
function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

function parseJSON<T>(raw: string): Result<T> {
  try {
    return ok(JSON.parse(raw) as T);
  } catch {
    return err("Invalid JSON");
  }
}

const res = parseJSON<{ id: number }>('{"id": 1}');
if (res.ok) {
  console.log(res.value.id);   // res.value is { id: number } here
} else {
  console.log(res.error);      // narrowed to the error branch
}
```

You'll use this `Result<T>` pattern constantly for LLM calls, tool executions, and validation — it makes error handling type-checked instead of hope-based.

---

## 2. Generic interfaces & classes

Generics aren't just for functions.

```ts
// Generic interface
interface Box<T> {
  value: T;
  map<U>(fn: (value: T) => U): Box<U>;
}

// Generic class
class Container<T> {
  private items: T[] = [];
  add(item: T): void { this.items.push(item); }
  get(index: number): T | undefined { return this.items[index]; }
  get size(): number { return this.items.length; }
  toArray(): T[] { return [...this.items]; }
}

const nums = new Container<number>();
nums.add(1);
nums.add(2);
// nums.add("three");   // ❌ not a number
console.log(nums.toArray()); // [1, 2]

const strings = new Container<string>();
strings.add("hello");
console.log(strings.get(0)); // "hello"
```

> **🤖 AI/ML relevance:** A generic `VectorStore<TMeta>` class can hold embeddings alongside *any* metadata shape (`{ source, page }` for docs, `{ userId }` for memories) while keeping `.query()` results fully typed. One class, reused across every RAG use case — no `any` in sight.

---

## 3. Utility types — derive new types from existing ones

TS ships built-in generic types that transform other types. Learn these — they save enormous duplication and keep types in sync automatically.

Start with a base:

```ts
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}
```

### `Partial<T>` — all properties optional

```ts
type UserUpdate = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number }

function updateUser(id: number, changes: Partial<User>) { /* ... */ }
updateUser(1, { name: "New Name" });  // ✅ only the fields you change
```

### `Required<T>` — all properties required (opposite of Partial)

```ts
interface Config { model?: string; temp?: number }
type FullConfig = Required<Config>;
// { model: string; temp: number }  — no more optionals
```

### `Pick<T, Keys>` — keep only some properties

```ts
type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string }
```

### `Omit<T, Keys>` — remove some properties

```ts
type UserWithoutEmail = Omit<User, "email">;
// { id: number; name: string; age: number }

// Classic use: a "create" type without the server-generated id
type NewUser = Omit<User, "id">;
```

### `Record<Keys, Value>` — build an object type from keys → value

```ts
type Scores = Record<string, number>;      // { [key: string]: number }
const s: Scores = { math: 90, science: 85 };

type RoleCount = Record<"user" | "assistant" | "system", number>;
const counts: RoleCount = { user: 3, assistant: 3, system: 1 }; // all keys required
```

### `Readonly<T>` — all properties immutable

```ts
type FrozenUser = Readonly<User>;
const u: FrozenUser = { id: 1, name: "Ada", email: "a@x.com", age: 36 };
// u.name = "X";   // ❌ read-only
```

### `ReturnType<F>` and `Parameters<F>` — extract from function types

```ts
function createEmbedding(text: string, dims: number) {
  return { text, vector: new Array(dims).fill(0), createdAt: Date.now() };
}

type Embedding = ReturnType<typeof createEmbedding>;
// { text: string; vector: number[]; createdAt: number }

type EmbedArgs = Parameters<typeof createEmbedding>;
// [text: string, dims: number]
```

These let a type *follow* a function — change the function, the derived type updates automatically. No drift.

### `Awaited<T>` — unwrap a Promise's resolved type

```ts
async function fetchUser(): Promise<User> {
  return { id: 1, name: "Ada", email: "a@x.com", age: 36 };
}

type Fetched = Awaited<ReturnType<typeof fetchUser>>;
// User   (Promise unwrapped)
```

> **🤖 AI/ML relevance:** `Record<string, number>` is the natural type for a **vocabulary** (token → id) or a **frequency map**. `Omit<Doc, "embedding">` types a document *before* you compute its embedding; `Partial<Config>` types config overrides. `ReturnType`/`Awaited` keep your types aligned with SDK functions so an SDK upgrade surfaces every affected line.

### 🎬 Real-life scenario: typed vocab and config overrides

```ts
type Vocab = Record<string, number>;
const vocab: Vocab = { the: 0, cat: 1, dog: 2 };

interface PipelineConfig {
  model: string;
  batchSize: number;
  normalize: boolean;
  maxTokens: number;
}

// Users override only what they want; we merge with defaults.
function makeConfig(overrides: Partial<PipelineConfig>): PipelineConfig {
  return {
    model: "text-embedding-3-small",
    batchSize: 32,
    normalize: true,
    maxTokens: 512,
    ...overrides,   // overrides win
  };
}

console.log(makeConfig({ batchSize: 64 }));
// full config with batchSize overridden to 64
```

---

## 4. `keyof` and indexed access types

`keyof T` produces a union of T's property names. Indexed access `T[K]` produces the type of that property. Together they're the foundation of type-safe generic object code.

```ts
interface Model {
  name: string;
  contextWindow: number;
  supportsTools: boolean;
}

type ModelKey = keyof Model;
// "name" | "contextWindow" | "supportsTools"

type ContextType = Model["contextWindow"];   // number (indexed access)
type NameOrCtx = Model["name" | "contextWindow"]; // string | number

// Get the element type of an array type:
type Names = string[];
type Name = Names[number];   // string

// Get a union of all value types of an object:
type ModelValues = Model[keyof Model];   // string | number | boolean
```

`T[number]` (the type of any array element) and `T[keyof T]` (the union of all value types) are idioms worth memorizing — they show up constantly in advanced type code.

> **🤖 AI/ML relevance:** `keyof` + indexed access powers type-safe config accessors and the tool-registry pattern in §11, where a tool name (a `keyof` the registry) determines the exact argument type via indexed access. It's how an SDK can say "if you call the `search` tool, `args` must be `{query: string}`."

---

## 5. Mapped types — transform every property

A mapped type builds a new type by iterating over the keys of another. It's how `Partial`, `Readonly`, etc. are actually implemented — and you can write your own.

```ts
// Rebuild Partial<T> by hand to see the mechanism:
type MyPartial<T> = {
  [K in keyof T]?: T[K];   // for each key K, make it optional
};

// Make everything nullable:
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

interface User { id: number; name: string }
type NullableUser = Nullable<User>;
// { id: number | null; name: string | null }
```

### Mapping modifiers (`+`/`-` readonly and `?`)

```ts
// Remove optionality and readonly (like Required + mutable):
type Concrete<T> = {
  -readonly [K in keyof T]-?: T[K];
};
```

### Remapping keys with `as` (template literal, §7 combined)

```ts
// Generate getter method names from properties:
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Point { x: number; y: number }
type PointGetters = Getters<Point>;
// { getX: () => number; getY: () => number }
```

> **🤖 AI/ML relevance:** Mapped types let you derive a "streaming/partial" version of a response type (every field optional as chunks arrive), or a "nullable feature vector" type where any feature may be missing before imputation. You transform the *type* the same way `map` transforms an array — mechanically, without hand-copying fields.

---

## 6. Conditional types with `infer`

A conditional type chooses between two types based on a condition: `T extends U ? X : Y`. The `infer` keyword lets you *extract* a type from within another.

```ts
type IsString<T> = T extends string ? "yes" : "no";
type A = IsString<string>;   // "yes"
type B = IsString<number>;   // "no"

// Extract the element type of an array with infer:
type ElementType<T> = T extends (infer E)[] ? E : T;
type E1 = ElementType<number[]>;   // number
type E2 = ElementType<string>;      // string (not an array → returns T)

// Extract a Promise's resolved type (this is basically Awaited):
type Unwrap<T> = T extends Promise<infer R> ? R : T;
type U1 = Unwrap<Promise<number>>;   // number
type U2 = Unwrap<string>;             // string
```

`infer E` means "capture whatever type is in this position and call it E." It's how utility types like `ReturnType` (`T extends (...args: any) => infer R ? R : never`) are built.

### Distributive conditional types (a subtle superpower)

When the checked type is a naked type parameter and you pass a union, the condition distributes over each member:

```ts
type ToArray<T> = T extends any ? T[] : never;
type Arrs = ToArray<string | number>;   // string[] | number[]  (distributed!)
```

> **🤖 AI/ML relevance:** Conditional + `infer` lets you write types that adapt to input — e.g., a client whose response type is derived from the request type, or extracting the argument type of a tool from its handler function. It's the machinery behind SDKs where the types "just know" what you meant.

---

## 7. Template literal types

Types can be built from string patterns, like template strings but at the type level.

```ts
type Greeting = `Hello, ${string}!`;
const g1: Greeting = "Hello, world!";   // ✅
// const g2: Greeting = "Hi there";      // ❌ doesn't match the pattern

// Combine literal unions into every combination:
type Method = "get" | "post";
type Resource = "users" | "models";
type Endpoint = `${Method}_${Resource}`;
// "get_users" | "get_models" | "post_users" | "post_models"

// Build event names:
type Entity = "message" | "tool";
type Lifecycle = "start" | "end";
type EventName = `${Entity}:${Lifecycle}`;
// "message:start" | "message:end" | "tool:start" | "tool:end"
```

TS also ships intrinsic string manipulators: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`.

```ts
type Loud = Uppercase<"stream">;   // "STREAM"
```

> **🤖 AI/ML relevance:** Template literal types type **event streams** (`"token:delta" | "tool:call"`), **model id patterns** (`` `${Provider}/${string}` ``), and **routes** in an AI backend. They let the compiler enforce naming conventions that would otherwise be loose strings prone to typos.

---

## 8. Discriminated unions at scale

Module 07 introduced discriminated unions. At scale — many event or message types — pair them with **generics** and **exhaustiveness helpers** to keep handlers correct as variants multiply.

```ts
// A reusable exhaustiveness helper:
function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
}

// A realistic agent event union:
type AgentEvent =
  | { type: "thinking"; text: string }
  | { type: "tool_call"; tool: string; args: unknown }
  | { type: "tool_result"; tool: string; output: string }
  | { type: "final"; answer: string }
  | { type: "error"; message: string };

// A handler map typed so every event type MUST have a handler:
type Handlers = {
  [E in AgentEvent as E["type"]]: (event: E) => void;
};

const handlers: Handlers = {
  thinking: (e) => console.log("🤔", e.text),
  tool_call: (e) => console.log("🔧", e.tool, e.args),
  tool_result: (e) => console.log("📥", e.tool, e.output),
  final: (e) => console.log("✅", e.answer),
  error: (e) => console.error("❌", e.message),
};

function dispatch(event: AgentEvent) {
  // Type-safe lookup: handlers[event.type] expects exactly this event.
  (handlers[event.type] as (e: AgentEvent) => void)(event);
}

dispatch({ type: "thinking", text: "Let me search..." });
dispatch({ type: "final", answer: "42" });
```

The `Handlers` mapped type (`[E in AgentEvent as E["type"]]`) *derives* the handler map from the union: add a new event variant and TS demands a handler for it. That's exhaustiveness enforced structurally, not just in a switch.

> **🤖 AI/ML relevance:** Agent loops emit many event kinds; streaming APIs emit many chunk kinds. Deriving the handler map from the union means the type system guarantees you handle every event — adding "tool_call" to your protocol won't compile until every consumer handles it. Fewer silent gaps in production agents.

---

## 9. Type guards & `is` predicates (generic)

A **type predicate** function returns `x is T`, teaching the compiler to narrow. Module 07 wrote specific ones; here are reusable generic guards.

```ts
// Generic "is defined" guard — great for filtering out null/undefined
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const maybe: (number | null)[] = [1, null, 2, undefined as any, 3];
const defined = maybe.filter(isDefined);  // number[]  — nulls removed AND type narrowed!
console.log(defined); // [1, 2, 3]

// Generic property-presence guard
function hasKey<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

// A guard factory for discriminated unions
function isType<T extends { type: string }, K extends T["type"]>(
  kind: K
) {
  return (event: T): event is Extract<T, { type: K }> => event.type === kind;
}
```

The `filter(isDefined)` trick is one you'll use constantly: `Array.prototype.filter` with a type-predicate callback *narrows the array's element type*, removing `null`/`undefined` from the type, not just the values.

> **🤖 AI/ML relevance:** After mapping documents to embeddings, some may fail and be `null`; `filter(isDefined)` cleans them and gives you a `Embedding[]` (not `(Embedding | null)[]`) so downstream code needs no null checks. Guard factories neatly extract one event type from a stream union.

---

## 10. The `satisfies` operator

`satisfies` checks that a value conforms to a type **without widening** the value's inferred type. It gives you validation *and* keeps the precise literal types. It's the "best of both worlds" between annotation and `as const`.

```ts
// Problem with a plain annotation: you lose specific keys/values.
const config1: Record<string, number> = { a: 1, b: 2 };
// config1.a is number, but TS forgot the exact keys — config1.c is also `number` (no error!)

// Problem with no annotation: no validation that it matches the intended shape.

// satisfies: validate against the type BUT keep the narrow inferred type.
const config2 = { a: 1, b: 2 } satisfies Record<string, number>;
config2.a;      // number ✅
// config2.c;   // ❌ Property 'c' does not exist — exact keys preserved!
```

A realistic example — a model registry validated as `Record<string, ModelInfo>` but keeping exact keys for autocomplete:

```ts
interface ModelInfo {
  contextWindow: number;
  supportsTools: boolean;
}

const models = {
  "gpt-4o": { contextWindow: 128000, supportsTools: true },
  "o1-mini": { contextWindow: 128000, supportsTools: false },
} satisfies Record<string, ModelInfo>;

models["gpt-4o"].contextWindow;   // ✅ number, autocompletes the exact key
// models["gpt-5"];                // ❌ not a known key (keys preserved)
// A missing supportsTools in any entry would be a compile error (shape validated)
```

**Rule of thumb:** use `satisfies` when you want the compiler to *check* a value against a type but you still want the precise inferred literal types for autocomplete and narrowing. Prefer it over `as` (which lies) and over a plain annotation (which widens).

> **🤖 AI/ML relevance:** `satisfies` is perfect for model registries, prompt template maps, and tool-definition objects: you validate each entry has the required shape while keeping exact keys so `models["gpt-4o"]` autocompletes and `models["typo"]` errors. You get validation without sacrificing the precision that makes the tool registry (§11) work.

---

## 11. Modeling an LLM tool/function-calling schema (capstone)

Now we combine everything — generics, `keyof`, indexed access, mapped types, `satisfies` — to build a **type-safe tool registry**. This is the crown jewel: define tools with their parameter and result types once, and the compiler infers the correct `args` type for each tool automatically, the way a great AI SDK does.

```ts
// A tool defines its parameter type and result type, plus a handler.
interface ToolDef<TArgs, TResult> {
  description: string;
  handler: (args: TArgs) => Promise<TResult> | TResult;
}

// Helper to define a tool while inferring TArgs/TResult from the handler.
function defineTool<TArgs, TResult>(
  def: ToolDef<TArgs, TResult>
): ToolDef<TArgs, TResult> {
  return def;
}

// The registry: each key is a tool name; each value is a ToolDef.
const tools = {
  search: defineTool({
    description: "Search the knowledge base",
    handler: (args: { query: string; topK: number }) =>
      Promise.resolve({ hits: [`result for ${args.query}`].slice(0, args.topK) }),
  }),
  calculator: defineTool({
    description: "Evaluate an arithmetic expression",
    handler: (args: { expression: string }) => ({ result: eval(args.expression) as number }),
  }),
  getWeather: defineTool({
    description: "Get weather for a city",
    handler: (args: { city: string; units: "c" | "f" }) =>
      ({ temp: 21, units: args.units }),
  }),
};

// Derive types FROM the registry — no manual duplication:
type ToolName = keyof typeof tools;                              // "search" | "calculator" | "getWeather"
type ArgsOf<N extends ToolName> = Parameters<(typeof tools)[N]["handler"]>[0];
type ResultOf<N extends ToolName> = Awaited<ReturnType<(typeof tools)[N]["handler"]>>;

// A single type-safe call function: the `args` type is inferred from `name`!
async function callTool<N extends ToolName>(
  name: N,
  args: ArgsOf<N>
): Promise<ResultOf<N>> {
  const tool = tools[name];
  // (one internal cast; the PUBLIC signature above is fully type-safe)
  return (tool.handler as (a: ArgsOf<N>) => Promise<ResultOf<N>>)(args);
}

// --- Usage: the compiler enforces the right args for each tool --------------
async function demo() {
  const s = await callTool("search", { query: "embeddings", topK: 2 });
  console.log(s.hits);                    // s is { hits: string[] }

  const c = await callTool("calculator", { expression: "6 * 7" });
  console.log(c.result);                  // c is { result: number }

  const w = await callTool("getWeather", { city: "Berlin", units: "c" });
  console.log(w.temp, w.units);           // w is { temp: number; units: "c" | "f" }

  // ❌ Each of these is a COMPILE error:
  // callTool("search", { query: "x" });          // missing topK
  // callTool("search", { q: "x", topK: 1 });     // wrong key
  // callTool("weatherr", { city: "X" });         // unknown tool name
  // callTool("calculator", { expression: 42 });  // expression must be string
}
demo();
```

Read what just happened: we defined each tool's `args` shape *once* (in its handler). `ArgsOf<N>` uses `Parameters<...>[0]` (indexed access on the tuple `Parameters` returns) to extract it, keyed by tool name. `callTool("search", ...)` then *knows* `args` must be `{query: string; topK: number}` — mistype it and the build fails. This is exactly how modern AI SDKs give you autocomplete and safety for function/tool calling, and you now understand the machinery.

> **🤖 AI/ML relevance:** This *is* function calling / tool use, typed. When an LLM decides to call `getWeather`, you validate its arguments against `ArgsOf<"getWeather">`, execute, and return a typed result. Because the types derive from a single registry, adding a tool is one entry and every consumer is instantly type-safe. No drift between "what the model can call" and "what your code accepts."

---

## Common pitfalls

- **Reaching for `any` instead of a generic.** If you're tempted by `any[]`, you almost always want `<T>`. `any` deletes safety; generics preserve it.
- **Over-genericizing.** Not everything needs a type parameter. Add generics when a function/type genuinely works across many types; otherwise a concrete type is clearer.
- **Forgetting constraints.** `function f<T>(x: T) { return x.length }` errors — TS doesn't know T has `length`. Add `T extends { length: number }`.
- **`as` vs `satisfies`.** `as` overrides the compiler (can lie); `satisfies` asks the compiler to check while keeping precise types. Prefer `satisfies` for object literals you want validated.
- **Mapped types re-widen without care.** Remember modifiers: `-?` removes optional, `-readonly` removes readonly. Forgetting them can carry over unwanted modifiers.
- **Distributive conditional surprises.** `T extends U ? ... : ...` distributes over unions when `T` is naked. Wrap in a tuple `[T] extends [U]` to disable distribution when you don't want it.
- **`ReturnType<typeof fn>` needs `typeof`.** You pass the function's *type*, not the function value: `ReturnType<typeof createEmbedding>`, not `ReturnType<createEmbedding>`.
- **Trusting `as T` on model/tool arguments.** Validate LLM-provided tool args at runtime (a guard or Zod) even though the *type* says they're correct — the model can send anything.

## Recap

- **Generics** (`<T>`, constraints via `extends`, defaults) give reuse without losing type safety — the basis of `Result<T>`, generic clients, and containers.
- **Utility types** (`Partial`, `Pick`, `Omit`, `Record`, `ReturnType`, `Awaited`, …) derive new types from old ones so they never drift.
- **`keyof` + indexed access** (`T[K]`, `T[number]`, `T[keyof T]`) enable type-safe generic object code.
- **Mapped types** transform every property; **conditional types + `infer`** compute and extract types; **template literal types** build string-pattern types.
- **Discriminated unions at scale** plus derived handler maps enforce exhaustiveness structurally.
- **Type guards / `is` predicates** (esp. `filter(isDefined)`) narrow safely and reusably.
- **`satisfies`** validates a value against a type while preserving precise inferred types — better than `as` or a plain annotation for literals.
- A **generic tool registry** ties it all together: define tools once, get inferred, type-safe `callTool` — the real machinery behind typed LLM function calling.

## Next

Continue to **[Module 09 — TypeScript in Practice](../09-typescript-in-practice/README.md)**, where you'll apply all this to real projects: tsconfig, runtime validation with Zod (making `unknown` → typed *safe* at runtime), typing third-party SDKs, and project structure for AI apps.

Practice first: work through [`exercises.md`](exercises.md); solutions in [`solutions/`](solutions/), runnable examples in [`examples/`](examples/).
