// examples/project4-agent.ts
// Project 4 skeleton — a tool-using agent with a BOUNDED loop.
// RUNNABLE WITHOUT AN API KEY: it uses a scripted fake model that returns a
// fixed sequence of decisions, exactly like the deterministic tests in Module 14.
// This shows the loop, tool dispatch, and Zod arg validation without an LLM.
//
// Run:  npx tsx examples/project4-agent.ts

import { z } from "zod";

// ---- Tools (src/tools.ts) ----
interface Tool<A = unknown> {
  name: string;
  description: string;
  parameters: z.ZodType<A>;
  execute(args: A): Promise<string>;
}

const calculator: Tool<{ expression: string }> = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression.",
  parameters: z.object({ expression: z.string() }),
  async execute({ expression }) {
    if (!/^[\d\s+\-*/().]+$/.test(expression)) throw new Error("unsafe expression");
    return String(Function(`"use strict"; return (${expression});`)());
  },
};

const search: Tool<{ query: string }> = {
  name: "search",
  description: "Search the web (mock).",
  parameters: z.object({ query: z.string() }),
  async execute({ query }) {
    const canned: Record<string, string> = { "capital of france": "Paris." };
    return canned[query.toLowerCase()] ?? `No results for "${query}".`;
  },
};

// ---- Model interface (src/model.ts) ----
type ModelDecision =
  | { type: "tool_call"; name: string; args: unknown; callId: string }
  | { type: "final"; text: string };
interface Message { role: "user" | "assistant" | "tool"; content: string; callId?: string; }
interface ToolCallingModel { decide(messages: Message[], tools: Tool[]): Promise<ModelDecision>; }

// ---- The bounded agent loop (src/agent.ts) ----
async function runAgent(
  task: string,
  model: ToolCallingModel,
  tools: Tool[],
  maxSteps = 5,
): Promise<string> {
  const byName = new Map(tools.map((t) => [t.name, t]));
  const messages: Message[] = [{ role: "user", content: task }];

  for (let step = 0; step < maxSteps; step++) {
    const decision = await model.decide(messages, tools);
    if (decision.type === "final") return decision.text;

    const tool = byName.get(decision.name);
    if (!tool) {
      messages.push({ role: "tool", content: `Unknown tool: ${decision.name}`, callId: decision.callId });
      continue;
    }
    // NEVER trust the model's args — validate before executing.
    const parsed = tool.parameters.safeParse(decision.args);
    const observation = parsed.success
      ? await tool.execute(parsed.data).catch((e) => `Tool error: ${(e as Error).message}`)
      : `Invalid arguments: ${parsed.error.message}`;
    console.log(`  step ${step}: ${decision.name}(${JSON.stringify(decision.args)}) -> ${observation}`);
    messages.push({ role: "tool", content: observation, callId: decision.callId });
  }
  return "Reached the step limit without a final answer.";
}

// ---- A scripted fake model (in prod: an OpenAI/Anthropic tool-calling impl) ----
function scriptedModel(script: ModelDecision[]): ToolCallingModel {
  let i = 0;
  return { async decide() { return script[i++]; } };
}

async function main() {
  console.log("Task: What is 15% of 240, and what is the capital of France?\n");
  const model = scriptedModel([
    { type: "tool_call", name: "calculator", args: { expression: "0.15 * 240" }, callId: "1" },
    { type: "tool_call", name: "search", args: { query: "capital of France" }, callId: "2" },
    { type: "final", text: "15% of 240 is 36, and the capital of France is Paris." },
  ]);

  const answer = await runAgent(
    "What is 15% of 240, and what is the capital of France?",
    model,
    [calculator, search],
  );
  console.log(`\nFinal answer: ${answer}`);
}

main();
