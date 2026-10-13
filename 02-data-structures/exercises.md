# Module 02 — Exercises

Progressively harder. Attempt each before checking [`solutions/`](solutions/). Many mirror real retrieval/embedding/config tasks.

---

### Exercise 1 — Array basics
**Scenario:** Manage a queue of pending prompts.

**Requirements:**
- Start with `["p1", "p2", "p3"]`.
- Add `"p4"` to the end and `"p0"` to the front.
- Remove and log the first item (as if you're about to process it).
- Log the final array and its length.

**Hint:** `push`, `unshift`, `shift`, `.length`.

---

### Exercise 2 — slice vs splice
**Scenario:** Demonstrate you understand the difference.

**Requirements:**
- Given `[10, 20, 30, 40, 50]`, use `slice` to get `[20, 30]` without changing the original.
- Then use `splice` to remove those same two elements, mutating the array.
- Log both results and the array state after each.

**Hint:** `slice(1, 3)` copies; `splice(1, 2)` removes in place.

---

### Exercise 3 — Top-k retrieval
**Scenario:** Rank retrieved chunks by similarity and take the best ones.

**Requirements:**
- Given an array of `{ id, score }` objects, write `topK(items, k)` returning the `k` highest-scoring items (as an array of ids), without mutating the input.
- Test with k=3.

**Hint:** Copy with `[...items]`, `.sort((a,b)=>b.score-a.score)`, `.slice(0,k)`, `.map(x=>x.id)`.

---

### Exercise 4 — Config merge
**Scenario:** Apply user overrides on top of default model settings.

**Requirements:**
- Write `resolveConfig(overrides)` that merges `overrides` onto defaults `{ model: "opus", temperature: 0.7, maxTokens: 512 }`.
- User overrides win. An override of `temperature: 0` must be respected (not treated as "missing").

**Hint:** `{ ...defaults, ...overrides }` — spread handles the `0` case correctly.

---

### Exercise 5 — Usage aggregator
**Scenario:** Sum token usage per model across many requests.

**Requirements:**
- Given an array of `{ model, inputTokens, outputTokens }`, return an object mapping each model to `{ input, output }` totals.

**Hint:** Loop, use `totals[model] ??= { input: 0, output: 0 }`, then `+=`.

---

### Exercise 6 — Deduplicate retrieved docs
**Scenario:** Merge results from multiple queries, removing duplicate document ids while keeping first occurrence.

**Requirements:**
- Write `dedupeById(items)` that returns items with unique `id`, preserving order.
- Also return the count of duplicates removed.

**Hint:** Use a `Set` to track seen ids.

---

### Exercise 7 — Build a vocabulary with Map
**Scenario:** Assign a unique integer id to each distinct token — a mini tokenizer vocabulary.

**Requirements:**
- Write `buildVocab(tokens)` returning a `Map` from token → id (ids assigned in first-seen order, starting at 0).
- Then write `encode(tokens, vocab)` returning an array of ids.

**Hint:** `if (!vocab.has(t)) vocab.set(t, vocab.size);`

---

### Exercise 8 — JSON round-trip with error handling
**Scenario:** Parse LLM output that is supposed to be JSON but might be malformed or fenced.

**Requirements:**
- Write `safeParseJson(text)` that strips ```` ```json ```` fences if present, then parses.
- Return the parsed object on success, or `null` on failure (no crash).
- Test with valid JSON, fenced JSON, and garbage.

**Hint:** Use `.replace(/```json|```/g, "").trim()` then `try { JSON.parse(...) } catch { return null; }`.

---

### Exercise 9 — Deep copy a nested config
**Scenario:** Generate independent configs for a temperature sweep.

**Requirements:**
- Given `base = { model: "opus", params: { temperature: 0.7, maxTokens: 512 } }`, produce configs for temperatures `[0, 0.5, 1]`.
- Mutating one config must NOT affect `base` or the others.
- Prove independence by asserting `base.params.temperature` is still `0.7` afterward.

**Hint:** `structuredClone(base)` per run.

---

### Exercise 10 — Cosine similarity with Float32Array (capstone)
**Scenario:** Implement the core operation of semantic search.

**Requirements:**
- Write `cosineSimilarity(a, b)` accepting two `Float32Array`s of equal length.
- Return the cosine similarity (dot product over the product of magnitudes).
- Then write `mostSimilar(query, docs)` returning the index of the doc most similar to `query`, where `docs` is an array of `Float32Array`s.

**Hint:** Loop once computing `dot`, `normA`, `normB`; then `dot / (Math.sqrt(normA) * Math.sqrt(normB))`. Track the max in `mostSimilar`.
