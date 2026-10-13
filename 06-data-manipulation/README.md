# Module 06 — Data Manipulation

> The single most-used skill in day-to-day AI/ML engineering isn't training models — it's **shaping data**. Reading rows, cleaning nulls, normalizing numbers, counting tokens, batching examples, reshaping JSON into training records. This module makes you fluent in JavaScript's array/data toolkit so that data wrangling becomes second nature.

## What you'll learn

- The core array transforms: `map`, `filter`, `reduce`, `forEach`
- Searching & testing: `find`, `findIndex`, `some`, `every`, `includes`
- Ordering data: `sort` (numeric, by key, stable, multi-key)
- Flattening & expanding: `flat`, `flatMap`
- **Chaining** transforms into readable pipelines
- Constructing arrays: `Array.from`, spread, `entries`, `keys`, `values`
- **Grouping** records (`Object.groupBy` and the reduce pattern)
- Building **frequency maps** (word counts, vocabularies)
- **Normalization** of numeric arrays (min-max, z-score)
- Working with **CSV-like row objects** and **JSON transformation**
- A complete worked **mini data pipeline**: parse → clean → transform → aggregate

## Prerequisites

Modules 01–05 (variables, objects, arrays, functions, closures, arrow functions, spread/rest, destructuring). If `const double = x => x * 2` and `const { a } = obj` look familiar, you're ready.

---

## 0. The mental model: data flows through transforms

Almost all data work in JS is a **pipeline**: you start with an array, and each step returns a *new* array (or a single value), which feeds the next step. The array methods we cover are mostly **immutable** — they don't change the original, they return something new. This matters enormously for ML data prep, where reproducibility and avoiding hidden mutation bugs is critical.

```js
const raw = [1, 2, 3, 4, 5];

const result = raw
  .filter(n => n % 2 === 1)   // keep odds  -> [1, 3, 5]
  .map(n => n * 10);          // scale       -> [10, 30, 50]

console.log(result); // [10, 30, 50]
console.log(raw);    // [1, 2, 3, 4, 5]  <- untouched!
```

`raw` is unchanged. Every step produced a brand-new array. Read that twice — it's the foundation of everything below.

> **🤖 AI/ML relevance:** A feature-engineering pipeline is *literally* a chain of these transforms: load rows → drop bad ones → extract features → normalize → batch. Keeping each step pure (no mutation) means you can re-run, cache, and reason about each stage independently — exactly what you want when a dataset misbehaves at 2am.

---

## 1. `forEach` — do something for each item (side effects)

`forEach` runs a function once per element. It returns `undefined` — you use it for **side effects** (logging, pushing to an external store), *not* for building a new array.

```js
const models = ["gpt", "claude", "gemini"];

models.forEach((name, index) => {
  console.log(`${index}: ${name}`);
});
// 0: gpt
// 1: claude
// 2: gemini
```

The callback receives `(element, index, array)`. Most of the time you only need the first one or two.

**When NOT to use it:** if you're building a new array, reach for `map`. A common beginner smell:

```js
// 🚩 Don't do this
const upper = [];
names.forEach(n => upper.push(n.toUpperCase()));

// ✅ Do this
const upper = names.map(n => n.toUpperCase());
```

> **🤖 AI/ML relevance:** `forEach` is fine for *emitting* things — writing each processed record to a file stream, or calling an embedding API for each chunk. But when transforming data in memory, `map` is clearer and composable.

---

## 2. `map` — transform every item

`map` takes each element, runs it through your function, and collects the results into a **new array of the same length**. It's the workhorse of data transformation.

```js
const celsius = [0, 20, 37, 100];
const fahrenheit = celsius.map(c => c * 9 / 5 + 32);
console.log(fahrenheit); // [32, 68, 98.6, 212]
```

Same length in, same length out. One input → one output, always.

### Mapping objects (the common real case)

Datasets are rarely plain numbers — they're arrays of objects (rows). `map` reshapes each row:

```js
const users = [
  { name: "Ada",  ageYears: 36 },
  { name: "Alan", ageYears: 41 },
];

// Add a derived field without mutating the originals
const withDecade = users.map(u => ({
  ...u,                          // copy existing fields
  decade: Math.floor(u.ageYears / 10) * 10,
}));

console.log(withDecade[0]); // { name: 'Ada', ageYears: 36, decade: 30 }
console.log(users[0]);      // { name: 'Ada', ageYears: 36 } <- unchanged
```

