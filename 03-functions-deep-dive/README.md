# Module 03 — Functions Deep Dive

Functions are the beating heart of JavaScript. Almost everything you do in an AI/ML data pipeline — cleaning text, caching embeddings, streaming tokens, composing transforms — is ultimately a function calling other functions. In this module we slow down and really understand what a function *is* in JS, how `this` works, why closures matter, and how to compose small functions into powerful pipelines.

## What you'll learn

- Functions as first-class values, and function expressions vs declarations (plus hoisting)
- Arrow functions vs regular functions and the real story behind `this`
- Parameters: default params, rest params, and the `arguments` object
- Closures — a solid mental model, a counter, and a real memoize
- Higher-order functions, callbacks, and `call` / `apply` / `bind`
- Currying and partial application
- Pure functions and side effects (and why they matter for reproducible ML)
- Recursion, base cases, and stack depth
- Immediately-invoked function expressions (IIFE)

## Prerequisites

You should be comfortable with the material in [../01-javascript-fundamentals/README.md](../01-javascript-fundamentals/README.md) and [../02-data-structures/README.md](../02-data-structures/README.md). We'll build directly on arrays, objects, `map`/`filter`/`reduce`, and destructuring.

---

## 1. Functions are first-class values

The single most important idea in this module: in JavaScript a function is just a *value*, like a number or a string. You can store it in a variable, put it in an array or object, pass it to another function, and return it from a function. Anything you can do with a `42` you can do with a function.

```js
// Store a function in a variable
const double = (n) => n * 2;

// Put functions in an array
const transforms = [
  (s) => s.trim(),
  (s) => s.toLowerCase(),
];

// Put a function in an object (a "method")
const mathUtils = {
  square: (n) => n * n,
};

// Pass a function as an argument
[1, 2, 3].map(double); // => [2, 4, 6]

// Return a function from a function
function adder(x) {
  return (y) => x + y;
}
const add10 = adder(10);
console.log(add10(5)); // => 15
```

Because functions are values, we can treat pipelines of data transformations as *data* — arrays of functions we iterate over. That is the foundation of the compose/pipe patterns later in this module.

> **🤖 AI/ML relevance:** A text-preprocessing pipeline is literally an array of functions — `[lowercase, stripPunctuation, tokenize]`. Treating each step as a first-class value lets you reorder, log, test, and reuse steps independently. Most ML data bugs come from a preprocessing step behaving differently at training time vs. inference time; keeping each step as a small named function makes that mismatch visible.

---

## 2. Function declarations vs expressions (and hoisting)

There are two main ways to define a named function, and the difference matters because of **hoisting** — the way JavaScript makes some names available before the line that defines them.

A **function declaration** starts with the `function` keyword at statement position. It is fully hoisted: both the name and the body are available anywhere in the enclosing scope, even above the definition.

```js
console.log(greet("Ada")); // => "Hello, Ada" — works even though it's above the definition

function greet(name) {
  return `Hello, ${name}`;
}
```

A **function expression** assigns a function to a variable. Only the variable declaration is hoisted (and with `const`/`let` it sits in the "temporal dead zone" until the assignment runs), so you cannot call it before the line that assigns it.

```js
try {
  console.log(farewell("Ada")); // ReferenceError: Cannot access 'farewell' before initialization
} catch (e) {
  console.log(e.constructor.name); // => "ReferenceError"
}

const farewell = function (name) {
  return `Goodbye, ${name}`;
};

console.log(farewell("Ada")); // => "Goodbye, Ada"
```

Practical guidance: prefer `const` function expressions (including arrow functions) for most code. They read top-to-bottom, they cannot be accidentally redeclared, and the temporal dead zone catches ordering mistakes early. Reach for declarations when you genuinely want the hoisting (e.g. helper functions defined below the main logic that reads them).

> **🤖 AI/ML relevance:** In a data-loading script you often define the "main" flow at the top and small helpers below. Function declarations let you write the readable high-level story first (`loadDataset()`, `cleanRows()`, `writeShards()`) and define the details underneath, because declarations are hoisted.

