# Module 10 — Node.js & the Ecosystem

> Your TypeScript compiles to JavaScript — but *something* has to run it outside
> a browser. That something is **Node.js**. This module is the runtime and the
> tooling around it: how Node executes your code, how `package.json` and npm hold
> a project together, how you read files and environment variables, how you make
> HTTP requests with the built-in `fetch`, and how to build a small CLI. By the
> end you can stand up the kind of script that loads a dataset, reads an API key
> from `.env`, calls a model, and writes results to disk — the backbone of every
> AI/ML pipeline in JS/TS.

## What you'll learn

- What Node.js *is* — the runtime, the event loop's home, and the standard library
- CommonJS vs ESM in Node, and how `"type": "module"` decides which you get
- `package.json` in depth: scripts, `dependencies` vs `devDependencies`, semver,
  and lockfiles
- npm and pnpm basics, and the `node_modules` mental model
- Environment variables, `.env` files, `process.env`, and **secure API-key
  handling**
- Reading and writing files with `node:fs/promises`, and working with paths
- The built-in `fetch`, plus a note on tiny HTTP servers
- `process.argv` and building a CLI
- Structuring a small Node project

## Prerequisites

- Modules 04 (Async), 05 (Modern JS/modules), and 09 (TS in Practice)
- Node.js 20+ and npm installed (Module 00)

---

## 1. What Node.js actually is

**Node.js is a program that runs JavaScript outside the browser.** It bundles:

1. **V8** — Google's JavaScript engine (the same one in Chrome), which compiles
   and executes your JS.
