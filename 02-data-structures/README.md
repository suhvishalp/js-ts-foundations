# Module 02 — Data Structures

Data is the whole point of AI/ML, and data structures are how you hold it in memory. A dataset is an **array of objects**. An embedding is an **array of numbers** (or a `Float32Array`). A model config is an **object**. A vocabulary is a **Map**. Deduplicating retrieved chunks is a **Set**. Sending anything over the network means **JSON**.

This module makes all of that second nature. Keep a REPL open and run every block.

## What you'll learn
- **Arrays**: creation, indexing, mutation, `push/pop/shift/unshift/slice/splice`, `length`, and nested arrays as **matrices**
- **Objects**: literals, dot vs bracket access, nesting, dynamic/computed keys, shorthand
- **`Map`** and **`Set`**: what they are and when to reach for them over objects/arrays
- Iterating arrays, objects, Maps, and Sets
- **`JSON.parse`** / **`JSON.stringify`** — the language of APIs
- **Shallow vs deep copy**, and **`structuredClone`**
- **Typed arrays** (`Float32Array`, etc.) and why ML libraries use them

**Prerequisites:** [Module 01 — JavaScript Fundamentals](../01-javascript-fundamentals/README.md). You're comfortable with variables, types, loops, and functions.

---

## 1. Arrays

An **array** is an ordered, indexed list of values. Indices start at `0`. Arrays can hold any mix of types, but in practice you keep them homogeneous (all numbers, all objects, etc.).

```js
const scores = [0.9, 0.4, 0.7];
const empty = [];
const mixed = [1, "two", true, null]; // legal, but usually avoid mixing

console.log(scores[0]);          // 0.9  (first element)
console.log(scores[2]);          // 0.7  (third element)
console.log(scores[99]);         // undefined (no such index — no crash)
console.log(scores.length);      // 3
console.log(scores.at(-1));      // 0.7  (.at supports negative indexing)
```

### Mutating arrays: the core methods

Arrays are **mutable** — these methods change the array in place.

```js
const q = ["a", "b", "c"];

q.push("d");     // add to END          → ["a","b","c","d"]  returns new length
q.pop();         // remove from END     → ["a","b","c"]      returns "d"
q.unshift("z");  // add to START        → ["z","a","b","c"]  returns new length
q.shift();       // remove from START   → ["a","b","c"]      returns "z"
console.log(q);  // ["a","b","c"]
```

Think of it as a mnemonic: **push/pop** work on the back, **shift/unshift** work on the front.

### `slice` vs `splice` (know the difference!)

- **`slice(start, end)`** — returns a *copy* of a section. **Does not mutate.** `end` is exclusive.
- **`splice(start, deleteCount, ...items)`** — **mutates**: removes and/or inserts elements in place.

```js
const nums = [10, 20, 30, 40, 50];

// slice: non-destructive copy
console.log(nums.slice(1, 3)); // [20, 30]  (indices 1 and 2)
console.log(nums.slice(-2));   // [40, 50]  (last two)
console.log(nums);             // [10,20,30,40,50] — unchanged

// splice: destructive edit
const removed = nums.splice(1, 2, 99); // remove 2 items at index 1, insert 99
console.log(removed);          // [20, 30]  (what was removed)
console.log(nums);             // [10, 99, 40, 50] — mutated!
```

A memory hook: **s**lice = **s**afe copy; **sp**lice = **sp**licing/surgery on the original.

### Other everyday array helpers

```js
const a = [3, 1, 2];
console.log(a.includes(2));       // true
console.log(a.indexOf(1));        // 1
console.log([...a].sort());       // [1,2,3]  (copy first — sort mutates!)
console.log(a.concat([4, 5]));    // [3,1,2,4,5]  (non-mutating join)
console.log([1, [2, [3]]].flat(2)); // [1,2,3]
console.log(Array.from("abc"));   // ['a','b','c']
console.log(Array(3).fill(0));    // [0,0,0]  (zero-init, handy for vectors)
```

> ⚠️ `.sort()` mutates **and** sorts as strings by default: `[10, 2, 1].sort()` gives `[1, 10, 2]`. For numbers, pass a comparator: `.sort((a, b) => a - b)`.

