# Module 12 — AI/ML Foundations in JS/TS

> The building blocks under every LLM app: **vectors, embeddings, similarity, tensors, and running real models in JavaScript.** No calculus required — just arrays of numbers and the handful of operations you do to them.

Most "AI engineering" in JS/TS is not training neural networks. It is *plumbing*: turning text into vectors, comparing those vectors, storing them, and occasionally running a pre-trained model for inference. This module gives you the mechanical and conceptual fluency to do all of that from first principles — so that when you use a vector database or an embeddings API later, you know exactly what it is doing for you.

## What you'll learn

- What a **vector** and an **embedding** actually are, and how to represent them in JS (`number[]` vs `Float32Array`)
- **Vector math from scratch**: dot product, magnitude/norm, **cosine similarity**, and euclidean distance — implemented and explained
- Why **typed arrays** (`Float32Array`) matter for performance and memory
- How to **generate embeddings** from an API (provider-agnostic, with Voyage/OpenAI-shaped requests) and store them
- **Nearest-neighbor search**: brute-force top-K by cosine similarity over a corpus
- What a **vector database** is and why it exists — with a tiny in-memory implementation
- **Tensors** and **TensorFlow.js**: creating tensors, shapes, ops, and a tiny model
- **Transformers.js**: running a real Hugging Face model *locally* in JS (embeddings, sentiment, generation)
- **Tokenization**: what tokens are, why counts matter, and BPE at a high level
- **Numerical stability**: softmax overflow and normalization pitfalls

## Prerequisites

- Modules 01–06 (JS: arrays, functions, `map`/`reduce`, async, modules)
- Modules 07–09 (TypeScript: types, generics, interfaces)
- Module 10–11 (Node, `fetch`, calling APIs, env vars)
- Node.js 20+ with ESM (`"type": "module"` in `package.json`), and `tsx` or `ts-node` to run `.ts` files directly

```bash
# One-time setup for this module
npm init -y
npm pkg set type=module
npm install -D typescript tsx @types/node
# Optional (installed where each section calls for it):
#   npm install @xenova/transformers
#   npm install @tensorflow/tfjs
```

Run any example with: `npx tsx examples/cosine-similarity.ts`

---

## 1. Vectors and embeddings

A **vector** is just an ordered list of numbers. That's it. In math notation `[0.2, -1.1, 3.4]` is a 3-dimensional vector; in JavaScript it's a `number[]`.

An **embedding** is a vector that a model produces to represent the *meaning* of something — a word, a sentence, an image, a product. The model is trained so that things with similar meaning end up as vectors that point in similar directions. "dog" and "puppy" land close together; "dog" and "spreadsheet" land far apart.

```ts
// A hand-written embedding for intuition (real ones have 256–3072+ dimensions)
const dog: number[] = [0.9, 0.1, 0.0];
const puppy: number[] = [0.85, 0.15, 0.02];
const spreadsheet: number[] = [0.0, 0.05, 0.95];

console.log(dog.length); // 3  → "3-dimensional"
```

You cannot read meaning out of individual numbers — dimension 0 is not "dogginess." Meaning lives in the *geometry*: the relative positions and angles between vectors. Everything in this module is about measuring that geometry.

> **🤖 AI/ML relevance:** Embeddings are the universal adapter of AI apps. Search, recommendations, clustering, deduplication, classification, and Retrieval-Augmented Generation (Module 13) all reduce to: embed things → compare vectors. Master the comparison and you understand the machine.

### Representing vectors in JS: `number[]` vs `Float32Array`

You have two practical choices:

```ts
// Regular array of numbers — flexible, readable, but each number is a 64-bit float
// boxed inside a general-purpose JS array.
const a: number[] = [0.1, 0.2, 0.3];

// Typed array — a contiguous block of 32-bit floats. Half the memory,
// far more cache-friendly, and what most ML libraries actually hand you.
const b: Float32Array = new Float32Array([0.1, 0.2, 0.3]);

console.log(a[0], b[0]);       // 0.1 0.10000000149011612  ← 32-bit precision loss
console.log(b.byteLength);     // 12  → 3 values × 4 bytes
```

Note the `0.10000000149011612`: `Float32Array` stores 32-bit floats, so you lose precision versus a regular JS `number` (64-bit). For embeddings this is completely fine — the model's own noise dwarfs it — and you get big memory savings.

