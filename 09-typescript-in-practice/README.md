# Module 09 — TypeScript in Practice

> You know the *language* (Modules 07–08). Now you'll learn the **craft**: how to
> stand up a real TypeScript project, configure the compiler so it works *for*
> you, structure your code, model errors like a senior engineer, and — critically
> for AI/ML work — **validate untrusted data at runtime** so a malformed LLM
> response can never silently corrupt your program.

## What you'll learn

- What `tsconfig.json` actually does, flag by flag (`target`, `module`,
  `moduleResolution`, `strict`, `paths`, `outDir`, `lib`, `esModuleInterop`)
- How to set up a TypeScript project from scratch and run it two ways: compile
  with `tsc`, or run directly with `tsx`
- Why `strict` mode is non-negotiable and what each strict flag buys you
- Declaration files (`.d.ts`), `@types/*` packages, and how to type a library
  that ships no types
- How to structure and organize a growing TS codebase
- Error-handling patterns that scale: typed errors, discriminated-union errors,
  and the `Result` type
- **Runtime validation with Zod** — turning a schema into a type *and* a
  validator, and why `.parse` / `.safeParse` are your safety net for LLM and API
  output

## Prerequisites

- Modules 07 (TypeScript Fundamentals) and 08 (TypeScript Advanced)
- Node.js 20+ installed (Module 00) and a terminal you're comfortable in
- A working understanding of `import`/`export` (Module 05)

---

## 1. The mental model: TypeScript is a build step, not a runtime

This is the single most important idea in this module. **TypeScript does not run.**
Your browser and Node.js cannot execute a `.ts` file directly. Types are
*erased* — a compiler (`tsc`) or a runner (`tsx`) strips them out and produces
plain JavaScript, which is what actually executes.

```ts
// user.ts — what you write
interface User {
  id: number;
  name: string;
}

function greet(user: User): string {
  return `Hello, ${user.name}`;
}
```

```js
// user.js — what actually runs (types gone)
function greet(user) {
  return `Hello, ${user.name}`;
}
```

**Why this matters:** the types that protect you at *compile time* vanish at
*runtime*. If a JSON blob arrives from an API — or an LLM — shaped differently
than your `interface` claims, TypeScript will not catch it. Nothing will, unless
*you* check. This is the thread that runs through the whole module and lands on
Zod at the end.

> **🤖 AI/ML relevance:** LLM output is the ultimate untrusted input. You *ask*
> for JSON matching a schema, but the model can return prose, truncated JSON, or
> extra fields. Types alone give you a false sense of safety here. Runtime
> validation is the fix — and we build up to it deliberately.

---

## 2. Setting up a TypeScript project from scratch

Let's build one end to end. Every command here is real; run them.

```bash
mkdir ts-in-practice && cd ts-in-practice
npm init -y                      # creates package.json
npm install --save-dev typescript tsx @types/node
npx tsc --init                   # creates a tsconfig.json
```

- `typescript` — the compiler (`tsc`) and language service. A **dev** dependency:
  it's a build tool, not something your shipped code imports.
- `tsx` — runs `.ts` files directly (great for scripts and iteration).
- `@types/node` — type definitions for Node's built-in modules (`fs`, `path`,
  `process`, …). Node is written in C++/JS and ships no types of its own.

Make it an ESM project by adding one line to `package.json`:

```json
{
  "type": "module"
}
```

Now write a source file:

```ts
// src/index.ts
const message: string = "TypeScript project is alive";
console.log(message);
```

Two ways to run it:

```bash
npx tsx src/index.ts      # run directly, no build artifact
npx tsc && node dist/index.js   # compile to JS, then run (needs outDir set)
```