Note the `({ ... })` — the parentheses tell JS "this is an object literal I'm returning," not a function body block. Forgetting them is the #1 arrow-function gotcha.

### The index argument: turning data into examples

```js
const tokens = ["the", "cat", "sat"];
const indexed = tokens.map((tok, i) => ({ position: i, token: tok }));
console.log(indexed);
// [ {position:0, token:'the'}, {position:1, token:'cat'}, {position:2, token:'sat'} ]
```

> **🤖 AI/ML relevance:** `map` is how you turn raw records into **model inputs**. Converting `{question, answer}` rows into `{prompt: "Q: ...\nA:", completion: " ..."}` training examples, or turning documents into `{id, text, embedding}` objects, is a single `.map()` call.

### 🎬 Real-life scenario: building prompt payloads

You've fetched a list of support tickets and need to send each to an LLM for classification. The API wants a specific message shape.

```js
const tickets = [
  { id: 101, body: "My card was charged twice" },
  { id: 102, body: "How do I reset my password?" },
];

const requests = tickets.map(t => ({
  ticketId: t.id,
  messages: [
    { role: "system", content: "Classify this ticket into: billing, account, other." },
    { role: "user", content: t.body },
  ],
}));

console.log(requests[0].messages[1]); // { role: 'user', content: 'My card was charged twice' }
```

One `map`, and every ticket is now a ready-to-send request. That's the pattern you'll use constantly.

---

## 3. `filter` — keep only what matches

`filter` returns a **new array containing only the elements for which your function returns a truthy value**. The result is the same length *or shorter*.

```js
const scores = [0.91, 0.42, 0.88, 0.13, 0.76];
const confident = scores.filter(s => s >= 0.75);
console.log(confident); // [0.91, 0.88, 0.76]
```

### Filtering objects & cleaning data

```js
const rows = [
  { text: "hello world", label: "greeting" },
  { text: "",            label: "greeting" },   // empty!
  { text: "buy now",     label: null },          // missing label!
  { text: "goodbye",     label: "farewell" },
];

const clean = rows.filter(r => r.text.trim() !== "" && r.label != null);
console.log(clean.length); // 2
```

Notice `r.label != null` — the loose `!=` with `null` cleverly catches **both** `null` and `undefined` in one check. That's a legitimate, idiomatic use of loose equality (one of the very few).

### `filter` + `map` = the core of data cleaning

```js
const clean = rows
  .filter(r => r.text.trim() !== "" && r.label != null)   // drop bad rows
  .map(r => ({ ...r, text: r.text.toLowerCase() }));        // normalize good ones
```

> **🤖 AI/ML relevance:** Every real dataset is dirty — empty strings, nulls, duplicates, out-of-range values. `filter` is your first line of defense. Garbage in, garbage out: a model trained on unfiltered data learns your bugs.

### 🎬 Real-life scenario: quality-gating training data

You're building a fine-tuning dataset and only want examples that are long enough to be useful but short enough to fit the context window.

```js
const examples = [
  { prompt: "hi", completion: "hello" },                    // too short
  { prompt: "Summarize the following article...", completion: "The article argues..." },
  { prompt: "x".repeat(50000), completion: "..." },         // too long
];

const withinBudget = examples.filter(ex => {
  const total = ex.prompt.length + ex.completion.length;
  return total >= 20 && total <= 8000;
});

console.log(withinBudget.length); // 1
```

---

## 4. `reduce` — the universal fold (build intuition slowly)

`reduce` is the most powerful and most feared array method. It **collapses an array into a single value** — but that "single value" can be a number, a string, an object, or even another array. Once it clicks, you'll see it everywhere.

### The shape

```js
array.reduce((accumulator, currentItem) => newAccumulator, initialValue)
```

- `accumulator` — the running result carried from step to step
- `currentItem` — the current element
- you **return** the next accumulator
- `initialValue` — what the accumulator starts as (always provide it!)

### Step 1: summing (the "hello world" of reduce)

```js
const nums = [10, 20, 30, 40];

const total = nums.reduce((acc, n) => acc + n, 0);
console.log(total); // 100
```

