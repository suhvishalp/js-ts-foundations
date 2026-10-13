# Module 04 — Asynchronous JavaScript

Asynchronous programming is the single most important skill for AI/ML engineering in JavaScript. Almost everything you do — calling an LLM, fetching embeddings, streaming a completion, querying a vector database — is a network operation that takes time. Master this module and you can build fast, resilient, production-grade AI pipelines. Skip it and your code will be slow, brittle, and full of race conditions.

Take your time here. This is the longest and most important module in the guide.

## What you'll learn

- How the **event loop** actually works — the call stack, microtasks vs macrotasks, and why print order surprises people
- The difference between **synchronous** and **asynchronous** code
- **Callbacks**, callback hell, and how promises rescue us
- **Promises** end to end: creating, chaining, error propagation, `.then/.catch/.finally`
- The four combinators — **`Promise.all` / `allSettled` / `race` / `any`** — and exactly when to reach for each
- **`async/await`** as syntax sugar over promises, with proper `try/catch` error handling
- **Sequential vs parallel** awaits and the huge performance difference
- **`for await...of`**, **async iterators**, and **async generators** (`async function*`)
- **Streaming** LLM tokens with a mock stream (async generator + callback variants)
- The **retry-with-backoff** pattern for 429/5xx errors
- The **concurrency-limit** pattern (`mapWithConcurrency`) for batch jobs

## Prerequisites

You should be comfortable with functions, closures, higher-order functions, and callbacks. If any of that is shaky, review [`../03-functions-deep-dive/README.md`](../03-functions-deep-dive/README.md) first — closures in particular power a lot of async patterns.

Every code block below is runnable. The `examples/` folder has standalone files you can run with plain `node` (no network needed — every LLM call is mocked with `setTimeout`).

---

## 1. Synchronous vs asynchronous

**Synchronous** code runs top to bottom, one statement at a time. Each line finishes completely before the next starts. If a line takes 3 seconds, everything waits 3 seconds.

**Asynchronous** code lets you *start* a slow operation (a network request, a timer, reading a file) and continue running other code; the result arrives *later*. JavaScript is single-threaded — there is only one call stack — so async is how it stays responsive without blocking that single thread.

```js
console.log('A');

// setTimeout schedules a callback to run LATER, then returns immediately.
setTimeout(() => console.log('B (later)'), 1000);

console.log('C');

// What this prints:
// A
// C
// B (later)   <- one second after the others
```

The key mental shift: `setTimeout` does **not** pause. It registers the callback and moves on. `C` prints before `B` even though `B` appears first in the source.

> **🤖 AI/ML relevance:** An LLM completion can take several seconds. If those seconds were synchronous, your server could not handle any other request while waiting — one user's slow generation would freeze everyone. Async lets a single Node process juggle hundreds of in-flight LLM calls at once.

---

## 2. The event loop and the call stack

This is the mental model everything else builds on. Read it slowly.

JavaScript has:

1. **A call stack** — where synchronous function calls are pushed and popped. There is exactly one.
2. **A microtask queue** — holds Promise callbacks (`.then/.catch/.finally`), `queueMicrotask`, and the continuation after an `await`.
3. **A macrotask queue** (a.k.a. "task queue") — holds `setTimeout`, `setInterval`, `setImmediate`, and I/O callbacks.
4. **The event loop** — the referee that decides what runs next.

The algorithm the event loop follows:

1. Run **all** synchronous code (drain the call stack completely).
2. When the stack is empty, **drain the entire microtask queue** — run every microtask, including ones added *while* draining.
3. Take **one** macrotask, run it (which may push microtasks), then **drain microtasks again**.
4. Repeat forever.

The crucial takeaways: **microtasks always run before the next macrotask**, and a `setTimeout(fn, 0)` never runs before pending Promise callbacks.

