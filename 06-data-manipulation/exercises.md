# Module 06 — Exercises

Work top to bottom; they build in difficulty. Try each fully before peeking at `solutions/`. Run your code in Node (`node file.js`) or the browser console.

> Convention: each exercise says what to build, the requirements, and a hint. Several are explicitly AI/ML-flavored.

---

## Exercise 1 — Fahrenheit converter (map warm-up)

**Scenario:** You have an array of Celsius temperatures from a sensor log.

**Requirements:**
- Write `toFahrenheit(celsiusArray)` that returns a new array of Fahrenheit values (`c * 9/5 + 32`).
- Do not mutate the input.
- `toFahrenheit([0, 100, 37])` → `[32, 212, 98.6]`.

**Hint:** One `map` call. Confirm the original array is unchanged afterward.

---

## Exercise 2 — Clean a messy dataset (filter + map)

**Scenario:** Raw records for a text-classification dataset.

```js
const raw = [
  { text: "  Hello World  ", label: "greeting" },
  { text: "", label: "greeting" },
  { text: "Buy now!", label: null },
  { text: "Goodbye", label: "farewell" },
  { text: "   ", label: "farewell" },
];
```

**Requirements:**
- Write `clean(raw)` that: drops records whose trimmed `text` is empty, drops records with a missing `label` (null or undefined), and returns the survivors with `text` trimmed and lowercased.
- Result length should be 2.

**Hint:** `filter` twice (or with `&&`), then `map`. Use `r.label != null` to catch null *and* undefined.

---

## Exercise 3 — Dataset statistics in one pass (reduce)

**Scenario:** You need summary stats for a numeric feature column.

**Requirements:**
- Write `describe(values)` returning `{ count, sum, mean, min, max }`.
- Use a **single** `reduce` for count/sum/min/max, then derive `mean`.
- `describe([10, 20, 30, 40, 50])` → `{ count:5, sum:150, mean:30, min:10, max:50 }`.
- Return `{ count:0, sum:0, mean:0, min:null, max:null }` for an empty array.

**Hint:** Seed with `{ count:0, sum:0, min:Infinity, max:-Infinity }`. Handle the empty case before dividing.

---

## Exercise 4 — Word frequency map & top-k (reduce + sort + slice)

**Scenario:** Building vocabulary statistics for an NLP model.

**Requirements:**
- Write `wordFrequencies(text)` that lowercases, splits on whitespace, strips punctuation, and returns a `{ word: count }` object.
- Write `topK(freqMap, k)` returning the top `k` words as `[word, count]` pairs, highest count first.
- For `"the cat sat on the mat the cat ran"`, `topK(freq, 2)` → `[['the', 3], ['cat', 2]]`.

**Hint:** `reduce` for the map; `Object.entries(...).sort((a,b) => b[1]-a[1]).slice(0,k)` for top-k.

---

## Exercise 5 — Min-max & z-score normalization (AI/ML)

**Scenario:** Feature scaling before training.

**Requirements:**
- Write `minMax(values)` mapping values into `[0, 1]`.
- Write `zScore(values)` producing mean 0, std 1.
- Both must guard against divide-by-zero (constant arrays return all zeros).
- `minMax([10,20,30,40,50])` → `[0, 0.25, 0.5, 0.75, 1]`.

**Hint:** `Math.min(...values)` / `Math.max(...values)`. For z-score, compute mean, then variance via `reduce`, then `Math.sqrt`.

---

## Exercise 6 — Group and count by class (grouping, AI/ML)

**Scenario:** Check class balance before training a classifier.

```js
const dataset = [
  { text: "win money", label: "spam" },
  { text: "lunch?", label: "ham" },
  { text: "free prize", label: "spam" },
  { text: "meeting 3pm", label: "ham" },
  { text: "cheap meds", label: "spam" },
];
```

**Requirements:**
- Write `groupByLabel(rows)` → `{ spam: [...], ham: [...] }`.
- Write `classDistribution(rows)` → `{ spam: 3, ham: 2 }`.
- Bonus: return percentages as strings, e.g. `{ spam: "60%", ham: "40%" }`.

**Hint:** The `(groups[key] ??= []).push(item)` pattern, or `Object.groupBy`. For counts, reduce into `{ label: n }`.

---

## Exercise 7 — CSV parser to typed rows (parsing)

**Scenario:** Load a small dataset from a CSV string.

```js
const csv = `id,text,rating
1,Loved it,5
2,Awful,1
3,Fine,3`;
```

**Requirements:**
- Write `parseCsv(csv)` returning an array of row objects with `id` and `rating` as **numbers** and `text` as a string.
- Do not assume a fixed number of columns — read the header dynamically.
- `parseCsv(csv)[0]` → `{ id: 1, text: "Loved it", rating: 5 }`.

**Hint:** `split("\n")`, destructure `[header, ...lines]`, build objects with `Object.fromEntries(cols.map(...))`, then convert numeric fields.

---

## Exercise 8 — Tokenize & build a vocabulary (flatMap, AI/ML)

**Scenario:** Turn a corpus into a token-to-id mapping.

```js
const corpus = ["the cat sat", "the dog ran", "cat and dog"];
```

**Requirements:**
- Write `buildVocab(corpus, maxSize)` that tokenizes all documents, counts frequencies, keeps the `maxSize` most frequent tokens, and returns a `{ token: id }` object (ids `0..maxSize-1`, most frequent = 0).
- `buildVocab(corpus, 3)` should include the 3 most frequent tokens with ids 0, 1, 2.

**Hint:** `flatMap(doc => doc.split(" "))` to get one token stream, then frequency-map, sort, slice, and `map((.., id) => [token, id])` into `Object.fromEntries`.

---

## Exercise 9 — Batching for inference (Array.from / slicing, AI/ML)

**Scenario:** LLM/embedding APIs limit how many items you can send per request. You must split a big array into fixed-size batches.

**Requirements:**
- Write `batch(items, size)` returning an array of arrays, each of length `size` (last one may be shorter).
- `batch([1,2,3,4,5], 2)` → `[[1,2],[3,4],[5]]`.
- Bonus: write `batchStats(items, size)` returning `{ batches: n, lastBatchSize: m }`.

**Hint:** `Array.from({ length: Math.ceil(items.length/size) }, (_, i) => items.slice(i*size, i*size+size))`.

---

## Exercise 10 — Full mini pipeline (capstone, AI/ML)

**Scenario:** End-to-end prep of a review dataset for sentiment training.

```js
const rawCsv = `id,text,rating
1,"Absolutely love it",5
2,"",4
3,"Broke after a week",1
4,"Great value for money",5
5,"not bad",3`;
```

**Requirements:**
- Build `runPipeline(rawCsv)` that: **parses** the CSV → **cleans** (drop empty text, type-convert) → **transforms** (add `wordCount` and `sentiment` where rating ≥4 = positive, ≤2 = negative, else neutral) → **aggregates** into `{ count, sentimentDistribution, avgWordCount }`.
- Return the aggregate object; keep each stage a separate, named step.

**Hint:** Reuse your solutions from exercises 7, 2, and 3. Chain them. This mirrors the README's §14 pipeline.