Let's trace it by hand:

| Step | acc (start) | n  | returns |
|------|-------------|----|---------|
| 1    | 0           | 10 | 10      |
| 2    | 10          | 20 | 30      |
| 3    | 30          | 30 | 60      |
| 4    | 60          | 40 | 100     |

The final returned value (100) is the result. The `0` is where `acc` starts. **Always pass the initial value** — without it, `reduce` uses the first element as the seed, which breaks on empty arrays and is a common source of bugs.

### Step 2: reduce can build other things — max, min, count

```js
const nums = [3, 9, 1, 7, 4];

const max = nums.reduce((acc, n) => (n > acc ? n : acc), -Infinity);
console.log(max); // 9

// Counting items that pass a condition
const bigCount = nums.reduce((acc, n) => acc + (n > 4 ? 1 : 0), 0);
console.log(bigCount); // 2  (9 and 7)
```

### Step 3: reduce into an OBJECT (this is the big unlock)

The accumulator can be an object you gradually fill in. This is how you build lookups, counts, and groupings.

```js
const words = ["cat", "dog", "cat", "bird", "dog", "cat"];

const counts = words.reduce((acc, word) => {
  acc[word] = (acc[word] ?? 0) + 1;  // if unseen, start at 0, then +1
  return acc;                         // MUST return the accumulator!
}, {});

console.log(counts); // { cat: 3, dog: 2, bird: 1 }
```

Two things trip people up here:
1. **You must `return acc`** every iteration. Forgetting it makes `acc` become `undefined` on the next step.
2. `acc[word] ?? 0` uses the nullish coalescing operator to default first-time keys to `0`.

This exact pattern — the **frequency map** — is everywhere in NLP (see §11).

### Step 4: reduce into an ARRAY (when map/filter aren't enough)

Sometimes one input produces zero-or-many outputs and you want a single pass:

```js
const data = [1, 2, 3, 4];

// Keep evens AND double them, in one pass
const result = data.reduce((acc, n) => {
  if (n % 2 === 0) acc.push(n * 2);
  return acc;
}, []);

console.log(result); // [4, 8]
```

(Though `data.filter(n => n % 2 === 0).map(n => n * 2)` is clearer here — prefer readability; reach for reduce-into-array only when a single pass genuinely matters.)

> **🤖 AI/ML relevance:** `reduce` computes **dataset statistics** in one pass: sum, mean, min, max, variance, class distribution. It builds **vocabularies** (token → id maps), **confusion matrices**, and **aggregations by group**. When you need to summarize a whole dataset into one structure, reduce is the tool.

### 🎬 Real-life scenario: computing dataset statistics in one pass

You want mean, min, and max of model latencies to report SLA compliance — computed in a single traversal.

```js
const latenciesMs = [120, 340, 95, 610, 210];

const stats = latenciesMs.reduce(
  (acc, ms) => ({
    count: acc.count + 1,
    sum: acc.sum + ms,
    min: Math.min(acc.min, ms),
    max: Math.max(acc.max, ms),
  }),
  { count: 0, sum: 0, min: Infinity, max: -Infinity }
);

const mean = stats.sum / stats.count;
console.log({ ...stats, mean }); // { count:5, sum:1375, min:95, max:610, mean:275 }
```

---

## 5. Searching & testing: `find`, `findIndex`, `some`, `every`, `includes`

These answer questions about your data without transforming it.

```js
const models = [
  { name: "gpt-4",   contextWindow: 8192 },
  { name: "claude",  contextWindow: 200000 },
  { name: "gemini",  contextWindow: 32000 },
];

// find: first element matching a predicate (or undefined)
const big = models.find(m => m.contextWindow > 100000);
console.log(big.name); // "claude"

// findIndex: its position (or -1)
console.log(models.findIndex(m => m.name === "gemini")); // 2

// some: does AT LEAST ONE match? -> boolean
console.log(models.some(m => m.contextWindow > 150000)); // true

// every: do ALL match? -> boolean
console.log(models.every(m => m.contextWindow >= 8000)); // true

// includes: is this exact value present? (primitives)
console.log([1, 2, 3].includes(2)); // true
```

- `find` vs `filter`: `find` returns **one element** (the first match) or `undefined`; `filter` returns **an array** of all matches. Use `find` when you expect one.
- `some`/`every` **short-circuit** — they stop as soon as the answer is known, so they're efficient on large arrays.