```js
console.log('1: sync start');

setTimeout(() => console.log('5: setTimeout (macrotask)'), 0);

Promise.resolve().then(() => console.log('3: promise.then (microtask)'));

queueMicrotask(() => console.log('4: queueMicrotask (microtask)'));

console.log('2: sync end');

// Exact print order:
// 1: sync start
// 2: sync end
// 3: promise.then (microtask)
// 4: queueMicrotask (microtask)
// 5: setTimeout (macrotask)
```

Why this order?

- `1` and `2` are synchronous → they run first, in source order.
- `3` and `4` are microtasks → they run after sync finishes but before any macrotask, in the order queued.
- `5` is a macrotask → it waits for the microtask queue to be empty, so it runs **last** despite the `0ms` delay.

Run the full, richer demo (which also shows how `await` fits in):

```bash
node examples/event-loop.js
```

> **🤖 AI/ML relevance:** When you stream tokens and update a UI or a progress counter, understanding that microtasks flush before the next timer tick explains why your accumulator is fully updated before the next scheduled render. It also explains subtle bugs where a `.then` you expected to run "after a delay" actually runs before it.

### 🎬 Real-life scenario: the mysterious log order

You're debugging a token-usage tracker. A teammate added logging and swears the numbers print "out of order." Here's a distilled version of what they saw:

```js
function trackUsage(label) {
  console.log(`sync log: ${label}`);
  Promise.resolve().then(() => console.log(`microtask log: ${label}`));
  setTimeout(() => console.log(`timeout log: ${label}`), 0);
}

trackUsage('request-1');
trackUsage('request-2');

// Print order:
// sync log: request-1
// sync log: request-2
// microtask log: request-1
// microtask log: request-2
// timeout log: request-1
// timeout log: request-2
```

Nothing is broken. All synchronous logs flush first, then all microtasks (both `.then`s were queued before either fired), then the macrotasks. Once you *see* the three tiers, the order is completely predictable. This is why senior engineers can read async code and mentally simulate it.

---

## 3. Callbacks and callback hell

Before promises, async results were delivered via **callbacks** — you pass a function that gets called when the work is done. This works, but nesting dependent async steps produces the infamous "pyramid of doom."

```js
// Mock async step: calls back after `ms` with a value.
function step(name, ms, cb) {
  setTimeout(() => cb(null, `${name} done`), ms);
}

// Callback hell: each step depends on the previous one.
step('embed', 100, (err, r1) => {
  if (err) return console.error(err);
  step('search', 100, (err, r2) => {
    if (err) return console.error(err);
    step('rerank', 100, (err, r3) => {
      if (err) return console.error(err);
      step('generate', 100, (err, r4) => {
        if (err) return console.error(err);
        console.log('pipeline:', r1, r2, r3, r4);
        // Notice the drift to the right and the repeated error handling.
      });
    });
  });
});
```

The problems: it drifts rightward, error handling is duplicated at every level, and control flow is hard to follow. Promises flatten this into a readable chain (next section).

> **🤖 AI/ML relevance:** A RAG pipeline is exactly this: embed the query → search the vector store → rerank → call the LLM. Each step feeds the next. You do **not** want to express that as a five-deep callback pyramid.

---

## 4. Promises

A **Promise** is an object representing a value that will exist *eventually*. It is always in one of three states: **pending**, **fulfilled** (resolved with a value), or **rejected** (failed with a reason). Once it settles (fulfilled or rejected) it never changes again.

### Creating a promise

Use `new Promise((resolve, reject) => { ... })`. Call `resolve(value)` on success, `reject(error)` on failure.

```js
function mockLLMCall(prompt, { ms = 100, shouldFail = false } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error(`failed: ${prompt}`));
      else resolve(`Completion for "${prompt}"`);
    }, ms);
  });
}

mockLLMCall('hello').then((text) => console.log(text));
// => Completion for "hello"   (after ~100ms)
```

### `.then`, `.catch`, `.finally`

- `.then(onFulfilled)` runs when the promise resolves.
- `.catch(onRejected)` runs when it rejects (anywhere earlier in the chain).
- `.finally(onSettled)` always runs, resolve or reject — perfect for cleanup (closing a spinner, releasing a lock).