> **🤖 AI/ML relevance:** A single OpenAI `text-embedding-3-small` vector is 1536 dimensions. As `number[]`, that's ~1536 × 8 bytes ≈ 12 KB of payload plus array overhead. As `Float32Array`, it's exactly 6144 bytes. Across a million documents that's the difference between 6 GB and 12 GB in RAM. Typed arrays are not premature optimization here; they're table stakes.

### 🎬 Real-life scenario

You're building semantic search for a docs site with 50,000 pages. You embed each page once (offline), store the vectors, and at query time embed the user's search and find the closest pages. There is no "AI" at query time beyond one embedding call and a lot of vector comparisons. If those comparisons are slow or memory-hungry, your search feels broken. The rest of this module is the toolkit that makes that flow fast and correct.

---

## 2. Vector math from scratch

Four operations power almost everything. We'll implement each with TypeScript and explain what it *means*.

### 2.1 Dot product

The dot product multiplies two vectors element-by-element and sums the results. It's the workhorse — cosine similarity, projections, and neural network layers are all built on it.

```ts
/**
 * Dot product of two equal-length vectors.
 * Geometrically: how much the two vectors "agree" in direction and magnitude.
 * Larger positive => pointing the same way; negative => opposite ways; 0 => perpendicular.
 */
function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vectors must be same length: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

console.log(dot([1, 2, 3], [4, 5, 6])); // 1*4 + 2*5 + 3*6 = 32
```

We use an explicit `for` loop rather than `a.map(...).reduce(...)` on purpose: the loop allocates nothing and runs the same over `number[]` and `Float32Array`. In hot paths (millions of comparisons) that matters.

### 2.2 Magnitude (norm)

The magnitude (also called the L2 norm or length) is how "long" the vector is — the straight-line distance from the origin to the vector's tip. It's the square root of the dot product of a vector with itself.

```ts
/**
 * Euclidean length (L2 norm) of a vector: sqrt(x0^2 + x1^2 + ...).
 */
function magnitude(a: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * a[i];
  }
  return Math.sqrt(sum);
}

console.log(magnitude([3, 4]));    // 5  → the classic 3-4-5 triangle
console.log(magnitude([1, 1, 1])); // 1.7320508... = sqrt(3)
```

### 2.3 Cosine similarity — the one you'll use most

Cosine similarity measures the **angle** between two vectors, ignoring their length. It's the dot product divided by the product of the two magnitudes:

```
cos(θ) = (a · b) / (‖a‖ × ‖b‖)
```

The result ranges from **-1** (pointing opposite) through **0** (perpendicular / unrelated) to **1** (pointing the same direction / most similar).

```ts
/**
 * Cosine similarity: the cosine of the angle between two vectors.
 * Range: [-1, 1]. 1 = identical direction, 0 = unrelated, -1 = opposite.
 * We ignore magnitude on purpose — for text, direction carries the meaning.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) {
    // A zero vector has no direction; similarity is undefined. Return 0 rather than NaN.
    return 0;
  }
  return dot(a, b) / (magA * magB);
}

const dog = [0.9, 0.1, 0.0];
const puppy = [0.85, 0.15, 0.02];
const spreadsheet = [0.0, 0.05, 0.95];

console.log(cosineSimilarity(dog, puppy).toFixed(3));       // 0.997 → very similar
console.log(cosineSimilarity(dog, spreadsheet).toFixed(3)); // 0.058 → basically unrelated
```

**Why cosine and not raw distance?** Because for text embeddings, *direction* encodes meaning while *magnitude* often just reflects document length or emphasis. Two documents about dogs should score as similar whether one is a tweet and one is an essay. Cosine similarity throws away the length and keeps the meaning.

> **🤖 AI/ML relevance:** Cosine similarity is the default distance metric for text search in virtually every vector database (Pinecone, Weaviate, pgvector, Qdrant). When a RAG system "retrieves relevant chunks," it is ranking by cosine similarity. You just wrote the core of a search engine.

### 2.4 Euclidean distance

Euclidean distance is the straight-line ("as the crow flies") distance between the *tips* of two vectors. Unlike cosine, it cares about magnitude.