> **When to use which:** `tsx` for development, scripts, and CLIs you run on your
> own machine. `tsc` when you need to *ship* JavaScript (a published npm package,
> a container image where you don't want the TS toolchain at runtime).

### 🎬 Real-life scenario — the embeddings script

You're on an ML team and need a one-off script to read a CSV of product
descriptions, call an embeddings API, and write vectors to disk. You do **not**
want a build pipeline for a throwaway script. `tsx embed.ts` runs it with full
type-checking and zero ceremony. Later, when that script graduates into a
scheduled job in a container, you switch to `tsc` so the container ships plain
JS and doesn't need `tsx` installed. Same code, different runner.

---

## 3. `tsconfig.json`, flag by flag

`tsc --init` generates a heavily-commented file. Here is a lean, modern,
**Node 20 + ESM** configuration you can actually use, followed by an explanation
of every line that matters.

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### `target` — which JavaScript version to emit

`"ES2022"` tells `tsc` how *modern* the output JS may be. Modern targets mean
`tsc` emits `async/await`, optional chaining (`?.`), and top-level `await` as-is
instead of transpiling them into clunky older equivalents. On Node 20+ you can
safely target ES2022. Targeting `ES5` (an old default) produces bloated,
slower output you don't need.

### `module` and `moduleResolution` — how imports work

These two decide the *module system* of the output and how the compiler
**finds** the files you import.

- `"NodeNext"` for both is the correct modern choice for a Node project. It
  respects your `package.json` `"type"` field and the ESM rules Node actually
  uses — including the requirement to write **file extensions in relative
  imports**:

```ts
import { load } from "./dataset.js"; // note: .js, even though the file is dataset.ts
```

That `.js` looks wrong but is correct: you import the *emitted* path, and ESM
requires the extension. This trips up everyone once; now it won't trip you.

Other values you'll see: `"ESNext"` / `"Bundler"` (when a bundler like Vite or
esbuild resolves modules for you) and the legacy `"CommonJS"`. For a plain Node
service or script, `NodeNext` is the answer.

### `lib` — which built-in APIs exist

`lib` declares the *ambient* type definitions available. `["ES2022"]` gives you
`Array.prototype.at`, `Object.hasOwn`, etc. For browser code you'd add `"DOM"`
so `document` and `fetch` are typed. On Node 20+, `fetch` is a global — see the
`skipLibCheck` note and Module 10.

### `outDir` and `rootDir`

`rootDir: "src"` says "my source lives here"; `outDir: "dist"` says "put the
compiled JS here". This keeps a clean separation: edit `src/`, ship `dist/`.

### `strict` — turn it on and never look back

`"strict": true` is a **bundle** of flags. Each catches a real class of bug:

| Flag (all on under `strict`) | What it catches |
|---|---|
| `strictNullChecks` | Using a value that might be `null`/`undefined` without checking |
| `noImplicitAny` | A variable/param whose type couldn't be inferred silently becoming `any` |
| `strictFunctionTypes` | Unsafe function-parameter substitution |
| `strictPropertyInitialization` | A class field that's never assigned |
| `noImplicitThis` | `this` being implicitly `any` |
| `useUnknownInCatchVariables` | `catch (e)` giving you `unknown` instead of `any` (huge for error handling) |

The payoff is concrete:

```ts
// With strictNullChecks ON:
function firstWord(s: string | undefined) {
  return s.split(" ")[0];
  //     ^^^^ Error: 's' is possibly 'undefined'  ← caught at compile time
}

// You're forced to handle it:
function firstWordSafe(s: string | undefined) {
  if (s === undefined) return "";
  return s.split(" ")[0]; // OK — narrowed to string
}
```

> **🤖 AI/ML relevance:** API and model responses are riddled with optional
> fields (`usage?.output_tokens`, `choices[0]?.message`). Without
> `strictNullChecks`, you'd reach into `choices[0].message.content` and crash at
> runtime on an empty array. With it on, the compiler makes you handle the empty
> case *before* you ship.

### `esModuleInterop` — importing CommonJS from ESM

Many npm packages are still CommonJS. `esModuleInterop: true` lets you write the
natural `import express from "express"` instead of the awkward
`import * as express`. Leave it on. (It also enables `allowSyntheticDefaultImports`.)

### `skipLibCheck` — skip type-checking of `.d.ts` files

`true` tells `tsc` not to deep-check the declaration files inside
`node_modules`. This dramatically speeds up builds and sidesteps conflicts
between libraries' type definitions. It's standard practice; your own code is
still fully checked.

### `paths` and `baseUrl` — import aliases

`paths` lets you replace fragile deep relative imports with clean aliases:

```ts
// Instead of:
import { cosineSimilarity } from "../../../lib/vectors.js";
// You write:
import { cosineSimilarity } from "@/lib/vectors.js";
```