```js
mockLLMCall('hi', { ms: 50 })
  .then((text) => console.log('resolved:', text))
  .catch((err) => console.log('caught:', err.message))
  .finally(() => console.log('finally: always runs'));
```

### Chaining and error propagation

Each `.then` returns a **new** promise, so you can chain. Whatever you `return` from a `.then` becomes the input to the next `.then`. If you return a promise, the chain waits for it to settle. A rejection **skips all following `.then` handlers** and jumps to the next `.catch` — this is error propagation.

```js
mockLLMCall('step 1', { ms: 30 })
  .then((r1) => {
    console.log('got:', r1);
    return mockLLMCall('step 2', { ms: 30, shouldFail: true }); // rejects
  })
  .then((r2) => {
    console.log('never runs:', r2); // skipped because previous rejected
  })
  .then((r3) => {
    console.log('also skipped:', r3);
  })
  .catch((err) => console.log('caught downstream:', err.message));

// What this prints:
// got: Completion for "step 1"
// caught downstream: failed: step 2
```

That single `.catch` at the end handles a failure from *any* step above it — a massive improvement over per-callback error handling. Run the full promise tour:

```bash
node examples/promise-basics.js
```

> **🤖 AI/ML relevance:** The RAG pipeline from the callback-hell section becomes a flat, readable chain: `embed(q).then(search).then(rerank).then(generate).catch(handleError)`. One `.catch` covers the whole pipeline.

---

## 5. The four combinators

When you have *multiple* promises, these four static methods coordinate them. Choosing the right one is a real engineering decision.

### `Promise.all` — fail-fast batch

Waits for **all** to fulfill, resolves with an array of results **in input order**. If **any** rejects, `all` rejects immediately with that error (the others keep running but their results are discarded).

```js
const results = await Promise.all([
  mockLLMCall('a'),
  mockLLMCall('b'),
  mockLLMCall('c'),
]);
// results === ['Completion for "a"', 'Completion for "b"', 'Completion for "c"']
```

> **🤖 AI/ML relevance:** Use for batch embedding when you need **every** vector and a single failure means the whole batch is invalid. Fail fast, surface the error, retry the batch.

### `Promise.allSettled` — every outcome, never rejects

Waits for **all** to settle and resolves with an array of `{ status, value }` or `{ status, reason }` objects. It **never rejects** — you inspect each result.

```js
const settled = await Promise.allSettled([
  mockLLMCall('doc-1'),
  mockLLMCall('doc-2', { shouldFail: true }),
  mockLLMCall('doc-3'),
]);
for (const [i, res] of settled.entries()) {
  if (res.status === 'fulfilled') console.log(i, 'ok', res.value);
  else console.log(i, 'error', res.reason.message);
}
// 0 ok Completion for "doc-1"
// 1 error failed: doc-2
// 2 ok Completion for "doc-3"
```

> **🤖 AI/ML relevance:** Use for large batch jobs where partial failure is acceptable — embed 10,000 documents, keep the 9,987 that succeeded, log and re-queue the 13 that failed. Never let one bad document abort the whole run.

### `Promise.race` — first to settle (timeouts)

Settles as soon as the **first** promise settles — whether it fulfills **or rejects**. The classic use is a timeout guard.

```js
function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
  );
}

try {
  const answer = await Promise.race([
    mockLLMCall('slow', { ms: 5000 }),
    timeout(2000),
  ]);
  console.log(answer);
} catch (err) {
  console.log(err.message); // "timed out after 2000ms"
}
```

> **🤖 AI/ML relevance:** LLM calls occasionally hang. Racing the call against a timeout guarantees your request either returns or fails within a bound, so a single stuck request never wedges your service.

### `Promise.any` — first success (redundant providers)

Resolves with the **first fulfilled** value, ignoring rejections. It rejects only if **all** reject (with an `AggregateError`).

