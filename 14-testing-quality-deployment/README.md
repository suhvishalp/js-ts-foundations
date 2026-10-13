# Module 14 — Testing, Quality & Deployment

You've learned to *build* AI applications — RAG pipelines, agents, embeddings, streaming chat. This module is about the unglamorous work that separates a weekend demo from something you'd put in front of real users: **testing it**, **keeping it clean**, **observing it in production**, and **shipping it**. AI apps have a special twist — parts of them are *non-deterministic* — so we spend real time on how to test something that gives a slightly different answer every time.

## What you'll learn
- **Why testing matters**, and why it's *harder but more important* for AI apps
- **Unit testing with Vitest** — `describe/it/expect`, running tests, watch mode, coverage
- Testing **pure functions** deterministically (cosine similarity, chunkers, parsers)
- Testing **async code** and **mocking** network/LLM calls so tests never hit real APIs
- **Strategies for non-deterministic LLM output** — assert structure not exact text, golden sets, LLM-as-judge, careful snapshots
- **Linting & formatting** with ESLint + Prettier, and **type-checking in CI** (`tsc --noEmit`)
- **Logging & observability** — structured logs, tracing LLM calls, capturing tokens/latency/cost
- **Error handling & resilience** — retries, timeouts, circuit breakers
- **Config & secrets** management in production
- **Deployment** — building, running, Docker, serverless/edge (Vercel, Cloudflare Workers, Node)
- **CI basics** — a GitHub Actions workflow that installs, type-checks, lints, and tests

**Prerequisites:** Modules 01–13. You should be comfortable with async/await (Module 04), TypeScript (07–09), Node & npm (Module 10), calling LLMs (Module 11), and the RAG/agent patterns from Module 13. Node 20+ and a project using ESM + TypeScript.

---

## Why testing matters (especially for AI apps)

Every codebase drifts. You refactor a chunker, tweak a prompt, bump an SDK version — and something three files away quietly breaks. **Tests are the safety net that tells you the moment that happens**, instead of a user telling you a week later. They also serve as *executable documentation*: a good test suite shows exactly how a function is meant to be used.

For ordinary software this is well understood. For AI applications there's an extra reason testing matters, and a reason it's harder:

- **AI apps have a deterministic skeleton and a non-deterministic core.** The chunker, the vector math, the retrieval logic, the JSON parsing, the tool-dispatch — all *deterministic* and *eminently testable*. The LLM call in the middle is not. The trick is to **test the skeleton rigorously** and **test the LLM boundary cleverly**.
- **The expensive, flaky, rate-limited part is the network call.** You never want your test suite to actually call OpenAI or Anthropic — it's slow, costs money, and fails when the network hiccups. So we learn to **mock** that boundary.
- **Regressions are subtle.** A prompt change that makes answers 5% worse won't throw an error. This is where **golden sets** and **LLM-as-judge** come in.

> **🤖 AI/ML relevance:** The single highest-leverage testing habit for AI engineers is *isolating the model call behind an interface you can swap for a fake*. Do that, and 80% of your app becomes as testable as any other software.

### 🎬 Real-life scenario
Your team ships a RAG assistant. A junior dev "improves" the chunker to split on paragraphs instead of a fixed token window. All manual demos look fine. Two days later, retrieval quality tanks for long tables that used to fit in one chunk. A single unit test — *"a 1,200-token document produces chunks that never exceed 512 tokens and preserve every character"* — would have caught it in the pull request. This module is about writing that test (and the fifteen others that let you refactor fearlessly).

---

## Setting up Vitest

We'll use **[Vitest](https://vitest.dev/)** — a fast, modern test runner with a Jest-compatible API, first-class TypeScript/ESM support, and near-zero config. (Everything here maps almost 1:1 to Jest if your team uses that instead.)

```bash
npm install --save-dev vitest
```

Add scripts to `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

- `vitest run` runs once and exits — this is what CI uses.
- `vitest` (no `run`) starts **watch mode**: it re-runs only the tests affected by a file you save. This is your day-to-day loop.

A minimal `vitest.config.ts` (optional but nice):

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",     // we're testing backend code, not the DOM
    globals: false,          // we import describe/it/expect explicitly (clearer)
    include: ["**/*.test.ts"],
  },
});
```

> **🤖 AI/ML relevance:** `environment: "node"` matters — AI backends run on Node, not in a browser. If you later test in-browser Transformers.js code (Module 12), you'd add a `jsdom` environment for those files.

