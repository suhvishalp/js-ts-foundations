# Module 11 — Exercises

Run `.ts` files with `npx tsx <file>.ts`. Setup: `npm install zod` and, for the
SDK exercises, `npm install @anthropic-ai/sdk`. Live LLM exercises need
`ANTHROPIC_API_KEY` in your environment (or a `.env` + `dotenv`) — but several
exercises are written so you can build and test the *logic* with a mock, no key
required.

---

## Exercise 1 — HTTP status reasoning (warm-up)

**Scenario:** You're deciding how a client should react to responses.

**Requirements:** Write `shouldRetry(status: number): boolean` that returns
`true` only for statuses that are safe/sensible to retry (`408`, `429`, and
`5xx`), and `false` otherwise. Test it against `200`, `400`, `401`, `404`,
`429`, `500`, `503`.

**Hint:** `status === 408 || status === 429 || status >= 500`.

---

## Exercise 2 — A typed JSON fetch helper

**Scenario:** Build the GET/POST helpers the rest of the module relies on.

**Requirements:**
1. Write `getJson<T>(url)` and `postJson<T>(url, body, headers?)`.
2. Both must throw a clear error including the status when `!res.ok`, reading the
   error body for detail.
3. Use `getJson` against `https://api.github.com/repos/microsoft/TypeScript` and
   print `full_name`.

**Hint:** `headers: { "content-type": "application/json", ...extra }`. Read the
error body with `res.text()`.

---

## Exercise 3 — Exponential backoff (no network)

**Scenario:** Test backoff math without making real requests.

**Requirements:**
1. Write `backoffDelay(attempt: number, baseMs = 1000): number` returning
   `2 ** attempt * baseMs` plus up to 250ms of jitter.
2. Print the delay for attempts 0–4 and confirm the pattern (~1s, ~2s, ~4s,
   ~8s, ~16s).

**Hint:** `2 ** attempt * baseMs + Math.random() * 250`.

---

## Exercise 4 — `fetchWithRetry` (AI/ML themed)

**Scenario:** Make a fetch wrapper that survives transient failures.

**Requirements:**
1. Write `fetchWithRetry(url, init, maxAttempts = 4)` that retries only
   retryable statuses and network errors, with exponential backoff + jitter,
   honoring the `Retry-After` header if present.
2. Test it against a *mock* fetch you inject that fails with `503` twice, then
   succeeds — assert it eventually returns the success and made 3 attempts.

**Hint:** To make it testable, accept a `fetchFn = fetch` parameter you can
override in a test. Count attempts in the mock.

---

## Exercise 5 — Bounded concurrency (AI/ML themed)

**Scenario:** Embed a large list without triggering rate limits.

**Requirements:**
1. Write `mapWithConcurrency(items, limit, worker)` (see the lesson).
2. Use it to run a mock async `worker` over 20 items with `limit = 3`. Have the
   worker record and log the number of *currently active* calls to prove it
   never exceeds 3.

**Hint:** Increment a shared `active` counter at the start of the worker,
decrement in a `finally`, and log the peak.

---

## Exercise 6 — Build the LLM request body

**Scenario:** Construct a valid Anthropic Messages request (no network yet).

**Requirements:**
1. Write `buildMessagesBody({ model, maxTokens, system?, messages })` that
   returns the JSON-serializable object for the Anthropic Messages API.
2. Include `system` only when provided.
3. Log `JSON.stringify(body, null, 2)` for a two-message conversation.
   Include `temperature` only when provided (it's optional; `0.0`–`1.0`).

**Hint:** `...(system ? { system } : {})` to conditionally include a key.

---

## Exercise 7 — Call Claude with raw fetch (live, or mock)

**Scenario:** Make a real completion request and extract the answer.

**Requirements:**
1. Write `askClaude(prompt)` that POSTs to `https://api.anthropic.com/v1/messages`
   with the three required headers, checks `res.ok`, validates the response with
   Zod, and returns the text from the first text block.
2. Print the answer and the token usage.
3. If you don't have a key, factor the parsing into a `extractText(json)`
   function and test it against a hard-coded sample response object.

**Hint:** Headers: `x-api-key`, `anthropic-version: 2023-06-01`,
`content-type`. Text is at `content.find(b => b.type === "text")?.text`.

---

## Exercise 8 — Parse an SSE stream (core, no network)

**Scenario:** Prove you understand streaming by parsing a captured stream.

**Requirements:**
1. Given a multi-line string of Anthropic SSE events (provided in the solution),
   write a parser that extracts and concatenates all `text_delta` text and pulls
   the final `output_tokens`.
2. Handle the fact that `data:` lines are interleaved with `event:` and blank
   lines.
3. Print the reconstructed text and the token count.

**Hint:** Split on `\n`, keep only lines starting with `data:`, `JSON.parse`
each, and switch on `event.type`.

---

## Exercise 9 — Stream Claude live (stretch)

**Scenario:** Show tokens as they arrive.

**Requirements:**
1. Write `streamClaude(prompt)` using `stream: true`, `res.body.getReader()`, a
   `TextDecoder`, and a line buffer.
2. Write each `text_delta` to `process.stdout` as it arrives; return the full
   text at the end.
3. Print the final `output_tokens` from the `message_delta` event.

**Hint:** Reuse your Exercise 8 parser logic on each decoded chunk, buffering the
trailing partial line between reads.

---

## Exercise 10 — A reusable typed `callLLM()` with timeout + retry (stretch)

**Scenario:** Assemble the production helper.

**Requirements:**
1. Implement `callLLM(messages, opts)` returning `{ text, usage, stopReason }`
   (typed), with defaults for `model`, `maxTokens`, `timeoutMs`, `maxAttempts`.
2. Use `AbortController` for the timeout, retry only retryable failures with
   backoff, and validate the response with Zod.
3. Then rewrite the same call using the official `@anthropic-ai/sdk` and compare
   how much code disappears.

**Hint:** See Section 12 and 13 of the README. For the SDK version:
`new Anthropic()` then `client.messages.create({...})`.