> **🤖 AI/ML relevance:** A dataset is an array of examples; a single embedding is an array of ~384–3072 numbers. `slice` grabs the top-k results (`ranked.slice(0, 5)`), `push` accumulates streamed tokens, and `Array(n).fill(0)` initializes a zero vector. Getting slice/splice right prevents accidentally corrupting your data.

### Nested arrays as matrices

A 2D array (array of arrays) is a **matrix** — the fundamental shape for a batch of embeddings, an attention map, or image pixel data.

```js
// A 2x3 matrix: 2 rows, 3 columns.
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
];

console.log(matrix[0]);       // [1, 2, 3]  — first row
console.log(matrix[1][2]);    // 6          — row 1, column 2
console.log(matrix.length);   // 2          — number of rows
console.log(matrix[0].length);// 3          — number of columns

// Iterate every cell:
for (const row of matrix) {
  for (const cell of row) {
    process.stdout.write(cell + " ");
  }
  console.log();
}
// 1 2 3
// 4 5 6
```

### 🎬 Real-life scenario

You retrieved 8 candidate chunks from a vector DB, each with a similarity score. You need the top 3.

```js
const candidates = [
  { id: "c1", score: 0.42 },
  { id: "c2", score: 0.91 },
  { id: "c3", score: 0.66 },
  { id: "c4", score: 0.88 },
];

const top3 = [...candidates]                 // copy so we don't mutate the source
  .sort((a, b) => b.score - a.score)         // highest score first
  .slice(0, 3);                              // take the top 3

console.log(top3.map((c) => c.id));          // [ 'c2', 'c4', 'c3' ]
```

> **🤖 AI/ML relevance:** This exact "sort by score, slice top-k" pattern is the heart of every retrieval/reranking step in a RAG system.

---

## 2. Objects

An **object** is an unordered collection of **key–value pairs** (also called properties). Keys are strings (or symbols); values are anything. Objects model "a thing with named attributes" — a config, an API payload, a data record.

```js
const config = {
  model: "claude-opus-4",
  temperature: 0.7,
  maxTokens: 1024,
  stream: false,
};

// Dot access (when you know the key name at write-time):
console.log(config.model);       // "claude-opus-4"

// Bracket access (when the key is dynamic or not a valid identifier):
const key = "temperature";
console.log(config[key]);        // 0.7
console.log(config["maxTokens"]);// 1024
```

### Dot vs bracket — when to use which

- **Dot** (`config.model`) is cleaner — use it when you know the key literally.
- **Bracket** (`config[key]`) is required when the key is stored in a variable, computed, or contains spaces/special characters.

```js
const stats = { "total tokens": 500 }; // key has a space
console.log(stats["total tokens"]);     // 500 — dot wouldn't work here
```

### Adding, updating, deleting

```js
const user = { name: "Ada" };
user.role = "admin";        // add
user.name = "Ada Lovelace"; // update
delete user.role;           // remove
console.log(user);          // { name: 'Ada Lovelace' }

console.log("name" in user);            // true  (does the key exist?)
console.log(user.email ?? "no email");  // "no email"
```

### Nesting

Real API payloads are deeply nested. Reach in with chained access — and use `?.` when a level might be missing (Module 01).

```js
const response = {
  id: "msg_123",
  usage: { input_tokens: 50, output_tokens: 120 },
  content: [{ type: "text", text: "Hello!" }],
};

console.log(response.usage.output_tokens);   // 120
console.log(response.content[0].text);        // "Hello!"
console.log(response.error?.message ?? "ok"); // "ok" — safe on missing key
```

### Shorthand and computed keys

Two modern conveniences you'll see everywhere:

```js
const model = "claude-opus-4";
const temperature = 0.7;

// Shorthand: { model: model } → { model }
const cfg = { model, temperature };
console.log(cfg); // { model: 'claude-opus-4', temperature: 0.7 }

// Computed keys: build the key name from an expression.
const metricName = "accuracy";
const results = {
  [metricName]: 0.94,
  [`${metricName}_stddev`]: 0.02,
};
console.log(results); // { accuracy: 0.94, accuracy_stddev: 0.02 }
```

