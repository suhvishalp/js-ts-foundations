# Module 12 — Exercises

Work through these in order — each builds toward a working semantic-search engine. Try every task before peeking at `solutions/`. All exercises are AI/ML-themed and runnable with `npx tsx`.

> Set up once: `npm init -y && npm pkg set type=module && npm install -D typescript tsx @types/node`. Some later tasks optionally use `npm install @xenova/transformers` or `npm install @tensorflow/tfjs`.

---

## Exercise 1 — Vector toolkit (warm-up)

**Scenario:** Before you can search anything, you need the four core operations as a reusable, well-typed module.

**Requirements:**
- Create `vec.ts` exporting `dot`, `magnitude`, `cosineSimilarity`, `euclideanDistance`, and `normalize`.
- Each function validates that inputs are the same length and throws a clear error otherwise.
- `cosineSimilarity` returns `0` (not `NaN`) when either vector has zero magnitude.
- Add a small self-test at the bottom (`if (import.meta.url === ...)`) that prints results for a few known cases.

**Hint:** Use `ArrayLike<number>` as the parameter type so the same functions work for both `number[]` and `Float32Array`.

---

## Exercise 2 — Prove cosine ignores magnitude

**Scenario:** A teammate insists cosine similarity and euclidean distance are "basically the same." Show them they're not.

**Requirements:**
- Take a base vector `v` and a scaled copy `10 * v` (same direction, 10× longer).
- Print the cosine similarity and euclidean distance between `v` and `10 * v`.
- Explain in a comment why cosine is `~1.0` while euclidean distance is large.

**Hint:** Cosine measures the angle only; scaling a vector doesn't change its direction.

---

## Exercise 3 — Top-K retriever

**Scenario:** You have a small corpus of documents with precomputed embeddings and need to return the K most relevant to a query vector.

**Requirements:**
- Define a `Doc` type (`id`, `text`, `embedding: number[]`) and a corpus of at least 6 hand-made docs.
- Implement `topK(query, corpus, k)` returning the K docs ranked by cosine similarity, each with its score.
- Query with a vector and print the ranked results with scores to 3 decimals.

**Hint:** Map each doc to `{ doc, score }`, sort descending by score, then `slice(0, k)`.

---

## Exercise 4 — Typed-array speedup

**Scenario:** Your retriever is slow at scale. Measure the difference typed arrays make.

**Requirements:**
- Build a corpus of 20,000 random 512-dim vectors twice: once as `number[][]`, once as `Float32Array[]`.
- Time a full pass of dot products against a query for each representation using `performance.now()`.
- Print both timings and the speedup ratio.

**Hint:** Warm up the JIT by running each timed block once *before* the measured run to get stable numbers.

---

## Exercise 5 — In-memory vector store with metadata filtering

**Scenario:** You're building multi-tenant search — each query must only see one customer's documents.

**Requirements:**
- Implement a generic `InMemoryVectorStore<M>` with `upsert(id, vector, metadata)`, `delete(id)`, and `query(vector, k, filter?)`.
- The optional `filter(metadata) => boolean` must run *before* scoring.
- Demonstrate: insert docs tagged with `{ tenant: "a" | "b" }`, then query with a filter so only tenant `"a"` results come back.

**Hint:** Store records in a `Map<string, ...>`; skip any record where `filter` returns false before computing similarity.

---

## Exercise 6 — Stable softmax

**Scenario:** A classifier is returning `NaN` probabilities on high-confidence inputs.

**Requirements:**
- Implement `softmaxNaive` and a stable `softmax` (subtract the max before exponentiating).
- Show that `softmaxNaive([1000, 1001, 1002])` returns `NaN`s while `softmax` returns a valid distribution.
- Assert that your stable softmax outputs sum to `~1.0`.

**Hint:** `Math.exp(x - max)` keeps the largest exponent at `exp(0) = 1`.

---

## Exercise 7 — Local embeddings with Transformers.js

**Scenario:** You want zero-cost, private embeddings for a prototype — no API key.

**Requirements:**
- Install `@xenova/transformers`.
- Load the `feature-extraction` pipeline with `Xenova/all-MiniLM-L6-v2`.
- Embed 4–5 short sentences (some about the same topic, some unrelated) with `{ pooling: 'mean', normalize: true }`.
- Print a cosine-similarity matrix and confirm same-topic sentences score higher.

**Hint:** The pipeline output's `.data` is a `Float32Array`; wrap with `Array.from(...)` to reuse your `vec.ts` functions.

---

## Exercise 8 — End-to-end local semantic search

**Scenario:** Tie it all together into a working search engine — no external services.

**Requirements:**
- Use Transformers.js (Exercise 7) to embed a corpus of ~8 short "documents."
- Store them in your `InMemoryVectorStore` (Exercise 5).
- Accept a query string, embed it with the *same* model, and print the top 3 matches with scores.
- Bonus: read the query from `process.argv[2]` so you can run `npx tsx search.ts "your query"`.

**Hint:** Embed the corpus once at startup; only the query gets embedded per search. Same model for both.

---

## Exercise 9 — Tiny TensorFlow.js model (stretch)

**Scenario:** Understand the train → predict loop by teaching a model a rule from examples.

**Requirements:**
- Install `@tensorflow/tfjs`.
- Build a one-dense-layer model and train it on data following `y = 3x + 2`.
- After training, predict `y` for `x = 10` (expected `~32`) and print the learned weight and bias.
- Dispose all tensors when done.

**Hint:** `model.getWeights()` returns the learned `[weight, bias]` tensors; `.dataSync()` reads their values.

---

## Exercise 10 — Token-budget chunker (stretch, bridges to Module 13)

**Scenario:** RAG needs documents split into chunks that fit a token budget.

**Requirements:**
- Write `chunkByTokens(text, maxTokens, overlap)` that splits text into chunks of at most `maxTokens` tokens, with `overlap` tokens repeated between consecutive chunks.
- Use a real tokenizer (`AutoTokenizer` from `@xenova/transformers`) or, if offline, approximate with `~4 chars/token` and note the approximation in a comment.
- Print each chunk and its token count; verify no chunk exceeds `maxTokens`.

**Hint:** Encode to token IDs, slide a window of `maxTokens` with step `maxTokens - overlap`, and decode each window back to text.
