# Module 11 — APIs & LLMs

> This is the pivotal module. Everything before it — types, validation, the Node
> runtime, `fetch` — was preparation for *this*: talking to real APIs, and
> especially to **Large Language Models**. You'll learn HTTP and REST properly,
> then build up from a single `fetch` to a production-grade LLM client with
> retries, backoff, concurrency control, streaming, usage accounting, timeouts,
> and full TypeScript types. We use the **Anthropic Messages API** (Claude) as
> the primary example — it's what this guide targets — but the patterns transfer
> to any provider. You'll finish with a reusable, typed `callLLM()` helper and an
> understanding of *what the official SDK does for you underneath*.

## What you'll learn

- HTTP fundamentals: methods, status codes, headers, JSON request/response bodies
- REST concepts and how they map onto real endpoints
- Authentication: API keys and bearer tokens (kept in env vars, always)
- `fetch` for GET and POST with JSON, and rigorous error/status handling
- Retries with **exponential backoff** and jitter
- **Rate limiting** and controlling concurrency
- LLM APIs: the chat-completions request/response shape (`messages`, roles,
  `model`, `max_tokens`, temperature)
- Calling Claude with raw `fetch` — the Anthropic Messages API in detail
- **Streaming** responses: Server-Sent Events, reading a `ReadableStream`,
  parsing `data:` lines token by token
- Token/usage accounting and cost awareness
- Handling **timeouts** with `AbortController`
- Typing all of it, and building a reusable `callLLM()`
- The official `@anthropic-ai/sdk` — why it's preferred in real projects, and a
  short example — plus what it hides

## Prerequisites

- Module 04 (Async), 09 (TS in Practice — Zod, error patterns), 10 (Node, env
  vars, `fetch`)
- An Anthropic API key in `ANTHROPIC_API_KEY` if you want to run the live
  examples (the code is written so you can read and understand it without one)

---

## 1. HTTP fundamentals

Every API call — REST or LLM — is an HTTP request and response. Get the model of
HTTP clear and everything else is detail.

An HTTP **request** has:

- a **method** (the verb),
- a **URL**,
- **headers** (metadata: content type, auth, etc.),
- and optionally a **body** (the payload).

A **response** has a **status code**, **headers**, and a **body**.

### Methods

| Method | Meaning | Body? |
|---|---|---|
| `GET` | Read a resource | No |
| `POST` | Create a resource / submit data (LLM calls are POST) | Yes |
| `PUT` | Replace a resource | Yes |
| `PATCH` | Partially update a resource | Yes |
| `DELETE` | Remove a resource | Usually no |

LLM completions are **`POST`** — you're submitting a prompt payload and getting a
generated response.

### Status codes

The first digit tells you the category:

| Range | Meaning | Examples |
|---|---|---|
| `2xx` | Success | `200 OK`, `201 Created` |
| `3xx` | Redirect | `301`, `304 Not Modified` |
| `4xx` | **Your** error (don't blindly retry) | `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `429 Too Many Requests` |
| `5xx` | **Server** error (safe to retry) | `500`, `503`, `529 Overloaded` |

Two you'll handle constantly with LLMs: **`429`** (rate limited — back off and
retry) and **`5xx`** (transient server issue — retry). A **`400`** or **`401`**
means *you* sent something wrong (bad request body, missing/invalid key) —
retrying won't help.

### Headers and JSON bodies

Headers carry metadata. The two you'll set on almost every JSON API call:

```
content-type: application/json      # "my body is JSON"
authorization: Bearer <token>       # or a provider-specific auth header
```

The body of a JSON API is a JSON string; you serialize with `JSON.stringify` on
the way out and `res.json()` on the way in.

---

## 2. REST in one page

**REST** is a style for organizing HTTP APIs around **resources** addressed by
URL, manipulated with the standard methods.

```
GET    /v1/models            # list models
GET    /v1/models/claude-... # get one model
POST   /v1/messages          # create a message (an LLM completion)
```

Notice the LLM endpoint fits the pattern: creating a completion is `POST
/v1/messages`. You send a request body describing what you want; you get a
response resource back. The rest of this module is really just "how to make good
REST calls, applied to LLMs."

