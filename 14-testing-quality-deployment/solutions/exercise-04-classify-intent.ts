// solutions/exercise-04-classify-intent.ts
// Exercise 4 — Mock an LLM call with dependency injection.
// Run:  npx vitest run solutions/exercise-04-classify-intent.ts

import { describe, it, expect, vi } from "vitest";

// ---- The interface we own ----
export interface ChatModel {
  complete(prompt: string): Promise<string>;
}

// ---- Implementation ----
export type Intent = "question" | "command" | "chitchat";

export async function classifyIntent(text: string, model: ChatModel): Promise<Intent> {
  const prompt =
    `Classify the user's message as exactly one of: question, command, chitchat.\n` +
    `Reply with ONLY the label.\n\nMessage: ${text}`;
  const raw = (await model.complete(prompt)).trim().toLowerCase();
  // Coerce anything unexpected to a safe default rather than trusting the model.
  return raw === "question" || raw === "command" ? (raw as Intent) : "chitchat";
}

// ---- Tests ----
describe("classifyIntent", () => {
  it("returns the normalized label and passes the text to the model", async () => {
    const fake: ChatModel = { complete: vi.fn(async () => "Question") };

    const result = await classifyIntent("What is a vector database?", fake);

    expect(result).toBe("question");
    expect(fake.complete).toHaveBeenCalledOnce();
    expect(fake.complete).toHaveBeenCalledWith(
      expect.stringContaining("What is a vector database?"),
    );
  });

  it("recognizes commands", async () => {
    const fake: ChatModel = { complete: vi.fn(async () => "command\n") };
    expect(await classifyIntent("delete my account", fake)).toBe("command");
  });

  it("coerces unknown labels to chitchat", async () => {
    const fake: ChatModel = { complete: vi.fn(async () => "banana") };
    expect(await classifyIntent("lol nice weather", fake)).toBe("chitchat");
  });
});