---

## 3. Arrow functions vs regular functions, and `this`

Arrow functions (`=>`) are not just shorter regular functions. The critical difference is that **arrow functions do not have their own `this`** — they capture `this` from the surrounding (lexical) scope where they were defined. Regular functions get a `this` determined by *how they are called*.

Let's see the classic trap. A regular function used as a callback loses the object `this`, while an arrow function keeps it.

```js
const model = {
  name: "gpt-mini",
  layers: [1, 2, 3],

  // Regular method: `this` is `model` when called as model.reportBad()
  reportBad() {
    // Inside this callback, `this` is NOT model — it's undefined (strict) or global
    this.layers.forEach(function (layer) {
      // console.log(this.name) would throw or print undefined
      return layer;
    });
  },

  // Fix with an arrow: the callback inherits `this` from reportGood
  reportGood() {
    this.layers.forEach((layer) => {
      console.log(`${this.name} has layer ${layer}`);
    });
  },
};

model.reportGood();
// => gpt-mini has layer 1
// => gpt-mini has layer 2
// => gpt-mini has layer 3
```

Why does the regular-function callback lose `this`? Because `forEach` calls your callback as a plain function (`callback(item)`), not as a method on `model`. Plain-function calls get `this === undefined` in strict/module code. The arrow function ignores how it's called and just uses the `this` that was in scope when it was written — which is `model`.

The flip side: **do not use an arrow function as an object method** if the method needs `this` to refer to the object.

```js
const counter = {
  count: 0,
  // WRONG: arrow captures the module-level `this` (undefined), not `counter`
  incWrong: () => {
    // this.count is undefined here
    return this?.count;
  },
  // RIGHT: regular method gets `this === counter` when called as counter.inc()
  inc() {
    this.count += 1;
    return this.count;
  },
};

console.log(counter.inc()); // => 1
console.log(counter.inc()); // => 2
console.log(counter.incWrong()); // => undefined
```

Arrow functions also have no `arguments` object and cannot be used with `new`. We'll cover `arguments` next.

See [examples/this-binding.js](examples/this-binding.js) for a runnable walk-through of every `this` scenario.

### 🎬 Real-life scenario: token stream handler on a client object

You're writing a small client that streams tokens from an LLM and appends them to a buffer stored on the client object. You register a per-token callback. If you use a regular function for the callback, `this.buffer` breaks; an arrow function keeps `this` pointed at the client.

```js
class StreamClient {
  constructor() {
    this.buffer = "";
  }

  // Simulate a streaming API that calls onToken(token) repeatedly
  connect(tokens, onToken) {
    for (const t of tokens) onToken(t);
  }

  start(tokens) {
    // Arrow callback => `this` is still the StreamClient instance
    this.connect(tokens, (token) => {
      this.buffer += token;
    });
    return this.buffer;
  }
}

const client = new StreamClient();
console.log(client.start(["Hel", "lo", " ", "world"])); // => "Hello world"
```

> **🤖 AI/ML relevance:** Streaming UIs (chat interfaces, agent loops) live and die by `this` inside per-token callbacks. Using arrow callbacks for token handlers is the idiomatic fix so the handler can reach the component/instance state it's updating.

---

## 4. Parameters: defaults, rest, and the `arguments` object

**Default parameters** give a fallback when an argument is `undefined`. They're evaluated at call time, so you can even reference earlier parameters.

```js
function chunk(text, size = 512, overlap = Math.floor(size / 10)) {
  return { size, overlap };
}
console.log(chunk("...")); // => { size: 512, overlap: 51 }
console.log(chunk("...", 100)); // => { size: 100, overlap: 10 }
console.log(chunk("...", 100, 0)); // => { size: 100, overlap: 0 }
```

Note that only `undefined` triggers the default — `null` does not.

```js
function f(x = 5) { return x; }
console.log(f(undefined)); // => 5
console.log(f(null));      // => null
```

**Rest parameters** (`...args`) collect any number of trailing arguments into a real array. This is the modern, preferred way to write variadic functions.

