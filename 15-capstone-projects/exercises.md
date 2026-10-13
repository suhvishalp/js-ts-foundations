# Module 15 — Exercises (Capstone Extensions)

The four projects in the [README](README.md) *are* the main work. These exercises push each one further — they're the "stretch goals" turned into concrete, gradable tasks. Pick the ones that stretch you; each maps to a real production concern. Reference solutions/skeletons for a subset are in [`solutions/`](solutions/) and [`examples/`](examples/).

Work against the same interface-first, test-as-you-go discipline from Module 14: mock the model/embedder in unit tests, never hit the network in the test suite.

---

### Exercise 1 — Project 1: interactive REPL mode
**Scenario:** Engineers want a conversational session, not one-shot questions.

**Requirements:**
- When the CLI is run with no question argument, enter a REPL loop reading lines from stdin.
- Maintain conversation history (array of `{role, content}`) and send it with each turn.
- Stream each answer; type `/exit` to quit cleanly.

**Hint:** Use `node:readline/promises` (`createInterface({ input: process.stdin, output: process.stdout })`) and `for await (const line of rl)`.

---

### Exercise 2 — Project 1: structured `--json` mode with Zod
**Scenario:** A downstream script needs machine-readable answers.

**Requirements:**
- Add a `--json` flag. When set, instruct the model to reply as JSON matching a Zod schema (e.g. `{ answer: string, confidence: number }`).
- Parse and validate the response; on validation failure, retry once with a "your JSON was invalid" nudge, then error out.
- Print the validated object with `JSON.stringify(obj, null, 2)`.

**Hint:** Ask for JSON explicitly and set a low temperature. Reuse the parse-then-validate pattern from Module 14 Exercise 6.

---

### Exercise 3 — Project 2: incremental (cached) ingestion
**Scenario:** Re-embedding an entire folder every time is slow and expensive.

**Requirements:**
- Hash each chunk's text (e.g. SHA-256). Store `{hash, embedding}` alongside records.
- On re-ingest, skip embedding any chunk whose hash is already in the index; only embed new/changed chunks.
- Report how many chunks were reused vs newly embedded.

**Hint:** `import { createHash } from "node:crypto"`. Build a `Set` of existing hashes before the loop.

---

### Exercise 4 — Project 2: hybrid search
**Scenario:** Pure semantic search sometimes misses exact terms (names, error codes, IDs).

**Requirements:**
- Add a keyword score (e.g. count of query terms present in a chunk, normalized).
- Combine it with the cosine score: `final = α * semantic + (1 - α) * keyword`.
- Make `α` configurable; test that an exact-ID query ranks the chunk containing that ID first.

**Hint:** Normalize both scores to 0–1 before combining. Test with fake embeddings so the semantic part is deterministic.

---

### Exercise 5 — Project 3: stream the RAG answer over SSE
**Scenario:** The web client should see the grounded answer appear live.

**Requirements:**
- Add `POST /ask/stream` returning `Content-Type: text/event-stream`.
- Retrieve first (send the citations as an initial event), then stream answer tokens as `data:` events, ending with a `done` event.
- Ensure the model wrapper exposes a streaming `complete` variant.

**Hint:** In Hono, use `streamSSE` from `hono/streaming`. Send citations as one event, then loop the token stream.

---

### Exercise 6 — Project 3: faithfulness eval with LLM-as-judge
**Scenario:** Prove the assistant doesn't hallucinate before you ship a prompt change.

**Requirements:**
- Build a golden set of `{ question, expectedSubstrings }` pairs over a fixed doc set.
- Write `npm run eval` that runs each question through `answer()` and checks substrings (deterministic layer).
- Add an LLM-as-judge pass (Module 14) scoring faithfulness 1–5 against the retrieved context; fail the eval if the mean score drops below a threshold.

**Hint:** Unit-test the judge harness with a fake (does it parse the verdict?). Use the real judge only in the eval script, keyed off an env flag.

---

### Exercise 7 — Project 4: real tool + budget cap
**Scenario:** Give the agent a real capability, but never let it run away with cost.

**Requirements:**
- Replace the mock `search` with a real search API (e.g. Tavily) behind the same `Tool` interface — no other code changes.
- Add per-step token accounting; abort the loop if cumulative estimated cost exceeds a `maxCostUsd` budget, returning a clear message.
- Keep the mock version available for tests (inject the tool).

**Hint:** Because tools are injected, tests keep using the canned `search`; only production wires the real one. Reuse the cost estimator from Module 14.

---

### Exercise 8 — Project 4: sandboxed `readFile` tool (security)
**Scenario:** A file-reading tool is dangerous if the model can request `../../etc/passwd`.

**Requirements:**
- Implement `readFile` restricted to a `baseDir`. Resolve the requested path and reject anything that escapes `baseDir`.
- Return a helpful error (not a stack trace) for missing files or traversal attempts.
- Unit-test: a legit read succeeds; `../secret` and absolute paths outside `baseDir` are rejected.

**Hint:** `const resolved = path.resolve(baseDir, requested); if (!resolved.startsWith(path.resolve(baseDir) + path.sep)) throw ...`.

---

### Exercise 9 — Cross-project: containerize Project 3
**Scenario:** Ship the RAG API as a portable image.

**Requirements:**
- Write a multi-stage `Dockerfile` (Module 14) that builds to `dist/` and runs `node dist/server.js` as a non-root user.
- Add `.dockerignore`. Build and run locally, passing `OPENAI_API_KEY` via `--env-file`.
- `curl` the running container's `/health` and `/ask` endpoints.

**Hint:** Bake the prebuilt `index.json` into the image, or mount it as a volume — decide and document which and why.

---

### Exercise 10 — Cross-project: CI for a capstone
**Scenario:** Guard your capstone against regressions.

**Requirements:**
- Add `typecheck`, `lint`, `test` scripts and a `.github/workflows/ci.yml` (Module 14) running them on push/PR.
- Add a separate `workflow_dispatch` job running the real-model eval from Exercise 6 with `${{ secrets.OPENAI_API_KEY }}`.
- Make the every-push pipeline fully green with zero network calls.

**Hint:** Ensure every test injects a fake model/embedder. If any test needs a key to pass, it belongs in the eval job, not `quality`.
