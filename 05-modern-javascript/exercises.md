# Module 05 — Exercises

Work through these in order; each builds on the last. Write your attempts as `.mjs` files (so `import`/`export` and top-level `await` work) and run them with `node yourfile.mjs`. Worked solutions for exercises 1, 3, 5, and 7 live in [`solutions/`](./solutions/) — try first, peek later.

---

## Exercise 1 — Destructure a chat-completion response

**Scenario:** You're wrapping an LLM API. The raw response is deeply nested and inconsistent between models — sometimes `usage` is missing.

**Requirements:**
- Given the response object below, write a function `extract(response)` that returns `{ text, promptTokens, completionTokens }`.
- Use nested destructuring to pull `choices[0].message.content` into `text`.
- Use defaults so that when `usage` is absent, both token counts are `0`.
- Do not use `response.choices[0]...` dot chains — destructure.

```js
const response = {
  id: 'chatcmpl-1',
  choices: [{ index: 0, message: { role: 'assistant', content: 'Hi!' } }],
  usage: { prompt_tokens: 10, completion_tokens: 3 },
};
// extract(response) => { text: 'Hi!', promptTokens: 10, completionTokens: 3 }
// extract({ choices: [{ message: { content: 'x' } }] }) => { text: 'x', promptTokens: 0, completionTokens: 0 }
```

**Hint:** Destructure `usage` with a default of `{}`, then destructure `prompt_tokens`/`completion_tokens` from it with defaults of `0`.

---

## Exercise 2 — Merge model configs with correct defaults

**Scenario:** Users pass partial generation configs; you merge them over sensible defaults. A user setting `temperature: 0` must be respected.

**Requirements:**
- Write `resolveConfig(userConfig)` that merges `userConfig` over `{ model: 'gpt-4o', temperature: 0.7, topP: 1, stream: false }`.
- Use object spread; later (user) values win.
- Separately, write `getSeed(config)` that returns `config.seed` if present (including `0`) else `42`. Choose `??` vs `||` correctly.

```js
resolveConfig({ temperature: 0, stream: true });
// => { model: 'gpt-4o', temperature: 0, topP: 1, stream: true }
getSeed({ seed: 0 }); // => 0
getSeed({});          // => 42
```

**Hint:** `{ ...defaults, ...userConfig }`. For the seed, `||` would wrongly turn `0` into `42` — use `??`.

---

## Exercise 3 — Lazy batch generator over a dataset

**Scenario:** You must embed a large dataset in fixed-size batches without loading it all into memory.

**Requirements:**
- Write a generator `function* batchify(iterable, size)` that yields arrays of at most `size` items.
- It must work on any iterable (arrays, other generators, Sets).
- The final partial batch must still be yielded.
- Write a second generator `function* range(start, end)` (end exclusive) and demonstrate `batchify(range(0, 10), 3)`.

```js
[...batchify([1, 2, 3, 4, 5], 2)]; // => [[1,2],[3,4],[5]]
[...batchify(range(0, 10), 3)];    // => [[0,1,2],[3,4,5],[6,7,8],[9]]
```

**Hint:** Accumulate into a `batch` array; `yield` and reset it when it reaches `size`; after the loop, `yield` any remainder.

---

## Exercise 4 — Reshape a feature/config map with `Object.fromEntries`

**Scenario:** A classifier returns an array of `[label, score]` pairs. You need it as a lookup object, and you also want to normalize scores to percentages and drop anything below a threshold.

**Requirements:**
- Write `toLookup(pairs)` that turns `[['cat', 0.9], ['dog', 0.05]]` into `{ cat: 0.9, dog: 0.05 }`.
- Write `topLabels(pairs, threshold)` that returns an object of only the pairs with score `>= threshold`, with scores converted to whole-number percentages.

```js
toLookup([['cat', 0.9], ['dog', 0.05]]); // => { cat: 0.9, dog: 0.05 }
topLabels([['cat', 0.9], ['dog', 0.05], ['fox', 0.3]], 0.25);
// => { cat: 90, fox: 30 }
```

**Hint:** `Object.fromEntries(pairs)` for the first. For the second, `filter` the entries, then `map` each `[label, score]` to `[label, Math.round(score * 100)]`.

---

## Exercise 5 — Safe prompt builder (tagged template)

**Scenario:** You build prompts from templates that interpolate untrusted user content. You want a single choke point that sanitizes interpolated values.