> **🤖 AI/ML relevance:** Use `every` to **validate a batch** before sending it (`batch.every(x => x.text.length > 0)`), `some` to detect if *any* record needs re-processing, and `find` to look up a token in a small vocabulary or a model in a registry.

---

## 6. `sort` — ordering data (and the classic gotcha)

`sort` **mutates the array in place** and returns it. That's a double surprise: it changes the original, *and* by default it sorts **as strings**.

```js
const nums = [10, 2, 100, 25];
console.log(nums.sort());          // [10, 100, 2, 25]  😱 string sort!
```

`"100" < "2"` because it compares character by character. **Always pass a comparator for numbers:**

```js
const nums = [10, 2, 100, 25];
console.log([...nums].sort((a, b) => a - b)); // [2, 10, 25, 100]  ascending
console.log([...nums].sort((a, b) => b - a)); // [100, 25, 10, 2]  descending
```

The comparator rule: return a **negative** number if `a` should come first, **positive** if `b` should, `0` if equal. `a - b` gives ascending; `b - a` gives descending.

Note the `[...nums]` — I spread into a fresh array first because `sort` mutates. If you don't want to disturb the original (usually you don't), copy first.

### Sorting objects by a key

```js
const results = [
  { doc: "A", score: 0.42 },
  { doc: "B", score: 0.91 },
  { doc: "C", score: 0.67 },
];

const ranked = [...results].sort((a, b) => b.score - a.score); // highest first
console.log(ranked.map(r => r.doc)); // ['B', 'C', 'A']
```

### Multi-key sort (tie-breaking)

```js
const people = [
  { last: "Smith", first: "Ann" },
  { last: "Adams", first: "Zoe" },
  { last: "Smith", first: "Al" },
];

const sorted = [...people].sort(
  (a, b) => a.last.localeCompare(b.last) || a.first.localeCompare(b.first)
);
// Sort by last name; if equal (|| 0), break ties by first name
console.log(sorted.map(p => `${p.first} ${p.last}`));
// ['Zoe Adams', 'Al Smith', 'Ann Smith']
```

`localeCompare` is the correct way to sort strings (handles accents, case, locale). The `||` chains comparators: if the first returns `0` (tie), fall through to the next.

> **🤖 AI/ML relevance:** Ranking is core to retrieval. After computing cosine similarity between a query and documents, you `sort((a,b) => b.score - a.score)` and take the **top-k** — that's the "R" in RAG. You'll also sort tokens by frequency when building a vocabulary.

### 🎬 Real-life scenario: top-k retrieval

```js
const scored = [
  { chunk: "Refunds take 5 days", sim: 0.31 },
  { chunk: "Cancel anytime in settings", sim: 0.88 },
  { chunk: "Our HQ is in Berlin", sim: 0.12 },
  { chunk: "Refund policy: 30 days", sim: 0.79 },
];

const k = 2;
const topK = [...scored].sort((a, b) => b.sim - a.sim).slice(0, k);
console.log(topK.map(x => x.chunk));
// ['Cancel anytime in settings', 'Refund policy: 30 days']
```

`sort` then `slice(0, k)` — the canonical top-k pattern.

---

## 7. `flat` and `flatMap` — flattening nested arrays

Data often comes nested: batches of batches, documents split into arrays of sentences. `flat` collapses one level of nesting.

```js
const batches = [[1, 2], [3, 4], [5]];
console.log(batches.flat());     // [1, 2, 3, 4, 5]

const deep = [1, [2, [3, [4]]]];
console.log(deep.flat(2));       // [1, 2, 3, [4]]  (2 levels)
console.log(deep.flat(Infinity));// [1, 2, 3, 4]     (all levels)
```

`flatMap` = `map` then `flat(1)`, in one efficient step. It shines when each element expands into *several*:

```js
const docs = ["hello world", "foo bar baz"];

// Split each doc into words, then flatten into one token stream
const tokens = docs.flatMap(doc => doc.split(" "));
console.log(tokens); // ['hello', 'world', 'foo', 'bar', 'baz']
```

Compare: `docs.map(d => d.split(" "))` gives `[['hello','world'], ['foo','bar','baz']]` — nested. `flatMap` flattens it in one go.