```js
const fastest = await Promise.any([
  mockLLMCall('via A', { ms: 300, shouldFail: true }),
  mockLLMCall('via B', { ms: 80 }),
  mockLLMCall('via C', { ms: 120 }),
]);
console.log(fastest); // Completion for "via B" — first to SUCCEED
```

> **🤖 AI/ML relevance:** Send the same prompt to two or three providers (or regions) at once and take whichever answers first successfully. This is a common latency- and reliability-optimization for production LLM traffic.

| Combinator | Resolves when | Rejects when | AI/ML use |
|---|---|---|---|
| `all` | all fulfill | any rejects | batch that must fully succeed |
| `allSettled` | all settle | never | batch tolerant of partial failure |
| `race` | first settles | first settles with rejection | timeout guard |
| `any` | first fulfills | all reject | first successful of redundant providers |

### 🎬 Real-life scenario: a resilient batch embedding job

You need to embed 500 support tickets nightly. Some will fail (429s, malformed text). You must not lose the whole run over a few bad tickets, and you want a report.

```js
async function embedBatch(tickets) {
  const settled = await Promise.allSettled(
    tickets.map((t) => mockLLMCall(`embed:${t.id}`))
  );

  const succeeded = [];
  const failed = [];
  settled.forEach((res, i) => {
    if (res.status === 'fulfilled') succeeded.push({ id: tickets[i].id, vector: res.value });
    else failed.push({ id: tickets[i].id, error: res.reason.message });
  });

  console.log(`embedded ${succeeded.length}/${tickets.length}; ${failed.length} failed`);
  return { succeeded, failed }; // re-queue `failed` for a retry pass
}
```

`allSettled` is the right call: you want every outcome, and partial failure is expected and recoverable.

---

## 6. async/await

`async/await` is **syntax sugar over promises**. An `async` function always returns a promise. `await` pauses the function until the awaited promise settles, then gives you the resolved value (or throws the rejection). The code *reads* synchronous but *behaves* asynchronously — the engine suspends the function and frees the thread while awaiting.

```js
// These two are equivalent:

function withThen() {
  return mockLLMCall('q').then((r) => r.toUpperCase());
}

async function withAwait() {
  const r = await mockLLMCall('q'); // pause here until it resolves
  return r.toUpperCase();
}
```

### Error handling with try/catch

Because `await` *throws* on rejection, you handle errors with ordinary `try/catch` — the same construct you use for synchronous errors.

```js
async function safeCall() {
  try {
    const text = await mockLLMCall('q', { shouldFail: true });
    console.log('got:', text);
  } catch (err) {
    console.log('handled:', err.message); // handled: failed: q
  } finally {
    console.log('cleanup runs regardless');
  }
}
```

> **🤖 AI/ML relevance:** Wrap every LLM/embedding call in `try/catch`. Network failures, rate limits, and content-filter rejections all surface as thrown errors here. Unhandled promise rejections crash Node by default in modern versions — always handle them.

---

## 7. Sequential vs parallel awaits (performance)

This is where beginners quietly destroy performance. Awaiting inside a loop makes independent calls run **one after another**.

```js
// ANTIPATTERN: sequential — each await blocks the next iteration.
async function sequential(prompts) {
  const out = [];
  for (const p of prompts) {
    out.push(await mockLLMCall(p, { ms: 100 })); // waits 100ms EACH
  }
  return out; // 5 prompts => ~500ms total
}
```

If the calls don't depend on each other, fire them all at once and await together with `Promise.all`:

```js
// CORRECT: parallel — start them all, then await together.
async function parallel(prompts) {
  const promises = prompts.map((p) => mockLLMCall(p, { ms: 100 })); // all start now
  return Promise.all(promises); // 5 prompts => ~100ms total
}
```

The difference for 5 independent calls: **~500ms vs ~100ms**. For a 500-item batch it's the difference between a minute and a second.

The rule: **`await` sequentially only when each step needs the previous step's result.** Otherwise start everything first, then await.

