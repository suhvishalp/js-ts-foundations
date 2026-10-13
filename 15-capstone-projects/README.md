# Module 15 — Capstone Projects

This is where it all comes together. Reading and exercises got you the pieces; **building complete projects** is what turns pieces into proficiency. Below are **four end-to-end projects**, each harder than the last, each integrating skills from across the guide. You'll finish this module with a portfolio of real, running AI applications — a CLI chatbot, a semantic search engine over your own notes, a full RAG assistant with an HTTP API, and a tool-using agent.

## What you'll learn
- How to **scope, architect, and build** a complete AI application from an empty folder
- How every earlier module — async, TypeScript, Node, LLM APIs, embeddings, RAG, agents, testing — shows up in real work
- How to make deliberate **engineering decisions** (in-memory vs DB, serverless vs server, exact-string vs schema tests)
- How to know when something is actually *done* (each project has a "definition of done")

**Prerequisites:** The whole guide, especially Module 04 (async/streaming), Modules 07–09 (TypeScript, Zod), Module 10 (Node, fs, env), Module 11 (LLM APIs, streaming), Module 12 (embeddings, vector math), Module 13 (RAG, agents, tool use, structured output), and Module 14 (testing, resilience, deployment).

## How to use this module
- **Build them in order.** Each reuses concepts (and sometimes code) from the previous.
- **Type the code yourself.** The skeletons below are scaffolds, not copy-paste solutions — fill the gaps.
- **Write tests as you go** using Module 14's patterns. Every project lists what to test.
- Use a provider you have a key for. Examples use the **OpenAI SDK** (`npm i openai`) and OpenAI models, but everything is written against small interfaces you can point at Anthropic, a local model (Ollama), or the Vercel AI SDK.

### Shared setup for all projects
```bash
mkdir my-capstone && cd my-capstone
npm init -y
npm pkg set type=module
npm install openai zod
npm install --save-dev typescript tsx vitest @types/node
npx tsc --init
```
Put your key in a gitignored `.env`:
```
OPENAI_API_KEY=sk-...
```
Run TypeScript directly with `npx tsx src/index.ts` (Node 20.6+ loads `.env` with `node --env-file=.env`, and `tsx` respects it too via `--env-file`, or use `import "dotenv/config"`).

> **🤖 AI/ML relevance:** Everything you built toward is here. A CLI that streams tokens, an embeddings index, a grounded RAG API, and a bounded agent loop are the four archetypes underneath the vast majority of real LLM products.

---

## Project 1 — CLI Q&A Bot

**Goal:** A TypeScript command-line tool that takes a question, sends it to an LLM, and **streams** the answer to your terminal token-by-token.

**What it teaches:** Node CLI ergonomics (`process.argv`, exit codes), environment variables, `fetch`/SDK usage, **streaming responses**, error handling, and typing a thin model wrapper. This is the smallest complete, useful LLM app — and the foundation for everything else.

### Features / requirements
**MVP**
- Read the question from CLI args: `npx tsx src/index.ts "What is a tensor?"`.
- Call an LLM and **stream** the answer to stdout as it arrives (no waiting for the full response).
- Read the API key from the environment; exit with a clear message (code 1) if it's missing.
- Handle network/API errors gracefully (no raw stack trace dumped at the user).

**Stretch**
- A `--system` flag to set the system prompt (e.g. `--system "Answer like a pirate"`).
- A `--json` flag that asks for and validates a structured answer with Zod.
- Interactive REPL mode (no args → prompt in a loop, keep conversation history).
- A spinner while waiting for the first token; token/latency summary at the end.

### Suggested architecture
```
src/
  index.ts        # entry point: parse args, wire things up, handle top-level errors
  cli.ts          # arg parsing → typed options
  model.ts        # ChatModel interface + OpenAI streaming implementation
  config.ts       # Zod-validated env config
```
One dependency arrow only: `index → {cli, config, model}`. The model is behind an interface so you can test the CLI without the network.

### Build plan
1. **Config first.** Validate `OPENAI_API_KEY` with Zod; fail fast (Module 14).
2. **Define the streaming interface.** `stream(prompt): AsyncIterable<string>` — an async generator of text deltas (Module 04/05).
3. **Implement it** with the OpenAI SDK's `stream: true`.
4. **Parse args** into `{ question, system }`.
5. **Wire `index.ts`:** load config, build the model, iterate the stream writing each chunk to `process.stdout`.
6. **Wrap in try/catch** at the top level; print a friendly message and `process.exit(1)` on failure.
7. **Add tests** with a fake streaming model (below).

