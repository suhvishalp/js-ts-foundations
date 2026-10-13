# Module 00 — Setup: Your JavaScript/TypeScript Environment

Before you can write a single line of AI-powered code, you need a working development environment. This module gets your machine ready and demystifies the tools you'll use every day. We keep the examples deliberately tiny here — the goal is a green light on every command, not clever code.

## What you'll learn
- How to install **Node.js** (the runtime that executes JS outside the browser) using **nvm**
- How to verify your **Node** and **npm** versions
- How to install **TypeScript** globally and per-project
- How to pick and configure an **editor** (VS Code) with the right extensions
- How to run a `.js` file with `node`, and a `.ts` file with `tsx`
- How to use the **REPL** and the **browser console**
- How to initialize a project with `npm init -y` and read a `package.json`
- How to write and run a "Hello, AI World" script
- Basic **troubleshooting** when something goes wrong

**Prerequisites:** A computer (macOS, Linux, or Windows) and a terminal. No prior JS knowledge required.

---

## Why Node.js?

JavaScript was born in the browser, but AI/ML engineering happens mostly on **servers, in build tools, and in scripts**. **Node.js** is the runtime that lets you execute JavaScript on your own machine and on servers — no browser needed. When you call the OpenAI or Anthropic API, run a data-cleaning script, or serve a chatbot backend, you are almost always running **Node**.

**npm** ("Node Package Manager") ships with Node. It installs libraries (like the official AI SDKs) from a giant public registry and manages your project's dependencies.

> **🤖 AI/ML relevance:** Every JS-based AI project — LangChain.js, the Vercel AI SDK, `@anthropic-ai/sdk`, `openai`, Transformers.js — is distributed through npm and runs on Node. Getting this layer solid means the rest of the guide "just works."

---

## Step 1 — Install Node.js with nvm (recommended)