> **🤖 AI/ML relevance:** LLM providers expose REST APIs. Anthropic, OpenAI, and
> others all center on a "create a message/completion" POST endpoint with a
> JSON body of messages. Learn one well and the others are a quick diff.

---

## 3. Authentication

APIs identify you with a **credential**, sent in a header. Two common shapes:

- **API key** in a custom header — Anthropic uses `x-api-key: <key>`.
- **Bearer token** — `authorization: Bearer <token>` (OAuth-style; also how many
  other APIs, and Anthropic's OAuth mode, work).

**The key rule, from Module 10:** the credential lives in an **environment
variable**, never in source, never in a browser bundle.

```ts
import process from "node:process";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
```

Every example in this module reads the key from `process.env`. If you ever see
an API key written as a string literal in code, treat it as a bug.

---

## 4. `fetch` for GET and POST with JSON

You met `fetch` in Module 10. Here it is applied rigorously.

### GET

```ts
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} failed: HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}
```

### POST

```ts
async function postJson<T>(url: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // Include the response body — APIs put the *why* in there.
    const detail = await res.text().catch(() => "");
    throw new Error(`POST ${url} failed: HTTP ${res.status}. ${detail}`);
  }
  return (await res.json()) as T;
}
```

Three rules that separate robust code from fragile code:

1. **Always check `res.ok`.** `fetch` resolves (doesn't throw) on 4xx/5xx.
2. **Read the error body** on failure — the API tells you what went wrong there.
3. **Read the body once.** `.json()` or `.text()`, not both.

> The `as T` cast trusts the shape without checking it. For untrusted data
> (which includes every API response), validate with Zod (Module 09) instead of
> casting. We'll do exactly that for LLM output shortly.

---

## 5. Retries with exponential backoff

Networks are unreliable and APIs rate-limit. A robust client **retries**
transient failures — but not *all* failures, and not *immediately*.

**Which failures to retry:** `429` (rate limit), `5xx` (server), and network
errors. **Never** retry `400`/`401`/`404` — those are your fault and won't fix
themselves.

**Exponential backoff:** wait longer after each failed attempt — 1s, 2s, 4s, 8s…
This gives an overloaded server room to recover instead of hammering it.

**Jitter:** add a small random amount to each delay so many clients don't retry
in lockstep (a "thundering herd").

```ts
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 408 || status >= 500;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxAttempts = 4,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url, init);
      // Success, or a client error we must NOT retry -> return immediately.
      if (res.ok || !isRetryableStatus(res.status)) return res;

      // Retryable HTTP status. Honor Retry-After if the server sent it.
      if (attempt < maxAttempts - 1) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const backoff = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : 2 ** attempt * 1000;              // 1s, 2s, 4s...
        const jitter = Math.random() * 250;   // spread out concurrent clients
        await sleep(backoff + jitter);
        continue;
      }
      return res; // out of attempts — let the caller see the failing response
    } catch (err) {
      // Network-level error (DNS, connection reset). Retryable.
      lastError = err;
      if (attempt < maxAttempts - 1) {
        await sleep(2 ** attempt * 1000 + Math.random() * 250);
        continue;
      }
      throw lastError;
    }
  }
  throw lastError ?? new Error("fetchWithRetry: exhausted attempts");
}
```

> **🤖 AI/ML relevance:** LLM APIs rate-limit aggressively and occasionally
> return `529 Overloaded` under load. A backoff loop is the difference between a
> pipeline that survives a busy afternoon and one that dies on the first `429`.
> The `Retry-After` header, when present, tells you exactly how long to wait —
> honor it.

---

## 6. Rate limiting and concurrency control

Backoff handles failures *after* they happen. **Concurrency control** prevents
them by limiting how many requests are in flight at once. If you `Promise.all`
over 10,000 documents, you fire 10,000 simultaneous requests and get instantly
rate-limited. Instead, process with a bounded worker pool.

```ts
// Run an async `worker` over `items`, at most `limit` in flight at a time.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run(): Promise<void> {
    while (next < items.length) {
      const current = next++;          // claim an index
      results[current] = await worker(items[current]!, current);
    }
  }

  // Start `limit` workers that pull from the shared cursor until items run out.
  const runners = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(runners);
  return results;
}
```

Usage:

```ts
const docs = [/* thousands of strings */];
const embeddings = await mapWithConcurrency(docs, 5, async (doc) => {
  return callEmbeddingsApi(doc); // at most 5 concurrent requests
});
```

> **🤖 AI/ML relevance:** Embedding a large corpus is the canonical batch job.
> A concurrency of 5–10 usually maximizes throughput without tripping rate
> limits. Combine `mapWithConcurrency` (prevent overload) with `fetchWithRetry`
> (survive the overload that slips through) and you have a production ingestion
> pipeline.

---

## 7. The LLM request/response shape

Now the main event. Modern chat LLMs share a common request shape, often called
"chat completions":

- **`model`** — which model to use (e.g. `claude-sonnet-5`).
- **`messages`** — the conversation, an array of `{ role, content }`. Roles are
  `"user"` and `"assistant"` (and a system prompt, provided separately or as a
  role depending on the API). The API is **stateless** — you send the *entire*
  history every call; the server remembers nothing.
- **`max_tokens`** — the maximum length of the generated response, in tokens.
- **temperature** — how random/creative the output is (0 = deterministic-ish,
  higher = more varied). *(See the note below — current Claude models control
  this differently.)*

A **token** is a chunk of text (roughly ¾ of a word in English). Both your input
and the model's output are measured and billed in tokens.

Here is the Anthropic Messages API request body — the shape we'll use throughout:

```jsonc
{
  "model": "claude-sonnet-5",
  "max_tokens": 1024,
  "system": "You are a concise assistant.",   // optional top-level system prompt
  "messages": [
    { "role": "user", "content": "In one sentence, what is a vector database?" }
  ]
}
```

And the response body:

```jsonc
{
  "id": "msg_01...",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-5",
  "content": [
    { "type": "text", "text": "A vector database stores and searches data by..." }
  ],
  "stop_reason": "end_turn",       // why generation stopped
  "usage": { "input_tokens": 18, "output_tokens": 27 }
}
```

Two shape details that matter:

- **`content` is an array of blocks**, not a plain string. The text lives at
  `content[0].text` for a simple response. (Blocks exist because a response can
  also contain tool calls, images, etc.)
- **`stop_reason`** tells you *why* it stopped: `"end_turn"` (finished
  naturally), `"max_tokens"` (hit your limit — output is truncated, raise the
  limit), `"tool_use"`, or `"refusal"`.
- **`usage`** reports exact token counts — this is how you track cost.

> **Note on `temperature`:** the Anthropic Messages API accepts `temperature`
> (a value from `0.0` to `1.0`; lower = more deterministic, higher = more
> varied). You typically set *either* `temperature` *or* `top_p`, not both. For
> tasks where you want reproducible, structured output (JSON extraction, tool
> use) prefer a low temperature like `0` or `0.2`; for creative writing, go
> higher. The broader lesson still stands: request shapes are provider- *and*
> model-specific, so check the docs and validate the response — the
> runtime-validation discipline from Module 09.

---

## 8. Calling Claude with raw `fetch`

Let's make a real, minimal request to the Anthropic Messages API. Three headers
are required:

- `x-api-key` — your key
- `anthropic-version` — the API version, `2023-06-01`
- `content-type` — `application/json`

```ts
import process from "node:process";
import { z } from "zod";

// Validate the parts of the response we depend on (untrusted input!).
const MessageResponseSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
  stop_reason: z.string().nullable(),
  usage: z.object({ input_tokens: z.number(), output_tokens: z.number() }),
});

async function askClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic API HTTP ${res.status}: ${detail}`);
  }

  const data = MessageResponseSchema.parse(await res.json());
  // Pull the text out of the first text block.
  const text = data.content.find((b) => b.type === "text")?.text ?? "";
  console.log(`[tokens in=${data.usage.input_tokens} out=${data.usage.output_tokens}]`);
  return text;
}