```js
// Legitimate sequential dependency — each step feeds the next (a RAG chain):
async function rag(query) {
  const embedding = await mockLLMCall(`embed:${query}`);
  const docs      = await mockLLMCall(`search:${embedding}`); // needs embedding
  const answer    = await mockLLMCall(`generate:${docs}`);    // needs docs
  return answer; // must be sequential — that's fine
}
```

> **🤖 AI/ML relevance:** The most common performance bug in AI code is `await` in a `for` loop over independent API calls. It turns a parallelizable batch into a slow serial crawl and often *masks* your true concurrency needs. Recognize it on sight. (When you *do* need parallelism but must cap it, see section 11.)

### 🎬 Real-life scenario: the dashboard that took 8 seconds

A colleague's analytics endpoint fetched summaries for 8 conversations, each an LLM call, and the page took ~8 seconds. The code was a `for` loop with `await` inside. The fix was one line — collect the promises and `Promise.all` them — and the endpoint dropped to ~1 second because the 8 calls now overlapped instead of queuing.

```js
// Before: ~8s
async function summarizeAll(convos) {
  const summaries = [];
  for (const c of convos) summaries.push(await mockLLMCall(`summarize:${c.id}`, { ms: 1000 }));
  return summaries;
}

// After: ~1s
async function summarizeAllFast(convos) {
  return Promise.all(convos.map((c) => mockLLMCall(`summarize:${c.id}`, { ms: 1000 })));
}
```

---

## 8. for await...of, async iterators, and async generators

A regular iterator produces values synchronously. An **async iterator** produces values *over time*, each wrapped in a promise. You consume it with **`for await...of`**, which awaits each value before running the loop body.

The easiest way to *produce* an async iterator is an **async generator**: `async function*`. Inside it, `yield` produces a value and `await` pauses for async work.

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Async generator: yields numbers 1..n, one every `gap` ms.
async function* counter(n, gap) {
  for (let i = 1; i <= n; i++) {
    await sleep(gap);
    yield i; // hand this value to the consumer, then pause until asked again
  }
}

async function run() {
  for await (const value of counter(3, 100)) {
    console.log('got', value);
  }
}
run();
// got 1   (after ~100ms)
// got 2   (after ~200ms)
// got 3   (after ~300ms)
```

`yield` is lazy and back-pressure-friendly: the generator does not compute the next value until the consumer asks for it. That's exactly what you want for streams — you process each chunk as it arrives instead of buffering everything.

> **🤖 AI/ML relevance:** Streaming LLM responses are modeled perfectly by async generators. The SDK yields tokens; you `for await...of` over them. Paginated APIs (list all fine-tuning jobs, all documents in a vector store) are also naturally async iterators — one page yielded at a time.

---

## 9. Streaming LLM tokens

Real LLM APIs can stream a completion **token by token** so a UI shows text as it's generated. On the wire this is Server-Sent Events or a chunked `ReadableStream`, but the JavaScript ergonomics come down to *consuming an async iterator*. We mock the server with an async generator that yields tokens with delays.

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mock streaming endpoint: yields one token at a time.
async function* streamCompletion(prompt) {
  const tokens = `Here is a streamed answer to: ${prompt}`.split(' ');
  for (const token of tokens) {
    await sleep(60);       // per-token latency
    yield token + ' ';
  }
}

// Consumer 1: for await...of — render as it arrives, and accumulate.
async function consume(prompt) {
  let full = '';
  for await (const token of streamCompletion(prompt)) {
    process.stdout.write(token); // the "typing" effect
    full += token;               // assemble the complete text
  }
  return full.trim();
}
```

You often also expose a **callback-per-token** interface (many SDKs do): call an `onToken` for each chunk and resolve when the stream ends.

```js
async function consumeWithCallback(prompt, onToken) {
  let full = '';
  for await (const token of streamCompletion(prompt)) {
    onToken(token); // caller decides what to do with each token
    full += token;
  }
  return full.trim();
}
```