**Requirements:**
- Write a tagged template function `prompt` such that `prompt\`...${value}...\`` returns a string where every interpolated value is: coerced to string, control characters removed, whitespace collapsed, trimmed, and truncated to 200 chars.
- The static template chunks must be left untouched.
- Add a helper `redact(value)` idea: also replace anything matching an email regex with `[redacted]` inside interpolated values.

```js
prompt`Q: "${'  hello\n\n\nworld  '}"`;      // => Q: "hello world"
prompt`Email me at ${'a@b.com please'}`;     // => Email me at [redacted] please
```

**Hint:** A tag receives `(strings, ...values)`. Use `strings.reduce(...)`; sanitize only `values[i]`.

---

## Exercise 6 — Optional chaining + nullish coalescing gauntlet

**Scenario:** You read config from a possibly-partial nested object coming from different sources (env, file, defaults).

**Requirements:**
- Write `readSetting(config, path, fallback)` where `path` is a dotted string like `'generation.maxTokens'`.
- Traverse safely (never throw on missing intermediate objects) and return `fallback` only when the resolved value is `null`/`undefined` (a value of `0` or `''` must be returned as-is).

```js
readSetting({ generation: { maxTokens: 0 } }, 'generation.maxTokens', 512); // => 0
readSetting({}, 'generation.maxTokens', 512);                               // => 512
readSetting({ a: { b: { c: 'x' } } }, 'a.b.c', 'z');                        // => x
```

**Hint:** `split('.')` then `reduce` with `acc?.[key]`. Apply `?? fallback` once at the end.

---

## Exercise 7 — Immutable agent-state reducer

**Scenario:** You're implementing the state core of an agent loop. State must never be mutated so runs are replayable.

**Requirements:**
- State shape: `{ messages: [], usage: { promptTokens: 0, completionTokens: 0 }, tools: {} }`.
- Write `reducer(state, action)` handling: `ADD_MESSAGE` (append to `messages`), `ADD_USAGE` (add `action.prompt`/`action.completion` into nested `usage`), `SET_TOOL` (set `tools[action.name] = action.enabled`), and a default case returning the same reference.
- No mutation anywhere: original state and its nested objects must be unchanged after each call. Assert this with `===`/`!==` checks.

```js
let s = { messages: [], usage: { promptTokens: 0, completionTokens: 0 }, tools: {} };
const s1 = reducer(s, { type: 'ADD_MESSAGE', message: { role: 'user', content: 'hi' } });
s.messages.length;  // => 0  (original untouched)
s1.messages.length; // => 1
```

**Hint:** Spread each level you change: `{ ...state, usage: { ...state.usage, promptTokens: ... } }`. For `SET_TOOL`, `{ ...state, tools: { ...state.tools, [action.name]: action.enabled } }`.

---

## Exercise 8 — Make a custom dataset iterable

**Scenario:** You wrap a data source and want callers to use natural `for...of` and spread over it.

**Requirements:**
- Create a `Dataset` class holding an internal array.
- Implement `[Symbol.iterator]()` (a generator method) so `for...of`, spread, and destructuring work.
- Add a `batches(size)` method that returns an iterable of batches (reuse your Exercise 3 `batchify`).

```js
const ds = new Dataset(['a', 'b', 'c', 'd', 'e']);
[...ds];                       // => ['a','b','c','d','e']
const [head] = ds;             // => head === 'a'
[...ds.batches(2)];            // => [['a','b'],['c','d'],['e']]
```

**Hint:** `*[Symbol.iterator]() { yield* this.items; }`. `batches(size)` can `return batchify(this, size)`.

---

## Exercise 9 (stretch) — Dynamic import plugin registry

**Scenario:** Your agent loads tools on demand from a folder, caching each after first load.

**Requirements:**
- Create a folder `tools/` with two modules, `calculator.mjs` and `echo.mjs`, each `export default` an object `{ run(input) }`.
- Write `loadTool(name)` that dynamically `import()`s `./tools/${name}.mjs`, caches the result in a `Map`, and returns the default export.
- Show that calling `loadTool('calculator')` twice does not re-import (add a top-level `console.log` in the tool module and observe it prints once).

**Hint:** `const mod = await import(\`./tools/${name}.mjs\`); return mod.default;`. Guard with the cache before importing.