```js
function mean(...nums) {
  if (nums.length === 0) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}
console.log(mean(1, 2, 3, 4)); // => 2.5
console.log(mean());           // => 0
```

The **`arguments` object** is an older, array-*like* object available inside regular (non-arrow) functions. It holds all passed arguments but is not a true array (no `.map`, `.filter`, etc. without conversion).

```js
function oldStyleMean() {
  // arguments is array-like: has length and indices, but no array methods
  const nums = Array.from(arguments); // convert to a real array
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}
console.log(oldStyleMean(2, 4, 6)); // => 4
```

**Arrow functions have no `arguments`.** Referencing `arguments` inside an arrow reaches for the enclosing function's `arguments` (or errors at module top level). This is another reason rest parameters are preferred — they work everywhere and give you a real array.

```js
const arrowMean = (...nums) => nums.reduce((s, n) => s + n, 0) / nums.length;
console.log(arrowMean(10, 20)); // => 15
```

> **🤖 AI/ML relevance:** Default params encode sane defaults for hyperparameters (chunk size, temperature, top-k) while letting callers override them. Rest params are great for utilities like `concatEmbeddings(...vectors)` or logging helpers that accept any number of tensors/metrics.

---

## 5. Closures

A **closure** is a function bundled together with the variables from the scope where it was created. When a function "remembers" a variable that was in scope when it was defined — even after that outer scope has returned — that's a closure.

Mental model: every function keeps a private backpack. Inside the backpack are references to the variables it saw when it was born. It carries that backpack everywhere and can read/update those variables long after the function that created them has finished.

Here is the canonical counter. `makeCounter` returns a function that keeps mutating `count`, which lives in the closure's backpack — it is fully private and survives between calls.

```js
function makeCounter() {
  let count = 0; // lives in the closure

  return function () {
    count += 1; // reads and updates the captured variable
    return count;
  };
}

const next = makeCounter();
console.log(next()); // => 1
console.log(next()); // => 2
console.log(next()); // => 3

// A second counter has its OWN independent backpack
const next2 = makeCounter();
console.log(next2()); // => 1  (not 4!)
```

`count` is genuinely private — there is no way to read or corrupt it from outside except through `next`. Closures are JavaScript's primary tool for data privacy and for building stateful functions.

### 🎬 Real-life scenario: memoizing embedding lookups

Computing an embedding for a piece of text is expensive (a network call or a model forward pass). If your pipeline embeds the same text repeatedly, you want to compute it once and cache the result by text key. A closure holds the private cache.

```js
function memoizeEmbedding(embedFn) {
  const cache = new Map(); // private cache captured by the returned function

  return function (text) {
    if (cache.has(text)) {
      return cache.get(text); // cache hit — skip the expensive call
    }
    const vector = embedFn(text); // expensive: pretend this hits a model
    cache.set(text, vector);
    return vector;
  };
}

// A fake, expensive embedder that we count calls to
let calls = 0;
const slowEmbed = (text) => {
  calls += 1;
  return [text.length, text.charCodeAt(0)]; // stand-in "vector"
};

const embed = memoizeEmbedding(slowEmbed);
embed("hello"); // computes
embed("hello"); // cached
embed("world"); // computes
console.log(calls); // => 2  (only two real computations for three calls)
```

A full, generalized version (with custom cache keys) lives in [examples/memoize.js](examples/memoize.js).

> **🤖 AI/ML relevance:** Memoizing embeddings, tokenizations, and API responses by input key is one of the highest-leverage optimizations in an LLM app. It cuts cost and latency dramatically for repeated inputs (retrieval over a fixed corpus, evaluating the same prompts, deduped documents). Closures make the cache both automatic and private.

Also see [examples/closures.js](examples/closures.js) for more closure patterns, including the classic `for`-loop-with-`var` bug and its fix.

---

## 6. Higher-order functions and callbacks

A **higher-order function** is any function that takes a function as an argument, returns a function, or both. You already use them constantly: `map`, `filter`, `reduce`, `sort`, `setTimeout`. A **callback** is just a function you pass to another function to be called later.