> **Gotcha:** `paths` is a *compile-time* remap. `tsc` does **not** rewrite the
> emitted import to the real path — so at runtime Node won't find `@/lib/...`.
> `tsx` handles it, and bundlers handle it, but for a `tsc`-then-`node` pipeline
> you need a resolver (e.g. `tsc-alias`) or you skip `paths`. Know this before
> it bites you.

### `declaration` and `sourceMap`

`declaration: true` emits `.d.ts` files alongside your `.js` — essential if
you're publishing a library so *consumers* get types. `sourceMap: true` emits
`.js.map` files so stack traces and debuggers point back to your `.ts` lines.

---

## 4. Declaration files and `@types/*`

A **declaration file** (`.d.ts`) contains *only* types — no runtime code. It's
how the compiler learns the shape of code it can't see the source of.

Three scenarios you'll hit:

**1. The library ships its own types.** Modern packages (like `zod`, or the
Anthropic SDK) include `.d.ts` files. You install and it just works.

**2. The library has no types, but `@types/*` exists.** The
[DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) project
publishes community types under the `@types` scope:

```bash
npm install --save-dev @types/node
```

Now `import fs from "node:fs"` is fully typed. The `@types/node` package *is* a
big bundle of `.d.ts` files.

**3. The library has no types and no `@types` package.** You write a minimal
declaration yourself. Say you import a tiny untyped package `mini-stats`:

```ts
// types/mini-stats.d.ts
declare module "mini-stats" {
  export function mean(nums: number[]): number;
  export function stdev(nums: number[]): number;
}
```

Point `tsconfig` at it (it's included by `include: ["src/**/*"]` if you keep it
under `src`, or add the folder). Now `import { mean } from "mini-stats"` is
typed, even though the package shipped nothing.

> **🤖 AI/ML relevance:** The JS ML ecosystem moves fast and some smaller
> libraries (tokenizers, vector-store clients, experimental model runners) ship
> incomplete or missing types. Being able to write a 5-line `.d.ts` shim
> unblocks you instead of scattering `// @ts-ignore` everywhere.

---

## 5. Project structure

There is no single "correct" layout, but a predictable one saves you. A good
default for an AI/ML-flavored Node service:

```
my-ai-app/
├── src/
│   ├── index.ts          # entry point
│   ├── config.ts         # env parsing + typed config
│   ├── lib/
│   │   ├── llm.ts        # LLM client wrapper
│   │   └── vectors.ts    # embedding / similarity helpers
│   ├── schemas/
│   │   └── extraction.ts # Zod schemas for structured output
│   └── types/
│       └── domain.ts     # shared domain types
├── tests/
├── dist/                 # compiled output (gitignored)
├── tsconfig.json
├── package.json
└── .env                  # secrets (gitignored — see Module 10)
```

Principles that scale:

- **One concern per file.** `llm.ts` talks to the model; `vectors.ts` does math.
- **Schemas live together** (`schemas/`) — they're the contract with the outside
  world, and you'll import them widely.
- **A single typed `config.ts`** so environment access is centralized and
  validated once (Module 10 covers env vars in depth).
- **Barrel files sparingly.** An `index.ts` that re-exports a folder is
  convenient but can create circular imports and slow builds. Use judgment.

---

## 6. Error handling patterns in TypeScript

JavaScript's `throw` can throw *anything* — a string, a number, `undefined`. And
under `strict`, `catch (e)` gives you `e: unknown`. That's a feature: it forces
you to narrow before you touch the error.

### Pattern A: narrow `unknown` in `catch`

```ts
async function loadConfig(path: string): Promise<string> {
  try {
    const { readFile } = await import("node:fs/promises");
    return await readFile(path, "utf8");
  } catch (e: unknown) {
    if (e instanceof Error) {
      // Now e.message / e.stack are safe to use
      throw new Error(`Failed to load ${path}: ${e.message}`);
    }
    throw new Error(`Failed to load ${path}: ${String(e)}`);
  }
}
```

### Pattern B: typed / custom error classes

Give distinct failures distinct classes so callers can react differently:

```ts
class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Rate limited; retry after ${retryAfterSeconds}s`);
    this.name = "RateLimitError";
  }
}

class ValidationError extends Error {
  constructor(message: string, public readonly issues: string[]) {
    super(message);
    this.name = "ValidationError";
  }
}

