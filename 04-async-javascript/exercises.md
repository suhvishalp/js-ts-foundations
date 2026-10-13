# Module 04 — Exercises: Asynchronous JavaScript

Work through these in order — each builds on the last. Everything is offline; mock any "API" with `setTimeout`. Test by running `node yourfile.js`.

A reusable mock you'll want in most exercises:

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mockLLMCall(prompt, { ms = 100, failRate = 0 } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failRate) reject(new Error(`API error for "${prompt}"`));
      else resolve(`Completion for "${prompt}"`);
    }, ms);
  });
}
```

Worked solutions for exercises 1, 3, 5, and 7 live in [`solutions/`](./solutions/).

---

## Exercise 1 — Predict the print order

**Scenario:** Before you write async code, you must be able to *read* it.

**Requirements:**
1. Write down (as a comment) the exact print order of this snippet, then run it to check.
   ```js
   console.log('a');
   setTimeout(() => console.log('b'), 0);
   Promise.resolve().then(() => console.log('c')).then(() => console.log('d'));
   queueMicrotask(() => console.log('e'));
   console.log('f');
   ```
2. Explain in one sentence per line *why* each lands where it does.

**Hint:** Sync first, then drain all microtasks (chained `.then`s queue their next link as they resolve), then the macrotask.

---

## Exercise 2 — Promisify a callback API

**Scenario:** You're handed an old callback-style function and want to use it with `async/await`.

```js
function fetchConfigCallback(key, cb) {
  setTimeout(() => {
    if (!key) cb(new Error('key required'));
    else cb(null, { key, value: `value-for-${key}` });
  }, 50);
}
```

**Requirements:**
1. Write `fetchConfig(key)` that returns a promise wrapping `fetchConfigCallback` (the Node error-first callback convention).
2. Use it with `await` inside a `try/catch`, showing both the success and the error case (call with a key and with `''`).

**Hint:** `return new Promise((resolve, reject) => fetchConfigCallback(key, (err, data) => err ? reject(err) : resolve(data)))`.

---

## Exercise 3 — Sequential vs parallel timing

**Scenario:** Prove to yourself how much parallelism matters.

**Requirements:**
1. Given `prompts = ['p1','p2','p3','p4','p5']` and `mockLLMCall(p, { ms: 200 })`, write `runSequential(prompts)` using `await` in a loop and time it with `Date.now()`.
2. Write `runParallel(prompts)` using `Promise.all` and time it.
3. Print both durations and the speedup factor.

**Hint:** Sequential ≈ 5 × 200ms ≈ 1000ms; parallel ≈ 200ms. Start all promises *before* awaiting for the parallel version.

---

## Exercise 4 — Batch embeddings with allSettled

**Scenario:** Embed 8 documents where each call fails ~30% of the time. You must keep every success and report every failure — the job must not abort.

**Requirements:**
1. Build 8 mock calls with `failRate: 0.3`.
2. Use `Promise.allSettled`. Partition results into `succeeded` and `failed`.
3. Print a summary like `embedded 6/8; 2 failed` and list the failed prompts.

**Hint:** `res.status === 'fulfilled'` → `res.value`; otherwise `res.reason`. `allSettled` never rejects, so no `try/catch` is needed around it.

---

## Exercise 5 — Add a timeout with Promise.race

**Scenario:** A call sometimes hangs. Guarantee it returns or fails within a bound.

**Requirements:**
1. Write `withTimeout(promise, ms)` that resolves/rejects with `promise` if it settles first, or rejects with a `TimeoutError` after `ms`.
2. Demonstrate a fast call (500ms limit over a 100ms call → succeeds) and a slow call (100ms limit over a 500ms call → times out).
3. Bonus: clear the timer when the underlying promise wins, so no timer leaks.

**Hint:** `Promise.race([promise, timeoutPromise])`. For the bonus, keep the `setTimeout` id and `clearTimeout` it in a `.finally` on the original promise.

---

## Exercise 6 — retryWithBackoff

**Scenario:** Wrap a flaky endpoint so transient failures are absorbed.

**Requirements:**
1. Implement `retryWithBackoff(fn, { maxRetries, baseDelayMs, maxDelayMs })`.
2. Use exponential backoff (`baseDelayMs * 2 ** attempt`) with full jitter (`Math.random() * backoff`), capped at `maxDelayMs`.
3. Only retry when `err.status` is `429`, `>= 500`, or `undefined`; give up otherwise and after `maxRetries`.
4. Demonstrate: an endpoint that fails 3 times then succeeds; a `400` that is not retried; retries exhausted.

**Hint:** A `while (true)` loop with `try { return await fn() } catch { ...decide... }`. Model errors with a class carrying a `.status`.

---

## Exercise 7 — mapWithConcurrency

**Scenario:** Embed 20 documents but never more than 4 requests in flight.

**Requirements:**
1. Implement `mapWithConcurrency(items, concurrency, mapper)` returning results **in input order**.
2. Never run more than `concurrency` mappers at once (a worker pool sharing a cursor).
3. Instrument it: track and print the maximum observed in-flight count to prove the cap holds.
4. Compare total time at concurrency 1, 4, and 20.

**Hint:** N workers each loop `while (nextIndex < items.length) { const i = nextIndex++; results[i] = await mapper(items[i], i); }`, then `await Promise.all(workers)`.

---

## Exercise 8 — Consume a mock token stream

**Scenario:** Build the client side of a streaming chat completion.

**Requirements:**
1. Write an async generator `streamCompletion(prompt)` that yields the words of a sentence with a ~50ms gap each.
2. Consume it with `for await...of`: render each token immediately (`process.stdout.write`) and accumulate the full text.
3. Provide a callback variant `onToken(token)` and count the tokens.
4. Return the assembled completion and assert it equals the original sentence.

**Hint:** `async function* () { for (const w of words) { await sleep(50); yield w + ' '; } }`.

---

## Exercise 9 — Cancellable stream

**Scenario:** The user clicks "stop" mid-generation.

**Requirements:**
1. Extend exercise 8's consumer to accept a `shouldStop()` predicate.
2. `break` out of the `for await...of` loop when it returns true, returning the partial text.
3. Simulate stopping after 3 tokens and show the partial result.

**Hint:** Check `shouldStop()` at the top of each loop iteration; `break` cleanly suspends the generator.

---

## Exercise 10 — Put it all together: a resilient RAG batch runner (capstone)

**Scenario:** Nightly job: for each of 15 user questions, run a mini RAG pipeline (embed → search → generate), but be fast, resilient, and rate-limit-aware.

**Requirements:**
1. Write `ragPipeline(question)` as three **sequential** dependent mock steps (each feeds the next).
2. Run all 15 questions through `mapWithConcurrency` with a cap of 3.
3. Wrap each pipeline step in `retryWithBackoff` (calls fail ~25% of the time).
4. Wrap each whole pipeline in `withTimeout` (from exercise 5) with a generous bound.
5. Collect results with `allSettled` semantics — report how many pipelines succeeded, how many failed, and why.

**Hint:** Compose the helpers you already built: `mapWithConcurrency(questions, 3, (q) => withTimeout(retryablePipeline(q), 8000))`, and have the mapper catch/record failures so one bad question never aborts the batch.