You *can* download Node from [nodejs.org](https://nodejs.org), but a **version manager** is far better: different projects need different Node versions, and nvm lets you switch in seconds.

### macOS / Linux

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Close and reopen your terminal, then install the latest LTS ("Long Term Support") Node:
nvm install --lts
nvm use --lts

# Make it the default for new shells:
nvm alias default 'lts/*'
```

### Windows

On Windows, use [**nvm-windows**](https://github.com/coreybutler/nvm-windows) (a separate project) or install Node directly from [nodejs.org](https://nodejs.org). WSL2 (Windows Subsystem for Linux) is the smoothest option for AI work — you then follow the Linux instructions above.

> **Why LTS?** "LTS" versions are supported for years and are the safe default for real projects. Use the "Current" release only if you specifically need a brand-new feature.

---

## Step 2 — Verify your installation

Open a terminal and run:

```bash
node --version
npm --version
```

You should see something like:

```
v22.11.0
10.9.0
```

The exact numbers will differ — as long as **Node is v20 or newer**, you're in great shape for everything in this guide. If either command errors with "command not found," jump to [Troubleshooting](#troubleshooting).

---

## Step 3 — Run your first JavaScript

Create a file called `hello.js`:

```js
// hello.js
console.log("Hello from Node.js!");
console.log("2 + 2 =", 2 + 2);
```

Run it:

```bash
node hello.js
```

Output:

```
Hello from Node.js!
2 + 2 = 4
```

`console.log(...)` prints to the terminal. It is the single most-used debugging tool you will ever touch — get comfortable sprinkling it everywhere while learning.

---

## Step 4 — The REPL (interactive playground)

REPL stands for **Read–Eval–Print Loop**. It's an interactive prompt where you type JS and see results instantly — perfect for experiments.

```bash
node
```

You'll get a `>` prompt:

```
> 1 + 1
2
> const name = "Ada"
undefined
> `Hi, ${name}`
'Hi, Ada'
> .exit
```

Type `.exit` (or press `Ctrl+D`) to leave. Use the REPL constantly while working through Modules 01 and 02 — it's the fastest way to test "what does this expression evaluate to?"

> **🤖 AI/ML relevance:** When you're unsure how a chunk of an API response is shaped, or whether `array.slice(0, 5)` does what you think, the REPL answers in one second. This tight feedback loop is how experienced engineers reason about data.

---

## Step 5 — The browser console

Every browser has a JS console too. In Chrome, Firefox, or Edge, press **F12** (or `Cmd+Option+I` on macOS) and click the **Console** tab. Type:

```js
console.log("Hello from the browser!");
[1, 2, 3].map(n => n * 2);
```

You'll use the browser console when you build front-end AI features (Module 13) and when experimenting with **Transformers.js** (in-browser ML). For now, just know it exists and behaves almost identically to the Node REPL.

---

## Step 6 — Initialize a project with npm

A "project" is just a folder with a `package.json` file describing it. Create one:

```bash
mkdir hello-ai && cd hello-ai
npm init -y
```

The `-y` flag says "yes to all defaults." You now have a `package.json`:

```json
{
  "name": "hello-ai",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

### What each field means

| Field | Meaning |
|-------|---------|
| `name` | The project/package name |
| `version` | Semantic version (major.minor.patch) |
| `main` | Entry file when the package is imported |
| `scripts` | Named commands you run with `npm run <name>` |
| `dependencies` | Packages your code needs at runtime (added by `npm install`) |
| `devDependencies` | Packages needed only during development (TypeScript, test tools) |

Add a script so `npm start` runs your file. Edit `scripts`:

```json
"scripts": {
  "start": "node index.js"
}
```

Create `index.js` with `console.log("It runs!");` and run:

```bash
npm start
```

> **🤖 AI/ML relevance:** When you install `npm install @anthropic-ai/sdk`, npm records it under `dependencies` and downloads it into `node_modules/`. The `package.json` + `package-lock.json` pair guarantees your teammates (and production servers) get the *exact* same library versions — reproducibility that matters when a model SDK update changes behavior.

---

## Step 7 — Add TypeScript

TypeScript (TS) is JavaScript **with types**. You'll go deep on it in Modules 07–09, but let's install it now so it's ready.

### Per-project (the recommended way)

```bash
npm install --save-dev typescript
npx tsc --version
```

`--save-dev` puts it in `devDependencies` (it's a build-time tool, not shipped to production). `npx` runs a locally-installed binary. Pinning TypeScript per-project means every project can use a different TS version safely.

### Globally (handy for quick experiments)

```bash
npm install -g typescript
tsc --version
```

Create a `tsconfig.json` (TypeScript's config file) with sensible defaults:

```bash
npx tsc --init
```

---

## Step 8 — Run TypeScript files with tsx

TypeScript must be **compiled** to JavaScript before Node can run it. During development that's tedious, so we use **`tsx`** — a tool that compiles-and-runs `.ts` files in one step.

```bash
npm install --save-dev tsx
```

Create `hello.ts`:

```ts
// hello.ts
const greeting: string = "Hello from TypeScript!";
const version: number = 2026;
console.log(`${greeting} It is ${version}.`);
```

Run it:

```bash
npx tsx hello.ts
```

Output:

```
Hello from TypeScript! It is 2026.
```

> **`tsx` vs `ts-node`:** Both run TS directly. `tsx` is faster and needs almost zero configuration, so this guide uses it. `ts-node` is the older, more established option and is stricter about type-checking as it runs. Either works.

> **🤖 AI/ML relevance:** Types catch bugs *before* you spend money calling an LLM. If your function expects `{ role: string, content: string }[]` and you accidentally pass a plain string, TypeScript flags it in your editor instantly — no failed API call, no wasted tokens.

---

## Step 9 — Choose an editor (VS Code)

[**Visual Studio Code**](https://code.visualstudio.com/) is the de-facto standard for JS/TS. It has TypeScript support built in (Microsoft makes both), inline error highlighting, and excellent debugging.

### Recommended extensions

| Extension | Why |
|-----------|-----|
| **ESLint** | Flags likely bugs and enforces style as you type |
| **Prettier** | Auto-formats code on save so you never argue about spacing |
| **Error Lens** | Shows errors inline right on the offending line |
| **npm Intellisense** | Autocompletes package names in imports |
| **GitLens** | Supercharges Git history in the editor |

Install the CLI shortcut too: in VS Code, open the Command Palette (`Cmd/Ctrl+Shift+P`) and run "**Shell Command: Install 'code' command in PATH**." Then you can open any folder with:

```bash
code .
```

---

## Step 10 — "Hello, AI World"

Let's tie it together with a slightly more AI-flavored script. It doesn't call a real model yet (that's Module 11) — it simulates the *shape* of an AI interaction so the structure feels familiar.

See [`examples/hello-ai.js`](examples/hello-ai.js):

```js
// examples/hello-ai.js
// A pretend "AI" that echoes a canned response — no API key needed.
function fakeChatModel(prompt) {
  const canned = {
    hello: "Hi! I'm a stand-in model. Real ones arrive in Module 11.",
    help: "I can only say a few things for now — but you ran Node correctly!",
  };
  const key = prompt.trim().toLowerCase();
  return canned[key] ?? `You said: "${prompt}". I don't know that one yet.`;
}

const userPrompt = process.argv[2] ?? "hello";
console.log("User:", userPrompt);
console.log("AI:  ", fakeChatModel(userPrompt));
```

Run it (the `process.argv[2]` reads a command-line argument):

```bash
node examples/hello-ai.js hello
node examples/hello-ai.js "what is ml"
```

Output:

```
User: hello
AI:   Hi! I'm a stand-in model. Real ones arrive in Module 11.
```

There's a TypeScript version too, in [`examples/hello-ai.ts`](examples/hello-ai.ts) — run it with `npx tsx examples/hello-ai.ts hello`.

### 🎬 Real-life scenario

You just joined an AI startup. On day one your lead says: "Clone the repo, run `npm install`, then `npm run dev` and confirm the chatbot boots." Everything in this module — Node installed, npm working, a project with scripts, TS running via a runner — is exactly the muscle memory that turns that onboarding task from a two-hour ordeal into a two-minute checklist. The `hello-ai.js` script mirrors the real thing: read input, pass it to a model function, print the reply.

---

## Troubleshooting

**`node: command not found`**
Your shell can't find Node. If you used nvm, close and reopen your terminal (the installer adds lines to your shell profile that only load on a fresh shell). Then run `nvm use --lts` again.

**`npm ERR! code EACCES` (permission errors on global install)**
Don't use `sudo npm install -g`. Instead, use nvm — it installs Node in your home directory, so global installs never need admin rights. This alone eliminates the most common beginner headache.

**`Cannot find module 'tsx'`**
You installed it globally but are running in a project, or vice-versa. Prefer `npx tsx file.ts` (uses the local copy) after `npm install --save-dev tsx`.

**`tsc` compiles but Node says "Cannot use import statement outside a module"**
This is a module-system mismatch (CommonJS vs ES Modules). For now, using `tsx` sidesteps it. We cover module systems properly in Module 10.

**VS Code shows red squiggles but the code runs fine**
Those are TypeScript type warnings, not runtime errors. They're helping you — read them! We learn to interpret them in Module 07.

**Wrong Node version in one project**
Add a `.nvmrc` file containing just the version (e.g. `22`) to the project, then run `nvm use` in that folder. Teams use this to stay in sync.

---

## Common pitfalls

- **Installing globally when you meant locally.** For project tools (TypeScript, tsx, test runners), prefer `--save-dev` + `npx`. Reserve global installs for throwaway experiments.
- **Editing `package-lock.json` by hand.** Never. It's machine-managed; let npm own it.
- **Committing `node_modules/` to Git.** Don't — it's huge and reproducible from `package.json`. Add it to `.gitignore`.
- **Forgetting to reopen the terminal after installing nvm.** The single most common "it doesn't work" cause.
- **Mixing Node versions across projects** without nvm, leading to "works on my machine" bugs.

---

## Recap

- **Node.js** runs JavaScript outside the browser; **npm** installs and manages libraries.
- Use **nvm** to install and switch Node versions cleanly (no `sudo` headaches).
- Verify with `node --version` and `npm --version` (want Node 20+).
- Run JS with `node file.js`; experiment interactively in the **REPL** (`node`) or the **browser console**.
- Start a project with `npm init -y`; `package.json` describes it and defines `scripts`.
- Install **TypeScript** per-project with `--save-dev`; run `.ts` files directly with **`tsx`**.
- Use **VS Code** with ESLint, Prettier, and Error Lens.
- You wrote and ran a "Hello, AI World" script in both JS and TS.

---

## Next

Continue to **[Module 01 — JavaScript Fundamentals](../01-javascript-fundamentals/README.md)**, where you'll learn variables, types, operators, control flow, and functions — the bedrock of everything that follows.
