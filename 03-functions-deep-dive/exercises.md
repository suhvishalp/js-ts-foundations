# Module 03 — Exercises

Work through these in order — each builds on ideas from the last. Write your attempts in the `examples/` scratch area or a file of your own, then compare with the worked answers in `solutions/`. Solutions exist for exercises 1, 3, 5, and 7. Every exercise is runnable with `node yourfile.js`.

Aim to make your functions **pure** unless a task explicitly asks for state. Test your code by running it and comparing to the expected output in each task.

---

## Exercise 1 — Pure text normalizer (warm-up)

**Scenario:** Before embedding text, you must normalize it consistently so the same sentence always produces the same tokens across training and inference.

**Requirements:**
- Write a pure function `normalize(text)` that: trims whitespace, lowercases, collapses internal runs of whitespace into a single space, and removes punctuation (keep letters, numbers, and spaces).
- It must not mutate its input and must return the same output for the same input every time.
- `normalize("  The QUICK, brown  Fox!! ")` should return `"the quick brown fox"`.

**Hint:** Chain string methods and use a regex for punctuation (`/[^\w\s]/g`) and for whitespace collapsing (`/\s+/g`). Return a brand-new string; never assign to a property of an argument.

---

## Exercise 2 — Counter factory with reset

**Scenario:** You want to count how many documents you've processed, with the count kept private so no other code can corrupt it.

**Requirements:**
- Write `makeCounter(start = 0)` that returns an object `{ inc, dec, reset, value }` where each is a function.
- `inc()` increments and returns the new value; `dec()` decrements and returns it; `reset()` sets it back to `start` and returns it; `value()` returns the current count without changing it.
- The count must be private (not accessible except through those methods).

**Hint:** Use a closure. Declare `let count = start` inside `makeCounter` and return an object of functions that all close over `count`.

---

## Exercise 3 — Generic memoize for embeddings

**Scenario:** Embedding calls are expensive. Cache results by input so repeated inputs are free.

**Requirements:**
- Write `memoize(fn, keyFn)` that returns a memoized version of `fn`.
- `keyFn` (optional) maps the arguments to a cache key; default it to using the first argument as the key.
- Repeated calls with the same key must not re-invoke `fn`.
- Demonstrate it by wrapping a fake embedder that counts how many times it actually runs, and show the count stays low across repeated inputs.

**Hint:** Use a `Map` captured in a closure. Signature idea: `memoize(fn, keyFn = (...args) => args[0])`. Use rest params to accept any arity.

---

## Exercise 4 — Compose and pipe

**Scenario:** Your preprocessing is a series of small steps. You want to combine them into one function.

**Requirements:**
- Write `pipe(...fns)` that returns a function applying `fns` left-to-right (first function runs first).
- Write `compose(...fns)` that applies right-to-left (last function runs first).
- Build a preprocessing function from steps `lowercase`, `stripPunctuation`, `tokenize` using `pipe`, and confirm the order is correct.

**Hint:** `reduce` is your friend. For `pipe`: `(x) => fns.reduce((acc, fn) => fn(acc), x)`. For `compose`, use `reduceRight`.

---

## Exercise 5 — Curried, configurable tokenizer

**Scenario:** You need one tokenizer that can be configured once (lowercasing, min token length, keep-numbers) and then reused as a simple `text => tokens` function.

**Requirements:**
- Write `makeTokenizer(config)` that returns a function `(text) => tokens`.
- Support config keys: `lowercase` (boolean), `minLength` (number, drop shorter tokens), and `dropNumbers` (boolean, remove purely numeric tokens).
- Create two differently-configured tokenizers from the same factory and show they behave differently on the same input.

**Hint:** This is currying: `const makeTokenizer = (config) => (text) => { ... }`. Apply config-driven filters with `Array.prototype.filter`.

---

## Exercise 6 — Retry with backoff using a callback

**Scenario:** Calls to an embedding API sometimes fail. You want a helper that retries a callback a few times before giving up.

**Requirements:**
- Write `withRetries(fn, maxAttempts)` where `fn` is a callback that returns a value or throws.
- Call `fn`; if it throws, retry up to `maxAttempts` total attempts; if all fail, re-throw the last error.
- Return the successful value. Track and expose (via `console.log`) how many attempts it took.

**Hint:** Use a `for` loop from 1 to `maxAttempts` with `try/catch`. This is a synchronous version; the async one comes in Module 04.

---

## Exercise 7 — Recursive tree flattener (with depth guard)

**Scenario:** An agent returns a deeply nested tree of tool calls. You need a flat list of all node names, and you must not blow the stack on deep trees.

**Requirements:**
- Write a recursive `flattenNames(node)` that returns an array of all `name` values in a `{ name, children: [] }` tree (pre-order).
- Then write an iterative `flattenNamesIterative(root)` that produces the same result using an explicit stack.
- Show both return the same result on a sample tree.

**Hint:** Recursive version: start with `[node.name]` then concat the flattened children. Iterative version: push the root onto a stack, pop, record the name, push children (push in reverse to preserve pre-order).

---

## Exercise 8 — Partial application for a metrics logger

**Scenario:** Throughout a training run you log metrics that all share a run id and split name. You want to pre-fill those so call sites stay short.

**Requirements:**
- Write `logMetric(runId, split, name, value)` that returns a formatted string like `"[run=42][train] loss=0.5"`.
- Use `bind` (or a curried wrapper) to create `logTrain` with `runId=42` and `split="train"` pre-filled, so you only pass `name` and `value`.
- Demonstrate logging `loss` and `accuracy` with the pre-filled logger.

**Hint:** `const logTrain = logMetric.bind(null, 42, "train")`. Then `logTrain("loss", 0.5)`.

---

## Exercise 9 — Pure pipeline over a dataset (capstone)

**Scenario:** Put it all together. Given an array of raw records `{ id, text }`, produce cleaned, tokenized, embedded records — reproducibly and with caching.

**Requirements:**
- Compose `normalize` (from Ex. 1) and a tokenizer (from Ex. 5) into a `preprocess` function using `pipe` (from Ex. 4).
- Memoize a fake embedder (from Ex. 3) keyed on the normalized text.
- Map over the dataset to produce `{ id, tokens, embedding }` for each record without mutating the input array or its records.
- Run it twice on the same data and assert the outputs are deeply equal (reproducibility) and that the embedder ran fewer times the second pass due to caching.

**Hint:** Keep every step pure except the memoize cache. Use `JSON.stringify(a) === JSON.stringify(b)` for a quick deep-equality check. Build the memoized embedder once, outside the map.