---

## Your first test: a pure function

The best place to start is a **pure function** — same input, same output, no side effects, no network. Cosine similarity, the workhorse of every embeddings app, is a perfect example.

```ts
// src/vector.ts
/** Cosine similarity of two equal-length vectors. Range: -1 (opposite) to 1 (identical). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vectors must be equal length: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
```

Now the test. Test files live next to the code as `*.test.ts` (or under `tests/` — pick one convention and keep it):

```ts
// src/vector.test.ts
import { describe, it, expect } from "vitest";
import { cosineSimilarity } from "./vector.js";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBe(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBe(-1);
  });

  it("handles floating point with a tolerance", () => {
    // Never assert exact equality on floats — use closeTo.
    const sim = cosineSimilarity([0.1, 0.2, 0.3], [0.2, 0.4, 0.6]);
    expect(sim).toBeCloseTo(1, 5); // these are parallel → similarity 1
  });

  it("treats a zero vector as similarity 0 (no divide-by-zero)", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it("throws on length mismatch", () => {
    expect(() => cosineSimilarity([1, 2], [1])).toThrow(/equal length/);
  });
});
```

Run it:

```bash
npm test
```

```
 ✓ src/vector.test.ts (6)
   ✓ cosineSimilarity (6)
     ✓ returns 1 for identical vectors
     ✓ returns 0 for orthogonal vectors
     ✓ returns -1 for opposite vectors
     ✓ handles floating point with a tolerance
     ✓ treats a zero vector as similarity 0 (no divide-by-zero)
     ✓ throws on length mismatch

 Test Files  1 passed (1)
      Tests  6 passed (6)
```

**Anatomy of a test:**
- `describe(name, fn)` — groups related tests (a "suite").
- `it(name, fn)` (alias `test`) — one test case. Name it as a *sentence describing behavior*.
- `expect(value).matcher(...)` — an assertion. Key matchers: `toBe` (strict `===`), `toEqual` (deep equality), `toBeCloseTo` (floats!), `toThrow`, `toContain`, `toHaveLength`, `toMatchObject`.

> **🤖 AI/ML relevance:** `toBeCloseTo` is your best friend in ML code. Embeddings, similarities, softmax outputs, and normalized vectors are all floating-point — asserting `toBe(0.9999999999998)` will fail on a different CPU. Assert *approximate* equality with a tolerance.

### 🎬 Real-life scenario
A teammate normalizes embeddings before storing them to speed up similarity search. You write one test asserting that a normalized vector has magnitude ≈ 1 and that cosine similarity is unchanged after normalization. When someone later "optimizes" the normalizer and accidentally divides by the *sum* instead of the *magnitude*, the test fails instantly with a clear message — no debugging a mysterious "search feels off" report.

---

## Testing a chunker (deterministic text logic)

Chunking is pure text logic — perfect for exhaustive testing. Here's a simple character-window chunker with overlap (the shape of most real chunkers):

```ts
// src/chunk.ts
export interface Chunk {
  text: string;
  index: number;
  start: number;
  end: number;
}

/** Split text into overlapping windows of `size` chars, stepping by `size - overlap`. */
export function chunkText(text: string, size = 512, overlap = 64): Chunk[] {
  if (size <= 0) throw new Error("size must be > 0");
  if (overlap >= size) throw new Error("overlap must be < size");
  const chunks: Chunk[] = [];
  const step = size - overlap;
  let start = 0;
  let index = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push({ text: text.slice(start, end), index, start, end });
    if (end === text.length) break;
    start += step;
    index++;
  }
  return chunks;
}
```

Tests that pin down the *contract*:

