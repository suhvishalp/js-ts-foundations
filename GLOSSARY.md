# Glossary

A quick-reference for the JavaScript/TypeScript and AI/ML terms used throughout this guide. Terms are alphabetized. Cross-references point to *related* entries. Where a concept has a home module, it's noted in parentheses.

---

### Agent
An LLM placed in a **loop** with access to **tools** and a stopping condition. Each iteration the model decides whether to call a tool (and with what arguments) or to produce a final answer. See **Tool use**, **Function calling**, **ReAct**. (Modules 13, 15)

### Anthropic / OpenAI SDK
Official client libraries (`@anthropic-ai/sdk`, `openai`) that wrap an LLM provider's HTTP API with typed methods for chat, streaming, embeddings, and tool calling. See **LLM**, **API**. (Module 11)

### API (Application Programming Interface)
A defined contract for one program to talk to another, usually over HTTP for web services. You send a request (method, URL, headers, body) and get a structured response. See **REST**, **fetch**. (Module 11)

### AsyncIterable / Async generator
An object you can loop over with `for await...of`, producing values over time. Written with `async function*` and `yield`. The idiomatic way to model a **streaming** token feed. See **Streaming**, **Generator**. (Modules 04, 05)

### async/await
Syntax for writing asynchronous code that reads like synchronous code. `await` pauses a function until a **Promise** settles. See **Promise**, **Event loop**. (Module 04)

### Backoff (exponential)
A retry strategy where the wait between attempts grows exponentially (often with random **jitter**), giving a struggling service room to recover instead of hammering it. See **Retry**, **Circuit breaker**. (Module 14)

### Chunking
Splitting a long document into smaller pieces ("chunks") so each fits an **embedding** model's **context window** and yields focused **retrieval**. Chunks often **overlap** to avoid cutting ideas at boundaries. See **RAG**, **Embedding**. (Modules 12, 13, 15)

### Circuit breaker
A resilience pattern: after too many failures to a dependency, "open" the circuit and fail fast (returning a fallback) for a cool-down period, then test recovery. Stops cascading failure. See **Backoff**, **Retry**. (Module 14)

### Closure
A function bundled with the variables from the scope where it was defined, so it "remembers" them even after that scope has returned. The basis of many functional patterns. (Module 03)

### CI (Continuous Integration)
Automatically running quality gates (install, type-check, lint, test) on every push/PR so broken code never reaches the main branch. Commonly via GitHub Actions. See **Linting**, **tsc**. (Module 14)

### Container / Docker
A portable package of your app plus its exact runtime and dependencies, running identically anywhere. A **multi-stage** Dockerfile builds in one stage and ships a slim runtime stage. See **Deployment**. (Module 14)

### Context window
The maximum number of **tokens** an LLM can consider at once (prompt + response). Exceeding it truncates or errors; it's why **chunking** and retrieval exist. See **Token**, **RAG**. (Modules 11, 13)

### Cosine similarity
A measure of how aligned two **vectors** are, from -1 (opposite) to 1 (identical), independent of magnitude. The standard way to rank **embeddings** by semantic closeness. See **Embedding**, **Vector**, **Dot product**. (Modules 12, 14, 15)

### Cost (token cost)
LLM providers bill per **token**, at different rates for input vs output. Tracking cost per request (via **observability**) is essential because model calls are usually an app's biggest variable expense. See **Token**, **Observability**. (Module 14)

### Dependency injection (DI)
Passing a dependency (e.g. a model client) into a function/class rather than creating it inside. Makes code testable (inject a **mock**) and provider-agnostic. See **Mock**, **Interface**. (Module 14)

### Deployment
Getting your app running for real users: building to production JavaScript, then running on a **Node server / container**, **serverless** function, or **edge** runtime. See **Serverless**, **Edge**, **Container**. (Module 14)

### Destructuring
Syntax for pulling values out of arrays/objects into variables: `const { name } = user;` or `const [first] = list;`. (Module 05)

### Dot product
The sum of element-wise products of two vectors. The numerator of **cosine similarity**; equals cosine similarity for **normalized** (unit-length) vectors. See **Vector**, **Cosine similarity**. (Modules 12, 14)

### Edge (edge runtime)
Code running on a lightweight, globally distributed runtime (e.g. Cloudflare Workers) close to users for very low latency — but with a restricted API (no full Node, no filesystem). See **Serverless**, **Deployment**. (Module 14)