console.log(await askClaude("In one sentence, what is a vector database?"));
```

That's the whole loop: build the body, POST it with auth headers, check the
status, validate the JSON, extract the text. Everything else in this module makes
this more robust (retries, timeouts) or more responsive (streaming).

> **Provider-agnostic view:** swap the URL, the auth header name, and the exact
> body/response keys, and this same code talks to a different provider. The
> concepts — POST a `messages` array, get back generated content and token usage
> — are universal.

### 🎬 Real-life scenario — the classification microservice

Your team needs to auto-categorize incoming support emails. You wrap `askClaude`
with a system prompt ("Classify into: bug, billing, feature, other. Reply with
only the label.") and a Zod enum to validate the reply. You add `fetchWithRetry`
so a midday `429` doesn't drop an email, and `mapWithConcurrency` so the nightly
backfill of 50,000 historical emails runs at a steady 8 requests in flight. The
whole service is ~150 lines of TypeScript built entirely from the pieces in this
module.

---

## 9. Streaming responses

For anything user-facing, waiting for the *entire* response before showing
anything feels slow. **Streaming** delivers the response token by token as it's
generated — the "typing" effect you see in chat UIs.

Streaming APIs use **Server-Sent Events (SSE)**: the response body is a long-
lived stream of text lines. Each event is one or more `data:` lines followed by a
blank line:

```
event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"A vector"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" database"}}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":27}}