```ts
/**
 * Euclidean (L2) distance between two vectors: the length of (a - b).
 * Range: [0, ∞). 0 = identical. Smaller = closer.
 */
function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vectors must be same length");
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

console.log(euclideanDistance([0, 0], [3, 4])); // 5
console.log(euclideanDistance(dog, puppy).toFixed(3)); // 0.070 → close
```

**Cosine vs euclidean — how to choose:**

| | Cosine similarity | Euclidean distance |
|---|---|---|
| Measures | Angle (direction) | Straight-line gap (position) |
| Range | -1 → 1 (higher = closer) | 0 → ∞ (lower = closer) |
| Sensitive to magnitude? | No | Yes |
| Typical use | Text/semantic search | Coordinates, clustering, normalized vectors |

Handy fact: if all your vectors are **normalized** (magnitude 1), cosine similarity and euclidean distance rank things in the same order — so many databases normalize on ingest and then use whichever is faster.

```ts
/** Scale a vector to length 1 while keeping its direction. */
function normalize(a: number[]): number[] {
  const mag = magnitude(a);
  if (mag === 0) return a.slice();
  return a.map((x) => x / mag);
}

const n = normalize([3, 4]);
console.log(n, magnitude(n).toFixed(6)); // [0.6, 0.8] 1.000000
```

---

## 3. Why typed arrays matter

We touched on memory. There's also *speed*. Let's measure it honestly.

```ts
const DIM = 1536;
const COUNT = 20_000;

// Build a corpus two ways.
const plain: number[][] = [];
const typed: Float32Array[] = [];
for (let i = 0; i < COUNT; i++) {
  const row = new Float32Array(DIM);
  for (let j = 0; j < DIM; j++) row[j] = Math.random();
  typed.push(row);
  plain.push(Array.from(row));
}

// A dot product that works for both array kinds (ArrayLike<number>).
function dotFast(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

const q = typed[0];
const qPlain = plain[0];

let t = performance.now();
for (const v of plain) dotFast(qPlain, v);
console.log(`number[][]:      ${(performance.now() - t).toFixed(1)}ms`);

t = performance.now();
for (const v of typed) dotFast(q, v);
console.log(`Float32Array[]:  ${(performance.now() - t).toFixed(1)}ms`);
```

You'll typically see the typed-array pass run meaningfully faster (numbers vary by machine and JIT warmup), and it uses roughly half the memory. The reason: a `Float32Array` is a contiguous slab of raw floats the CPU can stream through its cache. A `number[]` is a JS array of boxed 64-bit values with pointer indirection and bounds/type checks.

> **🤖 AI/ML relevance:** Embeddings almost always arrive as arrays of numbers over JSON, which parse into `number[]`. For a small corpus, keep them as `number[]` — it's simpler. Once you're comparing against tens of thousands of vectors per query, convert to `Float32Array` on ingest. Better still: pack the whole corpus into **one** big `Float32Array` of `count × dim` and index by offset — that's what production vector stores do under the hood.

### 🎬 Real-life scenario

A recommendation endpoint must return "products similar to this one" in under 50ms across a 100k-item catalog. Naively storing `number[][]` and using `.map().reduce()` per comparison blows the budget and thrashes the garbage collector. Switching to a single flat `Float32Array` and a plain offset loop drops it to a few milliseconds — no external service, no GPU, just knowing your data structures.

---

## 4. Generating embeddings from an API

You rarely compute embeddings yourself — you call a model. The interfaces are near-identical across providers: POST some text, get back vectors. Keep the API key in an environment variable, never in code.

Here's a **provider-agnostic** shape. We use `fetch` (built into Node 20+) so there's no SDK dependency.