2. **libuv** — a C library providing the event loop and non-blocking I/O (the
   machinery behind Module 04's async model).
3. **A standard library** — modules for the filesystem (`fs`), networking
   (`http`, `net`), paths (`path`), processes (`process`), crypto, and more.

Run JavaScript with it directly:

```bash
node -e "console.log('Node version:', process.version)"
# Node version: v20.x.x
```

Or run a file:

```bash
node script.js
```

Because Node runs *JavaScript*, and TypeScript compiles *to* JavaScript, Node is
where your compiled code lives. During development you'll often skip the compile
step with `tsx` (Module 09), which is just Node with an on-the-fly TS
transformer.

> **🤖 AI/ML relevance:** The heavy model training happens elsewhere (Python,
> GPUs). But the *application* layer around AI — API orchestration, RAG
> pipelines, agents, data prep, serving — is increasingly built in Node/TS
> because it's the same language as the web frontend and has excellent async and
> streaming support. Node is the runtime for the AI *product*, not the model.

Node's standard-library modules are best imported with the `node:` prefix, which
makes it unambiguous you mean the built-in, not an npm package:

```ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
```

---

## 2. CommonJS vs ESM in Node

Node historically used **CommonJS (CJS)** modules — `require()` and
`module.exports`. Modern JavaScript standardized on **ES Modules (ESM)** —
`import` and `export` (Module 05). Node supports both, and *which one a file uses
is decided by configuration*, not by you at the call site.

```js
// CommonJS (the old way)
const fs = require("node:fs");
module.exports = { greet };

// ESM (the standard, modern way)
import fs from "node:fs";
export { greet };
```

**How Node decides:** the nearest `package.json`'s `"type"` field.

- `"type": "module"` → `.js` files are treated as **ESM**.
- `"type": "commonjs"` (or absent) → `.js` files are **CJS**.
- The `.mjs` extension is always ESM; `.cjs` is always CJS — regardless of `"type"`.

**Use ESM for new projects.** Add `"type": "module"` to `package.json` and write
`import`/`export` everywhere. This guide's examples all assume ESM.

```jsonc
// package.json
{
  "type": "module"
}
```

Key ESM rules that trip people up:

- **Relative imports need file extensions:** `import { x } from "./util.js"`
  (Module 09 explained why — you import the emitted path).
- **No `__dirname` / `__filename`** globals. Derive them from `import.meta.url`:

```ts
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

- **Top-level `await` works** in ESM modules — no wrapper `async` function needed.

> **Gotcha:** You can `import` a CommonJS package from ESM (thanks to
> `esModuleInterop`, Module 09), but you generally cannot `require()` an ESM
> package from CJS. When a package's docs show `import`, follow them.

---

## 3. `package.json` in depth

`package.json` is the manifest for your project — its identity, dependencies, and
scripts. Here's an annotated one for an AI CLI:

```jsonc
{
  "name": "embed-cli",
  "version": "1.0.0",
  "type": "module",              // ESM (see Section 2)
  "bin": { "embed": "dist/index.js" }, // makes `embed` a runnable command when installed
  "scripts": {
    "dev": "tsx src/index.ts",           // run without building
    "build": "tsc",                       // compile to dist/
    "start": "node dist/index.js",        // run the built output
    "typecheck": "tsc --noEmit"           // check types without emitting
  },
  "dependencies": {
    "zod": "^3.23.0",              // needed at RUNTIME (your code imports it)
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",       // build-time only
    "tsx": "^4.16.0",
    "@types/node": "^20.14.0"
  }
}
```

### Scripts

Anything under `"scripts"` runs with `npm run <name>` (and a few names like
`start`/`test` work without `run`). Scripts are just shell commands; they run
with `node_modules/.bin` on the PATH, so `tsc`, `tsx`, etc. resolve without a
global install.

### `dependencies` vs `devDependencies`

This distinction is load-bearing:

- **`dependencies`** — packages your *shipped code imports at runtime* (`zod`,
  `dotenv`, an SDK). They get installed when someone else installs your package.
- **`devDependencies`** — tools used only to *build/test/lint* (`typescript`,
  `tsx`, test runners, `@types/*`). Excluded from production installs with
  `npm install --omit=dev`.

Getting this wrong bloats production installs (dev deps leaking in) or breaks
runtime (a runtime dep marked as dev and stripped out). Rule of thumb: *does my
running code `import` it?* → `dependencies`. *Only my toolchain?* →
`devDependencies`.

Install into the right bucket:

```bash
npm install zod            # -> dependencies
npm install -D typescript  # -> devDependencies (-D is short for --save-dev)
```

### Semver — the `^` and `~`

Version numbers are `MAJOR.MINOR.PATCH` (**sem**antic **ver**sioning):

- **MAJOR** — breaking changes
- **MINOR** — new features, backward compatible
- **PATCH** — bug fixes, backward compatible

Range prefixes control which updates you accept:

| Spec | Meaning | Allows |
|---|---|---|
| `^3.23.0` | compatible with 3.x | `3.23.0` up to `<4.0.0` |
| `~3.23.0` | approximately 3.23.x | `3.23.0` up to `<3.24.0` |
| `3.23.0` | exact | only `3.23.0` |
| `*` | anything (avoid) | any version |

`^` is the npm default and usually right: pick up bug fixes and features, avoid
surprise breaking changes.

### Lockfiles

`package.json` records *ranges* (`^3.23.0`); the **lockfile** records the
*exact* versions actually installed (`3.23.8`), plus every transitive
dependency and its hash. npm writes `package-lock.json`; pnpm writes
`pnpm-lock.yaml`.

**Commit your lockfile.** It's what makes installs reproducible — you, your CI,
and production all get byte-identical dependency trees. Use `npm ci` (instead of
`npm install`) in CI to install *exactly* from the lockfile and fail if it's out
of sync.

---

## 4. npm, pnpm, and the `node_modules` mental model

`npm` ships with Node. **pnpm** is a popular alternative that's faster and far
more disk-efficient — it stores each package version once in a global,
content-addressed store and hard-links it into each project's `node_modules`.
Ten projects using the same `zod` version share one copy on disk.

```bash
# npm                      # pnpm equivalent
npm install                pnpm install
npm install zod            pnpm add zod
npm install -D tsx         pnpm add -D tsx
npm run build              pnpm build
npm ci                     pnpm install --frozen-lockfile
```

**The `node_modules` mental model:** when you `import "zod"`, Node walks up the
directory tree looking for `node_modules/zod` and reads that package's
`package.json` to find its entry point. Your imports of bare package names
(`"zod"`, not `"./thing.js"`) resolve into `node_modules`. It's a big folder of
your dependencies *and their dependencies* — often thousands of files. You never
edit it, never commit it (`.gitignore` it), and can always regenerate it from
`package.json` + lockfile with an install.

> **🤖 AI/ML relevance:** AI projects pull in a lot — SDKs, vector-store clients,
> tokenizers, validation libs. pnpm's shared store noticeably speeds up installs
> and CI across the many small services a typical AI product spawns. And keeping
> `dependencies`/`devDependencies` clean keeps your deployed container small.

---

## 5. Environment variables, `.env`, and API-key hygiene

Configuration and **secrets** (API keys) must not be hard-coded. They live in
**environment variables**, read via `process.env`.

```ts
import process from "node:process";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}
```

Every value in `process.env` is a `string | undefined` — always check for
`undefined` before use (Module 09's `strictNullChecks` makes the compiler
enforce this).

### `.env` files with `dotenv`

For local development, a `.env` file is convenient. The `dotenv` package loads it
into `process.env`:

```bash
npm install dotenv
```

```
# .env  (NEVER commit this file)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxx
LLM_MODEL=claude-sonnet-5
```

```ts
import "dotenv/config"; // loads .env into process.env as a side effect
import process from "node:process";

console.log("Model:", process.env.LLM_MODEL); // claude-sonnet-5
```

> **Node 20.6+ built-in:** you can also skip `dotenv` and run
> `node --env-file=.env script.js`. `dotenv` remains handy for programmatic
> control and older setups.

### Secure API-key handling — the rules

This matters enormously; a leaked key can cost real money or expose data.

1. **Never hard-code keys** in source. Not even "temporarily."
2. **Never commit `.env`.** Add it to `.gitignore` on day one. Commit a
   `.env.example` with the *names* (and blank values) so teammates know what's
   needed.
3. **Validate config at startup** — fail loudly if a required key is missing,
   rather than mid-request. (Combine with a Zod schema from Module 09.)
4. **Keys belong on the server.** Never ship an API key to a browser bundle — it
   would be visible to anyone. Frontend code calls *your* backend, which holds
   the key.
5. **In production, use the platform's secret manager** (environment variables
   set by your host, a vault, etc.) — not a `.env` file baked into an image.

```
# .gitignore
node_modules/
dist/
.env
.env.*
!.env.example
```

### 🎬 Real-life scenario — the key that got committed

A teammate pushes a quick prototype and accidentally commits `.env` with a live
API key. Within hours automated scrapers find it in the public repo and the key
racks up thousands of dollars in usage before anyone notices. The fix is
prevention: `.env` in `.gitignore` from the first commit, keys loaded from the
environment, and config validated at startup so the app refuses to run without
properly-provided secrets. Every example in Module 11 keeps keys in
`process.env` for exactly this reason.

---

## 6. Reading and writing files with `node:fs/promises`

Node's promise-based filesystem API (`node:fs/promises`) pairs perfectly with
`async/await`. Use it over the old callback API.

```ts
import { readFile, writeFile, mkdir } from "node:fs/promises";

// Read a text file
const text = await readFile("data/reviews.txt", "utf8");
//                                              ^^^^^ encoding -> returns a string
// (omit the encoding and you get a Buffer of raw bytes)

// Write a text file (creates or overwrites)
await writeFile("out/summary.txt", "All done.\n", "utf8");

// Ensure a directory exists before writing into it
await mkdir("out", { recursive: true }); // recursive:true = no error if it exists
```

### Reading and writing JSON

There's no dedicated JSON file API — you read text and `JSON.parse`, or
`JSON.stringify` and write text.

```ts
import { readFile, writeFile } from "node:fs/promises";

interface Record { id: number; text: string; }

// Read + parse
const raw = await readFile("data/records.json", "utf8");
const records: Record[] = JSON.parse(raw); // untrusted! validate with Zod (Module 09)

// Serialize + write (the `null, 2` makes it human-readable)
await writeFile("out/records.json", JSON.stringify(records, null, 2), "utf8");
```

> **Reminder from Module 09:** `JSON.parse` returns `any` — the data is
> *untrusted*. In real code, pipe it through a Zod schema so a malformed file
> can't silently poison your program.

### Paths — never string-concatenate them

Use `node:path` to join paths portably (it handles `/` vs `\` and stray slashes):

```ts
import path from "node:path";

const p = path.join("data", "2026", "reviews.json"); // "data/2026/reviews.json"
const abs = path.resolve("out", "vectors.json");      // absolute path from cwd
const ext = path.extname("model.safetensors");        // ".safetensors"
const base = path.basename("/tmp/data/reviews.json"); // "reviews.json"
```

> **🤖 AI/ML relevance:** Datasets live on disk. You'll read a JSONL corpus,
> stream it in batches, call an embeddings API, and write vectors back to a JSON
> file — all with `fs/promises` and `path`. Batch-processing files is a core
> AI-engineering chore, and doing it with async file I/O keeps memory bounded and
> throughput high.

---

## 7. The built-in `fetch` and HTTP

Since Node 18, **`fetch` is a global** — the same API you know from the browser,
no install needed. This is your gateway to every REST and LLM API (Module 11 goes
deep).

```ts
// GET JSON
const res = await fetch("https://api.example.com/models");
if (!res.ok) {
  throw new Error(`HTTP ${res.status} ${res.statusText}`);
}
const data = await res.json(); // parses the JSON body

// POST JSON
const created = await fetch("https://api.example.com/items", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "vector-index" }),
});
```

Two things everyone forgets:

- **`fetch` does not throw on HTTP errors.** A 404 or 500 is a *resolved*
  promise with `res.ok === false`. You must check `res.ok` yourself.
- **The body is a stream you read once** — call `res.json()` **or** `res.text()`,
  not both.

### A tiny HTTP server

For completeness, Node can *serve* HTTP too, with the built-in `node:http`:

```ts
import { createServer } from "node:http";

const server = createServer((req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, path: req.url }));
});

server.listen(3000, () => console.log("Listening on http://localhost:3000"));
```

> **In practice**, you'd reach for a framework — **Express** (mature, ubiquitous)
> or **Hono** (modern, tiny, works on every runtime) — which add routing,
> middleware, and body parsing. For AI apps, Hono is popular because it runs on
> Node, Bun, Cloudflare Workers, and edge runtimes unchanged. The built-in
> `node:http` is worth knowing, but you'll rarely write raw servers by hand.

---

## 8. `process.argv` and building a CLI

`process.argv` is the array of command-line arguments. The first two entries are
always the Node binary and the script path; *your* arguments start at index 2.

```ts
import process from "node:process";

// Run as: tsx cli.ts embed "hello world" --model=claude-sonnet-5
const args = process.argv.slice(2);
console.log(args); // ["embed", "hello world", "--model=claude-sonnet-5"]
```

A minimal hand-rolled CLI:

```ts
import process from "node:process";

const [command, ...rest] = process.argv.slice(2);

switch (command) {
  case "greet":
    console.log(`Hello, ${rest[0] ?? "world"}!`);
    break;
  case undefined:
    console.error("Usage: cli <command> [args]");
    process.exit(1); // non-zero exit = failure (important for scripts/CI)
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
```

For anything beyond trivial parsing, use a library — Node's built-in
`node:util` `parseArgs`, or `commander`/`yargs` — which handle flags, defaults,
and `--help` for you. But `process.argv.slice(2)` is enough to get started and
teaches you what those libraries do under the hood.

> **🤖 AI/ML relevance:** A huge amount of AI tooling is CLIs — "embed this
> folder", "run this eval", "chat with the model in the terminal". A small
> `process.argv` script that reads a `.env` key, calls a model, and prints the
> answer is often the fastest useful thing you can build. The Module 10 exercises
> build exactly that.

---

## 9. Structuring a small Node project

Pulling it together, a runnable AI CLI project looks like:

```
embed-cli/
├── src/
│   ├── index.ts        # CLI entry: parse argv, dispatch commands
│   ├── config.ts       # load + validate env (dotenv + Zod)
│   ├── io.ts           # read/write dataset & output files
│   └── llm.ts          # fetch wrapper for the model API
├── data/               # input datasets (maybe gitignored if large)
├── out/                # generated output (gitignored)
├── .env                # secrets (gitignored)
├── .env.example        # documented, committed
├── .gitignore
├── package.json
└── tsconfig.json
```

- **`config.ts`** loads and validates the environment *once*, exports a typed
  `config`. Everything else imports it — no scattered `process.env` reads.
- **`io.ts`** isolates filesystem concerns so `index.ts` stays about
  orchestration.
- **`llm.ts`** wraps `fetch` so the network details live in one place (Module 11
  turns this into a reusable `callLLM()`).

---

## Common pitfalls

- **Forgetting `res.ok`.** `fetch` doesn't throw on 4xx/5xx. Always check.
- **Reading a fetch body twice.** `res.json()`/`res.text()` consume the stream —
  call one, once.
- **Putting runtime deps in `devDependencies`** (or vice versa). Ask: does
  *running* code import it?
- **Committing `.env` or `node_modules`.** `.gitignore` both from the start.
- **Hard-coding API keys.** Always `process.env`, validated at startup, never in
  a browser bundle.
- **String-concatenating paths.** Use `node:path`.
- **Expecting `__dirname` in ESM.** Derive it from `import.meta.url`.
- **Using callback `fs`** in new code. Prefer `node:fs/promises` with `await`.
- **Deleting the lockfile "to fix installs."** The lockfile is the source of
  reproducibility — keep it committed and use `npm ci` in CI.

## Recap

- **Node.js** runs JavaScript outside the browser (V8 + libuv + a standard
  library). It's the runtime for AI *applications*.
- New projects use **ESM** (`"type": "module"`, `import`/`export`, extensions on
  relative imports, no `__dirname`).
- **`package.json`** declares scripts and dependencies; `dependencies` are
  runtime, `devDependencies` are build-time. **Semver** (`^`) controls updates;
  the **lockfile** pins exact versions — commit it.
- **npm/pnpm** manage `node_modules`; pnpm shares packages across projects for
  speed and disk savings.
- **Secrets** live in environment variables (`process.env`), loaded from `.env`
  in dev via `dotenv` or `--env-file`. Never commit them, never ship them to the
  browser, validate them at startup.
- **`node:fs/promises`** reads/writes files; **`node:path`** joins paths safely.
- **`fetch`** is built in — check `res.ok`, read the body once.
- **`process.argv.slice(2)`** gives you CLI arguments; `process.exit(1)` signals
  failure.

## Next

→ **[Module 11 — APIs & LLMs](../11-apis-and-llms/README.md)**: the pivotal
module. HTTP fundamentals, REST, auth, `fetch` for GET/POST, retries with
exponential backoff, rate limiting, and then LLM APIs in depth — the Anthropic
Messages API request/response shape, streaming token-by-token, usage accounting,
timeouts, a reusable typed `callLLM()`, and when to reach for the official SDK.