```ts
// src/chunk.test.ts
import { describe, it, expect } from "vitest";
import { chunkText } from "./chunk.js";

describe("chunkText", () => {
  it("returns one chunk when text fits in a single window", () => {
    const chunks = chunkText("short text", 512, 64);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("short text");
  });

  it("never produces a chunk larger than `size`", () => {
    const text = "a".repeat(2000);
    const chunks = chunkText(text, 512, 64);
    for (const c of chunks) {
      expect(c.text.length).toBeLessThanOrEqual(512);
    }
  });

  it("covers the entire input (no characters dropped)", () => {
    const text = "The quick brown fox ".repeat(50);
    const chunks = chunkText(text, 100, 20);
    // Reconstruct by concatenating the non-overlapping prefix of each chunk.
    const covered = chunks[chunks.length - 1].end;
    expect(covered).toBe(text.length);
  });

  it("overlaps consecutive chunks by `overlap` chars", () => {
    const text = "0123456789".repeat(10); // 100 chars
    const chunks = chunkText(text, 40, 10);
    const tailOfFirst = chunks[0].text.slice(-10);
    const headOfSecond = chunks[1].text.slice(0, 10);
    expect(headOfSecond).toBe(tailOfFirst);
  });

  it("validates its arguments", () => {
    expect(() => chunkText("x", 0)).toThrow(/size/);
    expect(() => chunkText("x", 10, 10)).toThrow(/overlap/);
  });
});
```

Notice the pattern: instead of hard-coding "the output should be exactly these 5 strings," we assert **invariants** — *never exceeds size*, *covers everything*, *overlaps correctly*. Invariant tests survive refactors that legitimately change the exact output.