Run both consumers:

```bash
node examples/mock-stream.js
```

The two things you almost always do while streaming: (1) render each token immediately for responsiveness, and (2) accumulate them so you have the full completion at the end (to store, to post-process, to log token counts).

> **🤖 AI/ML relevance:** Every chat UI you've used streams. On the server you frequently forward the model's token stream to the client (SSE) *and* accumulate the full text to persist to a database. Async generators make both trivial and let you stop early (break the loop) if the user cancels.

### 🎬 Real-life scenario: cancelling a stream when the user navigates away

A user starts a long generation, then clicks "stop." With `for await...of` you just `break`, and because generators are lazy, no further tokens are requested — the upstream call can be aborted.

```js
async function streamUntil(prompt, shouldStop) {
  let full = '';
  for await (const token of streamCompletion(prompt)) {
    if (shouldStop()) {
      console.log('\n[user cancelled]');
      break; // stop pulling tokens; generator suspends and is cleaned up
    }
    full += token;
  }
  return full.trim();
}
```

---

## 10. Retry with exponential backoff and jitter

LLM and embedding APIs return `429 Too Many Requests` and transient `5xx` errors constantly under load. The professional response is to **retry with exponential backoff and jitter**:

- **Exponential backoff:** wait `base * 2^attempt` — longer after each failure, giving the server room to recover.
- **Jitter:** add randomness so many clients don't all retry at the same instant (a "thundering herd").
- **A cap** on max retries (and optionally max delay) so you eventually give up.
- **Only retry retryable errors** — retry `429`/`5xx`/network, but never a `400 Bad Request`, which will fail identically forever.

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function retryWithBackoff(fn, { maxRetries = 5, baseDelayMs = 100, maxDelayMs = 5000 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (err) {
      const retryable = err.status === 429 || err.status >= 500 || err.status === undefined;
      if (!retryable || attempt >= maxRetries) throw err; // give up

      const backoff = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      const delay = Math.random() * backoff; // full jitter: [0, backoff]
      await sleep(delay);
      attempt += 1;
    }
  }
}
```

Run the full demo (flaky endpoint, non-retryable error, exhausted retries):

```bash
node examples/retry-backoff.js
```

> **🤖 AI/ML relevance:** Every serious LLM client wraps calls in retry-with-backoff. Provider SDKs do it internally, but the moment you add your own logic (custom endpoints, self-hosted models, embedding services) you must implement it yourself. Getting the "only retry retryable errors" rule wrong means you either hammer a server that's rejecting bad input, or you fail on transient blips you could have survived.

---

## 11. Concurrency limiting (the worker pool)

You have 500 documents to embed. Options:

- **Sequential** (`await` in a loop): safe, but painfully slow.
- **All at once** (`Promise.all` over 500): fast, but you'll hit rate limits, exhaust memory, and possibly get your key throttled.

The professional middle ground: keep exactly **N in flight at once**. This is a **concurrency limit**, implemented as a worker pool. A fixed number of workers each pull the next item off a shared queue until everything is processed.

```js
async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0; // shared cursor; single-threaded so no locks needed

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;            // claim the next item
      results[i] = await mapper(items[i], i); // results stay in input order
    }
  }

  const pool = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(pool); // wait for every worker to drain the queue
  return results;
}