```ts
// examples/generate-embeddings.ts (illustrative — needs network + a real key)
interface EmbeddingResponse {
  data: { embedding: number[] }[];
}

/**
 * Generic embeddings client. The request/response shape below matches the
 * OpenAI embeddings endpoint, which Voyage, Together, and many others mirror.
 */
async function embed(
  texts: string[],
  opts: { url: string; apiKey: string; model: string },
): Promise<number[][]> {
  const res = await fetch(opts.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`, // key from env, never hard-coded
    },
    body: JSON.stringify({ model: opts.model, input: texts }),
  });

  if (!res.ok) {
    throw new Error(`Embedding request failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as EmbeddingResponse;
  return json.data.map((d) => d.embedding);
}

// Usage:
const vectors = await embed(["hello world", "goodbye world"], {
  url: "https://api.openai.com/v1/embeddings",
  apiKey: process.env.OPENAI_API_KEY!,
  model: "text-embedding-3-small",
});
console.log(vectors.length, vectors[0].length); // 2  1536
```

**Provider notes (all follow the same request/response contract):**

- **OpenAI** — `POST https://api.openai.com/v1/embeddings`, models like `text-embedding-3-small` (1536-dim) / `text-embedding-3-large` (3072-dim).
- **Voyage AI** — `POST https://api.voyageai.com/v1/embeddings`, models like `voyage-3` — popular for retrieval, strong quality-per-dollar.
- **Cohere** — `POST https://api.cohere.com/v2/embed`, with an `input_type` distinguishing search *documents* from search *queries* (a nice quality boost for RAG).

Practical rules regardless of provider:

- **Batch** your inputs. Send arrays, not one request per string — far fewer round trips.
- **Same model for indexing and querying.** Vectors from different models live in different spaces and are not comparable.
- **Store the model name** alongside the vectors so you know how they were made.
- **Respect rate limits.** Reuse the retry/backoff patterns from Modules 04 and 11.

### Storing embeddings

For a first project, JSON on disk is completely fine:

```ts
import { writeFile, readFile } from "node:fs/promises";

interface StoredDoc {
  id: string;
  text: string;
  embedding: number[];
  model: string; // record how the vector was produced
}

async function saveCorpus(path: string, docs: StoredDoc[]): Promise<void> {
  await writeFile(path, JSON.stringify(docs), "utf8");
}

async function loadCorpus(path: string): Promise<StoredDoc[]> {
  return JSON.parse(await readFile(path, "utf8")) as StoredDoc[];
}
```

> **🤖 AI/ML relevance:** Embedding is the expensive, rate-limited step. Do it **once**, offline, and persist the results. At query time you embed only the user's short query. Re-embedding your whole corpus on every request is the single most common (and expensive) beginner mistake.

---

## 5. Nearest-neighbor search (brute-force top-K)

"Find the K most similar documents to this query" is the beating heart of semantic search and RAG. The simplest correct approach is **brute force**: compare the query against every stored vector, then take the top K.

```ts
interface Doc {
  id: string;
  text: string;
  embedding: number[];
}

interface ScoredDoc {
  doc: Doc;
  score: number;
}

/**
 * Brute-force top-K nearest neighbours by cosine similarity.
 * O(n · d): n documents, d dimensions. Perfectly fine into the tens of thousands.
 */
function topK(query: number[], corpus: Doc[], k: number): ScoredDoc[] {
  const scored: ScoredDoc[] = corpus.map((doc) => ({
    doc,
    score: cosineSimilarity(query, doc.embedding),
  }));

  // Sort descending by score, then slice. For large k relative to n, a proper
  // heap is faster, but sort is clear and plenty fast for typical corpora.
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

// Toy corpus with hand-made 3-D "embeddings"
const corpus: Doc[] = [
  { id: "1", text: "The dog barked loudly",        embedding: [0.9, 0.1, 0.0] },
  { id: "2", text: "A puppy played in the yard",   embedding: [0.85, 0.15, 0.02] },
  { id: "3", text: "Quarterly revenue increased",  embedding: [0.0, 0.05, 0.95] },
  { id: "4", text: "The cat chased a mouse",       embedding: [0.7, 0.3, 0.05] },
];

const query = [0.88, 0.12, 0.01]; // "something about dogs"
for (const { doc, score } of topK(query, corpus, 2)) {
  console.log(score.toFixed(3), doc.text);
}
// 0.999  The dog barked loudly
// 0.997  A puppy played in the yard
```

**When brute force stops being enough:** at ~100k–1M+ vectors, scanning everything per query gets slow. That's when you reach for **Approximate Nearest Neighbor (ANN)** indexes — HNSW, IVF — which trade a tiny bit of accuracy for enormous speed. You don't implement those by hand; you use a vector database (next section). But brute force is exact, trivial to reason about, and the right default until you've measured a real problem.

> **🤖 AI/ML relevance:** This `topK` function *is* the retriever in "Retrieval-Augmented Generation." In Module 13 you'll drop it straight into a RAG pipeline: embed the question, `topK` over your chunks, stuff the winners into the prompt.

---

## 6. What a vector database is (and a tiny one)

A **vector database** is a specialized store built around one question: "given this vector, what are the nearest vectors?" It handles what you'd otherwise hand-roll:

- **Indexing** for fast approximate search (ANN) instead of scanning everything
- **Metadata filtering** — "nearest chunks *from this user's documents* written *after March*"
- **Persistence, scaling, and concurrency** — millions of vectors, many queries at once
- **CRUD** — insert, update, delete vectors as your data changes

Popular options: **pgvector** (a Postgres extension — great when you already run Postgres), **Pinecone** and **Weaviate** (managed), **Qdrant** and **Chroma** (open source). They all expose the same conceptual API: `upsert(id, vector, metadata)` and `query(vector, k, filter)`.

To demystify them, here's a tiny in-memory one that captures the essential interface (minus the fancy indexing):

```ts
interface VectorRecord<M> {
  id: string;
  vector: number[];
  metadata: M;
}

/** A minimal in-memory vector store — the conceptual core of a vector DB. */
class InMemoryVectorStore<M = Record<string, unknown>> {
  private records = new Map<string, VectorRecord<M>>();

  /** Insert or overwrite a vector by id. */
  upsert(id: string, vector: number[], metadata: M): void {
    this.records.set(id, { id, vector, metadata });
  }

  delete(id: string): void {
    this.records.delete(id);
  }

  get size(): number {
    return this.records.size;
  }

  /**
   * Nearest-neighbour query with optional metadata filtering.
   * `filter` runs BEFORE scoring, so we never waste work on excluded records.
   */
  query(
    vector: number[],
    k: number,
    filter?: (m: M) => boolean,
  ): { id: string; score: number; metadata: M }[] {
    const results: { id: string; score: number; metadata: M }[] = [];
    for (const rec of this.records.values()) {
      if (filter && !filter(rec.metadata)) continue;
      results.push({
        id: rec.id,
        score: cosineSimilarity(vector, rec.vector),
        metadata: rec.metadata,
      });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }
}

// Usage
const store = new InMemoryVectorStore<{ text: string; lang: string }>();
store.upsert("1", [0.9, 0.1, 0.0], { text: "The dog barked", lang: "en" });
store.upsert("2", [0.0, 0.1, 0.9], { text: "Los ingresos subieron", lang: "es" });

const hits = store.query([0.88, 0.12, 0.0], 5, (m) => m.lang === "en");
console.log(hits[0].metadata.text); // "The dog barked"
```

> **🤖 AI/ML relevance:** Understanding this tiny store means you can read the docs of any real vector DB and know exactly what `upsert` and `query` are doing. When you graduate to pgvector or Pinecone, you're swapping the *implementation* (persistence + ANN index), not the *concept*. Metadata filtering, in particular, is what makes multi-tenant RAG possible ("only search *this* customer's documents").

### 🎬 Real-life scenario

A support-bot startup ships v1 with the in-memory store above — a few thousand help-center articles, rebuilt on each deploy. It works and ships in a day. At 500k articles across paying customers, they migrate to pgvector for persistence and per-customer metadata filters. The retrieval *logic* — embed, query top-K, filter by tenant — never changed. Start simple; upgrade the storage engine when the data forces you to.

---

## 7. Tensors and TensorFlow.js

A **tensor** is a generalization of the numbers you already know:

- a **scalar** is a 0-D tensor (a single number),
- a **vector** is a 1-D tensor (`[1, 2, 3]`),
- a **matrix** is a 2-D tensor (rows × columns),
- and you keep going — a batch of RGB images is a 4-D tensor `[batch, height, width, channels]`.

Every tensor has a **shape** (the size along each dimension) and a **dtype** (float32, int32, …). Neural networks are just long chains of tensor operations.

`@tensorflow/tfjs` brings tensors and models to JavaScript, running on CPU, WebGL, or WASM.

```bash
npm install @tensorflow/tfjs
```

```ts
import * as tf from "@tensorflow/tfjs";

// Create tensors from JS arrays. The shape is inferred.
const scalar = tf.scalar(5);
const vector = tf.tensor1d([1, 2, 3]);
const matrix = tf.tensor2d([[1, 2], [3, 4]]);

console.log(matrix.shape); // [2, 2]
console.log(matrix.dtype); // "float32"

// Element-wise and matrix ops
const doubled = matrix.mul(2);
doubled.print();           // [[2, 4], [6, 8]]

const product = matrix.matMul(matrix); // real matrix multiplication
product.print();           // [[7, 10], [15, 22]]

// Tensors live in special memory (often GPU). Free them when done, or wrap
// work in tf.tidy() which disposes intermediates automatically.
scalar.dispose();
vector.dispose();
matrix.dispose();
doubled.dispose();
product.dispose();
```

### A tiny model: linear regression

Let's teach a one-neuron model the relationship `y = 2x - 1` purely from examples. This is the "hello world" of ML and shows the full train → predict loop.

```ts
import * as tf from "@tensorflow/tfjs";

async function main() {
  // A model with a single dense layer: one input, one output (y = w*x + b).
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

  // Configure how it learns: mean-squared-error loss, stochastic gradient descent.
  model.compile({ loss: "meanSquaredError", optimizer: tf.train.sgd(0.01) });

  // Training data for y = 2x - 1
  const xs = tf.tensor2d([-1, 0, 1, 2, 3, 4], [6, 1]);
  const ys = tf.tensor2d([-3, -1, 1, 3, 5, 7], [6, 1]);

  // Fit the model — it adjusts w and b to minimize the loss.
  await model.fit(xs, ys, { epochs: 200, verbose: 0 });

  // Predict for x = 10. The true answer is 2*10 - 1 = 19.
  const pred = model.predict(tf.tensor2d([10], [1, 1])) as tf.Tensor;
  pred.print(); // ~[[18.9...]]  → the model learned w≈2, b≈-1

  xs.dispose();
  ys.dispose();
  pred.dispose();
}

main();
```

What just happened: the model started with random `w` and `b`, made predictions, measured how wrong they were (the loss), and nudged the weights to reduce that error — repeated 200 times. That nudging is **gradient descent**, the engine behind essentially all modern ML.

> **🤖 AI/ML relevance:** You mostly won't *train* models in JS — that's Python/GPU territory. But **inference** in JS is everywhere: run a pre-trained pose detector, object detector, or toxicity classifier directly in the browser (privacy-preserving, no server round trip) or in Node. TF.js is how a web app runs ML without sending user data anywhere.

---

## 8. Transformers.js — real models, locally, in JavaScript

`@xenova/transformers` (also published as `@huggingface/transformers`) runs actual Hugging Face transformer models in JS via ONNX Runtime — **no Python, no server, no API key**. It downloads a model once (cached locally) and runs inference on your machine. The high-level `pipeline` API makes it a one-liner.

```bash
npm install @xenova/transformers
```

> The first run downloads model weights (tens to hundreds of MB) and caches them. Subsequent runs are offline and fast.

### Feature extraction (embeddings, computed locally)

```ts
import { pipeline } from "@xenova/transformers";

// Load a small, fast sentence-embedding model. `extractor` is reusable.
const extractor = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);

// `pooling: 'mean'` averages token vectors into one sentence vector;
// `normalize: true` scales it to length 1 (ideal for cosine similarity).
const output = await extractor("The dog barked loudly", {
  pooling: "mean",
  normalize: true,
});

const embedding = Array.from(output.data as Float32Array);
console.log(embedding.length); // 384  → a real 384-dim embedding, computed on your CPU
```

This is a genuine embedding — feed it straight into the `cosineSimilarity` and `topK` functions from earlier and you have a fully local semantic search with zero API cost. See `examples/transformers-embeddings.ts`.

### Sentiment classification

```ts
import { pipeline } from "@xenova/transformers";

const classifier = await pipeline("sentiment-analysis");

console.log(await classifier("I absolutely love this product!"));
// [{ label: 'POSITIVE', score: 0.9998 }]

console.log(await classifier("This was a complete waste of money."));
// [{ label: 'NEGATIVE', score: 0.9995 }]
```

### Text generation

```ts
import { pipeline } from "@xenova/transformers";

const generator = await pipeline("text-generation", "Xenova/distilgpt2");

const result = await generator("Once upon a time", { max_new_tokens: 20 });
console.log(result[0].generated_text);
```

> **🤖 AI/ML relevance:** Transformers.js unlocks patterns an API can't: **offline** apps, **zero-cost** embeddings for a prototype, **private** inference where data never leaves the device, and **browser** ML (a Chrome extension that classifies text on the page). The trade-off is model size and speed — a local MiniLM is far smaller and weaker than a hosted frontier model, but for embeddings, classification, and small tasks it's often more than enough. Knowing when a local model suffices versus when you need a hosted LLM (Module 13) is a core engineering judgment.

### 🎬 Real-life scenario

A note-taking app wants "find related notes" without shipping every note to a third-party API (privacy is the selling point). They embed notes on-device with `all-MiniLM-L6-v2` via Transformers.js, store the vectors locally, and run the same `topK` cosine search you wrote in Section 5. No servers, no per-query cost, no privacy review — the whole feature lives on the user's machine.

---

## 9. Tokenization basics

Models don't see characters or words — they see **tokens**: chunks of text mapped to integer IDs. Tokenization is the bridge between your strings and the model's math.

- A token is often a word, part of a word, or a punctuation mark.
- Common words are usually one token; rare words split into several.
- A rough English rule of thumb: **~4 characters ≈ 1 token**, or **~0.75 tokens per word**.

```ts
// A cartoon tokenizer for intuition only (real ones use a learned vocabulary).
const text = "Tokenization is important!";
const wordish = text.split(/(\s+|[.,!?])/).filter((s) => s.trim().length > 0);
console.log(wordish); // ['Tokenization', 'is', 'important', '!']
// A real BPE tokenizer might split "Tokenization" into ["Token", "ization"].
```

### Why token counts matter

1. **Cost** — API pricing is per token (input *and* output). Twice the tokens, twice the price.
2. **Context limits** — every model has a maximum context window (measured in tokens). Overflow it and the request fails or silently truncates.
3. **Latency** — more tokens means slower generation.

You'll manage token budgets constantly in Module 13 (context windows, chunking, cost control). Get counts from the tokenizer that matches your model — never guess by character count for anything that must be precise.

```ts
// Transformers.js exposes the real tokenizer for a model:
import { AutoTokenizer } from "@xenova/transformers";

const tokenizer = await AutoTokenizer.from_pretrained("Xenova/gpt2");
const encoded = tokenizer.encode("Tokenization is important!");
console.log(encoded);        // e.g. [ 30642, 1634, 318, 1593, 0 ]
console.log(encoded.length); // exact token count for THIS model
```

### BPE at a high level

Most modern tokenizers use **Byte Pair Encoding (BPE)**. The idea:

1. Start with individual characters (or bytes) as the vocabulary.
2. Repeatedly find the most frequent *adjacent pair* in the training corpus and merge it into a new token.
3. Stop at a target vocabulary size (e.g. 50,000).

The result: frequent sequences ("the", "ing", "tion") become single tokens, while rare words fall back to smaller pieces. This gives full coverage of *any* input (no "unknown word" failures) with a fixed, manageable vocabulary — the reason a model can handle text, code, emoji, and typos all at once.

> **🤖 AI/ML relevance:** Tokenization quirks bite you in practice. Non-English text and code often use *more* tokens per character than English prose (so they cost more and fill context faster). Whitespace and casing change token counts. When you build a RAG chunker (Module 13), you chunk by *tokens*, not characters, because the model's context limit is in tokens. Understanding BPE is why "count the characters and divide by 4" is only ever an estimate.

---

## 10. Numerical stability

When you do math on floats, some operations blow up. Two you'll meet constantly:

### Softmax overflow

**Softmax** turns a vector of arbitrary numbers ("logits") into a probability distribution (all positive, summing to 1). It's how models turn raw scores into "70% this class, 20% that class." The naive formula exponentiates each number:

```ts
// NAIVE softmax — numerically unstable!
function softmaxNaive(logits: number[]): number[] {
  const exps = logits.map((x) => Math.exp(x));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

console.log(softmaxNaive([1, 2, 3]));       // fine: [0.09, 0.24, 0.67]
console.log(softmaxNaive([1000, 1001, 1002])); // [NaN, NaN, NaN]  ❌
```

`Math.exp(1000)` is `Infinity`, and `Infinity / Infinity` is `NaN`. The fix is a classic trick: **subtract the maximum** before exponentiating. This shifts every input so the largest is 0, which mathematically produces the *identical* result (the shift cancels in the division) but keeps every `exp()` in a safe range.

```ts
/** Numerically stable softmax: subtract the max before exponentiating. */
function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - max)); // largest term is exp(0) = 1
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

console.log(softmax([1000, 1001, 1002]).map((p) => p.toFixed(3)));
// ['0.090', '0.245', '0.665']  ✅ same distribution, no NaN
```

### Normalization edge cases

You saw `normalize` guard against a zero-magnitude vector earlier — dividing by zero gives `Infinity`/`NaN` and poisons every downstream comparison. Always guard:

```ts
function safeNormalize(a: number[]): number[] {
  const mag = magnitude(a);
  if (mag === 0 || !Number.isFinite(mag)) return a.slice(); // don't divide by 0 / NaN
  return a.map((x) => x / mag);
}
```

Related gotchas:

- **Cosine similarity of a zero vector** is undefined — return 0, not `NaN` (we did this in Section 2.3).
- **Accumulated float error** — summing millions of tiny floats drifts. For extreme cases, compensated summation (Kahan) helps; for embeddings it rarely matters.
- **`Float32Array` precision** — a value like `0.1` isn't stored exactly. Never test embeddings for *exact* equality; compare with a tolerance (`Math.abs(a - b) < 1e-6`).

> **🤖 AI/ML relevance:** Softmax is inside every classifier and every language model's next-token step. You may not write it by hand often, but when a model or library returns `NaN` scores, "did something overflow, or did a zero vector sneak in?" is the first question — and now you can answer it.

---

## Common pitfalls

- **Mixing embedding models.** Vectors from `text-embedding-3-small` and `all-MiniLM-L6-v2` are not comparable — different dimensions, different spaces. Index and query with the *same* model, and store the model name.
- **Re-embedding on every query.** Embed the corpus once, offline, and persist. Only the short query gets embedded at request time.
- **Comparing different-length vectors.** Dimension mismatch is a bug, not a resize opportunity. Throw early (all our functions do).
- **Forgetting to normalize when a metric expects it.** Some libraries assume unit vectors. If results look wrong, check whether normalization is expected.
- **Dividing by zero magnitude.** Empty text or an all-zero vector → guard before you normalize or take cosine.
- **Estimating tokens by character count.** Fine for a ballpark; wrong for cost/limit-critical logic. Use the model's real tokenizer.
- **Leaking TF.js tensors.** Tensors don't get garbage-collected like normal objects — `dispose()` them or wrap work in `tf.tidy()`, or you'll leak memory (especially on WebGL).
- **`number[]` at scale.** Great for prototypes; switch to `Float32Array` (ideally one flat buffer) once you're scanning tens of thousands of vectors per query.
- **Trusting `Float32Array` for exact equality.** 32-bit precision means `arr[0] === 0.1` is false. Compare with a tolerance.

## Recap

- A **vector** is a list of numbers; an **embedding** is a vector that encodes meaning. Represent them as `number[]` (simple) or `Float32Array` (fast, compact).
- **Dot product, magnitude, cosine similarity, and euclidean distance** are the four core operations — and you implemented all of them. **Cosine similarity** is your default for text.
- **Typed arrays** cut memory in half and run faster; use them once your corpus grows.
- Generate embeddings via a provider-agnostic API, **batch** the calls, and **persist** the vectors with their model name.
- **Brute-force top-K by cosine similarity** is a complete retriever — the core of search and RAG.
- A **vector database** adds indexing, filtering, persistence, and scale to that same `upsert`/`query` idea; you built a tiny one.
- **Tensors** generalize scalars/vectors/matrices; **TensorFlow.js** runs (and can train) models in JS.
- **Transformers.js** runs real Hugging Face models locally — embeddings, classification, generation — with no API key.
- **Tokenization** (BPE) turns text into integer tokens; token counts drive cost, context limits, and latency.
- **Numerical stability** matters: stabilize softmax by subtracting the max, and guard against zero-magnitude vectors.

## Next

You now have the mathematical and mechanical foundation. In **[Module 13 — Building AI Applications](../13-building-ai-apps/README.md)** you'll put it to work: prompt engineering in code, structured output with Zod, tool use / function calling, agents, and a full **RAG pipeline** built directly on the `cosineSimilarity`, `topK`, and vector-store code from this module.

➡️ **[Module 13 — Building AI Applications](../13-building-ai-apps/README.md)**