### Useful `Object.*` helpers

```js
const usage = { promptTokens: 50, completionTokens: 120 };

console.log(Object.keys(usage));    // ['promptTokens', 'completionTokens']
console.log(Object.values(usage));  // [50, 120]
console.log(Object.entries(usage)); // [['promptTokens',50],['completionTokens',120]]

// Rebuild an object from entries (great for transforming):
const doubled = Object.fromEntries(
  Object.entries(usage).map(([k, v]) => [k, v * 2])
);
console.log(doubled); // { promptTokens: 100, completionTokens: 240 }

// Merge objects (later wins); also a shallow copy technique:
const defaults = { temperature: 0.7, model: "a" };
const merged = { ...defaults, temperature: 0.2 };
console.log(merged); // { temperature: 0.2, model: 'a' }

// True immutability (unlike const):
const frozen = Object.freeze({ locked: true });
frozen.locked = false;   // silently ignored (throws in strict mode)
console.log(frozen);     // { locked: true }
```

> **🤖 AI/ML relevance:** Config objects are how you parameterize model calls. `Object.entries` + `map` transforms hyperparameter grids. Merging with spread (`{ ...defaults, ...overrides }`) is the standard way to apply user options on top of sensible defaults — you'll write it in every API wrapper.

### 🎬 Real-life scenario

You're logging LLM usage per request to compute a daily bill. Each record is an object; you accumulate into a totals object with computed keys.

```js
const requests = [
  { model: "opus", inputTokens: 100, outputTokens: 300 },
  { model: "haiku", inputTokens: 500, outputTokens: 50 },
  { model: "opus", inputTokens: 200, outputTokens: 150 },
];

const totalsByModel = {};
for (const req of requests) {
  // Initialize the bucket the first time we see a model.
  totalsByModel[req.model] ??= { input: 0, output: 0 };
  totalsByModel[req.model].input += req.inputTokens;
  totalsByModel[req.model].output += req.outputTokens;
}

console.log(totalsByModel);
// { opus: { input: 300, output: 450 }, haiku: { input: 500, output: 50 } }
```

That `??=` is "assign only if currently null/undefined" — a clean way to lazily initialize buckets.

---

## 3. `Map` — a better key–value store

A **`Map`** is like an object, but purpose-built as a dictionary. Reach for it when:
- Keys aren't strings (they can be numbers, objects, anything).
- You add/remove keys frequently.
- You need reliable **insertion order** and a real `.size`.
- You want to avoid inherited-prototype key collisions (e.g. a key literally named `"toString"`).

```js
const cache = new Map();

cache.set("query:refund policy", [0.1, 0.2, 0.3]); // key → embedding
cache.set("query:shipping", [0.4, 0.5, 0.6]);

console.log(cache.get("query:refund policy")); // [0.1, 0.2, 0.3]
console.log(cache.has("query:shipping"));      // true
console.log(cache.size);                        // 2

cache.delete("query:shipping");
console.log(cache.size);                        // 1

// Iterate in insertion order:
for (const [key, value] of cache) {
  console.log(key, "→", value);
}
```

### Map vs Object — the decision