### Embedding
A dense numeric **vector** representing the *meaning* of text (or images, etc.), produced by a model. Similar meanings → nearby vectors, enabling semantic search. See **Vector**, **Cosine similarity**, **RAG**. (Modules 12, 15)

### ESLint
A pluggable linter that flags likely bugs and bad patterns (unused vars, floating promises, stray `any`). Complements **Prettier** (which handles formatting). See **Linting**, **Prettier**. (Module 14)

### ESM (ES Modules)
JavaScript's standard module system using `import`/`export`, enabled by `"type": "module"` in `package.json` or `.mjs` files. Contrast with older **CommonJS** (`require`). (Modules 05, 10)

### Eval / Evaluation (LLM)
Measuring an AI system's quality on a curated dataset. Techniques: **golden sets** (checkable properties), **LLM-as-judge**, and human review. Run separately from unit tests. See **Golden set**, **LLM-as-judge**. (Module 14)

### Event loop
The mechanism that lets single-threaded JavaScript handle concurrency: it runs your code, then processes queued callbacks/microtasks (resolved **Promises**) when the stack is empty. See **async/await**, **Promise**. (Module 04)

### fetch
The built-in Web/Node API for making HTTP requests, returning a **Promise** of a `Response`. The foundation under most LLM SDK calls. See **API**, **Promise**. (Modules 10, 11)

### Function calling
The mechanism by which an LLM, given typed **tool** schemas, outputs a structured request to invoke a specific tool with specific arguments. The engine behind **agents**. Also called "tool use." See **Agent**, **Tool use**, **Structured output**. (Modules 13, 15)

### Generic
A type parameter that lets a function/class/type work over many types while preserving type information: `function first<T>(arr: T[]): T`. See **Type inference**, **Union type**. (Module 08)

### Golden set
A small, curated set of representative inputs with known-acceptable outputs (or checkable properties like "answer must contain 'Paris'"). Run to catch **regressions** rather than assert perfection. See **Eval**, **Regression**. (Module 14)

### Grounding
Constraining an LLM to answer *only* from provided context (retrieved documents), typically with an instruction to say "I don't know" otherwise. Reduces **hallucination** and enables **citations**. See **RAG**, **Hallucination**. (Modules 13, 15)

### Hallucination
When an LLM produces fluent but false or unsupported content. Mitigated by **grounding**, **RAG**, lower **temperature**, and verification via **citations** or **LLM-as-judge**. (Modules 13, 15)

### Higher-order function (HOF)
A function that takes and/or returns another function — e.g. `map`, `filter`, `reduce`. Core to JavaScript's functional style. See **Closure**. (Modules 03, 06)

### Hoisting
JavaScript's behavior of moving `function` and `var` declarations to the top of their scope before execution. `let`/`const` are hoisted but not initialized (the "temporal dead zone"). (Module 01)

### Inference (ML)
Running a trained model to produce an output for new input (e.g. generating text, computing an embedding). Distinct from *training*. In TS, don't confuse with **type inference**. (Module 12)

### Interface (TypeScript)
A named description of an object's shape (or a contract a class implements). Defining an interface *you own* (e.g. `ChatModel`) is the key to testable, swappable code. See **Type**, **Dependency injection**. (Modules 07, 14)

### Jitter
Small randomness added to retry **backoff** delays so many clients don't retry in lockstep and overwhelm a recovering service. See **Backoff**, **Retry**. (Module 14)

### JSON (JavaScript Object Notation)
A lightweight text format for structured data. `JSON.parse`/`JSON.stringify` convert to/from JS values. The lingua franca of APIs and **structured output**. (Modules 06, 11)

### Linting
Static analysis that catches errors and enforces conventions without running the code. See **ESLint**, **Prettier**, **tsc**. (Module 14)

### LLM (Large Language Model)
A neural network trained on vast text that predicts likely next **tokens**, enabling chat, summarization, extraction, tool use, and more. See **Token**, **Inference**, **Temperature**. (Modules 11–13)

### LLM-as-judge
Using a (usually strong) LLM to grade another model's output against a rubric, returning a structured score. Useful when correctness is fuzzy; beware judge biases (verbosity, position). See **Eval**, **Structured output**. (Module 14)