// Caller:
try {
  await callModel();
} catch (e) {
  if (e instanceof RateLimitError) {
    await sleep(e.retryAfterSeconds * 1000); // back off — recoverable
  } else if (e instanceof ValidationError) {
    console.error("Bad model output:", e.issues); // log + surface, not retryable
  } else {
    throw e; // unknown failure — let it bubble
  }
}
```

### Pattern C: the `Result` type (errors as values)

`throw` is invisible in a function's signature — nothing tells the caller a
function can fail. The `Result` pattern makes failure *part of the return type*,
so the compiler forces the caller to handle it. This is idiomatic in Rust and
increasingly popular in TS.

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parsePositiveInt(input: string): Result<number, string> {
  const n = Number(input);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: `"${input}" is not a positive integer` };
  }
  return { ok: true, value: n };
}

const r = parsePositiveInt("42");
if (r.ok) {
  console.log(r.value * 2); // r.value is number here — narrowed
} else {
  console.error(r.error);   // r.error is string here
}
```

That `{ ok: true } | { ok: false }` union is a **discriminated union**: the `ok`
field is the *discriminant*, and checking it narrows the type. This is the same
machinery we use next for error types.

### Pattern D: discriminated unions for domain errors

When a function can fail in several *known* ways, model each as a variant:

```ts
type LlmError =
  | { kind: "timeout"; elapsedMs: number }
  | { kind: "rate_limit"; retryAfter: number }
  | { kind: "bad_output"; raw: string }
  | { kind: "http"; status: number };

function describe(err: LlmError): string {
  switch (err.kind) {
    case "timeout":    return `Timed out after ${err.elapsedMs}ms`;
    case "rate_limit": return `Rate limited; wait ${err.retryAfter}s`;
    case "bad_output": return `Model returned unparseable output`;
    case "http":       return `HTTP ${err.status}`;
    // No default needed — TS knows every case is handled (exhaustiveness).
  }
}
```

If you later add a `{ kind: "auth" }` variant and forget a `case`, the compiler
flags it (with the `never` exhaustiveness trick from Module 08). Your error
handling can never silently fall out of date.

> **🤖 AI/ML relevance:** LLM calls fail in *categorically* different ways —
> transient (rate limit, timeout → retry) vs. terminal (bad output, auth →
> don't retry). A discriminated union makes those categories explicit and forces
> your retry logic to consider all of them. Module 11 builds a real retry loop on
> exactly this idea.

---

## 7. Runtime validation with Zod

We've arrived at the payoff. **TypeScript types are erased at runtime; Zod
schemas are not.** [Zod](https://zod.dev) lets you declare a schema *once* and
get two things from it: a **validator** that runs at runtime, and a **static
type** inferred from the schema. One source of truth, checked at the boundary.

```bash
npm install zod
```

### Schema → type, for free

```ts
import { z } from "zod";

// Define the schema once:
const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "member", "guest"]),
  createdAt: z.coerce.date(), // accepts an ISO string, produces a Date
});

// Derive the TypeScript type from it — no duplication:
type User = z.infer<typeof UserSchema>;
// type User = {
//   id: number; name: string; email: string;
//   role: "admin" | "member" | "guest"; createdAt: Date;
// }
```

You never write the `interface` separately — `z.infer` keeps type and validator
perfectly in sync. Change the schema, the type changes with it.

### `.parse` vs `.safeParse`

Two ways to validate:

```ts
// .parse — throws a ZodError if invalid. Use when invalid data is exceptional.
const user = UserSchema.parse(unknownData); // user: User (guaranteed valid)

// .safeParse — returns a Result-like object. Use when invalid data is expected.
const result = UserSchema.safeParse(unknownData);
if (result.success) {
  console.log(result.data.email); // result.data: User
} else {
  console.error(result.error.issues); // detailed, path-aware error list
}
```

Notice `.safeParse` returns exactly the discriminated-union `Result` shape from
Section 6 (`success: true | false`). The patterns compound.

### Why this matters: validating LLM / API output

Here's the whole module in one example. You ask an LLM to extract structured
data. It *usually* returns clean JSON — but "usually" is not "always".

```ts
import { z } from "zod";

// The contract you want the model to honor:
const SentimentSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string()).max(10),
});
type Sentiment = z.infer<typeof SentimentSchema>;

function parseModelOutput(raw: string): Sentiment {
  // Step 1: the raw text might not even be JSON.
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Model did not return valid JSON: ${raw.slice(0, 120)}`);
  }
  // Step 2: it's JSON, but is it the RIGHT shape? Zod decides.
  return SentimentSchema.parse(json); // returns a fully-typed, validated Sentiment
}