```js
// Higher-order: takes a callback, applies it to each item
function transformAll(items, fn) {
  const out = [];
  for (const item of items) out.push(fn(item));
  return out;
}

const tokens = ["The", "Cat", "SAT"];
console.log(transformAll(tokens, (t) => t.toLowerCase()));
// => ["the", "cat", "sat"]
```

### 🎬 Real-life scenario: per-token streaming callback

When you stream a completion, the SDK doesn't return one big string — it invokes a callback for every token as it arrives so you can render progressively. Here's a faithful simulation.

```js
// A streaming function that invokes onToken for each token, then onDone
function streamCompletion(tokens, { onToken, onDone }) {
  let full = "";
  for (const token of tokens) {
    full += token;
    onToken(token, full); // callback fires per token
  }
  onDone(full); // final callback
}

const received = [];
streamCompletion(["Hel", "lo", "!"], {
  onToken: (tok) => received.push(tok),
  onDone: (full) => console.log("DONE:", full),
});
console.log(received); // => ["Hel", "lo", "!"]
// prints: DONE: Hello!
```

> **🤖 AI/ML relevance:** Callbacks are the backbone of streaming LLM output, progress reporting during long training/embedding jobs, and event-driven agent loops (`onToolCall`, `onFinish`). Understanding that "the library will call my function later" is essential to reading any AI SDK.

---

## 7. `call`, `apply`, and `bind`

These three methods let you control what `this` is when a function runs.

- `fn.call(thisArg, a, b)` — call `fn` now, with `this = thisArg`, passing args individually.
- `fn.apply(thisArg, [a, b])` — same, but args come as an array.
- `fn.bind(thisArg, a)` — return a *new* function with `this` (and optionally some leading args) permanently fixed. It does not call immediately.

```js
function describe(prefix) {
  return `${prefix}: ${this.name}`;
}

const modelA = { name: "resnet" };
const modelB = { name: "bert" };

console.log(describe.call(modelA, "Model"));   // => "Model: resnet"
console.log(describe.apply(modelB, ["Model"])); // => "Model: bert"

const describeA = describe.bind(modelA);        // this permanently = modelA
console.log(describeA("Arch"));                 // => "Arch: resnet"
```

`bind` is also how you do **partial application** by fixing leading arguments.

```js
function logMetric(namespace, name, value) {
  return `[${namespace}] ${name}=${value}`;
}
// Fix the namespace once; caller supplies name and value
const logTraining = logMetric.bind(null, "training");
console.log(logTraining("loss", 0.42));     // => "[training] loss=0.42"
console.log(logTraining("accuracy", 0.91)); // => "[training] accuracy=0.91"
```

> **🤖 AI/ML relevance:** `bind` is handy for pre-configuring loggers, metric emitters, or API clients with a fixed context (experiment id, model name) so downstream code passes fewer arguments and can't forget the context.

---

## 8. Currying and partial application

**Currying** transforms a function of many arguments into a chain of functions each taking one argument. **Partial application** fixes some arguments now and leaves the rest for later. They're closely related — both let you build specialized functions from general ones.

```js
// Manual curry: each call returns a function until all args are supplied
const multiply = (a) => (b) => (c) => a * b * c;
console.log(multiply(2)(3)(4)); // => 24

// Partial application via a first call
const timesSix = multiply(2)(3);
console.log(timesSix(10)); // => 60
```

### 🎬 Real-life scenario: a configurable, curried tokenizer

You want one tokenizer definition that can be *configured* (lowercase? keep punctuation?) and then reused as a plain `text => tokens` function across your pipeline. Currying separates the "configure once" step from the "run many times" step.

```js
// Curried: first supply config, get back a tokenizer function
const makeTokenizer = (config) => (text) => {
  let s = text;
  if (config.lowercase) s = s.toLowerCase();
  if (config.stripPunctuation) s = s.replace(/[^\w\s]/g, "");
  return s.split(/\s+/).filter(Boolean);
};

// Configure once
const tokenize = makeTokenizer({ lowercase: true, stripPunctuation: true });

// Reuse everywhere as a simple text => tokens function
console.log(tokenize("Hello, World!"));   // => ["hello", "world"]
console.log(tokenize("Foo. Bar? Baz!"));  // => ["foo", "bar", "baz"]
```