### Mock / vi.fn()
A stand-in for a real dependency in tests that records how it was called and returns controlled values, so tests stay fast, deterministic, and offline. See **Dependency injection**, **Vitest**. (Module 14)

### Narrowing (type narrowing)
Using runtime checks (`typeof`, `in`, `instanceof`, truthiness) so TypeScript refines a broad type to a more specific one within a branch. See **Union type**, **Type guard**. (Modules 07, 08)

### Node.js
The runtime that executes JavaScript outside the browser (on servers, in scripts). Where nearly all JS/TS AI backend work happens. See **npm**, **ESM**. (Modules 00, 10)

### Normalization (vector)
Scaling a **vector** to unit length (magnitude 1) by dividing by its magnitude. Makes **dot product** equal **cosine similarity** and speeds up search. See **Vector**, **Cosine similarity**. (Modules 12, 14)

### npm
Node's package manager and registry: installs libraries, manages dependencies via `package.json`, and runs scripts. Use `npm ci` for reproducible installs in CI/prod. See **package.json**, **Node.js**. (Modules 00, 10)

### Observability
Instrumenting an app so you can understand it in production: **structured logs**, metrics, and traces. For AI apps, specifically logging per-call latency, **tokens**, and **cost** with a request id. See **Structured logging**, **Cost**. (Module 14)

### Optional chaining / Nullish coalescing
`a?.b` safely accesses `b` only if `a` exists (else `undefined`); `a ?? b` yields `b` only when `a` is `null`/`undefined`. Essential for defensive handling of API responses. (Module 05)

### package.json
The manifest describing a Node project: its name, `type` (module vs commonjs), dependencies, and `scripts`. See **npm**, **ESM**. (Modules 00, 10)

### Prettier
An opinionated code formatter that standardizes style (quotes, spacing, line width) automatically, ending style debates. Pairs with **ESLint** (correctness). (Module 14)

### Prompt engineering
Crafting the instructions/context sent to an LLM to get reliable, well-structured results — including system prompts, few-shot examples, and output-format directives. See **System prompt**, **Structured output**. (Module 13)

### Prompt injection
A security risk where malicious text in user input or retrieved documents tries to override the app's instructions (e.g. "ignore previous instructions and…"). Mitigated by trust boundaries, **tool-arg validation**, and bounded **agent** loops. See **Agent**, **Grounding**. (Modules 13, 15)

### Promise
An object representing the eventual result of an async operation, in one of three states: pending, fulfilled, or rejected. Consumed with `await` or `.then()/.catch()`. See **async/await**, **Event loop**. (Module 04)

### Pure function
A function whose output depends only on its inputs and which has no side effects. Same input → same output, always — making it trivially testable (e.g. **cosine similarity**, a chunker). (Modules 03, 14)

### RAG (Retrieval-Augmented Generation)
An architecture where you **retrieve** relevant chunks (via **embeddings** + **vector** search) and inject them into the LLM prompt so it answers from *your* data, **grounded** and with **citations**. See **Chunking**, **Embedding**, **Grounding**. (Modules 13, 15)

### ReAct
An agent pattern interleaving *reasoning* ("thought") and *acting* (tool calls), feeding each tool's result back into the next reasoning step. See **Agent**, **Tool use**. (Module 13)

### Regression
A previously-working behavior that breaks after a change. Tests and **golden sets** exist to catch regressions automatically. See **Eval**, **CI**. (Module 14)

### REST
An API style using HTTP methods (GET/POST/…) on resource URLs, typically exchanging **JSON**. See **API**, **fetch**. (Module 11)

### Retry
Re-attempting a failed operation, ideally only for *transient* errors (429, 5xx, network) and with **backoff** + **jitter**. Never retry deterministic failures like 400/401. See **Backoff**, **Circuit breaker**. (Module 14)

### Retrieval
The "R" in **RAG**: finding the most relevant chunks for a query, usually by embedding the query and ranking stored chunks with **cosine similarity**. See **RAG**, **Vector database**. (Modules 13, 15)

### Serverless
A deployment model where your function runs on demand per request, scales to zero, and bills per invocation (e.g. Vercel functions, AWS Lambda). Watch cold starts and time limits. See **Edge**, **Deployment**. (Module 14)

### Snapshot testing
Recording a value to a file and comparing future runs against it. Great for *deterministic* structures (built prompts, schemas); **never** for free-form LLM text. See **Vitest**, **Eval**. (Module 14)