// Happy path:
const good = parseModelOutput('{"sentiment":"positive","confidence":0.92,"keywords":["fast","reliable"]}');
console.log(good.sentiment); // "positive" — and TypeScript knows the type

// The model hallucinated an out-of-range confidence — CAUGHT:
try {
  parseModelOutput('{"sentiment":"positive","confidence":1.7,"keywords":[]}');
} catch (e) {
  if (e instanceof z.ZodError) {
    console.error(e.issues[0].message); // "Number must be less than or equal to 1"
  }
}
```

**Output:**

```
positive
Number must be less than or equal to 1
```

Without Zod, `confidence: 1.7` would flow straight into your app — maybe into a
UI progress bar that renders 170%, maybe into a database column that later
breaks a downstream model. With Zod, the bad value is stopped *at the boundary*,
with a precise, actionable error.

> **🤖 AI/ML relevance:** This is the single most important pattern in this
> module for AI work. Every LLM "structured output" call should end in a Zod
> `.parse`/`.safeParse`. You get: (1) a runtime guarantee the data is well-formed,
> (2) a static type for the rest of your program, and (3) a clean signal to
> *retry the model* when validation fails (feed the ZodError back into the prompt
> — "your last output was invalid because…"). Module 13 builds exactly this loop.

### 🎬 Real-life scenario — the resilient extraction pipeline

Your job ingests support tickets and asks an LLM to tag each with a category,
priority, and a list of affected features. You define a `TicketTagSchema` in
`schemas/`. Each model response goes through `.safeParse`. On success you write
the typed object to your database. On failure you (a) log the ZodError, (b) retry
the model once with the error appended to the prompt, and (c) if it *still*
fails, route the ticket to a human queue. Because the schema is the single source
of truth, when product asks to add a `sentiment` field you change *one* file and
both the validator and the type update — the compiler then walks you through every
call site that needs the new field.

---

## Common pitfalls

- **Believing types protect you at runtime.** They don't — types are erased.
  Untrusted input (files, network, LLMs) needs runtime validation. This is *the*
  lesson of the module.
- **Forgetting `.js` extensions in relative imports** under `NodeNext`. The
  import points at the *emitted* file, so `./x.ts` becomes `import "./x.js"`.
- **Using `paths` aliases with a plain `tsc` → `node` pipeline** and being
  surprised Node can't resolve `@/...`. Aliases need a resolver at runtime, or
  use them only with `tsx`/bundlers.
- **Disabling `strict` "to move faster."** You trade a few seconds now for
  runtime crashes later. Keep it on from day one.
- **Duplicating a Zod schema and a hand-written `interface`.** Use
  `z.infer<typeof Schema>` — one source of truth.
- **`catch (e)` then immediately using `e.message`.** Under `strict`, `e` is
  `unknown`; narrow with `e instanceof Error` first.
- **Putting `typescript`/`tsx` in `dependencies`.** They're build tools →
  `devDependencies` (Module 10 explains the distinction).

## Recap

- TypeScript is a **build step**; types vanish at runtime. Everything follows
  from that.
- `tsconfig.json` configures the compiler — for Node 20 + ESM use `target:
  ES2022`, `module`/`moduleResolution: NodeNext`, and **`strict: true`**.
- Run `.ts` with **`tsx`** in development; compile with **`tsc`** when you ship.
- `.d.ts` files and `@types/*` packages carry types for code the compiler can't
  see; you can write your own shim in a few lines.
- Handle errors with **narrowing**, **typed error classes**, the **`Result`
  type**, and **discriminated unions** — all of which the compiler helps you keep
  exhaustive.
- **Zod** turns one schema into both a runtime validator and a static type
  (`z.infer`). `.parse` throws; `.safeParse` returns a Result. This is how you
  make untrusted LLM/API output safe.

## Next

→ **[Module 10 — Node.js & Ecosystem](../10-nodejs-ecosystem/README.md)**: the
runtime that actually executes your compiled code — `package.json`, npm/pnpm,
modules, `fs`, environment variables and API-key hygiene, `fetch`, and building a
small CLI. Everything you need before you start calling real APIs in Module 11.
