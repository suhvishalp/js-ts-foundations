// solutions/exercise-08-observability-eval.ts
// Exercise 8 — Observability decorator + a tiny offline golden-set eval.
// Run:  npx vitest run solutions/exercise-08-observability-eval.ts

import { describe, it, expect, vi } from "vitest";

export interface ChatModel {
  complete(prompt: string): Promise<string>;
}

interface Logger {
  info(obj: object, msg: string): void;
  error(obj: object, msg: string): void;
}

// ---- Part 1: observability decorator (logger injected for testability) ----
export function withObservability(inner: ChatModel, model: string, log: Logger): ChatModel {
  return {
    async complete(prompt) {
      const start = performance.now();
      try {
        const answer = await inner.complete(prompt);
        const latencyMs = Math.round(performance.now() - start);
        log.info(
          { model, latencyMs, inTok: Math.ceil(prompt.length / 4), outTok: Math.ceil(answer.length / 4) },
          "llm.response",
        );
        return answer;
      } catch (err) {
        log.error({ model, err: String(err) }, "llm.error");
        throw err;
      }
    },
  };
}

// ---- Part 2: golden-set eval ----
export interface GoldenCase {
  input: string;
  mustContain: string[];
}

export async function runEval(
  model: ChatModel,
  set: GoldenCase[],
): Promise<{ passRate: number; misses: string[] }> {
  let passed = 0;
  const misses: string[] = [];
  for (const { input, mustContain } of set) {
    const answer = (await model.complete(input)).toLowerCase();
    const ok = mustContain.every((s) => answer.includes(s.toLowerCase()));
    if (ok) passed++;
    else misses.push(input);
  }
  return { passRate: passed / set.length, misses };
}

// ---- Tests ----
describe("withObservability", () => {
  it("logs a response event with numeric latency on success", async () => {
    const log: Logger = { info: vi.fn(), error: vi.fn() };
    const inner: ChatModel = { complete: async () => "hello world" };

    const model = withObservability(inner, "gpt-4o-mini", log);
    const answer = await model.complete("hi");

    expect(answer).toBe("hello world");
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o-mini", latencyMs: expect.any(Number) }),
      "llm.response",
    );
    expect(log.error).not.toHaveBeenCalled();
  });

  it("logs an error event and rethrows on failure", async () => {
    const log: Logger = { info: vi.fn(), error: vi.fn() };
    const inner: ChatModel = { complete: async () => { throw new Error("boom"); } };

    const model = withObservability(inner, "gpt-4o-mini", log);

    await expect(model.complete("hi")).rejects.toThrow(/boom/);
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.stringContaining("boom") }),
      "llm.error",
    );
  });
});

describe("runEval", () => {
  const goldenSet: GoldenCase[] = [
    { input: "capital of France?", mustContain: ["Paris"] },
    { input: "who wrote Hamlet?", mustContain: ["Shakespeare"] },
    { input: "year WW2 ended?", mustContain: ["1945"] },
  ];

  it("reports a perfect pass rate against a correct fake model", async () => {
    const answers: Record<string, string> = {
      "capital of France?": "The capital is Paris.",
      "who wrote Hamlet?": "William Shakespeare wrote it.",
      "year WW2 ended?": "It ended in 1945.",
    };
    const model: ChatModel = { complete: async (q) => answers[q] };

    const { passRate, misses } = await runEval(model, goldenSet);
    expect(passRate).toBe(1);
    expect(misses).toEqual([]);
  });

  it("detects regressions (a wrong answer lowers the pass rate)", async () => {
    const model: ChatModel = {
      complete: async (q) => (q.includes("Hamlet") ? "Charles Dickens" : "Paris 1945"),
    };
    const { passRate, misses } = await runEval(model, goldenSet);
    expect(passRate).toBeCloseTo(2 / 3, 5);
    expect(misses).toContain("who wrote Hamlet?");
  });
});