### Streaming
Delivering an LLM response incrementally (token-by-token) instead of all at once, so users see output immediately. Modeled in JS with **async generators** / `for await`. See **AsyncIterable**, **Token**. (Modules 04, 11, 15)

### Structured logging
Emitting logs as machine-parseable objects (usually JSON) rather than plain strings, so they're queryable in a log platform. See **Observability**. (Module 14)

### Structured output
Constraining an LLM to return data in a specific machine-readable shape (usually JSON), validated at runtime with **Zod**. The basis of extraction and **function calling**. See **Zod**, **Function calling**. (Modules 13, 14)

### System prompt
The instruction that sets an LLM's role, tone, and rules for a conversation, sent as the `system` message ahead of user input. See **Prompt engineering**. (Modules 11, 13)

### Temperature
An LLM sampling parameter (typically 0–1+) controlling randomness: low = focused/deterministic, high = creative/varied. Use low temperature for extraction and factual/structured tasks. See **LLM**, **Inference**. (Module 11)

### Tensor
A multi-dimensional array of numbers (a generalization of scalars, **vectors**, and matrices) — the core data structure of ML frameworks like TensorFlow.js. See **Vector**. (Module 12)

### Token
The unit an LLM reads and generates — a word or word-piece (~4 characters of English on average). Billing, **context window** limits, and latency are all measured in tokens. See **Tokenization**, **Context window**, **Cost**. (Modules 11, 14)

### Tokenization
Converting text into **tokens** (and back) using a model-specific vocabulary. Why "token count" ≠ "word count" and why estimates use ~4 chars/token. See **Token**. (Modules 11, 12)

### Tool use
Giving an LLM callable functions ("tools") with typed schemas so it can act on the world — search, calculate, read files, call APIs. The model requests calls via **function calling**; your code validates args and executes. See **Agent**, **Function calling**. (Modules 13, 15)

### tsc / tsconfig.json
`tsc` is the TypeScript compiler; run `tsc --noEmit` to **type-check** without producing JS (a key **CI** step). `tsconfig.json` configures compilation (`target`, `module`, `strict`, etc.). See **Type-checking**, **CI**. (Modules 09, 14)

### Type / Type annotation
A description of what values a variable, parameter, or return may hold, checked at compile time (`const n: number = 5`). Catches whole classes of bugs before runtime. See **Interface**, **Generic**. (Module 07)

### Type-checking
Verifying that code respects its types. Note: **tsx**/Vitest *run* TypeScript by stripping types, so you still need `tsc --noEmit` to actually check them. See **tsc**, **CI**. (Modules 09, 14)

### Type guard
A boolean-returning check (built-in like `typeof`, or a custom `x is Foo` predicate) that lets TypeScript **narrow** a type. See **Narrowing**. (Module 08)

### Type inference
TypeScript automatically deducing a type you didn't write explicitly (e.g. `const n = 5` is inferred as `number`). Distinct from ML **inference**. (Module 07)

### tsx
A tool that runs `.ts`/`.mts` files directly (no separate build step) by stripping types on the fly — great for scripts and development. Does *not* type-check. See **Type-checking**, **Node.js**. (Modules 00, 10)

### Union type
A type that is one of several possibilities: `type Status = "ok" | "error"` or `string | number`. Combined with **narrowing** to handle each case safely. See **Narrowing**, **Type guard**. (Modules 07, 08)

### Vector
An ordered list of numbers (e.g. `number[]` in JS). In AI, an **embedding** is a vector; similarity between vectors (via **cosine similarity**) measures semantic closeness. See **Embedding**, **Tensor**. (Modules 12, 15)

### Vector database
A store optimized for holding **embeddings** and doing fast nearest-neighbor search over them (e.g. Pinecone, Qdrant, pgvector, Cloudflare Vectorize). Swaps in behind an in-memory index for scale. See **Embedding**, **Retrieval**, **RAG**. (Modules 13, 15)

### Vitest
A fast, modern test runner with a Jest-compatible API (`describe`/`it`/`expect`) and first-class TypeScript/ESM support. Used for all tests in this guide. See **Mock**, **Snapshot testing**. (Module 14)

### Zod
A TypeScript-first schema library for validating unknown runtime data (API payloads, LLM output) and inferring static types from schemas. The standard way to enforce **structured output**. See **Structured output**, **Type**. (Modules 09, 13, 14)
