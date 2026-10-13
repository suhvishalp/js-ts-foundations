# Module 01 — JavaScript Fundamentals

This is the bedrock. Every RAG pipeline, every agent loop, every embedding transform is built out of the small pieces you learn here: values, variables, types, operators, control flow, and functions. Master these and the rest of the guide feels natural. Rush them and you'll fight subtle bugs forever.

We'll go slowly and explain the *why*, not just the *how*. Keep a `node` REPL open and type every example yourself.

## What you'll learn
- The difference between **values** and **variables**
- `let`, `const`, `var`, and **scope**
- The **primitive types**: string, number, bigint, boolean, null, undefined, symbol
- `typeof` and how JS thinks about types
- **Template literals** for building strings
- **Numbers and floating point** — and why `0.1 + 0.2 !== 0.3` (this matters in ML!)
- **Strings** and their most useful methods
- **Booleans**, and **truthy/falsy** values
- **Comparison**: `===` vs `==` (and why you almost always want `===`)
- **Operators** (arithmetic, logical, nullish)
- **Control flow**: `if/else`, `switch`, ternary
- **Loops**: `for`, `for...of`, `for...in`, `while`
- **Functions**: declarations, expressions, arrows, parameters, defaults, return

**Prerequisites:** [Module 00 — Setup](../00-setup/README.md). You can run `.js` files with `node` and use the REPL.

---

## 1. Values vs. variables

A **value** is a piece of data: the number `42`, the text `"hello"`, the boolean `true`. A **variable** is a *named box* that holds a value so you can refer to it later.

```js
// The value 42 exists on its own.
42;

// A variable named `score` holds the value 42.
const score = 42;
console.log(score); // 42
```