See [examples/compose.js](examples/compose.js) for currying combined with pipeline composition.

> **🤖 AI/ML relevance:** Curried, configurable transformers are perfect for preprocessing: define behavior via config once, then hand a clean single-argument function to `map` or a pipeline. This keeps the configuration explicit and versionable (great for reproducibility) while the call sites stay simple.

---

## 9. Pure functions and side effects

A **pure function** has two properties:

1. Its output depends only on its inputs (no reading external mutable state).
2. It causes no observable side effects (no mutating arguments, no I/O, no touching globals).

Given the same inputs, a pure function always returns the same output. Impure functions read/write the outside world.

```js
// PURE: same input => same output, no external effects
const normalize = (text) => text.trim().toLowerCase();

// IMPURE: mutates its argument (a side effect) and depends on Date.now()
let callCount = 0;
function impureNormalize(record) {
  callCount += 1;            // side effect: mutates outer state
  record.text = record.text.trim(); // side effect: mutates the argument
  record.processedAt = Date.now();  // non-deterministic
  return record;
}
```

Prefer pure functions for data transformation. They are trivially testable, cacheable (memoizable!), parallelizable, and reproducible.

### 🎬 Real-life scenario: reproducible preprocessing

ML experiments must be reproducible: run the same preprocessing on the same raw data and you must get byte-identical results, or your metrics aren't comparable across runs. Pure functions guarantee this. Below, the pure version never mutates the input, so the original data is untouched and re-runnable.

```js
// Pure normalizer: returns a NEW object, leaves input untouched
const cleanRecord = (record) => ({
  ...record,
  text: record.text.trim().toLowerCase(),
});

const raw = { id: 1, text: "  Hello WORLD  " };
const cleaned = cleanRecord(raw);

console.log(cleaned.text); // => "hello world"
console.log(raw.text);     // => "  Hello WORLD  "  (original untouched!)
```

> **🤖 AI/ML relevance:** Reproducibility is non-negotiable in ML. If your preprocessing mutates shared state or depends on wall-clock time / random seeds you didn't fix, two runs diverge and you can't trust A/B comparisons. Pure functions make "same raw data in, same tensors out" a guarantee, and they're what make memoization safe.

---

## 10. Recursion

A **recursive function** calls itself to solve a smaller version of the problem. Every recursion needs a **base case** — the condition that stops the recursion — and a **recursive case** that moves toward the base case. Without a base case you get infinite recursion and a stack overflow.

```js
function factorial(n) {
  if (n <= 1) return 1;       // base case: stop here
  return n * factorial(n - 1); // recursive case: smaller problem
}
console.log(factorial(5)); // => 120  (5*4*3*2*1)
```

Recursion shines for **tree-structured data**, which is everywhere in AI/ML: parsed syntax trees, nested JSON responses, agent tool-call trees, file directory trees for datasets.

### 🎬 Real-life scenario: counting leaf nodes in a nested response

An agent framework returns a nested tree of tool calls, each possibly containing child calls. You want to count the leaf calls (those with no children). Recursion walks the tree naturally.

```js
const callTree = {
  name: "root",
  children: [
    { name: "search", children: [] },
    {
      name: "plan",
      children: [
        { name: "fetch", children: [] },
        { name: "summarize", children: [] },
      ],
    },
  ],
};

function countLeaves(node) {
  if (node.children.length === 0) return 1; // base case: a leaf
  // recursive case: sum leaves of all children
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

console.log(countLeaves(callTree)); // => 3  (search, fetch, summarize)
```

**A note on stack depth.** Each recursive call adds a frame to the call stack. JavaScript engines have a limited stack (typically a few thousand to tens of thousands of frames), so deep recursion on large inputs can throw `RangeError: Maximum call stack size exceeded`. For very deep or unbounded structures, convert to an *iterative* approach with an explicit stack/queue.