event: message_stop
data: {"type":"message_stop"}
```

To stream, add `"stream": true` to the request body, then read the response as a
`ReadableStream` instead of calling `.json()`.

```ts
import process from "node:process";

async function streamClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 512,
      stream: true, // <-- turn on streaming
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Streaming request failed: HTTP ${res.status}`);
  }

  // res.body is a ReadableStream<Uint8Array>. Decode bytes -> text, then split
  // the text into SSE lines. Bytes may split mid-line, so we buffer.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines; keep the trailing partial line in `buffer`.
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue; // ignore `event:` and blank lines
      const json = line.slice(5).trim();
      if (!json) continue;

      const event = JSON.parse(json);
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        process.stdout.write(event.delta.text); // print each token as it arrives
        full += event.delta.text;
      } else if (event.type === "message_delta" && event.usage) {
        // Final usage arrives near the end of the stream.
        process.stdout.write(`\n[output_tokens=${event.usage.output_tokens}]\n`);
      }
    }
  }
  return full;
}

await streamClaude("Write a haiku about vectors.");
```

The key mechanics, worth internalizing:

1. **`res.body.getReader()`** gives you a reader that yields `Uint8Array` chunks.
2. **`TextDecoder`** turns bytes into text. Pass `{ stream: true }` so multi-byte
   characters split across chunks are handled correctly.
3. **Chunks don't align to lines.** Buffer, split on `\n`, and keep the last
   (possibly incomplete) line for the next chunk.
4. **Parse only `data:` lines**, `JSON.parse` the payload, and act on the event
   `type`. Text lives in `content_block_delta` → `delta.text`; final token usage
   arrives in `message_delta`.

> **🤖 AI/ML relevance:** Streaming is essential for chat UIs (perceived latency)
> and for long generations where you'd otherwise risk an HTTP timeout waiting for
> a large response. It's also how agent loops surface progress. The SSE-parsing
> pattern above is exactly what SDKs implement for you — knowing it means you can
> debug a stalled stream instead of staring at a spinner.

---

## 10. Token/usage accounting and cost

Every response reports `usage.input_tokens` and `usage.output_tokens`. Track them
to understand and control cost. Pricing is per *million* tokens and differs for
input vs output (output is typically several times more expensive).

```ts
// Illustrative rates ($ per million tokens) — check current pricing.
const RATES = { inputPerM: 3, outputPerM: 15 };

function costUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * RATES.inputPerM
       + (outputTokens / 1_000_000) * RATES.outputPerM;
}

// Accumulate across a batch:
let totalIn = 0, totalOut = 0;
// ...for each response: totalIn += usage.input_tokens; totalOut += usage.output_tokens;
console.log(`Batch cost ≈ $${costUsd(totalIn, totalOut).toFixed(4)}`);
```