> **🤖 AI/ML relevance:** Chunking quality directly drives retrieval quality. Bugs here (dropped characters, chunks that blow past the embedding model's token limit) are silent and corrosive. Invariant tests are cheap insurance for the most important preprocessing step in RAG.

---

## Testing async code and mocking LLM calls

Now the interesting part. Consider a function that summarizes text with an LLM:

```ts
// src/summarize.ts — the WRONG shape for testing
import OpenAI from "openai";
const client = new OpenAI(); // ❌ reaches out to the network, reads env at import time

export async function summarize(text: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: `Summarize: ${text}` }],
  });
  return res.choices[0].message.content ?? "";
}
```

This is hard to test: the model client is baked in. The fix is **dependency injection** — pass the "thing that talks to the model" as a parameter (or via a constructor), typed by an *interface you own*:

```ts
// src/llm.ts — an interface YOU control
export interface ChatModel {
  complete(prompt: string): Promise<string>;
}
```

```ts
// src/summarize.ts — the RIGHT shape
import type { ChatModel } from "./llm.js";

export async function summarize(text: string, model: ChatModel): Promise<string> {
  if (!text.trim()) throw new Error("Cannot summarize empty text");
  return model.complete(`Summarize in one sentence:\n\n${text}`);
}
```

Your real implementation wraps the SDK:

```ts
// src/openai-model.ts
import OpenAI from "openai";
import type { ChatModel } from "./llm.js";

export class OpenAIModel implements ChatModel {
  constructor(private client = new OpenAI()) {}
  async complete(prompt: string): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0].message.content ?? "";
  }
}
```

But your **test** injects a fake — no network, instant, deterministic:

```ts
// src/summarize.test.ts
import { describe, it, expect, vi } from "vitest";
import { summarize } from "./summarize.js";
import type { ChatModel } from "./llm.js";

describe("summarize", () => {
  it("sends the text to the model and returns its answer", async () => {
    const fake: ChatModel = {
      complete: vi.fn(async () => "A concise summary."),
    };

    const result = await summarize("Long article about otters...", fake);

    expect(result).toBe("A concise summary.");
    // We can assert HOW the model was called — prompt construction is our logic:
    expect(fake.complete).toHaveBeenCalledOnce();
    expect(fake.complete).toHaveBeenCalledWith(
      expect.stringContaining("Long article about otters"),
    );
  });

  it("rejects empty input before ever calling the model", async () => {
    const fake: ChatModel = { complete: vi.fn() };
    await expect(summarize("   ", fake)).rejects.toThrow(/empty/);
    expect(fake.complete).not.toHaveBeenCalled();
  });
});
```

Two big ideas here:

1. **`vi.fn()`** creates a *mock function* — a stand-in that records how it was called (`toHaveBeenCalledWith`, `toHaveBeenCalledOnce`) and returns whatever you tell it. It's how you verify your code's *behavior around* the model without a real model.
2. **Async assertions.** For a promise that should resolve, `await` it and assert the value. For one that should reject, use `await expect(promise).rejects.toThrow(...)`.

### Mocking at the module boundary with `vi.mock`

Dependency injection is the cleanest approach, but sometimes you must test code that imports the SDK directly (legacy code, third-party). Vitest can replace a whole module:

```ts
// src/summarize-direct.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Replace the 'openai' module for every import in this test file.
vi.mock("openai", () => {
  const create = vi.fn(async () => ({
    choices: [{ message: { content: "Mocked summary." } }],
  }));
  return { default: vi.fn(() => ({ chat: { completions: { create } } })) };
});

// Import AFTER the mock is declared (vi.mock is hoisted, so this is fine).
import { summarize } from "./summarize-legacy.js";

beforeEach(() => vi.clearAllMocks());

describe("summarize (module-mocked)", () => {
  it("returns the mocked completion", async () => {
    expect(await summarize("hello")).toBe("Mocked summary.");
  });
});
```

> **🤖 AI/ML relevance:** Prefer **dependency injection** over `vi.mock` for the model boundary. An injected `ChatModel` interface makes your code testable *and* lets you swap providers (OpenAI ↔ Anthropic ↔ a local model) without touching business logic. `vi.mock` is a fine escape hatch when you can't change the code's shape.

### 🎬 Real-life scenario
Your CI bill spikes and builds start failing intermittently. Investigation: someone wrote an integration test that calls the real embeddings API in a loop. It's slow, costs money per run, and fails whenever the API is briefly rate-limited. You refactor it to inject a fake embedder that returns deterministic vectors. CI time drops from 4 minutes to 8 seconds, the flakiness vanishes, and the bill disappears. **Unit tests must never touch the network.** (Keep a *tiny* number of real integration tests, run on a schedule or manually — not on every push.)

---

## Testing non-deterministic LLM output

Here's the hard question: how do you test a function whose whole point is that an LLM produces free-form text that varies run to run? You **stop asserting exact strings** and start asserting **properties**. From weakest to strongest guarantees:

### 1. Assert structure / schema, not exact text
If your app asks the model for JSON, validate the *shape* with Zod (Module 09/13), not the exact content:

```ts
// src/extract.test.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { extractContact } from "./extract.js";
import type { ChatModel } from "./llm.js";

const ContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  confidence: z.number().min(0).max(1),
});

describe("extractContact", () => {
  it("returns an object matching the contract", async () => {
    // A realistic fake: returns JSON, exact values don't matter.
    const fake: ChatModel = {
      complete: async () =>
        JSON.stringify({ name: "Ada Lovelace", email: "ada@example.com", confidence: 0.9 }),
    };
    const result = await extractContact("Ada, ada@example.com", fake);
    // The real assertion: it PARSES and VALIDATES.
    expect(() => ContactSchema.parse(result)).not.toThrow();
    expect(result.email).toContain("@");
  });
});
```

When you *do* call a real model in an integration test, this is still the right assertion: "did we get valid, schema-conforming output?" — not "did it say exactly X?"

### 2. Golden sets (evaluation datasets)
Curate a small set of representative inputs with *acceptable* outputs or checkable properties. Run them, score them, track the score over time. You're not asserting perfection — you're catching *regressions*.

```ts
// evals/qa.eval.ts (run separately from unit tests, e.g. `npm run eval`)
const goldenSet = [
  { q: "What is the capital of France?", mustContain: ["Paris"] },
  { q: "Who wrote Hamlet?", mustContain: ["Shakespeare"] },
  { q: "What year did WW2 end?", mustContain: ["1945"] },
];

let passed = 0;
for (const { q, mustContain } of goldenSet) {
  const answer = (await askRealModel(q)).toLowerCase();
  const ok = mustContain.every((s) => answer.includes(s.toLowerCase()));
  if (ok) passed++;
  else console.warn(`MISS: ${q} → ${answer}`);
}
console.log(`Golden set: ${passed}/${goldenSet.length} passed`);
// Fail the build if the pass rate drops below a threshold.
if (passed / goldenSet.length < 0.8) process.exit(1);
```

`mustContain` is a **substring check** — cheap, deterministic, and robust to phrasing. Great for factual QA.

### 3. LLM-as-judge
When correctness is fuzzy ("is this summary faithful and concise?"), use a *second* LLM call to grade the first, returning a structured score. This is a real, widely used technique.

```ts
// src/judge.ts
import type { ChatModel } from "./llm.js";
import { z } from "zod";

const Verdict = z.object({ score: z.number().min(1).max(5), reason: z.string() });

export async function judgeSummary(
  source: string,
  summary: string,
  judge: ChatModel,
): Promise<z.infer<typeof Verdict>> {
  const prompt = `You are grading a summary for FAITHFULNESS to the source.
Return ONLY JSON: {"score": 1-5, "reason": "..."}.
Score 5 = fully faithful & concise, 1 = hallucinated or wrong.

SOURCE:
${source}

SUMMARY:
${summary}`;
  const raw = await judge.complete(prompt);
  return Verdict.parse(JSON.parse(raw));
}
```

You *unit test the judge harness* with a fake (does it parse the verdict, does it clamp scores?), and you *use the real judge* in your eval suite. Caveats: judges are biased (they favor verbose answers, their own style, first-listed options) and cost money — use a strong model as judge, keep the rubric tight, and spot-check against human labels.

### 4. Snapshots — use with care
`expect(value).toMatchSnapshot()` records output to a file and compares future runs against it. **Never snapshot raw LLM text** — it changes every run and every snapshot update becomes meaningless noise. Snapshots *are* useful for **deterministic derived structures**: the exact prompt you build, the tool schema you send, the shape of a parsed response.

```ts
it("builds a stable RAG prompt", () => {
  const prompt = buildRagPrompt("What is X?", ["chunk one", "chunk two"]);
  expect(prompt).toMatchSnapshot(); // deterministic → safe to snapshot
});
```

> **🤖 AI/ML relevance:** A mature AI test strategy is layered: **unit tests** (fast, mocked, deterministic — 95% of your suite) + **eval suite** (golden sets + LLM-as-judge, run on demand or nightly, hits real models) + a **handful of integration/smoke tests**. Don't try to make the model deterministic in unit tests; make everything *around* it deterministic and test the model separately.

---

## Linting & formatting: ESLint + Prettier

**Prettier** formats code (spacing, quotes, line length) so nobody argues about style. **ESLint** catches *bugs and bad patterns* (unused variables, floating promises, `any` leaks). They're complementary: Prettier owns *formatting*, ESLint owns *correctness*.

```bash
npm install --save-dev eslint @eslint/js typescript-eslint prettier
```

A modern flat ESLint config with TypeScript support:

```js
// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Catch a classic AI-app bug: forgetting to await an async call.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off", // console is fine in scripts/CLIs
    },
  },
  { ignores: ["dist/", "node_modules/", "coverage/"] },
);
```

```json
// .prettierrc.json
{ "semi": true, "singleQuote": false, "printWidth": 100, "trailingComma": "all" }
```

Scripts:

```json
{
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

> **🤖 AI/ML relevance:** `no-floating-promises` alone justifies ESLint for AI work. A missed `await` on an LLM or embedding call is the single most common async bug — the code "runs," logs nothing useful, and returns a `Promise` where you expected a string. The linter flags it before it ships.

---

## Type-checking in CI (`tsc --noEmit`)

`tsx` and Vitest run TypeScript by *stripping* types — they don't fully *check* them. So a type error can sail through your tests. Add an explicit type-check step that compiles without producing output:

```json
{ "scripts": { "typecheck": "tsc --noEmit" } }
```

Your `tsconfig.json` should be strict:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true
  }
}
```

> **🤖 AI/ML relevance:** `noUncheckedIndexedAccess` makes `res.choices[0]` typed as *possibly undefined*, forcing you to handle the empty-response case — which real LLM APIs occasionally return. It turns a production `Cannot read properties of undefined` into a compile-time nudge.

---

## Logging & observability

Once your app is live, `console.log` isn't enough. You need **structured logs** (JSON, machine-queryable) and, for AI apps specifically, you need to **trace every model call**: its prompt, latency, token usage, and cost. This is how you debug "why was this answer bad?" and control spend.

Use a structured logger like **pino**:

```bash
npm install pino
```

```ts
// src/logger.ts
import pino from "pino";
export const log = pino({
  level: process.env.LOG_LEVEL ?? "info",
  // Pretty output in dev; raw JSON in prod (fast, ingestible by log platforms).
  transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
});
```

Now instrument the model boundary — a thin wrapper that times the call and records usage:

```ts
// src/observed-model.ts
import type { ChatModel } from "./llm.js";
import { log } from "./logger.js";

// Rough cost table ($ per 1K tokens) — keep this current for your models.
const PRICING: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.00015, out: 0.0006 },
};

export function withObservability(inner: ChatModel, model: string): ChatModel {
  return {
    async complete(prompt: string) {
      const start = performance.now();
      const requestId = crypto.randomUUID();
      log.info({ requestId, model, promptChars: prompt.length }, "llm.request");
      try {
        const answer = await inner.complete(prompt);
        const latencyMs = Math.round(performance.now() - start);
        // Estimate tokens (~4 chars/token). Use real usage from the API when available.
        const inTok = Math.ceil(prompt.length / 4);
        const outTok = Math.ceil(answer.length / 4);
        const price = PRICING[model];
        const costUsd = price
          ? (inTok / 1000) * price.in + (outTok / 1000) * price.out
          : undefined;
        log.info(
          { requestId, model, latencyMs, inTok, outTok, costUsd },
          "llm.response",
        );
        return answer;
      } catch (err) {
        log.error({ requestId, model, err }, "llm.error");
        throw err;
      }
    },
  };
}
```

Because `withObservability` is *another* `ChatModel` wrapping a `ChatModel`, you can layer it (this is the **decorator pattern**): `withObservability(withRetry(new OpenAIModel()), "gpt-4o-mini")`. Each layer does one job.

A structured log line looks like:

```json
{"level":"info","requestId":"a1b2","model":"gpt-4o-mini","latencyMs":812,"inTok":150,"outTok":64,"costUsd":0.000061,"msg":"llm.response"}
```

You can now query your logs for "p95 latency of gpt-4o-mini this week" or "total cost per user per day." For deeper traces across a whole RAG pipeline (retrieve → rerank → generate), reach for **OpenTelemetry** or a purpose-built LLM observability tool (Langfuse, Helicone, LangSmith), which visualize nested spans.

> **🤖 AI/ML relevance:** Token/latency/cost logging isn't optional at scale — LLM calls are your biggest variable cost and your biggest latency source. Instrument the boundary from day one; you cannot optimize what you don't measure. Logging `requestId` lets you correlate a user complaint with the exact prompt and response.

### 🎬 Real-life scenario
A customer reports the assistant "went silent" for some questions. Your logs show `llm.error` lines with a `429` (rate limit) at a specific hour, and `llm.response` lines with `latencyMs` over 20,000 for large documents. Without structured logs you'd be guessing; with them you see two distinct problems — add retries for the 429s, and truncate/summarize oversized inputs for the latency — and you fix both in an afternoon.

---

## Error handling & resilience

Networks fail, APIs rate-limit, models time out. Production AI apps must degrade gracefully. Three patterns cover most cases:

### Retries with exponential backoff
Transient errors (429, 500, 503, network blips) usually succeed on a second try — but retry *politely*, with increasing delays and jitter, and only on *retryable* errors:

```ts
// src/retry.ts
export async function withRetries<T>(
  fn: () => Promise<T>,
  { retries = 3, baseMs = 300 } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      const retryable = status === 429 || (status ?? 0) >= 500 || status === undefined;
      if (!retryable || attempt === retries) throw err;
      const delay = baseMs * 2 ** attempt + Math.random() * 100; // backoff + jitter
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
```

Never blindly retry a `400` (bad request) or `401` (bad key) — those fail identically forever and just waste time and money.

### Timeouts
An LLM call that never returns will hang your whole request. Bound it with `AbortSignal.timeout`:

```ts
// Most SDKs and fetch accept a signal:
const res = await fetch(url, { signal: AbortSignal.timeout(15_000) }); // 15s cap
```

### Circuit breaker (concept)
If a dependency is *consistently* failing, hammering it with retries makes things worse. A **circuit breaker** tracks the recent failure rate; once failures cross a threshold it "opens" and fails fast for a cool-down period (returning a cached/fallback answer instead), then "half-opens" to test recovery. You rarely hand-roll this — libraries like `opossum` provide it — but you must know the concept: **stop calling a dying service and give it room to recover.**

```
CLOSED ──(too many failures)──▶ OPEN ──(cool-down elapses)──▶ HALF-OPEN
   ▲                                                              │
   └───────────────(trial call succeeds)─────────────────────────┘
```

> **🤖 AI/ML relevance:** A resilient model wrapper is `withObservability(withRetry(withTimeout(realModel)))`. Combined with a fallback (e.g. try `gpt-4o`, on repeated failure fall back to `gpt-4o-mini` or a cached answer), your app stays up even when a provider has a bad day. Users tolerate "a slightly simpler answer"; they don't tolerate a spinner that never ends.

---

## Config & secrets management

**Rule zero: never commit secrets.** API keys belong in the environment, never in source. Load them from `.env` in development and from your platform's secret store in production.

```ts
// src/config.ts — validate config ONCE at startup, fail fast if it's wrong.
import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
});

export const config = EnvSchema.parse(process.env);
// From here, `config.OPENAI_API_KEY` is a guaranteed non-empty string.
```

Node 20.6+ can load `.env` natively: `node --env-file=.env dist/index.js`. Always ship a committed **`.env.example`** documenting required keys (with dummy values), and add `.env` to `.gitignore`.

In production, secrets come from the platform: Vercel/Netlify environment variables, Cloudflare Workers "secrets" (`wrangler secret put`), Docker/Kubernetes secrets, or a manager like AWS Secrets Manager. The code doesn't change — `process.env` is the same interface everywhere.

> **🤖 AI/ML relevance:** Validating config at boot with Zod turns "the app started fine then crashed on the first user's request because the API key was missing" into "the app refused to start and told you exactly which variable is wrong." For AI apps that also read model names, temperatures, and token limits from env, this catches typos like `TEMPARATURE=0.7` immediately.

---

## Deployment overview

Your AI app runs fine on your laptop. Getting it in front of users means **building** it, **running it in production**, and choosing **where** it lives. Keep it practical.

### Build & run in production
For a TypeScript service, *compile to JavaScript* and run plain Node in prod (faster startup, no dev deps):

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

```bash
npm ci          # clean, reproducible install from package-lock.json
npm run build   # tsc → dist/
NODE_ENV=production node --env-file=.env dist/index.js
```

Use `npm ci` (not `npm install`) in CI/prod: it installs *exactly* what's in the lockfile and is faster and reproducible.

### Containerization: a Dockerfile for a Node service
A container packages your app + its exact Node version + deps into one portable image that runs identically anywhere. Use a **multi-stage build** so the final image ships only what production needs:

```dockerfile
# Dockerfile
# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build          # produces dist/

# ---- runtime stage ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev      # prod deps only → smaller, safer image
COPY --from=build /app/dist ./dist
USER node                  # don't run as root
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```dockerfile
# .dockerignore
node_modules
dist
.env
.git
```

```bash
docker build -t my-ai-service .
docker run -p 3000:3000 --env-file .env my-ai-service
```

### Serverless & edge
Many AI apps don't need a long-running server. Two popular models:

- **Serverless functions (e.g. Vercel, AWS Lambda).** Your code runs on demand per request, scales to zero, and you pay per invocation. Great for chat endpoints and webhooks. Watch out for **cold starts** and **execution time limits** — but streaming responses are well supported (crucial for chat UX). Vercel is the default home for Next.js + the Vercel AI SDK.
- **Edge runtimes (e.g. Cloudflare Workers).** Code runs geographically close to users on a lightweight V8 runtime — very low latency, but a *restricted* environment (no full Node API, no filesystem, size limits). Perfect for lightweight proxying to model APIs, auth, and RAG *retrieval* backed by an edge vector DB. Deploy with `wrangler deploy`.

### Where AI apps commonly deploy
- **Vercel** — Next.js frontends + serverless API routes; first-class streaming; the Vercel AI SDK's natural habitat.
- **Cloudflare Workers** — ultra-low-latency edge APIs, Workers AI, and Vectorize (edge vector DB).
- **A plain Node server** (Fly.io, Render, Railway, a VM, or Kubernetes) — when you need long-running processes, WebSockets, large in-memory indexes, background jobs, or full Node APIs. A Dockerized Hono/Express service is the workhorse here.

**How to choose:** Need a filesystem, big in-memory vector index, long jobs, or WebSockets? → **Node server / container.** Bursty, stateless, request/response chat with a managed vector DB? → **serverless.** Latency-critical, lightweight, global? → **edge.**

> **🤖 AI/ML relevance:** RAG apps often *split*: a Node/container service does heavy ingestion + embedding (needs fs, memory, time), while a serverless or edge endpoint handles the fast query path (retrieve + generate). Streaming support should drive the decision for anything user-facing — a chat that streams tokens feels instant even when total latency is identical.

### 🎬 Real-life scenario
You prototype a RAG assistant on Vercel serverless. It works until a user uploads a 200-page PDF: the ingestion step (parse → chunk → embed hundreds of chunks) blows past the function's execution-time limit. The fix isn't "a bigger function" — it's *architecture*: move ingestion to a Dockerized Node worker (or a background job/queue) that writes embeddings to a vector DB, and keep the serverless endpoint for the fast query path. Knowing the tradeoffs of each deployment target let you diagnose this in minutes.

---

## CI basics: a GitHub Actions workflow

**Continuous Integration** runs your quality gates automatically on every push and pull request, so broken code never reaches `main`. A good AI-project pipeline: install → type-check → lint → test. (Note: no real API keys — the suite is fully mocked.)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install (reproducible)
        run: npm ci

      - name: Type-check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test
```

Order matters: type-check first (fastest, catches the most), then lint, then tests. Each step must exit non-zero on failure — the tools above already do. Once green is required to merge (a branch-protection rule), your `main` stays deployable.

> **🤖 AI/ML relevance:** Keep real-model **evals** *out* of this every-push pipeline (they're slow, cost money, and are non-deterministic). Run them on a **schedule** (`on: schedule: - cron: "0 6 * * *"`) or manually (`workflow_dispatch`) with the API key stored as an encrypted **GitHub secret** (`${{ secrets.OPENAI_API_KEY }}`), and treat a drop in the golden-set pass rate as a signal to investigate, not necessarily a hard build failure.

---

## Common pitfalls

- **Hitting real APIs in unit tests.** Slow, costly, flaky. Inject a fake `ChatModel`/embedder. Keep real calls to a separate, opt-in eval/integration suite.
- **Asserting exact LLM text.** It changes every run. Assert *schema/structure*, substrings, or use golden sets and LLM-as-judge.
- **`toBe` on floats.** Use `toBeCloseTo`. Embeddings and similarities are floating point.
- **Snapshotting model output.** Snapshots are for *deterministic* structures (prompts, schemas), not free text.
- **Forgetting `tsc --noEmit` in CI.** Tests strip types; a type error can pass tests and break prod. Type-check explicitly.
- **Committing secrets / `.env`.** Gitignore it, ship `.env.example`, validate config with Zod at boot.
- **Retrying non-retryable errors.** Don't retry 400/401 — they fail forever. Retry 429/5xx with backoff + jitter.
- **No timeouts on model calls.** One hung request can pin a worker. Always bound with `AbortSignal.timeout`.
- **`npm install` in CI instead of `npm ci`.** Use `npm ci` for reproducible, lockfile-exact installs.
- **Deploying heavy ingestion to a time-limited serverless function.** Split ingestion (worker/container) from the query path (serverless/edge).
- **No observability.** If you don't log latency/tokens/cost with a `requestId`, you can't debug or optimize production.

---

## Recap

- **Test the deterministic skeleton rigorously** (vector math, chunkers, parsers) with **Vitest**: `describe/it/expect`, `toBeCloseTo` for floats, invariant tests over exact-output tests.
- **Isolate the model behind an interface you own** (`ChatModel`) and **inject a fake** in tests — never touch the network in unit tests. `vi.fn()` records and controls calls; `vi.mock` is the escape hatch.
- **Test non-determinism by testing properties**: schema/structure validation, golden sets with substring checks, LLM-as-judge, and *careful* snapshots of deterministic structures only.
- Enforce quality with **ESLint** (bugs, `no-floating-promises`) + **Prettier** (formatting) + **`tsc --noEmit`** (types).
- **Observe** the model boundary: structured logs (pino) capturing latency, tokens, and cost with a `requestId`; layer via a decorator wrapper.
- **Be resilient**: retries with backoff+jitter on 429/5xx, timeouts via `AbortSignal`, and the circuit-breaker concept for dying dependencies.
- **Manage config/secrets** with Zod validation at boot, `.env` (gitignored) + `.env.example`, and platform secret stores in prod.
- **Deploy** by building to `dist/`, containerizing with a multi-stage **Dockerfile**, and choosing Node server vs serverless vs edge by your needs (fs? memory? long jobs? latency?).
- **Automate** it all with a **GitHub Actions** pipeline: install → typecheck → lint → test on every PR; run real-model evals on a schedule.

---

## Next

Continue to **[Module 15 — Capstone Projects](../15-capstone-projects/README.md)**, where you'll combine everything — TypeScript, async, LLMs, embeddings, RAG, agents, *and* the testing/observability/deployment skills from this module — into four end-to-end builds that prove you're a proficient AI/ML developer in JS/TS.