```js
// Iterative leaf count using an explicit stack — no recursion depth limit
function countLeavesIterative(root) {
  let leaves = 0;
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.children.length === 0) leaves += 1;
    else stack.push(...node.children);
  }
  return leaves;
}
console.log(countLeavesIterative(callTree)); // => 3
```

> **🤖 AI/ML relevance:** Recursion is the natural fit for traversing nested LLM/agent outputs, JSON schemas, and dataset directory trees. But watch stack depth when flattening deeply nested documents — switch to an explicit-stack iteration for arbitrarily deep or user-supplied structures.

---

## 11. Immediately-invoked function expressions (IIFE)

An **IIFE** is a function you define and call in the same breath, wrapping it in parentheses. Historically it was the way to create a private scope before `let`/`const`/modules existed. Today it's still useful for running a bit of setup that needs its own scope, or for using `await` at the top level in environments that don't support top-level `await`.

```js
// Classic IIFE: everything inside is scoped, nothing leaks out
const config = (function () {
  const secret = "not-exposed"; // private
  return { version: "1.0", hasSecret: secret.length > 0 };
})();

console.log(config);        // => { version: "1.0", hasSecret: true }
// console.log(secret);     // ReferenceError — secret is private

// Async IIFE: a common way to use await at the "top level" of a script
(async () => {
  const value = await Promise.resolve(42);
  console.log("async IIFE:", value); // => async IIFE: 42
})();
```

> **🤖 AI/ML relevance:** Async IIFEs are the idiomatic way to run a one-off inference or data-loading script that needs `await` without wrapping everything in a named `main()` function. You'll see `(async () => { ... })()` at the bottom of countless ML utility scripts.

---

## Common pitfalls

- **Using an arrow function as a method that needs `this`.** `obj.method = () => this.x` captures the wrong `this`. Use a regular method when you need `this` to be the object.
- **Assuming a callback keeps the object's `this`.** Passing `obj.method` as a bare callback loses `this`. Use an arrow wrapper (`() => obj.method()`) or `obj.method.bind(obj)`.
- **Calling a `const` function expression before its line.** Temporal dead zone throws a `ReferenceError`. Only declarations are fully hoisted.
- **Confusing `null` with `undefined` for default params.** Only `undefined` triggers a default; `null` is passed through as-is.
- **Reaching for `arguments` in an arrow function.** Arrows don't have it — use rest params (`...args`).
- **Mutating arguments in a "transform" function.** This breaks purity and reproducibility. Return new objects/arrays with spread instead.
- **Memoizing an impure function.** If the function's output depends on hidden state, caching by input key returns stale/wrong results. Only memoize pure functions.
- **Unbounded recursion.** Missing or unreachable base cases and very deep inputs cause stack overflows. Add base cases and consider iteration for deep structures.
- **Recreating expensive closures in a hot loop.** Building a new memoized function inside a loop defeats the cache — create it once, outside.

---

## Recap

- Functions are first-class values you can store, pass, and return — this enables pipelines-as-data.
- Declarations are fully hoisted; `const`/`let` function expressions are not (temporal dead zone).
- Arrow functions capture lexical `this` and lack `arguments`; regular functions get `this` from the call site.
- Default params fill in for `undefined` only; rest params (`...args`) give a real array and beat `arguments`.
- A closure is a function plus its captured variables — the basis of private state and memoization.
- Higher-order functions and callbacks power `map`/`filter`/`reduce` and streaming APIs.
- `call`/`apply` invoke with a chosen `this`; `bind` returns a new function with fixed `this`/args (partial application).
- Currying turns multi-arg functions into single-arg chains, ideal for configurable transformers.
- Pure functions (same input → same output, no side effects) are testable, cacheable, and reproducible.
- Recursion needs a base case; watch stack depth and switch to iteration for deep data.
- IIFEs create private scope and enable async top-level scripts.

## Next

Continue to [../04-async-javascript/README.md](../04-async-javascript/README.md) to learn Promises, `async`/`await`, and how to orchestrate the network calls and streaming that AI/ML apps depend on.
