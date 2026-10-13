// examples/mock-llm.test.ts
// How to test code that calls an LLM WITHOUT touching the network, using
// dependency injection + a fake ChatModel. This is the single most important
// testing pattern for AI apps.
//
// Run:  npx vitest run examples/mock-llm.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// ---- The interface YOU own (in a real project: src/llm.ts) ----
interface ChatModel {
  complete(prompt: string): Promise<string>;
}

// ---- Code under test (in a real project: src/*.ts) ----

/** Summarize text. Guards empty input before ever calling the model. */
async function summarize(text: string, model: ChatModel): Promise<string> {
  if (!text.trim()) throw new Error("Cannot summarize empty text");
  return model.complete(`Summarize in one sentence:\n\n${text}`);
}

/** Classify a message; coerce unknown labels to a safe default. */
type Intent = "question" | "command" | "chitchat";
async function classifyIntent(text: string, model: ChatModel): Promise<Intent> {
  const raw = (await model.complete(`Label as question|command|chitchat:\n${text}`))
    .trim()
    .toLowerCase();
  return raw === "question" || raw === "command" ? (raw as Intent) : "chitchat";
}

/** Extract structured todos; validate against a schema; wrap parse errors. */
const TodoSchema = z.array(
  z.object({ task: z.string(), priority: z.enum(["low", "med", "high"]) }),
);
type Todos = z.infer<typeof TodoSchema>;
async function extractTodos(text: string, model: ChatModel): Promise<Todos> {
  const raw = await model.complete(`Extract todos as JSON:\n${text}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Model returned invalid JSON: ${raw.slice(0, 80)}`);
  }
  return TodoSchema.parse(parsed);
}

// ---- Tests ----

describe("summarize", () => {
  it("sends the text to the model and returns its answer", async () => {
    const fake: ChatModel = { complete: vi.fn(async () => "A concise summary.") };
    const result = await summarize("Long article about otters...", fake);

    expect(result).toBe("A concise summary.");
    expect(fake.complete).toHaveBeenCalledOnce();
    expect(fake.complete).toHaveBeenCalledWith(
      expect.stringContaining("Long article about otters"),
    );
  });

  it("rejects empty input before calling the model", async () => {
    const fake: ChatModel = { complete: vi.fn() };
    await expect(summarize("   ", fake)).rejects.toThrow(/empty/);
    expect(fake.complete).not.toHaveBeenCalled();
  });
});

describe("classifyIntent", () => {
  it("normalizes a valid label", async () => {
    const fake: ChatModel = { complete: vi.fn(async () => "Question") };
    expect(await classifyIntent("what time is it?", fake)).toBe("question");
  });

  it("coerces unknown labels to chitchat", async () => {
    const fake: ChatModel = { complete: vi.fn(async () => "banana") };
    expect(await classifyIntent("hi there", fake)).toBe("chitchat");
  });
});

describe("extractTodos", () => {
  it("parses valid structured output", async () => {
    const fake: ChatModel = {
      complete: vi.fn(async () =>
        JSON.stringify([{ task: "Write tests", priority: "high" }]),
      ),
    };
    const todos = await extractTodos("I must write tests", fake);
    expect(() => TodoSchema.parse(todos)).not.toThrow();
    expect(todos).toHaveLength(1);
    expect(todos[0].priority).toBe("high");
  });

  it("wraps malformed JSON in a clear error", async () => {
    const fake: ChatModel = { complete: vi.fn(async () => "not json at all") };
    await expect(extractTodos("x", fake)).rejects.toThrow(/invalid JSON/);
  });

  it("rejects output that violates the schema", async () => {
    const fake: ChatModel = {
      complete: vi.fn(async () => JSON.stringify([{ task: "x", priority: "urgent" }])),
    };
    // "urgent" is not in the enum → Zod throws.
    await expect(extractTodos("x", fake)).rejects.toThrow();
  });
});

// ---- Bonus: mocking a module directly with vi.mock (the escape hatch) ----
// Uncomment in a project where the SDK is imported directly and can't be injected.
//
// vi.mock("openai", () => {
//   const create = vi.fn(async () => ({ choices: [{ message: { content: "Mocked." } }] }));
//   return { default: vi.fn(() => ({ chat: { completions: { create } } })) };
// });

beforeEach(() => vi.clearAllMocks());