### Key code skeletons
```ts
// src/model.ts
export interface ChatModel {
  /** Yields text deltas as they arrive. */
  stream(prompt: string, system?: string): AsyncIterable<string>;
}
```
```ts
// src/openai-model.ts
import OpenAI from "openai";
import type { ChatModel } from "./model.js";

export class OpenAIModel implements ChatModel {
  constructor(private client = new OpenAI(), private model = "gpt-4o-mini") {}

  async *stream(prompt: string, system = "You are a concise, accurate assistant.") {
    const res = await this.client.chat.completions.create({
      model: this.model,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });
    for await (const chunk of res) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
```
```ts
// src/index.ts
import { config } from "./config.js";
import { parseArgs } from "./cli.js";
import { OpenAIModel } from "./openai-model.js";

async function main() {
  const { question, system } = parseArgs(process.argv.slice(2));
  if (!question) {
    console.error('Usage: qa "your question" [--system "..."]');
    process.exit(1);
  }
  const model = new OpenAIModel(); // reads config.OPENAI_API_KEY via the SDK
  for await (const delta of model.stream(question, system)) {
    process.stdout.write(delta); // stream to the terminal
  }
  process.stdout.write("\n");
}

main().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
```

### How to test it
- **Unit-test `parseArgs`** — pure function, exhaustive cases (missing question, `--system` with/without value).
- **Test the CLI loop with a fake `ChatModel`** whose `stream` is an async generator yielding `["Hel", "lo"]`; capture writes into an array and assert the concatenation is `"Hello"`. No network.
- **Test the error path**: a fake whose `stream` throws → assert your handler produces a friendly message and non-zero exit (extract the handler so it's testable).

### Definition of done
- [ ] `npx tsx src/index.ts "What is RAG?"` streams a coherent answer, then a trailing newline.
- [ ] Missing `OPENAI_API_KEY` prints a clear message and exits 1 (no stack trace).
- [ ] A network error is caught and reported cleanly.
- [ ] `parseArgs` and the streaming loop have passing unit tests with a mocked model.
- [ ] `npm run typecheck && npm run lint && npm test` are all green.

> **🤖 AI/ML relevance:** Streaming is *the* UX difference between "feels broken" and "feels alive." Async generators (`async *` + `for await`) are the idiomatic JS/TS way to model a token stream — the same pattern the Vercel AI SDK and every chat UI use under the hood.

### 🎬 Real-life scenario
Your team wants an internal `ask` command so engineers can query the LLM without opening a browser. You ship Project 1 as a global npm bin (`"bin": { "ask": "./dist/index.js" }`), and within a week half the team is running `ask "regex for a UUID"` from their terminals. The streaming output and clean error handling are why they trust it.

---

## Project 2 — Semantic Search Over Your Notes

**Goal:** Ingest a folder of markdown/text files, chunk and **embed** them, build an **in-memory vector index**, and query it from the CLI — returning the most semantically relevant passages (not keyword matches).

**What it teaches:** `fs` traversal, chunking, **embeddings**, **vector math** (cosine similarity — from Module 12 and tested in Module 14), and the *retrieval half* of RAG. No generation yet; the point is to nail retrieval.

### Features / requirements
**MVP**
- `ingest <folder>`: recursively read `.md`/`.txt`, chunk each file, embed each chunk, store `{text, embedding, source}` in memory, persist to a JSON file.
- `query "<question>"`: embed the query, cosine-rank all chunks, print the top-k with their source file and a similarity score.

**Stretch**
- Cache embeddings so re-ingesting only embeds changed files (hash the chunk text).
- Batch embedding requests (embed many chunks per API call — far cheaper/faster).
- Add a keyword pre-filter, then re-rank semantically (**hybrid search**).
- Highlight the matching sentence within each returned chunk.

### Suggested architecture
```
src/
  ingest.ts     # walk folder → read files → chunk → embed → save index.json
  index.ts      # VectorIndex: add(), search(k) using cosine similarity
  embed.ts      # Embedder interface + OpenAI implementation (with batching)
  chunk.ts      # chunkText (reuse from Module 14)
  vector.ts     # cosineSimilarity (reuse from Module 14 — already tested!)
  cli.ts        # `ingest` and `query` subcommands
```

### Build plan
1. **Reuse `cosineSimilarity` and `chunkText`** from Module 14 (with their tests).
2. **Define `Embedder`**: `embed(texts: string[]): Promise<number[][]>` — batch-friendly.
3. **Implement it** with the OpenAI embeddings endpoint (`text-embedding-3-small`).
4. **Build `VectorIndex`**: an array of records + a `search(queryVec, k)` that ranks by cosine similarity.
5. **`ingest`:** walk the folder (`fs.readdir` recursive), chunk, embed in batches, persist to `index.json`.
6. **`query`:** load `index.json`, embed the question, search, print results.
7. **Test** the index and search deterministically with fake embeddings.

### Key code skeletons
```ts
// src/embed.ts
export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}
```
```ts
// src/index.ts
import { cosineSimilarity } from "./vector.js";

export interface Record { text: string; source: string; embedding: number[]; }
export interface Hit { text: string; source: string; score: number; }

export class VectorIndex {
  private records: Record[] = [];
  add(records: Record[]) { this.records.push(...records); }

  search(queryVec: number[], k = 5): Hit[] {
    return this.records
      .map((r) => ({ text: r.text, source: r.source, score: cosineSimilarity(queryVec, r.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  toJSON() { return this.records; }
  static fromJSON(records: Record[]) { const idx = new VectorIndex(); idx.add(records); return idx; }
}
```
```ts
// src/ingest.ts (core loop)
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { chunkText } from "./chunk.js";
import { VectorIndex, type Record } from "./index.js";
import type { Embedder } from "./embed.js";

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => {
      const p = join(dir, e.name);
      if (e.isDirectory()) return walk(p);
      return [".md", ".txt"].includes(extname(e.name)) ? [p] : [];
    }),
  );
  return files.flat();
}

export async function ingest(folder: string, embedder: Embedder, out = "index.json") {
  const files = await walk(folder);
  const records: Record[] = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const chunks = chunkText(text, 800, 100);
    const embeddings = await embedder.embed(chunks.map((c) => c.text)); // batch!
    chunks.forEach((c, i) => records.push({ text: c.text, source: file, embedding: embeddings[i] }));
  }
  const index = new VectorIndex();
  index.add(records);
  await writeFile(out, JSON.stringify(index.toJSON()));
  console.log(`Indexed ${records.length} chunks from ${files.length} files → ${out}`);
}
```

### How to test it
- **`VectorIndex.search`** with hand-crafted vectors: insert records whose embeddings you control (e.g. `[1,0]`, `[0,1]`, `[0.9,0.1]`), query `[1,0]`, assert ranking order and that `k` bounds the result count. No API needed.
- **`ingest`** with a **fake `Embedder`** returning deterministic vectors (e.g. hash-based) and a temp folder of small files; assert `index.json` has the expected number of records and correct `source` paths.
- Reuse the **already-tested** `cosineSimilarity` and `chunkText`.

### Definition of done
- [ ] `ingest ./notes` produces `index.json` with one record per chunk and correct sources.
- [ ] `query "how do promises work?"` returns semantically relevant passages ranked by score, even when they don't share keywords with the query.
- [ ] Embeddings are batched (not one API call per chunk).
- [ ] `VectorIndex.search` and `ingest` have passing tests with a fake embedder.
- [ ] typecheck + lint + test green.

> **🤖 AI/ML relevance:** This *is* the retrieval engine of RAG. An in-memory index is perfect up to tens of thousands of chunks; past that you swap `VectorIndex` for a real vector DB (Pinecone, Qdrant, pgvector, Cloudflare Vectorize) behind the *same interface* — none of your calling code changes. That interface-first discipline is the whole lesson.

### 🎬 Real-life scenario
You have three years of meeting notes and can never find anything with keyword search ("what did we decide about caching?"). After Project 2, `query "our decision on caching strategy"` surfaces the right note even though it phrased it as "we'll memoize the expensive lookups." Semantic search found the *meaning*, not the words.

---

## Project 3 — RAG Document Assistant (with an HTTP API)

**Goal:** A complete **Retrieval-Augmented Generation** service: ingest documents, retrieve relevant chunks for a question, and generate a **grounded answer with citations**. Expose it over a small **HTTP API** with **Zod-validated** requests and **structured output**.

**What it teaches:** RAG end-to-end (retrieve → augment → generate), **API design** (Hono or Express), request validation, structured responses, citations, and grounding to reduce hallucination. This combines Projects 1 and 2 and adds a server tier.

### Features / requirements
**MVP**
- Reuse Project 2's ingestion + `VectorIndex`.
- `POST /ask` with `{ question: string }` → retrieves top-k chunks, builds a grounded prompt, generates an answer, returns `{ answer, citations: [{ source, snippet }] }`.
- The prompt **instructs the model to answer only from the provided context** and to say "I don't know" if the context is insufficient.
- Validate the request body with Zod; return `400` on bad input.

**Stretch**
- **Stream** the answer over SSE (`text/event-stream`) so the client sees tokens live.
- Add citation markers in the answer (`[1]`, `[2]`) mapping to the sources array.
- Re-rank retrieved chunks with an LLM or a cross-encoder before generating.
- A `GET /health` endpoint and structured request logging (Module 14).
- Add an **eval endpoint/script** using golden Q&A pairs (Module 14).

### Suggested architecture
```
src/
  server.ts     # Hono app: routes, Zod validation, error handling
  rag.ts        # answer(question): retrieve → build prompt → generate → parse
  retrieve.ts   # thin wrapper over VectorIndex + Embedder
  generate.ts   # ChatModel.complete for grounded generation
  schema.ts     # Zod: AskRequest, AskResponse
  index.ts / embed.ts / vector.ts / chunk.ts  # reused from Project 2
```

### Build plan
1. **Reuse** the embedder, vector index, chunker, and cosine similarity from Project 2.
2. **Define the contract** in `schema.ts` with Zod (`AskRequest`, `AskResponse`).
3. **Write `retrieve(question, k)`:** embed → `index.search` → return hits.
4. **Write the grounded prompt builder** (context + strict instructions + question).
5. **Write `answer(question)`** orchestrating retrieve → generate → assemble citations.
6. **Build the Hono server:** `POST /ask` validates with Zod, calls `answer`, returns JSON; central error handler maps thrown errors to `400/500`.
7. **Test** `answer` with fakes, and the route with a mocked `answer`.

### Key code skeletons
```ts
// src/schema.ts
import { z } from "zod";
export const AskRequest = z.object({ question: z.string().min(1).max(2000) });
export const Citation = z.object({ source: z.string(), snippet: z.string() });
export const AskResponse = z.object({ answer: z.string(), citations: z.array(Citation) });
export type AskResponse = z.infer<typeof AskResponse>;
```
```ts
// src/rag.ts
import type { ChatModel } from "./generate.js";
import { retrieve, type Hit } from "./retrieve.js";
import type { AskResponse } from "./schema.js";

function buildPrompt(question: string, hits: Hit[]): string {
  const context = hits.map((h, i) => `[${i + 1}] (source: ${h.source})\n${h.text}`).join("\n\n");
  return `Answer the question using ONLY the context below.
If the context does not contain the answer, reply exactly: "I don't know based on the provided documents."
Cite sources inline like [1], [2].

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`;
}

export async function answer(question: string, model: ChatModel): Promise<AskResponse> {
  const hits = await retrieve(question, 5);
  if (hits.length === 0) {
    return { answer: "I don't know based on the provided documents.", citations: [] };
  }
  const text = await model.complete(buildPrompt(question, hits));
  return {
    answer: text.trim(),
    citations: hits.map((h) => ({ source: h.source, snippet: h.text.slice(0, 160) })),
  };
}
```
```ts
// src/server.ts
import { Hono } from "hono";
import { AskRequest } from "./schema.js";
import { answer } from "./rag.js";
import { OpenAIChatModel } from "./generate.js";

const app = new Hono();
const model = new OpenAIChatModel();

app.get("/health", (c) => c.json({ status: "ok" }));

app.post("/ask", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = AskRequest.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  try {
    const result = await answer(parsed.data.question, model);
    return c.json(result);
  } catch (err) {
    console.error(err);
    return c.json({ error: "internal error" }, 500);
  }
});

export default app;
// Run with @hono/node-server:  serve({ fetch: app.fetch, port: 3000 })
```

### How to test it
- **`answer` (unit)** with a fake `Embedder`, a pre-seeded `VectorIndex`, and a fake `ChatModel`: assert citations map to the retrieved sources and that empty retrieval yields the "I don't know" path (deterministic).
- **Grounding test:** feed context that lacks the answer; assert the (fake) model prompt contains the strict instruction, and that your code handles the "I don't know" response.
- **Route test:** send an invalid body (missing `question`) → expect `400`; send a valid body with `answer` mocked → expect the JSON shape (validate the response with `AskResponse.parse`).
- **Eval (optional):** golden Q&A pairs with `mustContain` substring checks against the real model (Module 14), run separately.

### Definition of done
- [ ] `POST /ask {"question":"..."}` returns a grounded answer plus citations pointing to real source files.
- [ ] Questions with no relevant context return "I don't know…" instead of hallucinating.
- [ ] Invalid requests return `400` with a helpful validation error; server errors return `500` without leaking internals.
- [ ] `answer` and the route have passing tests with mocked model/embedder.
- [ ] typecheck + lint + test green; `GET /health` returns `{status:"ok"}`.

> **🤖 AI/ML relevance:** Grounding + citations are what make RAG *trustworthy* — the model answers from your documents and shows its work, so users can verify. The strict "answer only from context, else say I don't know" instruction is the single most important line of prompt in a production RAG system; test that it holds.

### 🎬 Real-life scenario
Support wants an assistant over the company handbook. You deploy Project 3 behind an internal endpoint. When someone asks "what's the parental leave policy?", it answers with the exact wording and a `[1]` citation to `handbook/benefits.md`. When someone asks something the handbook doesn't cover, it says "I don't know based on the provided documents" — which is exactly what keeps legal comfortable shipping it.

---

## Project 4 — Tool-Using Agent

**Goal:** An **agent** that, given a task, decides which of several **tools** to call, executes them in a **bounded loop**, and produces a final answer. Tools: a calculator, a (mock) web search, and a file reader. Tool schemas are typed; the LLM chooses via **function calling / tool use**; the loop is capped to prevent runaway cost.

**What it teaches:** Agent architecture, **tool use / function calling**, structured tool schemas (Zod), a **bounded reasoning loop**, and — crucially — **testing a non-deterministic system** by mocking the LLM's tool-choice decisions (Module 14).

### Features / requirements
**MVP**
- A registry of tools, each with `{ name, description, parameters (Zod schema), execute(args) }`.
- An agent loop: send the task + tool definitions → model responds with either a **tool call** or a **final answer** → if a tool call, execute it, append the result, loop → stop on final answer or after `maxSteps`.
- At least three tools: `calculator`, `search` (mock/canned), `readFile`.
- Validate tool arguments with Zod before executing (never trust the model's JSON).

**Stretch**
- Parallel tool calls in one step.
- A real web search tool (e.g. Tavily/Bing) behind the same interface.
- Per-step token/cost logging and a hard budget cap (Module 14 observability).
- Reflection: let the agent critique its own answer before returning.

### Suggested architecture
```
src/
  tools.ts      # Tool interface + calculator/search/readFile implementations
  agent.ts      # runAgent(task, model, tools, maxSteps): bounded loop
  model.ts      # ToolCallingModel interface (returns tool call OR final text)
  schema.ts     # Zod schemas for each tool's args
```

### Build plan
1. **Define `Tool`** with a Zod parameter schema and an `execute` function.
2. **Implement three tools.** `calculator` (safe arithmetic — do NOT `eval`), `search` (return canned results keyed by query for now), `readFile` (sandboxed to a directory).
3. **Define `ToolCallingModel`:** given messages + tool defs, return either `{ type: "tool_call", name, args }` or `{ type: "final", text }`.
4. **Implement it** with the OpenAI/Anthropic tool-calling API (convert Zod → JSON Schema with `zod-to-json-schema`).
5. **Write `runAgent`:** the bounded loop — call model, if tool call then validate args + execute + append observation, else return the final answer; enforce `maxSteps`.
6. **Test the whole loop with a scripted fake model** that returns a fixed sequence of decisions — fully deterministic (this is the key Module 14 technique).

### Key code skeletons
```ts
// src/tools.ts
import { z } from "zod";

export interface Tool<A = any> {
  name: string;
  description: string;
  parameters: z.ZodType<A>;
  execute(args: A): Promise<string>;
}

export const calculator: Tool<{ expression: string }> = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '2 * (3 + 4)'.",
  parameters: z.object({ expression: z.string() }),
  async execute({ expression }) {
    if (!/^[\d\s+\-*/().]+$/.test(expression)) throw new Error("Unsafe expression");
    // Safe because we validated the charset above; still, prefer a real parser in prod.
    const result = Function(`"use strict"; return (${expression});`)();
    return String(result);
  },
};

export const search: Tool<{ query: string }> = {
  name: "search",
  description: "Search the web for a query. Returns short snippets.",
  parameters: z.object({ query: z.string() }),
  async execute({ query }) {
    const canned: Record<string, string> = {
      "capital of france": "Paris is the capital of France.",
    };
    return canned[query.toLowerCase()] ?? `No results for "${query}".`;
  },
};
```
```ts
// src/model.ts
export type ModelDecision =
  | { type: "tool_call"; name: string; args: unknown; callId: string }
  | { type: "final"; text: string };

export interface Message { role: "user" | "assistant" | "tool"; content: string; callId?: string; }

export interface ToolCallingModel {
  decide(messages: Message[], tools: Tool[]): Promise<ModelDecision>;
}
```
```ts
// src/agent.ts
import type { Tool } from "./tools.js";
import type { ToolCallingModel, Message } from "./model.js";

export async function runAgent(
  task: string,
  model: ToolCallingModel,
  tools: Tool[],
  maxSteps = 5,
): Promise<string> {
  const byName = new Map(tools.map((t) => [t.name, t]));
  const messages: Message[] = [{ role: "user", content: task }];

  for (let step = 0; step < maxSteps; step++) {
    const decision = await model.decide(messages, tools);
    if (decision.type === "final") return decision.text;

    const tool = byName.get(decision.name);
    if (!tool) {
      messages.push({ role: "tool", content: `Unknown tool: ${decision.name}`, callId: decision.callId });
      continue;
    }
    // NEVER trust the model's args — validate before executing.
    const parsed = tool.parameters.safeParse(decision.args);
    const observation = parsed.success
      ? await tool.execute(parsed.data).catch((e) => `Tool error: ${e.message}`)
      : `Invalid arguments: ${parsed.error.message}`;
    messages.push({ role: "tool", content: observation, callId: decision.callId });
  }
  return "Reached the step limit without a final answer.";
}
```

### How to test it
This is the headline lesson. **You do not test against a real, unpredictable model.** You inject a **scripted fake** that returns a deterministic sequence of decisions:
```ts
// src/agent.test.ts
import { describe, it, expect, vi } from "vitest";
import { runAgent } from "./agent.js";
import { calculator } from "./tools.js";
import type { ToolCallingModel, ModelDecision } from "./model.js";

function scriptedModel(script: ModelDecision[]): ToolCallingModel {
  let i = 0;
  return { decide: vi.fn(async () => script[i++]) };
}

describe("runAgent", () => {
  it("calls a tool, then returns a final answer using the result", async () => {
    const model = scriptedModel([
      { type: "tool_call", name: "calculator", args: { expression: "2 * (3 + 4)" }, callId: "1" },
      { type: "final", text: "The answer is 14." },
    ]);
    const result = await runAgent("What is 2*(3+4)?", model, [calculator]);
    expect(result).toBe("The answer is 14.");
  });

  it("stops at maxSteps to prevent runaway loops", async () => {
    // A model that ALWAYS asks for another tool call → must be bounded.
    const loopy: ToolCallingModel = {
      decide: async () => ({ type: "tool_call", name: "calculator", args: { expression: "1+1" }, callId: "x" }),
    };
    const result = await runAgent("loop forever", loopy, [calculator], 3);
    expect(result).toMatch(/step limit/);
  });

  it("rejects invalid tool arguments without executing", async () => {
    const model = scriptedModel([
      { type: "tool_call", name: "calculator", args: { expression: 123 }, callId: "1" }, // wrong type
      { type: "final", text: "done" },
    ]);
    const result = await runAgent("bad args", model, [calculator]);
    expect(result).toBe("done"); // loop continued after logging the invalid-args observation
  });
});
```
Also unit-test each **tool** in isolation (calculator math + unsafe-expression rejection; readFile sandboxing).

### Definition of done
- [ ] `runAgent` executes a real multi-step task end-to-end with the real model (e.g. "What is 15% of 240, and what's the capital of France?" → uses calculator + search).
- [ ] The loop is **bounded** — a model that never finalizes stops at `maxSteps`.
- [ ] Tool args are **Zod-validated** before execution; invalid args don't crash the agent.
- [ ] The calculator does **not** use raw `eval` on untrusted input; `readFile` can't escape its sandbox directory.
- [ ] The full loop is tested deterministically with a **scripted fake model**; each tool is unit-tested.
- [ ] typecheck + lint + test green.

> **🤖 AI/ML relevance:** Agents are just "an LLM in a loop with tools and a stopping condition." The two things that separate a toy from something safe to ship are exactly what you tested here: **bounding the loop** (cost/safety) and **validating tool arguments** (never execute the model's raw output). The scripted-fake-model technique is how the whole industry tests agents.

### 🎬 Real-life scenario
You build an internal ops agent with `readFile`, `runQuery`, and `postToSlack` tools. Before it ever touches production, you write scripted-model tests for every path — including "model tries to call a tool that doesn't exist" and "model returns malformed args." Because the loop is bounded and args are validated, when a real prompt-injection attempt in a document tries to make it loop or call a tool with garbage, the agent degrades safely instead of running up a bill or corrupting data.

---

## Where to go next

You've built the four core archetypes from scratch — which means you now *understand* what the popular frameworks do for you. Reach for them once you know what they're abstracting:

- **[Vercel AI SDK](https://sdk.vercel.ai/)** — the most ergonomic way to do streaming, tool calling, and structured output in TS. `streamText`, `generateObject`, `tool()` map directly onto Projects 1, 3, and 4. Great default for Next.js apps.
- **[LangChain.js](https://js.langchain.com/)** — batteries-included chains, agents, retrievers, and integrations (many vector DBs, model providers). Powerful but heavier; you'll appreciate it more having built the primitives yourself.
- **[LlamaIndex.TS](https://ts.llamaindex.ai/)** — RAG-focused: document loaders, node parsers (chunkers), indexes, and query engines. A natural upgrade path for Projects 2 and 3.
- **[Mastra](https://mastra.ai/)** — a TypeScript-first agent framework (workflows, agents, tools, evals, memory) that packages Project 4's patterns for production.

**Also worth learning next:**
- A real **vector database** (pgvector, Qdrant, Pinecone, Cloudflare Vectorize) — swap it behind your `VectorIndex` interface.
- **Evaluation frameworks** (Promptfoo, Langfuse, Braintrust) — scale up the golden-set/LLM-as-judge ideas from Module 14.
- **Observability/tracing** (Langfuse, Helicone, OpenTelemetry) for production LLM apps.
- **Deploying** your capstones — Project 1/4 as an npm bin, Project 3 to a Node host or serverless (Module 14's deployment section), with the Dockerfile and CI you learned.
- **Advanced RAG** — hybrid search, re-ranking, query rewriting, agentic RAG.

Congratulations — you've gone from language fundamentals to shipping tested, observable, deployable AI applications in TypeScript. That's what "proficient JS/TS developer for AI/ML" means. Go build something real.

---

## Recap

- **Project 1 (CLI Q&A bot)** — Node CLI, env config, streaming via async generators, error handling, model behind an interface.
- **Project 2 (Semantic search)** — fs traversal, chunking, embeddings, in-memory vector index, cosine ranking (the retrieval half of RAG).
- **Project 3 (RAG assistant + API)** — full retrieve→augment→generate with grounding + citations, a Zod-validated Hono API, structured responses.
- **Project 4 (Tool-using agent)** — typed tools, function calling, a bounded loop, Zod-validated args, and deterministic testing via a scripted fake model.
- Every project is **interface-first** (so it's testable and provider-agnostic), **tested** with Module 14's patterns, and has a concrete **definition of done**.
- Now you understand the frameworks (Vercel AI SDK, LangChain.js, LlamaIndex.TS, Mastra) because you built their primitives by hand.

## Next

There's no "Next" module — this is the end of the guide. Return to the **[master README](../README.md)** to review the skill checklist, revisit any module, and pick which capstone to extend into a real product. You're ready.
