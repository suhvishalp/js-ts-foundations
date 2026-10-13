# Module 10 — Exercises

Run `.ts` files with `npx tsx <file>.ts`. Set up once:
`npm init -y`, add `"type": "module"`, then `npm install dotenv zod` and
`npm install -D typescript tsx @types/node`.

---

## Exercise 1 — Project bootstrap (warm-up)

**Scenario:** Stand up a runnable Node/TS project.

**Requirements:**
1. Create `package.json` with `"type": "module"` and scripts: `dev`
   (`tsx src/index.ts`), `build` (`tsc`), `start` (`node dist/index.js`).
2. Add a `.gitignore` covering `node_modules/`, `dist/`, and `.env`.
3. Write `src/index.ts` that prints `process.version`.

**Hint:** `npm run dev` should work with no build step.

---

## Exercise 2 — deps vs devDeps

**Scenario:** Classify packages correctly.

**Requirements:** For each package, state whether it belongs in `dependencies` or
`devDependencies`, and why: `zod`, `typescript`, `@types/node`, `dotenv`, `tsx`,
the Anthropic SDK.

**Hint:** Ask "does my *running* code import it?"

---

## Exercise 3 — Read config from the environment

**Scenario:** Load and validate configuration safely.

**Requirements:**
1. Create a `.env` with `LLM_MODEL=claude-sonnet-5` and `MAX_TOKENS=1024`.
2. Write `src/config.ts` that loads `.env`, reads both values from
   `process.env`, and throws a clear error if either is missing.
3. Convert `MAX_TOKENS` to a number and validate it's a positive integer.

**Hint:** `import "dotenv/config"`. Everything in `process.env` is
`string | undefined`.

---

## Exercise 4 — Config with Zod (combines Module 09)

**Scenario:** Replace the hand-rolled checks with a schema.

**Requirements:**
1. Define a Zod schema for the config: `LLM_MODEL` (non-empty string),
   `MAX_TOKENS` (coerced int, 1–128000), `ANTHROPIC_API_KEY` (string, min length
   10, optional for this exercise).
2. `.safeParse(process.env)` and, on failure, print every issue (path +
   message), then `process.exit(1)`.
3. Export a typed, frozen `config` object.

**Hint:** `z.coerce.number().int()` turns the env string into a number. Use
`Object.freeze`.

---

## Exercise 5 — Read and transform a JSON dataset (AI/ML themed)

**Scenario:** Prepare a dataset for embedding.

**Requirements:**
1. Create `data/reviews.json` — an array of `{ id, text }` objects (3–4 entries).
2. Write a script that reads it with `node:fs/promises`, validates it with a Zod
   schema, lowercases and trims each `text`, and writes the cleaned array to
   `out/reviews.clean.json` (pretty-printed).
3. Ensure `out/` is created if missing.

**Hint:** `mkdir("out", { recursive: true })`; `JSON.stringify(data, null, 2)`.

---

## Exercise 6 — Write "embeddings" to disk (AI/ML themed)

**Scenario:** Simulate an embeddings pipeline's output stage.

**Requirements:**
1. For each cleaned review from Exercise 5, produce a fake embedding: an array of
   8 pseudo-random numbers (a real pipeline would call an API here).
2. Write an array of `{ id, text, vector }` to `out/embeddings.json`.
3. Print how many records were written and the output file's absolute path.

**Hint:** `Array.from({ length: 8 }, () => Math.random())`; `path.resolve(...)`.

---

## Exercise 7 — `fetch` a public API

**Scenario:** Make a real HTTP request and handle failures.

**Requirements:**
1. `fetch` `https://api.github.com/repos/microsoft/TypeScript` (a public,
   no-auth endpoint).
2. Check `res.ok`; throw a clear error including `res.status` if not.
3. Parse the JSON and print `full_name`, `stargazers_count`, and
   `open_issues_count`.

**Hint:** GitHub's API works without auth for public repos (rate-limited). Always
check `res.ok` before `res.json()`.

---

## Exercise 8 — A batch file processor (AI/ML themed, stretch)

**Scenario:** Process a folder of text files the way an ingestion job would.

**Requirements:**
1. Create `data/docs/` with several `.txt` files.
2. Write a script that lists the folder (`readdir`), reads each `.txt`, computes
   a word count, and collects `{ file, words }`.
3. Write the summary to `out/wordcounts.json` and print a total.

**Hint:** `readdir("data/docs")` then filter with `path.extname(f) === ".txt"`.
Process files concurrently with `Promise.all` over the list.

---

## Exercise 9 — A tiny CLI (AI/ML themed, stretch)

**Scenario:** Build a command-line tool that reads a key from `.env` and
"answers" a question (mock the model for now).

**Requirements:**
1. Parse `process.argv.slice(2)`: first arg is a command (`ask`), the rest is the
   question text.
2. On `ask`, load config (Exercise 4), and print a mock answer that echoes the
   model name and the question. (In Module 11 you'll swap the mock for a real
   `fetch` call.)
3. On missing/unknown command, print usage and `process.exit(1)`.

**Hint:** `const [cmd, ...words] = process.argv.slice(2); const question = words.join(" ")`.
