# Module 00 — Exercises

Work through these in order. They're intentionally light — the point is to prove your environment works and you can navigate the tooling. Solutions for the coding tasks are in [`solutions/`](solutions/).

---

### Exercise 1 — Prove the environment works
**Scenario:** Your team lead wants a screenshot showing your toolchain is ready.

**Requirements:**
- Run `node --version`, `npm --version`, and `npx tsc --version` (after installing TypeScript).
- Confirm Node is v20 or newer.

**Hint:** If `tsc` isn't found, run `npm install -g typescript` or use `npx tsc --version` inside a project that has TypeScript installed.

---

### Exercise 2 — Your first script
**Scenario:** Print a personalized greeting from Node.

**Requirements:**
- Create `greet.js` that prints `Hello, <your name>! Today is a good day to learn JS.`
- Run it with `node greet.js`.

**Hint:** Use `console.log(...)` and a string.

---

### Exercise 3 — REPL exploration
**Scenario:** You want to check some expressions before writing them into a file.

**Requirements:**
- Open the REPL with `node`.
- Evaluate: `10 / 3`, `"ml".toUpperCase()`, `[1, 2, 3].length`, and `typeof 42`.
- Write down what each returns, then `.exit`.

**Hint:** The REPL prints the result of each expression automatically — no `console.log` needed.

---

### Exercise 4 — Initialize a project
**Scenario:** Start a fresh AI experiment project.

**Requirements:**
- Create a folder `token-counter`, `cd` into it, and run `npm init -y`.
- Add a `start` script that runs `node index.js`.
- Create `index.js` that prints `"Project initialized"`.
- Run it with `npm start`.

**Hint:** Edit the `"scripts"` block in `package.json`.

---

### Exercise 5 — Run TypeScript
**Scenario:** Confirm you can run `.ts` files directly.

**Requirements:**
- In the `token-counter` project, `npm install --save-dev tsx typescript`.
- Create `main.ts` with a typed constant and a `console.log`.
- Run it with `npx tsx main.ts`.

**Hint:** `const count: number = 5;`

---

### Exercise 6 — Command-line arguments (AI flavor)
**Scenario:** You want a script that "responds" to a prompt passed on the command line — the seed of a CLI chatbot.

**Requirements:**
- Create `cli-bot.js` that reads `process.argv[2]` as the user prompt.
- If no argument is given, default to `"hello"`.
- Print `User: <prompt>` and `Bot: <some canned reply based on the prompt>`.
- Support at least two known prompts plus a fallback.

**Hint:** `const prompt = process.argv[2] ?? "hello";` and use an object or `if/else` to pick a reply.

---

### Exercise 7 — A rudimentary token estimator (AI flavor)
**Scenario:** LLMs bill by "tokens." A crude rule of thumb is ~4 characters per token. Build a quick estimator.

**Requirements:**
- Create `estimate-tokens.js` that takes text from `process.argv[2]`.
- Print the character count and an estimated token count (`Math.ceil(chars / 4)`).
- Example: `node estimate-tokens.js "Hello, world!"` → `13 chars ≈ 4 tokens`.

**Hint:** Use `.length` on the string and `Math.ceil(...)`.

---

### Exercise 8 — Wire up npm scripts
**Scenario:** Make your tools runnable by name so teammates don't need to remember commands.

**Requirements:**
- In `package.json`, add scripts: `"bot": "node cli-bot.js"` and `"tokens": "node estimate-tokens.js"`.
- Run `npm run bot -- "help"` and `npm run tokens -- "some text"`.

**Hint:** The `--` passes everything after it as arguments to the underlying command.
