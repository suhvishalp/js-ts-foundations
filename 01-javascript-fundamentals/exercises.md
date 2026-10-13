# Module 01 — Exercises

Do these in order — they get progressively harder. Try each yourself before peeking at [`solutions/`](solutions/). Several are tied to real AI/ML tasks.

---

### Exercise 1 — Variables and types
**Scenario:** Warm-up on declarations and `typeof`.

**Requirements:**
- Declare a `const` for a model name (string) and a `let` for a temperature (number).
- Reassign the temperature to a new value.
- Log each variable and its `typeof`.

**Hint:** `console.log(temperature, typeof temperature);`

---

### Exercise 2 — The float trap
**Scenario:** You're checking whether a probability distribution sums to 1.

**Requirements:**
- Compute `0.1 + 0.2` and show it does not strictly equal `0.3`.
- Write a `nearlyEqual(a, b, epsilon)` function that returns `true` when two numbers are within a tolerance.
- Use it to confirm `0.1 + 0.2` is "nearly" `0.3`.

**Hint:** `Math.abs(a - b) < epsilon`.

---

### Exercise 3 — Template-literal prompt builder
**Scenario:** You need a reusable RAG prompt.

**Requirements:**
- Write a function `buildRagPrompt(context, question)` that returns a multi-line prompt string.
- It should instruct the model to answer using only the provided context.

**Hint:** Use a backtick string with `${context}` and `${question}` on separate lines.

---

### Exercise 4 — Text normalizer (tokenizer-lite)
**Scenario:** Preprocess raw user text before matching.

**Requirements:**
- Write `normalize(text)` that trims, lowercases, and collapses to an array of words.
- `normalize("  Hello   AI World  ")` should return `["hello", "ai", "world"]`.

**Hint:** `.trim().toLowerCase().split(/\s+/)` — `\s+` splits on runs of whitespace. You can also `.split(" ").filter(w => w.length > 0)`.

---

### Exercise 5 — Confidence classifier
**Scenario:** Convert a numeric score into a human label.

**Requirements:**
- Write `classify(score)` returning `"high"` (>= 0.8), `"medium"` (>= 0.5), or `"low"`.
- Handle the edge case where `score` is exactly `0` (still "low", not treated as "missing").

**Hint:** Use `if/else if/else`, and note that `0` is falsy — don't rely on truthiness here.

---

### Exercise 6 — Safe field extraction
**Scenario:** Extract the assistant's reply from a possibly-incomplete API response.

**Requirements:**
- Given `response = { choices: [{ message: { content: "Hi!" } }] }`, extract the content safely.
- If any part is missing, return the empty string `""` instead of crashing.
- Test it with a fully-populated response AND with `response = {}`.

**Hint:** `response.choices?.[0]?.message?.content ?? ""`.

---

### Exercise 7 — Intent router
**Scenario:** Route a classified intent to a canned response.

**Requirements:**
- Write `route(intent)` using a `switch` for `"greeting"`, `"refund"`, `"cancel"`, with a `default` fallback.
- Each case returns an appropriate string.

**Hint:** Use `return` in each case (no `break` needed when you return).

---

### Exercise 8 — Batch iterator
**Scenario:** Process a dataset in fixed-size batches to respect a rate limit.

**Requirements:**
- Write `batchProcess(items, batchSize)` that logs each batch and returns the number of batches.
- `batchProcess(["a","b","c","d","e"], 2)` should produce 3 batches.

**Hint:** `for (let i = 0; i < items.length; i += batchSize)` and `items.slice(i, i + batchSize)`.

---

### Exercise 9 — Retry with a while loop
**Scenario:** Simulate retrying a flaky operation.

**Requirements:**
- Write `retry(succeedsOnAttempt, maxAttempts)` that loops until the attempt number equals `succeedsOnAttempt` or `maxAttempts` is exhausted.
- Return an object `{ success: boolean, attempts: number }`.

**Hint:** Use a `let attempts = 0;` counter and a `while` loop; increment inside.

---

### Exercise 10 — Mini cost calculator (capstone)
**Scenario:** Estimate the USD cost of an LLM call.

**Requirements:**
- Write `estimateCost({ promptTokens, completionTokens }, pricing)` where `pricing` has `inputPer1k` and `outputPer1k` rates (defaulting to sample values).
- Return the total cost, rounded to 6 decimal places (use `.toFixed(6)` and convert back with `Number(...)`).
- Guard against `NaN`: if any token count isn't a valid number, treat it as 0.

**Hint:** `Number.isNaN(x) ? 0 : x`, and cost = `(promptTokens/1000)*inputPer1k + (completionTokens/1000)*outputPer1k`.