// Usage: embed 500 docs, at most 5 concurrent requests.
// const vectors = await mapWithConcurrency(docs, 5, (doc) => embed(doc));
```

Why it works: each `worker` loops, grabbing `nextIndex++` and awaiting `mapper`. Because JavaScript is single-threaded, `nextIndex++` is atomic — no two workers ever grab the same index. Exactly `concurrency` workers run, so exactly that many calls are ever in flight. Results are written by index, so the output array matches input order.

Run the timing comparison (sequential vs concurrency=4):

```bash
node examples/concurrency-limit.js
```

> **🤖 AI/ML relevance:** This is the single most useful helper in an AI batch pipeline. Set concurrency to just under your provider's rate limit and you get maximum throughput without 429s. It's how you embed a million documents overnight without babysitting the job or blowing your budget on retries.

### 🎬 Real-life scenario: staying under a 60-requests-per-minute limit

Your embedding provider allows 60 requests/minute. Firing 500 at once gets you throttled within seconds. Capping concurrency at ~5 (roughly matching the sustainable rate) keeps you comfortably under the ceiling while still running 5x faster than sequential. Combine it with `retryWithBackoff` inside the mapper, and even the occasional 429 is absorbed gracefully:

```js
const vectors = await mapWithConcurrency(docs, 5, (doc) =>
  retryWithBackoff(() => embed(doc), { maxRetries: 4, baseDelayMs: 500 })
);
// Capped concurrency + per-item backoff = a batch job that just works.
```

---

## Common pitfalls

- **`await` in a loop over independent calls.** Turns parallel work into serial crawl. Use `Promise.all` (or `mapWithConcurrency` when you must cap it). See section 7.
- **Forgetting to `await` (or return) a promise.** `const x = mockLLMCall(...)` makes `x` a *pending promise*, not the value. `if (mockLLMCall())` is always truthy. Missing `await` on the last line of a function means callers can't catch its errors.
- **Not handling rejections.** An unhandled promise rejection crashes modern Node. Always `.catch` or wrap `await` in `try/catch`.
- **Assuming `setTimeout(fn, 0)` runs "immediately."** It's a macrotask; every pending microtask runs first. See section 2.
- **Mixing `await` with `.then` needlessly.** Pick one style per function for readability. `await` is usually clearer.
- **`Promise.all` when you meant `allSettled`.** One rejection throws away every other result. If partial success is acceptable, use `allSettled`.
- **Retrying non-retryable errors.** Retrying a `400`/`401`/`422` just wastes time and hammers the server — the input is bad and won't improve. Retry only `429`/`5xx`/network.
- **Retrying without jitter.** Synchronized retries create a thundering herd that re-triggers the very overload you're recovering from.
- **Unbounded concurrency.** `Promise.all` over thousands of items exhausts memory, sockets, and rate limits. Cap it.
- **Creating promises that never settle.** A `new Promise` whose `resolve`/`reject` is never called leaves an `await` hanging forever. Always guarantee one path settles it (a timeout helps).
- **`forEach` with an async callback.** `array.forEach(async () => await ...)` does **not** wait — `forEach` ignores the returned promises. Use `for...of` with `await`, or `Promise.all(array.map(...))`.

---

## Recap

- JavaScript is single-threaded; the **event loop** coordinates the call stack, microtasks, and macrotasks. Sync runs first, then all microtasks drain, then one macrotask, repeat.
- **Microtasks** (Promise callbacks, `await` continuations) always run before the next **macrotask** (`setTimeout`).
- **Callbacks** work but nest into callback hell; **promises** flatten async flows into chains with one `.catch`.
- A **promise** is a future value: pending → fulfilled/rejected, settled once. Chain with `.then`, handle errors with `.catch`, clean up with `.finally`.
- **`all`** = fail-fast batch, **`allSettled`** = every outcome, **`race`** = first to settle (timeouts), **`any`** = first success (redundant providers).
- **`async/await`** is sugar over promises; handle errors with `try/catch`.
- **Await sequentially only for dependent steps**; otherwise start everything and `Promise.all`.
- **`for await...of`** consumes **async iterators**; **`async function*`** produces them — the natural model for **streaming** tokens and paginated APIs.
- **Retry with exponential backoff + jitter** for `429`/`5xx`, and only for retryable errors.
- **`mapWithConcurrency`** caps in-flight work — the workhorse of AI batch jobs.

## Next

Continue to [`../05-modern-javascript/README.md`](../05-modern-javascript/README.md) to learn the modern ES2022+ features (destructuring, spread, optional chaining, modules, and more) that make all of this code cleaner.