Practical levers on cost: use a smaller/cheaper model where quality allows, keep
prompts tight, set `max_tokens` no higher than you need, and — for repeated large
prefixes — prompt caching (an advanced feature the SDK exposes). Accounting is
the first step: you can't optimize what you don't measure.

---

## 11. Handling timeouts

A request can hang indefinitely. Bound it with an **`AbortController`**, whose
signal you pass to `fetch`; call `abort()` after a deadline.

```ts
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 30_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer); // always clean up the timer
  }
}
```

> **Streaming caveat:** for a streaming request, a whole-request timeout is the
> wrong tool — a long generation legitimately takes a while. Instead, bound the
> *time to first byte* or the *gap between chunks*. But for ordinary
> request/response calls, the pattern above is exactly right, and it composes
> with `fetchWithRetry` (a timeout is a retryable failure).

---

## 12. A reusable, typed `callLLM()`

Now assemble the pieces into one helper you'd actually reuse: typed inputs and
outputs, env-based auth, retries, timeout, status handling, and validated output.

```ts
import process from "node:process";
import { z } from "zod";

// ---- Types ----
export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CallLlmOptions {
  model?: string;
  maxTokens?: number;
  system?: string;
  timeoutMs?: number;
  maxAttempts?: number;
}

export interface LlmResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
  stopReason: string | null;
}

// ---- Response validation (untrusted!) ----
const ResponseSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
  stop_reason: z.string().nullable(),
  usage: z.object({ input_tokens: z.number(), output_tokens: z.number() }),
});

const RETRYABLE = (s: number) => s === 429 || s === 408 || s >= 500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function callLLM(
  messages: LlmMessage[],
  opts: CallLlmOptions = {},
): Promise<LlmResult> {
  const {
    model = "claude-sonnet-5",
    maxTokens = 1024,
    system,
    timeoutMs = 30_000,
    maxAttempts = 4,
  } = opts;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages,
  });

  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        // Non-retryable client errors: fail immediately.
        if (!RETRYABLE(res.status)) {
          throw new Error(`LLM HTTP ${res.status}: ${detail}`);
        }
        // Retryable: back off (honoring Retry-After) unless out of attempts.
        if (attempt < maxAttempts - 1) {
          const ra = Number(res.headers.get("retry-after"));
          const wait = Number.isFinite(ra) && ra > 0 ? ra * 1000 : 2 ** attempt * 1000;
          await sleep(wait + Math.random() * 250);
          continue;
        }
        throw new Error(`LLM HTTP ${res.status} after ${maxAttempts} attempts: ${detail}`);
      }

      const data = ResponseSchema.parse(await res.json());
      const text = data.content.find((b) => b.type === "text")?.text ?? "";
      return {
        text,
        usage: { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens },
        stopReason: data.stop_reason,
      };
    } catch (err) {
      lastErr = err;
      const aborted = err instanceof Error && err.name === "AbortError";
      // Retry timeouts and network errors; re-throw non-retryable HTTP errors.
      const retryable = aborted || (err instanceof TypeError); // TypeError ~ network failure
      if (retryable && attempt < maxAttempts - 1) {
        await sleep(2 ** attempt * 1000 + Math.random() * 250);
        continue;
      }
      throw lastErr;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error("callLLM: exhausted attempts");
}
```

Usage is now trivial and safe:

```ts
const result = await callLLM(
  [{ role: "user", content: "Name three vector databases." }],
  { system: "Answer with a comma-separated list only.", maxTokens: 64 },
);
console.log(result.text);
console.log(`cost tokens: in=${result.usage.inputTokens} out=${result.usage.outputTokens}`);
```

This is the payoff of the whole module: one typed function that hides HTTP,
auth, retries, timeouts, and validation behind a clean signature.

---

## 13. The official SDK — preferred in real projects

Everything above teaches you *what's underneath*. In real projects, **use the
official `@anthropic-ai/sdk`.** It implements all of this — auth, retries with
backoff, streaming, timeouts, typed responses, prompt caching, tool use — and is
maintained in lockstep with the API. Reinventing it by hand is a learning
exercise, not a production strategy.

```bash
npm install @anthropic-ai/sdk
```