`flatMap` can also **filter** by returning an empty array to drop an item:

```js
const values = ["1", "oops", "3"];
const numbers = values.flatMap(v => {
  const n = Number(v);
  return Number.isNaN(n) ? [] : [n];  // [] drops it, [n] keeps it
});
console.log(numbers); // [1, 3]
```

> **🤖 AI/ML relevance:** `flatMap` is the natural tool for **tokenization** (each document → many tokens) and **chunking** (each document → many overlapping chunks) when building a RAG index. It also cleanly handles "produce-or-skip" logic in a single pass.

---

## 8. Chaining transforms into pipelines

The real power emerges when you chain. Read a chain **top to bottom** as a series of steps, each line doing one clear thing.

```js
const reviews = [
  { text: "Great product!!!", rating: 5 },
  { text: "meh",              rating: 3 },
  { text: "TERRIBLE, broke",  rating: 1 },
  { text: "",                 rating: 4 },
  { text: "Love it",          rating: 5 },
];

const positiveWords = reviews
  .filter(r => r.text.trim() !== "")        // 1. drop empty
  .filter(r => r.rating >= 4)                // 2. keep positive
  .map(r => r.text.toLowerCase())            // 3. normalize case
  .flatMap(t => t.replace(/[^a-z\s]/g, "").split(/\s+/)) // 4. tokenize, strip punctuation
  .filter(w => w.length > 0);                // 5. drop empties from split

console.log(positiveWords);
// ['great', 'product', 'love', 'it']
```

Each step is independently understandable. If the output is wrong, comment out the tail and inspect one stage at a time — pipelines are trivial to debug this way.

**Readability tip:** one operation per line, and name the variable after the *result*, not the process (`positiveWords`, not `processedData`).

> **🤖 AI/ML relevance:** This *is* a preprocessing pipeline. In Python you'd write pandas chains; in JS you write array chains. The discipline of "one transform per line, immutable steps" pays off when a pipeline grows to 15 stages.

---

## 9. Constructing arrays: `Array.from`, spread, `entries`, `keys`, `values`

### `Array.from` — build arrays from anything iterable, or from scratch

```js
// From a string
console.log(Array.from("abc")); // ['a', 'b', 'c']

// From a Set (dedupe pattern!)
const unique = Array.from(new Set([1, 1, 2, 3, 3]));
console.log(unique); // [1, 2, 3]

// With a map function (2nd arg) — generate a range
const range = Array.from({ length: 5 }, (_, i) => i);
console.log(range); // [0, 1, 2, 3, 4]

// Generate synthetic data
const points = Array.from({ length: 3 }, (_, i) => ({ x: i, y: i * i }));
console.log(points); // [ {x:0,y:0}, {x:1,y:1}, {x:2,y:4} ]
```

`Array.from({ length: n }, (_, i) => ...)` is the idiomatic JS "range" — memorize it. The `_` is a throwaway for the (undefined) element; `i` is the index.

### `entries`, `keys`, `values` — iterate with index cleanly

```js
const labels = ["cat", "dog", "bird"];

for (const [index, label] of labels.entries()) {
  console.log(index, label);
}
// 0 'cat'  /  1 'dog'  /  2 'bird'

// entries also builds a vocabulary (token -> id) in one line:
const vocab = Object.fromEntries(
  labels.map((label, id) => [label, id])
);
console.log(vocab); // { cat: 0, dog: 1, bird: 2 }
```

`Object.fromEntries` turns `[key, value]` pairs into an object — the inverse of `Object.entries`. Together they let you transform objects by round-tripping through arrays (see §13).

> **🤖 AI/ML relevance:** `Array.from({length: n}, ...)` generates synthetic datasets and batch indices. The `Set` → `Array` dedupe builds unique vocabularies. `entries` + `Object.fromEntries` is the two-line recipe for a **token-to-id mapping**, the backbone of any tokenizer.

---

## 10. Grouping records

Grouping — "split these rows into buckets by some key" — is one of the most common aggregation needs.

### The reduce-based pattern (works everywhere)