The `=` is the **assignment operator**: "put the value on the right into the box on the left." This is *not* mathematical equality (that's `===`, coming later).

> **🤖 AI/ML relevance:** When an LLM API returns `{ usage: { total_tokens: 128 } }`, the number `128` is a value; you'll store it in a variable like `const tokensUsed = response.usage.total_tokens;` to log costs or enforce budgets.

---

## 2. Declaring variables: `let`, `const`, `var`

There are three keywords to create variables. In modern JS you use **`const` by default** and **`let` when you must reassign**. You essentially never use **`var`** anymore, but you must recognize it in old code.

```js
const modelName = "claude-opus-4";  // can't be reassigned
let temperature = 0.7;              // can be reassigned
temperature = 0.2;                  // fine

// modelName = "gpt-4";            // ❌ TypeError: Assignment to constant variable
```

### `const` doesn't mean "frozen"

`const` prevents **reassignment of the variable**, not **mutation of the value**. Objects and arrays held by a `const` can still be changed internally:

```js
const config = { temperature: 0.7 };
config.temperature = 0.2;   // ✅ allowed — we mutated the object, not the binding
console.log(config);        // { temperature: 0.2 }

// config = {};             // ❌ not allowed — that's reassignment
```

This trips up almost every beginner. Remember: `const` locks the *box*, not the *contents*.

### Scope: where a variable is "visible"

**Scope** is the region of code where a variable can be used. `let` and `const` are **block-scoped** — they live only inside the nearest `{ }`. `var` is **function-scoped** and ignores blocks, which causes surprising bugs.

```js
{
  const secret = "only visible in here";
  console.log(secret); // works
}
// console.log(secret); // ❌ ReferenceError: secret is not defined

for (let i = 0; i < 3; i++) { /* i is fresh each iteration */ }
// console.log(i);      // ❌ i doesn't exist out here — good!

for (var j = 0; j < 3; j++) {}
console.log(j);          // 3 — var leaked out of the loop. Avoid this.
```

> **🤖 AI/ML relevance:** In an agent loop that retries failed tool calls, block scoping guarantees each attempt gets its own `attempt` counter and doesn't accidentally share state with the next iteration — the kind of subtle bug that makes agents behave nondeterministically.

### 🎬 Real-life scenario

You're building a chatbot backend. Configuration that never changes during a request (the model name, the system prompt) should be `const`. State that evolves (the running token count, the conversation array reference stays const but you `push` into it) uses `let` only where you truly reassign.

```js
const SYSTEM_PROMPT = "You are a helpful assistant.";
const MODEL = "claude-opus-4";
let totalTokens = 0;              // grows across turns → let

totalTokens += 128;               // after turn 1
totalTokens += 96;                // after turn 2
console.log(`Used ${totalTokens} tokens on model ${MODEL}.`);
// Used 224 tokens on model claude-opus-4.
```

---

## 3. The primitive types

JavaScript has **7 primitive types** — the atomic, immutable building blocks. Everything that isn't a primitive is an **object** (arrays, functions, `{}` — covered in Module 02).

| Type | Example | Notes |
|------|---------|-------|
| `string` | `"hello"`, `'hi'`, `` `yo` `` | Text |
| `number` | `42`, `3.14`, `-0`, `Infinity`, `NaN` | 64-bit float — the *only* everyday number type |
| `bigint` | `9007199254740993n` | Integers of arbitrary size (note the `n`) |
| `boolean` | `true`, `false` | Logic |
| `undefined` | `undefined` | "This variable has no value yet" |
| `null` | `null` | "Intentionally no value" |
| `symbol` | `Symbol("id")` | Unique identifiers (rare in day-to-day AI code) |

```js
const text = "embeddings";        // string
const count = 1536;               // number (a common embedding dimension!)
const huge = 9007199254740993n;   // bigint
const isReady = true;             // boolean
let notSetYet;                    // undefined (declared but not assigned)
const empty = null;               // null (deliberately empty)
const uniqueKey = Symbol("id");   // symbol
```

### `null` vs `undefined`

Both mean "no value," but by convention:
- `undefined` = "hasn't been set" (JS gives you this automatically).
- `null` = "explicitly set to nothing" (you choose this deliberately).

```js
let cache;                 // undefined — we never assigned it
console.log(cache);        // undefined

let result = null;         // null — we deliberately say "no result yet"
console.log(result);       // null
```

> **🤖 AI/ML relevance:** API responses are full of these. An optional field like `response.error` might be `null` (no error occurred) while a field you forgot to read is `undefined`. Confusing them causes `Cannot read properties of undefined` crashes — the most common JS error in production AI apps.

---

## 4. `typeof` — asking "what type is this?"

The `typeof` operator returns a string naming a value's type. Use it to inspect unknown data.

```js
console.log(typeof "hi");        // "string"
console.log(typeof 42);          // "number"
console.log(typeof 42n);         // "bigint"
console.log(typeof true);        // "boolean"
console.log(typeof undefined);   // "undefined"
console.log(typeof Symbol());    // "symbol"
console.log(typeof {});          // "object"
console.log(typeof [1, 2]);      // "object"  (arrays are objects!)
console.log(typeof function(){});// "function"

// The infamous historical bug that can never be fixed for compatibility:
console.log(typeof null);        // "object"  ⚠️ NOT "null"
```

That last line is a 25-year-old JavaScript quirk. To test for `null`, compare directly: `value === null`.

---

## 5. Template literals

Backtick strings let you **interpolate** values with `${...}` and span multiple lines. They're vastly better than `+` concatenation.

```js
const model = "claude-opus-4";
const tokens = 224;

// Old way (avoid):
const a = "Model " + model + " used " + tokens + " tokens.";

// Template literal (prefer):
const b = `Model ${model} used ${tokens} tokens.`;
console.log(b); // Model claude-opus-4 used 224 tokens.

// Multi-line and expressions work too:
const prompt = `You are a helpful assistant.
The user has used ${tokens} tokens (${tokens * 0.000003} USD so far).`;
console.log(prompt);
```

> **🤖 AI/ML relevance:** Prompt templates are *the* use case. You'll build prompts like `` `Summarize the following text in ${maxWords} words:\n\n${document}` `` constantly. Template literals keep them readable.

### 🎬 Real-life scenario

You're assembling a RAG prompt: retrieved context chunks plus the user's question. Template literals make the structure obvious at a glance.

```js
const question = "What is the refund window?";
const context = "Refunds are accepted within 30 days of purchase.";

const ragPrompt = `Answer the question using ONLY the context below.

Context:
${context}

Question: ${question}
Answer:`;

console.log(ragPrompt);
```

---

## 6. Numbers and floating point (crucial for ML)

JavaScript has **one** everyday number type: a 64-bit IEEE-754 floating-point number. That single design choice has huge consequences for anyone working with probabilities, scores, and embeddings.

```js
console.log(2 + 2);        // 4
console.log(7 / 2);        // 3.5   (no separate integer type)
console.log(2 ** 10);      // 1024  (** is exponentiation)
console.log(10 % 3);       // 1     (% is remainder/modulo)
```

### Why `0.1 + 0.2 !== 0.3`

Computers store numbers in **binary**. Just as `1/3` can't be written exactly in decimal (0.3333...), `0.1` and `0.2` can't be represented exactly in binary. The tiny rounding errors add up:

```js
console.log(0.1 + 0.2);            // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);    // false  😱
```

This is **not a JavaScript bug** — it's how nearly every language stores decimals (Python, Java, C all do this). The fix is to compare within a small tolerance (an "epsilon"):

```js
function nearlyEqual(a, b, epsilon = 1e-9) {
  return Math.abs(a - b) < epsilon;
}
console.log(nearlyEqual(0.1 + 0.2, 0.3)); // true
```

> **🤖 AI/ML relevance:** This is *everywhere* in ML. Softmax outputs, cosine similarities, and probability distributions are floats. If you ever write `if (probability === 0.5)` you'll get flaky behavior. Always compare floats with a tolerance, and be aware that a distribution that "should" sum to 1.0 might sum to `0.9999999999998`.

### Other number gotchas

```js
console.log(0.1 + 0.2);                        // 0.30000000000000004
console.log((0.1 + 0.2).toFixed(2));           // "0.30"  (string, rounded)
console.log(Number.MAX_SAFE_INTEGER);          // 9007199254740991
console.log(0.1 + 0.2 - 0.3);                  // 5.55e-17 (a whisker, not 0)

console.log(1 / 0);         // Infinity
console.log(-1 / 0);        // -Infinity
console.log(0 / 0);         // NaN ("Not a Number")
console.log(Number("abc")); // NaN
console.log(NaN === NaN);   // false! Use Number.isNaN(x) to test.
console.log(Number.isNaN(0 / 0)); // true
```

`NaN` is the trickiest: it's the result of invalid math, and it's the only value in JS **not equal to itself**. Always test with `Number.isNaN()`.

> **🤖 AI/ML relevance:** A single `NaN` sneaking into a vector (e.g. from dividing by a zero-norm) poisons every downstream calculation — a dot product with one `NaN` is `NaN`. Guarding against `NaN` early saves hours of debugging silent model failures.

### Useful `Math` helpers

```js
console.log(Math.max(0.2, 0.9, 0.5)); // 0.9  — pick the top score
console.log(Math.min(0.2, 0.9, 0.5)); // 0.2
console.log(Math.round(2.7));         // 3
console.log(Math.floor(2.7));         // 2
console.log(Math.ceil(2.1));          // 3
console.log(Math.abs(-5));            // 5
console.log(Math.sqrt(16));           // 4
console.log(Math.exp(1));             // 2.718...  (used in softmax!)
```

---

## 7. Strings and their methods

Strings are sequences of characters. They're **immutable** — methods return *new* strings rather than changing the original. Here are the ones you'll use constantly.

```js
const s = "  Hello, AI World!  ";

console.log(s.length);              // 19 (includes spaces)
console.log(s.trim());              // "Hello, AI World!"
console.log(s.toUpperCase());       // "  HELLO, AI WORLD!  "
console.log(s.toLowerCase());       // "  hello, ai world!  "
console.log(s.trim().slice(0, 5));  // "Hello"  (substring by index)
console.log(s.includes("AI"));      // true
console.log(s.indexOf("AI"));       // 9
console.log(s.replace("AI", "ML")); // "  Hello, ML World!  "
console.log(s.trim().split(", "));  // ["Hello", "AI World!"]
console.log("a,b,c".split(","));    // ["a", "b", "c"]
console.log(["a", "b"].join("-"));  // "a-b"
console.log("ab".repeat(3));        // "ababab"
console.log("hi".startsWith("h"));  // true
console.log("hi".endsWith("i"));    // true
console.log("hi".padStart(5, "*")); // "***hi"
```

`split` and `join` are two sides of the same coin and appear in almost every text pipeline.

> **🤖 AI/ML relevance:** Text preprocessing is the front door of every NLP/LLM task: `.trim()` to clean scraped data, `.toLowerCase()` to normalize before matching, `.split(" ")` for a crude word tokenizer, `.split("\n\n")` to break a document into paragraphs for chunking. You'll do this thousands of times.

### 🎬 Real-life scenario

You scraped web text and need to chunk it into paragraphs for embedding. A tiny bit of string work does the job:

```js
const rawDoc = "  Intro paragraph.\n\nSecond paragraph here.\n\n  Third.  ";

const chunks = rawDoc
  .split("\n\n")           // split on blank lines
  .map(chunk => chunk.trim()) // clean each chunk (map arrives fully in Module 02/03)
  .filter(chunk => chunk.length > 0); // drop empties

console.log(chunks);
// [ 'Intro paragraph.', 'Second paragraph here.', 'Third.' ]
```

---

## 8. Booleans and truthy/falsy

`true` and `false` are the boolean values. But JavaScript will also treat *any* value as "truthy" or "falsy" when a boolean is expected (like in an `if`). Knowing the falsy list by heart prevents a whole class of bugs.

**The falsy values (memorize these 8):**

```js
false, 0, -0, 0n, "", null, undefined, NaN
```

**Everything else is truthy** — including `"0"`, `"false"`, `[]` (empty array!), and `{}` (empty object!).

```js
if ("") console.log("won't run");        // "" is falsy
if ("hello") console.log("runs");        // non-empty string is truthy
if (0) console.log("won't run");         // 0 is falsy
if ([]) console.log("runs — empty array is TRUTHY!"); // ⚠️ surprising
if ({}) console.log("runs — empty object is TRUTHY!");

console.log(Boolean(""));    // false
console.log(Boolean("no"));  // true
console.log(Boolean(0));     // false
console.log(!!"hi");         // true  (double-not is a common "to boolean" trick)
```

> **🤖 AI/ML relevance:** A classic bug: `if (results.length)` to check "did we get results?" works because `0` is falsy. But `if (score)` to check "do we have a score?" is a *trap* — a legitimate score of `0` would be treated as "no score." When `0` is a valid value, test explicitly: `if (score !== undefined)` or `if (score != null)`.

---

## 9. Comparison: `===` vs `==`

There are two equality operators, and choosing correctly matters.

- **`===` (strict equality):** equal only if same type *and* same value. **Use this.**
- **`==` (loose equality):** performs type *coercion* first, leading to surprises. **Avoid it.**

```js
console.log(1 === 1);      // true
console.log(1 === "1");    // false — different types
console.log(1 == "1");     // true  — "1" coerced to 1 😱
console.log(0 == false);   // true  — false coerced to 0 😱
console.log("" == false);  // true  😱
console.log(null == undefined);  // true
console.log(null === undefined); // false
```

The `==` coercion rules are genuinely confusing (there's a whole flowchart). The senior-engineer rule: **always use `===` and `!==`.** The one pragmatic exception many teams allow is `x == null`, which conveniently matches *both* `null` and `undefined`:

```js
function hasValue(x) {
  return x != null; // true unless x is null OR undefined
}
console.log(hasValue(0));         // true (0 is a real value)
console.log(hasValue(""));        // true ("" is a real value)
console.log(hasValue(null));      // false
console.log(hasValue(undefined)); // false
```

Ordering comparisons behave as expected:

```js
console.log(0.9 > 0.5);   // true — top score beats threshold
console.log(3 <= 3);      // true
console.log("a" < "b");   // true (lexicographic for strings)
```

> **🤖 AI/ML relevance:** Filtering results by a confidence threshold — `results.filter(r => r.score >= 0.8)` — relies on numeric comparison. Using `==` there would be fine numerically, but mixing types (a score that arrived as the string `"0.8"` from JSON) is exactly where `===` discipline saves you.

---

## 10. Operators

### Arithmetic

```js
console.log(5 + 2);   // 7
console.log(5 - 2);   // 3
console.log(5 * 2);   // 10
console.log(5 / 2);   // 2.5
console.log(5 % 2);   // 1   (remainder)
console.log(5 ** 2);  // 25  (power)
```

`+` also **concatenates** strings, which causes a famous gotcha:

```js
console.log(1 + 2 + "3"); // "33"  (1+2=3, then 3+"3"="33")
console.log("1" + 2 + 3); // "123" (left-to-right, all become strings)
```

### Compound assignment

```js
let x = 10;
x += 5;  // x = x + 5  → 15
x -= 3;  // 12
x *= 2;  // 24
x /= 4;  // 6
console.log(x); // 6
```

### Logical operators

```js
console.log(true && false); // false — AND: both must be true
console.log(true || false); // true  — OR: at least one true
console.log(!true);         // false — NOT: flips it
```

`&&` and `||` **short-circuit** and return one of their operands (not always a boolean):

```js
const userName = "" || "Anonymous";      // "Anonymous" ("" is falsy)
const cached = null && expensiveCall();  // null — right side never runs
console.log(userName); // "Anonymous"
```

### Nullish coalescing `??` and optional chaining `?.`

These two modern operators are lifesavers for messy API data.

```js
// ?? : use the right side ONLY if the left is null or undefined (not just falsy)
const temp1 = 0 || 0.7;   // 0.7  ⚠️ 0 is falsy, so we lost a valid 0!
const temp2 = 0 ?? 0.7;   // 0    ✅ 0 is a real value, kept it
console.log(temp1, temp2); // 0.7 0

// ?. : safely read nested properties that might not exist
const response = { usage: { total_tokens: 128 } };
console.log(response.usage?.total_tokens);   // 128
console.log(response.error?.message);        // undefined (no crash!)
console.log(response.error?.message ?? "no error"); // "no error"
```

> **🤖 AI/ML relevance:** LLM/API responses are deeply nested and fields are often optional. `response.choices?.[0]?.message?.content ?? ""` safely extracts the model's text even when the structure is incomplete — no crash, sensible default. You'll write patterns like this constantly. And `temperature ?? 0.7` (not `temperature || 0.7`) correctly preserves a deliberately-set temperature of `0`.

---

## 11. Control flow

### `if / else if / else`

```js
const score = 0.62;

if (score >= 0.8) {
  console.log("high confidence");
} else if (score >= 0.5) {
  console.log("medium confidence");
} else {
  console.log("low confidence");
}
// "medium confidence"
```

### The ternary operator (inline if/else)

`condition ? valueIfTrue : valueIfFalse` — great for choosing a value.

```js
const score2 = 0.9;
const label = score2 >= 0.5 ? "relevant" : "irrelevant";
console.log(label); // "relevant"

// Avoid nesting ternaries deeply — it hurts readability.
```

### `switch`

Good when comparing one value against many fixed options.

```js
function routeIntent(intent) {
  switch (intent) {
    case "greeting":
      return "Hello! How can I help?";
    case "refund":
      return "I can help with refunds.";
    case "goodbye":
      return "Take care!";
    default:
      return "Let me route you to a human.";
  }
}
console.log(routeIntent("refund"));  // "I can help with refunds."
console.log(routeIntent("unknown")); // "Let me route you to a human."
```

> ⚠️ **`break` matters.** Without `return` (or `break`), `switch` "falls through" to the next case. We use `return` here so each case exits cleanly.

> **🤖 AI/ML relevance:** Routing is core to agents. After an intent classifier or a tool-selection LLM returns a label, a `switch` dispatches to the right handler — greeting flow, refund flow, or escalation. It's the skeleton of a simple router agent.

### 🎬 Real-life scenario

Your moderation layer must decide what to do with a user message based on a toxicity score from a classifier model:

```js
function moderate(toxicityScore) {
  if (toxicityScore >= 0.9) return "block";
  if (toxicityScore >= 0.6) return "flag_for_review";
  return "allow";
}

console.log(moderate(0.95)); // "block"
console.log(moderate(0.7));  // "flag_for_review"
console.log(moderate(0.1));  // "allow"
```

---

## 12. Loops

Loops repeat work — iterating datasets, retrying calls, processing batches.

### `for` (classic, index-based)

```js
for (let i = 0; i < 3; i++) {
  console.log("attempt", i);
}
// attempt 0 / attempt 1 / attempt 2
```

### `for...of` (iterate values — usually what you want)

```js
const scores = [0.9, 0.4, 0.7];
for (const s of scores) {
  console.log(s >= 0.5 ? "keep" : "drop");
}
// keep / drop / keep
```

### `for...in` (iterate an object's keys)

```js
const usage = { promptTokens: 50, completionTokens: 120 };
for (const key in usage) {
  console.log(`${key} = ${usage[key]}`);
}
// promptTokens = 50 / completionTokens = 120
```

> ⚠️ Use `for...of` for **arrays** (values) and `for...in` for **object keys**. Using `for...in` on an array is a common bug — it iterates indices as *strings* and can pick up unexpected properties.

### `while` and `do...while`

```js
let attempts = 0;
while (attempts < 3) {
  console.log("retrying...", attempts);
  attempts++;
}

// do...while runs the body at least once, then checks:
let n = 5;
do {
  console.log("runs once even though n >= 3");
} while (n < 3);
```

### `break` and `continue`

```js
const nums = [1, 2, 3, 4, 5];
for (const n of nums) {
  if (n === 3) continue; // skip this iteration
  if (n === 5) break;    // stop the loop entirely
  console.log(n);        // 1, 2, 4
}
```

> **🤖 AI/ML relevance:** You'll loop over **batches** of documents to embed them, **retry** flaky API calls with a `while` + attempt counter, and iterate **streamed tokens** from an LLM as they arrive. `break` lets you stop early once you've found a confident-enough answer; `continue` lets you skip malformed records in a dataset.

### 🎬 Real-life scenario

You're embedding a dataset but must respect a rate limit — process items in batches and count how many you've handled:

```js
const documents = ["doc1", "doc2", "doc3", "doc4", "doc5"];
const batchSize = 2;
let processed = 0;

for (let i = 0; i < documents.length; i += batchSize) {
  const batch = documents.slice(i, i + batchSize);
  console.log(`Embedding batch:`, batch);
  processed += batch.length;
}
console.log(`Done. Processed ${processed} documents.`);
// Embedding batch: [ 'doc1', 'doc2' ]
// Embedding batch: [ 'doc3', 'doc4' ]
// Embedding batch: [ 'doc5' ]
// Done. Processed 5 documents.
```

---

## 13. Functions

Functions are reusable, named blocks of logic. They take **parameters** (inputs), do work, and `return` an output. They are how you avoid repeating yourself and how you build pipelines.

### Function declaration

```js
function toCelsius(fahrenheit) {
  return (fahrenheit - 32) * (5 / 9);
}
console.log(toCelsius(212)); // 100
```

Declarations are **hoisted** — you can call them before they appear in the file. (More on hoisting in Module 03.)

### Function expression

Store a function in a variable. Not hoisted the same way — define before use.

```js
const square = function (x) {
  return x * x;
};
console.log(square(5)); // 25
```

### Arrow functions (the modern favorite)

Shorter syntax. If the body is a single expression, you can omit `{}` and `return` (an "implicit return").

```js
const double = (x) => x * 2;          // implicit return
const add = (a, b) => a + b;
const greet = (name) => `Hi, ${name}`;
const noArgs = () => "constant";
const block = (x) => {                 // needs explicit return with { }
  const y = x + 1;
  return y * 2;
};

console.log(double(10));   // 20
console.log(add(2, 3));    // 5
console.log(greet("Ada")); // Hi, Ada
console.log(block(4));     // 10
```

> Arrow functions are everywhere in data work because array methods take them: `scores.map(s => s * 100)`. You'll see this constantly in Module 02 and 06.

### Parameters, defaults, and return

```js
// Default parameters kick in when an argument is undefined.
function chat(prompt, temperature = 0.7, maxTokens = 256) {
  return `Prompt: "${prompt}" | temp=${temperature} | max=${maxTokens}`;
}

console.log(chat("Hello"));                 // uses both defaults
console.log(chat("Hello", 0.2));            // overrides temperature only
console.log(chat("Hello", undefined, 1000)); // skip middle with undefined

// A function with no return statement returns undefined:
function logOnly(x) { console.log(x); }
console.log(logOnly("hi")); // "hi" then undefined
```

> ⚠️ Default parameters trigger only for `undefined`, **not** `null`. `chat("Hi", null)` sets temperature to `null`, not `0.7`.

### 🎬 Real-life scenario

You're wrapping an LLM call so the rest of your app has one clean entry point with sensible defaults — a pattern you'll formalize in Module 11.

```js
function buildRequest(prompt, { model = "claude-opus-4", temperature = 0.7 } = {}) {
  return {
    model,
    temperature,
    messages: [{ role: "user", content: prompt }],
  };
}

console.log(buildRequest("Summarize this article."));
// { model: 'claude-opus-4', temperature: 0.7, messages: [ ... ] }

console.log(buildRequest("Be creative!", { temperature: 1.0 }));
// { model: 'claude-opus-4', temperature: 1, messages: [ ... ] }
```

That `{ model = ..., temperature = ... } = {}` is **destructuring with defaults** — a preview of Module 05. It's the standard way JS libraries accept "options objects."

---

## Common pitfalls

- **Thinking `const` freezes objects.** It only blocks reassignment; you can still mutate the contents. Use `Object.freeze()` (Module 02) for true immutability.
- **Comparing floats with `===`.** `0.1 + 0.2 === 0.3` is `false`. Use an epsilon tolerance.
- **Using `||` for defaults when `0`, `""`, or `false` are valid.** Use `??` instead. `count || 10` turns a real `0` into `10`; `count ?? 10` keeps the `0`.
- **Using `==` instead of `===`.** Coercion causes bizarre results. Default to `===`.
- **`typeof null === "object"`.** A permanent quirk — test null with `=== null`.
- **`NaN === NaN` is `false`.** Test with `Number.isNaN()`.
- **`for...in` on arrays.** Use `for...of` for array values.
- **Treating `[]` or `{}` as falsy.** They are **truthy**. To check "is this array empty?" use `arr.length === 0`.
- **Forgetting `break` in `switch`,** causing fall-through. Prefer `return` in each case.

---

## Recap

- A **value** is data; a **variable** is a named box holding it. Use `const` by default, `let` when you reassign, avoid `var`.
- `let`/`const` are **block-scoped**; `const` locks the binding, not the contents.
- There are **7 primitive types**; everything else is an object. `typeof` inspects them (with the `null` quirk).
- **Template literals** (`` `...${x}...` ``) are the clean way to build strings and prompts.
- JS numbers are **floats**, so `0.1 + 0.2 !== 0.3` — compare with a tolerance. Beware `NaN` and `Infinity`.
- **Strings** are immutable; `.trim()`, `.split()`, `.slice()`, `.replace()`, `.includes()` power text pipelines.
- Know the **8 falsy values**; everything else is truthy (including `[]` and `{}`).
- Use `===`/`!==`, not `==`/`!=`. Use `??` for defaults and `?.` for safe nested access.
- **Control flow**: `if/else`, ternary, `switch` route your logic.
- **Loops**: `for`, `for...of` (values), `for...in` (object keys), `while`; `break`/`continue` to control them.
- **Functions** take parameters (with defaults), do work, and `return`. Arrow functions are the concise modern form.

---

## Next

Continue to **[Module 02 — Data Structures](../02-data-structures/README.md)**, where you'll learn arrays, objects, `Map`, `Set`, JSON, copying, and typed arrays — how you actually hold datasets, embeddings, and configs in memory.