```ts
import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment automatically.
const client = new Anthropic();

// Non-streaming
const message = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 256,
  messages: [{ role: "user", content: "In one sentence, what is a vector database?" }],
});
// content is a typed array of blocks; narrow to the text block:
for (const block of message.content) {
  if (block.type === "text") console.log(block.text);
}
console.log(message.usage.input_tokens, message.usage.output_tokens);

// Streaming — the SDK parses SSE for you and gives you clean events:
const stream = client.messages.stream({
  model: "claude-sonnet-5",
  max_tokens: 256,
  messages: [{ role: "user", content: "Write a haiku about vectors." }],
});
stream.on("text", (delta) => process.stdout.write(delta)); // each token
const final = await stream.finalMessage(); // full typed message when done
console.log(`\ntokens: ${final.usage.output_tokens}`);
```

Notice how much the SDK collapses: no manual header setup, no `res.ok` checks, no
`TextDecoder`/buffer/`data:` parsing, no hand-written retry loop — and the
responses are fully typed. The SDK retries `429`/`5xx` with backoff by default
(`maxRetries`, default 2) and applies sensible timeouts.

> **The takeaway:** understand the raw `fetch` layer so you can *debug* the SDK,
> reason about failures, and work with providers that lack a good SDK — but
> **reach for the official SDK by default.** Build `callLLM()` by hand once, for
> understanding; ship the SDK.

---

## Common pitfalls

- **Not checking `res.ok`.** `fetch` doesn't throw on 4xx/5xx. Every example here
  checks it.
- **Retrying non-retryable errors.** `400`/`401`/`404` are your fault — retrying
  wastes time and money. Retry only `429`, `408`, `5xx`, and network errors.
- **Retrying without backoff.** Immediate retries hammer a struggling server.
  Exponential backoff + jitter, and honor `Retry-After`.
- **Unbounded concurrency.** `Promise.all` over a huge list = instant rate limit.
  Use a bounded worker pool.
- **Treating the LLM response as trusted.** Validate with Zod — the `content`
  array can be empty, `stop_reason` can be `max_tokens` (truncated), output can be
  malformed JSON.
- **Setting both `temperature` and `top_p`.** Use one or the other. For
  structured/tool output, prefer a low `temperature` (e.g. `0`).
- **Forgetting the API is stateless.** No history is stored server-side; send the
  full `messages` array each call.
- **Parsing SSE naively.** Chunks split mid-line; buffer and split on `\n`, act
  only on `data:` lines.
- **Hard-coding or leaking the API key.** Env var, server-side only, always.
- **Reinventing the SDK for production.** Learn the internals, then use
  `@anthropic-ai/sdk`.

## Recap

- **HTTP**: methods (LLM calls are `POST`), status codes (`2xx` ok, `4xx` your
  fault, `5xx`/`429` retryable), headers, JSON bodies. **REST** organizes this
  around resources.
- **Auth** is a header (`x-api-key` or `Bearer`), and the key always comes from
  `process.env`.
- **`fetch`**: check `res.ok`, read the body once, read error bodies for detail.
- **Resilience**: retry only transient failures with **exponential backoff +
  jitter**, honoring `Retry-After`; bound **concurrency** with a worker pool.
- **LLM shape**: `model`, `messages` (`role`/`content`), `max_tokens`,
  `temperature` (optional, `0.0`–`1.0`); responses carry a `content`
  block array, `stop_reason`, and `usage` token counts. The API is **stateless**.
- **Streaming** via SSE: `stream: true`, read `res.body`, decode + buffer, parse
  `data:` lines, act on event `type`.
- **Accounting**: track `usage` tokens to measure and control cost.
- **Timeouts**: `AbortController` + `setTimeout`.
- A reusable **typed `callLLM()`** composes all of it — and the official
  **`@anthropic-ai/sdk`** does the same, better, for production.

## Next

→ **[Module 12 — AI/ML Foundations in JS/TS](../12-aiml-foundations/README.md)**:
now that you can *call* models, learn what their outputs *mean* — vectors,
embeddings, cosine similarity, tensors, and running models in JS with
Transformers.js and TensorFlow.js. Then Module 13 combines calling + embeddings
into full RAG systems and agents.