```js
const samples = [
  { label: "spam",  text: "win money now" },
  { label: "ham",   text: "meeting at 3" },
  { label: "spam",  text: "free prize" },
  { label: "ham",   text: "lunch?" },
];

const byLabel = samples.reduce((groups, s) => {
  (groups[s.label] ??= []).push(s);  // create bucket if missing, then push
  return groups;
}, {});

console.log(Object.keys(byLabel));      // ['spam', 'ham']
console.log(byLabel.spam.length);        // 2
```

`(groups[s.label] ??= [])` is a compact power move: the `??=` (nullish assignment) creates an empty array the first time it sees a label, and the whole expression evaluates to that array so you can `.push` onto it immediately.

### The modern way: `Object.groupBy` (Node 21+ / modern browsers)

```js
// Object.groupBy does exactly the above, built-in:
const byLabel = Object.groupBy(samples, s => s.label);
console.log(byLabel.spam.length); // 2
```

Cleaner, but check your runtime supports it (it's newer). The reduce pattern is the portable fallback.

### Counting per group (class distribution)

```js
const classCounts = samples.reduce((acc, s) => {
  acc[s.label] = (acc[s.label] ?? 0) + 1;
  return acc;
}, {});
console.log(classCounts); // { spam: 2, ham: 2 }
```

> **🤖 AI/ML relevance:** Checking **class balance** before training (`{spam: 2, ham: 2}`) tells you if your dataset is skewed — a skewed dataset produces a biased model. Grouping also powers **stratified splitting** (keeping class ratios equal across train/test) and per-category evaluation metrics.

### 🎬 Real-life scenario: detecting class imbalance

```js
const dataset = [
  { label: "positive" }, { label: "positive" }, { label: "positive" },
  { label: "positive" }, { label: "negative" },
];

const counts = Object.groupBy(dataset, d => d.label);
const distribution = Object.fromEntries(
  Object.entries(counts).map(([label, items]) => [label, items.length])
);
console.log(distribution); // { positive: 4, negative: 1 }

const total = dataset.length;
for (const [label, n] of Object.entries(distribution)) {
  console.log(`${label}: ${((n / total) * 100).toFixed(0)}%`);
}
// positive: 80%  <- imbalanced! model will be biased toward positive
// negative: 20%
```

---

## 11. Frequency maps & vocabularies (the NLP staple)

A **frequency map** counts occurrences. In NLP it's how you find common words, build vocabularies, and compute term statistics.

```js
const text = "the cat sat on the mat the cat ran";
const tokens = text.split(" ");

const freq = tokens.reduce((acc, tok) => {
  acc[tok] = (acc[tok] ?? 0) + 1;
  return acc;
}, {});
console.log(freq); // { the: 3, cat: 2, sat: 1, on: 1, mat: 1, ran: 1 }
```

### From frequencies to a ranked vocabulary

```js
// Sort by frequency (desc), keep top N, assign integer ids
const vocab = Object.entries(freq)                 // [['the',3], ['cat',2], ...]
  .sort((a, b) => b[1] - a[1])                      // by count, high to low
  .slice(0, 5)                                       // top 5
  .map(([token], id) => [token, id]);                // [token, newId]

const tokenToId = Object.fromEntries(vocab);
console.log(tokenToId); // { the: 0, cat: 1, sat: 2, on: 3, mat: 4 }
```

This is a miniature version of what real tokenizers do: count, rank, truncate to a vocab size, assign ids. Rare words get dropped (or mapped to an `<UNK>` token).

> **🤖 AI/ML relevance:** Vocabularies map text to the integer ids that models actually consume. Frequency maps also drive **TF (term frequency)** in TF-IDF, **stop-word detection** (very frequent words), and **rare-token filtering**. This handful of lines is the conceptual core of text preprocessing.

---

## 12. Normalizing numeric arrays (min-max & z-score)

Models train far better when numeric features are on comparable scales. A feature ranging 0–1,000,000 will dominate one ranging 0–1 unless you **normalize**. Two standard methods:

### Min-max scaling → maps values into [0, 1]

```js
function minMaxNormalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return values.map(() => 0); // avoid divide-by-zero
  return values.map(v => (v - min) / range);
}

console.log(minMaxNormalize([10, 20, 30, 40, 50]));
// [0, 0.25, 0.5, 0.75, 1]
```

The smallest value becomes 0, the largest becomes 1, everything else scales linearly between. Note the `range === 0` guard — if all values are identical, dividing would give `NaN`.

### Z-score standardization → mean 0, standard deviation 1

```js
function zScoreNormalize(values) {
  const n = values.length;
  const mean = values.reduce((a, v) => a + v, 0) / n;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  if (std === 0) return values.map(() => 0);
  return values.map(v => (v - mean) / std);
}

const z = zScoreNormalize([10, 20, 30, 40, 50]);
console.log(z.map(x => x.toFixed(2)));
// ['-1.41', '-0.71', '0.00', '0.71', '1.41']
```

Notice both use `reduce` for the aggregate (mean, variance) then `map` for the per-element transform — the two-phase pattern again.

**Which to use?** Min-max when you need a bounded range (e.g., image pixels → [0,1]). Z-score when data is roughly normal and you care about how many standard deviations from the mean a value is (most classic ML models prefer this).

> **🤖 AI/ML relevance:** Feature normalization is *mandatory* for most models — gradient descent converges slowly or not at all on unscaled features; distance-based methods (k-NN, k-means) are meaningless without it. **Critical rule:** compute the min/max/mean/std on your **training set only**, then apply those same stored parameters to the test set — otherwise you leak information from test into training.

---

## 13. CSV-like rows & JSON transformation

Real data arrives as CSV or JSON. Let's handle both.

### Parsing a simple CSV into row objects

```js
const csv = `name,age,city
Ada,36,London
Alan,41,Manchester
Grace,45,New York`;

const [header, ...lines] = csv.trim().split("\n");
const columns = header.split(",");

const rows = lines.map(line => {
  const cells = line.split(",");
  return Object.fromEntries(
    columns.map((col, i) => [col, cells[i]])
  );
});

console.log(rows[0]); // { name: 'Ada', age: '36', city: 'London' }
```

(For production CSVs with quoted fields and commas-in-values, use a library like `papaparse` — but understanding the manual version demystifies it.)

Note every value is a **string** — CSV has no types. Convert what you need:

```js
const typed = rows.map(r => ({ ...r, age: Number(r.age) }));
console.log(typed[0].age); // 36  (a number now)
```

### Transforming JSON: reshaping nested structures

```js
const apiResponse = {
  results: [
    { id: 1, attributes: { title: "A", tags: ["x", "y"] } },
    { id: 2, attributes: { title: "B", tags: ["y", "z"] } },
  ],
};

// Flatten into simple records
const flat = apiResponse.results.map(r => ({
  id: r.id,
  title: r.attributes.title,
  tagCount: r.attributes.tags.length,
}));
console.log(flat); // [ {id:1,title:'A',tagCount:2}, {id:2,title:'B',tagCount:2} ]

// Collect all unique tags across the response
const allTags = Array.from(
  new Set(apiResponse.results.flatMap(r => r.attributes.tags))
);
console.log(allTags); // ['x', 'y', 'z']
```

### Transforming an object's values (round-trip through entries)

```js
const prices = { apple: 1.2, banana: 0.5, cherry: 3.0 };

const withTax = Object.fromEntries(
  Object.entries(prices).map(([item, price]) => [item, +(price * 1.2).toFixed(2)])
);
console.log(withTax); // { apple: 1.44, banana: 0.6, cherry: 3.6 }
```

`Object.entries` → `map` → `Object.fromEntries` is the standard recipe for "map over an object's values." (The unary `+` converts the `.toFixed` string back to a number.)

> **🤖 AI/ML relevance:** LLM APIs return deeply nested JSON; you'll constantly reshape `response.choices[0].message.content` and friends into flat records. CSV parsing loads tabular datasets. And "map over object values" is how you scale every feature in a feature dict at once.

---

## 14. The mini data pipeline (putting it ALL together)

Here's a complete, realistic flow: **parse → clean → transform → aggregate**. Read it as one story.

```js
// Raw CSV of product reviews, straight from a file
const rawCsv = `id,text,rating
1,"Absolutely love it",5
2,"",4
3,"Broke after a week",1
4,"Great value for money",5
5,"not bad",3
6,"terrible terrible product",1`;

// ---- STEP 1: PARSE ---------------------------------------------------------
const [header, ...lines] = rawCsv.trim().split("\n");
const cols = header.split(",");
const parsed = lines.map(line => {
  // naive split is fine here (no commas inside our quoted fields)
  const cells = line.replace(/"/g, "").split(",");
  return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
});

// ---- STEP 2: CLEAN ---------------------------------------------------------
const cleaned = parsed
  .filter(r => r.text.trim() !== "")            // drop empty reviews
  .map(r => ({
    id: Number(r.id),
    text: r.text.toLowerCase().trim(),
    rating: Number(r.rating),
  }));

// ---- STEP 3: TRANSFORM (feature engineering) -------------------------------
const featured = cleaned.map(r => ({
  ...r,
  wordCount: r.text.split(/\s+/).length,
  sentiment: r.rating >= 4 ? "positive" : r.rating <= 2 ? "negative" : "neutral",
}));

// ---- STEP 4: AGGREGATE -----------------------------------------------------
const bySentiment = featured.reduce((acc, r) => {
  acc[r.sentiment] = (acc[r.sentiment] ?? 0) + 1;
  return acc;
}, {});

const avgWords =
  featured.reduce((a, r) => a + r.wordCount, 0) / featured.length;

console.log("Clean records:", featured.length);       // 5
console.log("Sentiment distribution:", bySentiment);  // { positive:2, negative:2, neutral:1 }
console.log("Avg word count:", avgWords.toFixed(1));  // 2.8
```

Every technique in this module appears here: split/parse, `filter` to clean, `map` for type conversion and feature engineering, `reduce` for aggregation. **This is what 80% of real ML data-prep code looks like.**

> **🤖 AI/ML relevance:** This exact skeleton — parse, clean, engineer features, aggregate/inspect — precedes *every* model training run. Before you train anything, you produce a clean dataset and a summary you trust. Mastering this pipeline is more valuable day-to-day than knowing any model architecture.

---

## Common pitfalls

- **Forgetting `return` in `reduce`.** The accumulator becomes `undefined` on the next step. If a reduce mysteriously breaks, check every code path returns `acc`.
- **`sort` mutates and sorts as strings.** Always `[...arr].sort((a,b) => a - b)` for numbers. Copy first if you need the original.
- **Forgetting the initial value in `reduce`.** `reduce(fn)` without a seed breaks on empty arrays and can start with the wrong type. Always pass it.
- **Arrow function returning an object needs parens.** `map(x => ({ ...x }))`, not `map(x => { ...x })` (the latter is a code block returning `undefined`).
- **`map` vs `forEach` confusion.** If you want a new array, use `map`. If you're doing side effects and pushing manually, you probably want `map`, `filter`, or `flatMap` instead.
- **Divide-by-zero in normalization.** Guard against `range === 0` (all values equal) and `std === 0` to avoid `NaN` poisoning your whole feature vector.
- **`NaN` propagation.** One bad `Number("abc")` → `NaN` spreads through sums and averages silently. Validate/filter with `Number.isNaN` early.
- **Data leakage in normalization.** Compute scaling stats on training data only; reuse them for test/inference. Re-fitting on test data inflates your metrics.
- **Chaining creates intermediate arrays.** For huge datasets, many chained passes cost memory/time. It's fine for typical sizes; for millions of rows consider a single `reduce` or a streaming approach.

---

## Recap

- `map` transforms (same length), `filter` selects (same-or-shorter), `reduce` folds to any single value — these three cover most needs.
- `forEach` is for side effects only; `find`/`some`/`every` answer questions without transforming.
- `sort` mutates and defaults to string order — always copy and pass a numeric comparator.
- `flat`/`flatMap` handle nesting; `flatMap` is perfect for tokenization and produce-or-skip logic.
- Chain transforms one-operation-per-line for readable, debuggable pipelines.
- `Array.from`, `Set`, `entries`, `Object.fromEntries` construct and reshape data structures.
- Grouping, frequency maps, and normalization are the recurring building blocks of ML data prep.
- The parse → clean → transform → aggregate pipeline is the shape of nearly all real data work.

## Next

Continue to **[Module 07 — TypeScript Fundamentals](../07-typescript-fundamentals/README.md)**, where we add a type system so these data pipelines catch bugs *before* they run — essential once your records get complex (LLM payloads, config, tool results).

Practice first: open [`exercises.md`](exercises.md) and work through the tasks. Solutions are in [`solutions/`](solutions/), runnable examples in [`examples/`](examples/).
