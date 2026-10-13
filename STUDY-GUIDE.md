# JavaScript & TypeScript for AI/ML — A Comprehensive Study Guide

> **Goal:** Take you from wherever you are today to a **proficient JavaScript/TypeScript developer capable of building real AI/ML applications** — LLM-powered apps, RAG systems, agents, embeddings pipelines, and in-browser ML.

This guide is **modular, hands-on, and scenario-driven**. Every concept is taught with:
- **Plain-language explanation** ("what is this and *why* do I care?")
- **Real-life scenarios** drawn from actual AI/ML engineering work
- **Runnable code examples** you can paste and execute
- **Tasks & exercises** with hints (solutions in `solutions/`)
- **"AI/ML relevance"** callouts connecting the concept to real ML work

---

## Who this is for

- Developers who want to build **AI products** (chatbots, RAG, agents, data pipelines) in the JS/TS ecosystem
- People who know *some* programming but want **depth** in JS + TS specifically
- Anyone who wants to move beyond "copy-paste from tutorials" to **understanding why code works**

You do **not** need prior ML math knowledge. You *do* need curiosity and willingness to run code.

---

## How to use this guide

1. **Go in order** the first time — modules build on each other.
2. **Type the code yourself.** Don't just read. Muscle memory matters.
3. **Do every task** before looking at solutions.
4. **Build the capstone projects** — they are where the learning consolidates.
5. Keep a REPL open (Node.js or the browser console) at all times.

**Recommended pace:** 1 module every 2–4 days. Full guide ≈ 8–12 weeks part-time.

---

## Setup (do this first)

See [00-setup/README.md](00-setup/README.md) for installing Node.js, TypeScript, an editor, and running your first script.

---

## The Learning Path

### Part I — JavaScript Foundations
| Module | Topic | Why it matters for AI/ML |
|--------|-------|--------------------------|
| [01](01-javascript-fundamentals/README.md) | **JavaScript Fundamentals** | Variables, types, control flow — the bedrock |
| [02](02-data-structures/README.md) | **Data Structures** | Arrays/objects/Maps/Sets — how you hold datasets, embeddings, configs |
| [03](03-functions-deep-dive/README.md) | **Functions Deep Dive** | Closures, HOFs, `this` — the functional style ML pipelines use |
| [04](04-async-javascript/README.md) | **Asynchronous JavaScript** | Promises, async/await, event loop, streaming — *essential* for LLM APIs |
| [05](05-modern-javascript/README.md) | **Modern JavaScript (ES6+)** | Modules, destructuring, generators, iterators |
| [06](06-data-manipulation/README.md) | **Data Manipulation** | map/filter/reduce, JSON, transforming datasets |

### Part II — TypeScript
| Module | Topic | Why it matters for AI/ML |
|--------|-------|--------------------------|
| [07](07-typescript-fundamentals/README.md) | **TypeScript Fundamentals** | Types, interfaces, inference — safety for complex API payloads |
| [08](08-typescript-advanced/README.md) | **TypeScript Advanced** | Generics, utility & conditional types — typing SDKs and tool schemas |
| [09](09-typescript-in-practice/README.md) | **TypeScript in Practice** | tsconfig, tooling, error handling, project layout |

### Part III — The Runtime & The Web
| Module | Topic | Why it matters for AI/ML |
|--------|-------|--------------------------|
| [10](10-nodejs-ecosystem/README.md) | **Node.js & Ecosystem** | npm, modules, fs, env, HTTP — how you run backends & scripts |
| [11](11-apis-and-llms/README.md) | **APIs & LLMs** | fetch, REST, auth, streaming responses, SDK patterns |

### Part IV — AI/ML in JavaScript/TypeScript
| Module | Topic | Why it matters for AI/ML |
|--------|-------|--------------------------|
| [12](12-aiml-foundations/README.md) | **AI/ML Foundations in JS/TS** | Vectors, tensors, embeddings, similarity, TF.js & Transformers.js |
| [13](13-building-ai-apps/README.md) | **Building AI Applications** | RAG, agents, tool use, prompt engineering in code, structured output |
| [14](14-testing-quality-deployment/README.md) | **Testing, Quality & Deployment** | Tests, linting, observability, shipping AI apps |

### Part V — Capstones
| Module | Topic |
|--------|-------|
| [15](15-capstone-projects/README.md) | **Capstone Projects** — 4 end-to-end AI/ML builds |

---

## Skill checklist (what "proficient" means here)

By the end you will be able to:

- [ ] Read and write idiomatic modern JavaScript confidently
- [ ] Reason about the event loop, async, and streaming
- [ ] Model complex data with TypeScript types & generics
- [ ] Type third-party SDKs and validate runtime data (e.g. with Zod)
- [ ] Call LLM APIs, stream tokens, and handle errors/retries/rate limits
- [ ] Generate and use **embeddings** and compute **vector similarity**
- [ ] Build a **RAG pipeline** end to end
- [ ] Build an **agent** with tool use / function calling
- [ ] Run models **in the browser** with Transformers.js / TensorFlow.js
- [ ] Test, lint, and deploy a production AI service

---

## Repository layout

```
Study Guide/
├── README.md                     ← you are here
├── 00-setup/
├── 01-javascript-fundamentals/
├── 02-data-structures/
├── ...
├── 15-capstone-projects/
└── GLOSSARY.md
```

Each module folder contains:
- `README.md` — the lesson
- `examples/` — runnable code (where applicable)
- `exercises.md` — tasks
- `solutions/` — worked solutions

---

Happy building. Start with [00-setup](00-setup/README.md), then [Module 01](01-javascript-fundamentals/README.md).
