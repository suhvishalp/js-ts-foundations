/**
 * Example: a minimal agent — observe → decide → act, bounded, with logging.
 *
 * Two tools (calculator + mock search); the model chains them on its own.
 *
 * Setup:
 *   npm install @anthropic-ai/sdk zod
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *
 * Run: npx tsx examples/mini-agent.ts "What is the speed of light times 2?"
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "calculator",
    description: "Evaluate a basic arithmetic expression. Use for any math.",
    input_schema: {
      type: "object",
      properties: { expression: { type: "string" } },
      required: ["expression"],
    },
  },
  {
    name: "search",
    description: "Look up a numeric fact in the knowledge base.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

const CalcArgs = z.object({ expression: z.string() });
function calculator(a: z.infer<typeof CalcArgs>): string {
  if (!/^[0-9+\-*/(). ]+$/.test(a.expression)) return "Error: invalid characters";
  try {
    return String(Function(`"use strict"; return (${a.expression});`)());
  } catch {
    return "Error: could not evaluate";
  }
}

const SearchArgs = z.object({ query: z.string() });
const KB: Record<string, string> = {
  "speed of light": "299792458",
  "population of france": "68000000",
};
function search(a: z.infer<typeof SearchArgs>): string {
  const key = Object.keys(KB).find((k) => a.query.toLowerCase().includes(k));
  return key ? KB[key] : "No results found.";
}

async function runAgent(goal: string, maxSteps = 6): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: goal }];

  for (let step = 0; step < maxSteps; step++) {
    const res = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "You are a helpful agent. Use search for facts and the calculator for math. " +
        "Chain tools as needed, then give a final answer.",
      tools,
      messages,
    });

    if (res.stop_reason !== "tool_use") {
      const text = res.content.find((b) => b.type === "text");
      return text?.type === "text" ? text.text : "";
    }

    messages.push({ role: "assistant", content: res.content });

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;
      console.log(`[step ${step}] ${block.name}(${JSON.stringify(block.input)})`);
      let out: string;
      try {
        if (block.name === "calculator") out = calculator(CalcArgs.parse(block.input));
        else if (block.name === "search") out = search(SearchArgs.parse(block.input));
        else out = `Unknown tool: ${block.name}`;
      } catch (e) {
        out = `Tool error: ${(e as Error).message}`;
      }
      console.log(`[step ${step}]   → ${out}`);
      results.push({ type: "tool_result", tool_use_id: block.id, content: out });
    }

    messages.push({ role: "user", content: results });
  }

  return "Agent stopped: reached max steps.";
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("Set ANTHROPIC_API_KEY to run this example.");
    return;
  }
  const goal = process.argv[2] ?? "What is the population of France divided by 2?";
  console.log(`Goal: ${goal}\n`);
  console.log("\nFinal answer:", await runAgent(goal));
}

main().catch(console.error);