| Use a `Map` when... | Use an object when... |
|---------------------|-----------------------|
| Keys are dynamic/unknown or non-string | Keys are a fixed, known set |
| You add/remove entries often | The shape is a fixed "record" |
| You need `.size` and clean iteration | You want JSON serialization (Maps don't `JSON.stringify` naturally) |
| You want no prototype surprises | You want simple literal syntax |

> **🤖 AI/ML relevance:** A `Map` is the natural structure for a **vocabulary** (token → id), an **embedding cache** (query text → vector, so you don't pay to recompute), or **memoizing** expensive tool calls in an agent. Its non-string keys also let you key a cache by an object reference.

---

## 4. `Set` — a collection of unique values

A **`Set`** stores unique values — duplicates are automatically ignored. Perfect for deduplication and fast membership tests.

```js
const tags = new Set();
tags.add("nlp");
tags.add("rag");
tags.add("nlp");   // ignored — already present
console.log(tags.size);          // 2
console.log(tags.has("rag"));    // true

// Deduplicate an array in one line:
const ids = ["c1", "c2", "c1", "c3", "c2"];
const unique = [...new Set(ids)];
console.log(unique);             // ['c1', 'c2', 'c3']

// Set operations (via arrays):
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);
const intersection = [...a].filter((x) => b.has(x)); // [2, 3]
const union = [...new Set([...a, ...b])];            // [1, 2, 3, 4]
console.log(intersection, union);
```

> **🤖 AI/ML relevance:** After retrieving chunks from multiple sub-queries, you often get duplicate document IDs — dedupe with a `Set` before building the prompt so you don't waste tokens sending the same context twice. Sets also power "have I already seen this URL?" checks in a crawler feeding a training set.

### 🎬 Real-life scenario

Your agent ran three retrieval queries and merged the results. You must dedupe by document ID while keeping the first (highest-ranked) occurrence.

```js
const retrieved = [
  { id: "doc-7", text: "..." },
  { id: "doc-2", text: "..." },
  { id: "doc-7", text: "..." }, // duplicate
  { id: "doc-9", text: "..." },
];

const seen = new Set();
const deduped = [];
for (const item of retrieved) {
  if (!seen.has(item.id)) {
    seen.add(item.id);
    deduped.push(item);
  }
}
console.log(deduped.map((d) => d.id)); // [ 'doc-7', 'doc-2', 'doc-9' ]
```

---

## 5. Iterating everything

A quick reference for looping over each structure:

```js
// Array — values
for (const v of [10, 20]) console.log(v);

// Object — keys/values/entries
const obj = { a: 1, b: 2 };
for (const k of Object.keys(obj)) console.log(k);          // 'a', 'b'
for (const [k, v] of Object.entries(obj)) console.log(k, v); // 'a' 1, 'b' 2

// Map — entries (destructured)
const m = new Map([["x", 1], ["y", 2]]);
for (const [k, v] of m) console.log(k, v);

// Set — values
for (const v of new Set([1, 2, 3])) console.log(v);
```

> Prefer `for...of` with `Object.entries()` over the older `for...in` for objects — it's clearer and avoids inherited-property surprises (Module 01 warning).

---

## 6. JSON — the language of APIs

**JSON** (JavaScript Object Notation) is a text format for data. Every LLM/API request and response, every config file, every log line crosses the wire as JSON. Two functions do all the work:

- **`JSON.stringify(value)`** — JS value → JSON string (to send/save).
- **`JSON.parse(text)`** — JSON string → JS value (to read).

```js
const payload = {
  model: "claude-opus-4",
  messages: [{ role: "user", content: "Hi" }],
  temperature: 0.7,
};

const asString = JSON.stringify(payload);
console.log(asString);
// {"model":"claude-opus-4","messages":[{"role":"user","content":"Hi"}],"temperature":0.7}

// Pretty-print with 2-space indentation (great for logs/debugging):
console.log(JSON.stringify(payload, null, 2));

// Parse a response body back into a usable object:
const raw = '{"usage":{"total_tokens":128},"ok":true}';
const parsed = JSON.parse(raw);
console.log(parsed.usage.total_tokens); // 128
```

### JSON's limits (know these)

JSON supports only: objects, arrays, strings, numbers, booleans, and `null`. It **cannot** represent:
- `undefined` (dropped from objects, becomes `null` in arrays)
- functions (dropped)
- `Map`, `Set` (become `{}` — you must convert manually)
- `BigInt` (throws!)
- `NaN` / `Infinity` (become `null`)
- Dates survive stringify (as ISO strings) but come back as **strings**, not `Date` objects.

```js
console.log(JSON.stringify({ a: undefined, b: () => 1, c: NaN }));
// {"c":null}   — a and b vanished, NaN became null

// Converting a Map for JSON:
const vocab = new Map([["hello", 1], ["world", 2]]);
console.log(JSON.stringify(Object.fromEntries(vocab)));
// {"hello":1,"world":2}
```

> ⚠️ **`JSON.parse` throws on invalid JSON.** LLMs asked to "return JSON" sometimes wrap it in markdown fences or add prose. Always wrap parsing in a `try/catch` (Module 04) and consider stripping ```` ```json ```` fences first.

> **🤖 AI/ML relevance:** This is the single most-used pair of functions in AI engineering. You `JSON.stringify` a request body, `fetch` it to the model, then `JSON.parse` the response. "Structured output" / "JSON mode" features make the model return JSON you parse into typed data. Handling malformed JSON gracefully is a real production skill.

---

## 7. Shallow vs deep copy

This is where subtle, painful bugs live. When you "copy" an object or array, do you copy the top level only (**shallow**) or everything, including nested structures (**deep**)?

### Shallow copy: spread `...` and `Object.assign`

These copy the **top level**. Nested objects/arrays are still **shared references**.

```js
const original = {
  model: "opus",
  params: { temperature: 0.7 }, // nested object
};

const shallow = { ...original };
shallow.model = "haiku";              // top-level change: safe, independent
shallow.params.temperature = 0.0;     // nested change: LEAKS back!

console.log(original.model);              // "opus"  ✅ unchanged
console.log(original.params.temperature); // 0.0     ❌ mutated the original!
```

The same trap applies to arrays of objects:

```js
const rows = [{ n: 1 }];
const copy = [...rows];
copy[0].n = 999;
console.log(rows[0].n); // 999 — shared nested object!
```

### Deep copy: `structuredClone`

`structuredClone` (built into modern Node and browsers) makes a fully independent copy, including nested structures, Maps, Sets, Dates, and typed arrays.

```js
const original2 = { params: { temperature: 0.7 }, tags: new Set(["a"]) };
const deep = structuredClone(original2);

deep.params.temperature = 0.0;
deep.tags.add("b");

console.log(original2.params.temperature); // 0.7 ✅ untouched
console.log([...original2.tags]);          // ['a'] ✅ untouched
```

The old trick `JSON.parse(JSON.stringify(obj))` also deep-copies, but it silently drops functions/`undefined`, mangles Dates into strings, and throws on `BigInt`. Prefer **`structuredClone`** unless you specifically want JSON's filtering.

> **🤖 AI/ML relevance:** Config templates are the classic bug source. You keep a `baseConfig`, then per-experiment you spread `{ ...baseConfig, temperature: t }`. If `baseConfig` has a nested `params` object, a shallow copy means every experiment mutates the same nested object — corrupting your whole hyperparameter sweep. Deep-clone when configs are nested.

### 🎬 Real-life scenario

Running a temperature sweep for an experiment. Each run needs its own independent config so results don't cross-contaminate.

```js
const baseConfig = {
  model: "claude-opus-4",
  params: { temperature: 0.7, maxTokens: 512 },
};

const runs = [0.0, 0.5, 1.0].map((t) => {
  const cfg = structuredClone(baseConfig); // deep copy — fully independent
  cfg.params.temperature = t;
  return cfg;
});

runs[0].params.temperature = 0.0;
console.log(baseConfig.params.temperature); // 0.7 — base is safe
console.log(runs.map((r) => r.params.temperature)); // [0, 0.5, 1]
```

---

## 8. Typed arrays (`Float32Array` and friends)

Regular JS arrays are flexible but heavy: each element is a boxed value that can be any type, and the array can grow/shrink. **Typed arrays** are fixed-length, contiguous blocks of memory holding one numeric type — exactly like arrays in C, NumPy, or a GPU buffer.

```js
// A 4-dimensional embedding as 32-bit floats.
const embedding = new Float32Array([0.12, -0.9, 0.44, 0.03]);

console.log(embedding.length);   // 4
console.log(embedding[0]);       // 0.11999999731779099 (32-bit precision!)
console.log(embedding instanceof Float32Array); // true

// Zero-initialized vector of length 8 (common when accumulating):
const zeros = new Float32Array(8);
console.log(zeros); // Float32Array(8) [0,0,0,0,0,0,0,0]

// You can iterate and map like a normal array:
const scaled = Float32Array.from(embedding, (x) => x * 2);
console.log([...scaled]);
```

Notice `0.12` came back as `0.11999999...` — a `Float32Array` stores 32-bit floats, which have less precision than JS's default 64-bit numbers. That's a deliberate trade: half the memory, and it's the precision most ML models actually use.

### The typed-array family

| Type | Holds | Common ML use |
|------|-------|---------------|
| `Float32Array` | 32-bit floats | Embeddings, tensors, model weights |
| `Float64Array` | 64-bit floats | High-precision numeric work |
| `Int32Array` | 32-bit integers | Token IDs, indices |
| `Uint8Array` | bytes (0–255) | Raw image pixels, binary data, file bytes |
| `Int8Array` / `Uint8ClampedArray` | 8-bit ints | Quantized weights, canvas pixels |

> **🤖 AI/ML relevance:** This is *why* they exist. ML libraries — TensorFlow.js, ONNX Runtime Web, Transformers.js — represent tensors as typed arrays because they map directly to GPU/WASM memory with no per-element boxing. When you get an embedding back from a local model, it's often a `Float32Array`. Understanding they're fixed-size, single-type, and lower-memory explains a lot of ML-library API design. Uint8Array is what you get when reading an image file or a binary model checkpoint.

### 🎬 Real-life scenario

You need cosine similarity between two embeddings stored as `Float32Array`s — the core operation of semantic search.

```js
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const query = new Float32Array([1, 0, 1]);
const docA = new Float32Array([1, 0, 1]); // identical direction
const docB = new Float32Array([0, 1, 0]); // orthogonal

console.log(cosineSimilarity(query, docA).toFixed(3)); // 1.000 (most similar)
console.log(cosineSimilarity(query, docB).toFixed(3)); // 0.000 (unrelated)
```

> Note the loop works identically on typed arrays and normal arrays — the algorithm doesn't change, only the storage does.

---

## Common pitfalls

- **`slice` vs `splice`.** `slice` copies (safe); `splice` mutates (surgery). Mixing them up corrupts data.
- **`.sort()` sorts as strings and mutates.** Use `[...arr].sort((a, b) => a - b)` for numbers on a copy.
- **Shallow copy leaking into nested data.** `{ ...obj }` and `[...arr]` copy one level only. Use `structuredClone` for nested structures.
- **`JSON.stringify` silently dropping data.** `undefined`, functions, `Map`/`Set` don't survive; `BigInt` throws; `NaN`/`Infinity` become `null`.
- **`JSON.parse` throwing on bad input.** Wrap it in `try/catch`, especially for LLM output.
- **Reaching into nested API data without `?.`.** One missing level throws `Cannot read properties of undefined`. Use optional chaining.
- **Using an object when you need a Map.** Dynamic keys, non-string keys, or frequent add/remove → reach for `Map`.
- **Forgetting typed arrays are fixed-length and single-type.** You can't `push` to a `Float32Array`; its size is set at creation.
- **Assuming `const` protects object contents.** It doesn't — use `Object.freeze()` if you need that.

---

## Recap

- **Arrays** are ordered, indexed, mutable lists. `push/pop` (back), `shift/unshift` (front), `slice` (copy), `splice` (mutate), `.at(-1)` (from end).
- **2D arrays are matrices** — the shape of embeddings batches and image data.
- **Objects** hold key–value pairs; use dot access for known keys, brackets for dynamic ones. Shorthand, computed keys, and `Object.keys/values/entries/fromEntries` are daily tools.
- **`Map`** is the right key–value store for dynamic, non-string, or frequently-changing keys (vocabularies, caches).
- **`Set`** stores unique values — one-line dedupe with `[...new Set(arr)]`.
- **JSON** is how data travels: `JSON.stringify` to send, `JSON.parse` to read. Know its limits and wrap parsing in `try/catch`.
- **Shallow copies** (`...`, `Object.assign`) share nested references; **`structuredClone`** deep-copies safely.
- **Typed arrays** (`Float32Array`, `Uint8Array`, ...) are fixed-size, single-type, low-memory numeric buffers — the native representation for embeddings, tensors, and binary data in ML libraries.

---

## Next

Continue to **[Module 03 — Functions Deep Dive](../03-functions-deep-dive/README.md)**, where you'll learn closures, higher-order functions, `this`, and the functional style that powers `map`/`filter`/`reduce` data pipelines.
