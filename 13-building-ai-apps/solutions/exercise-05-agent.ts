/**
 * Solution — Exercise 5: Minimal agent with two tools.
 *
 * Observe → decide → act loop with a hard step cap, a safe calculator, and a
 * mock search. Requires ANTHROPIC_API_KEY (network).
 *
 * Run: npx tsx solutions/exercise-05-agent.ts
 */
import { pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "calculator",
    description: "Evaluate a basic arithmetic expression. Use for any math.",
    input_schema: {
      type: "object",
      properties: { expression: { type: "string", description: "e.g. (2 + 3) * 4" } },
      required: ["expression"],
    },
  },
  {
    name: "search",
    description: "Look up a fact in the knowledge base. Use for factual lookups.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

const CalcArgs = z.object({ expression: z.string() });
function calculator(args: z.infer<typeof CalcArgs>): string {
  // Whitelist characters — NEVER eval() raw model output.
  if (!/^[0-9+\-*/(). ]+$/.test(args.expression)) return "Error: invalid characters";
  try {
    return String(Function(`"use strict"; return (${args.expression});`)());
  } catch {
    return "Error: could not evaluate";
  }
}

const SearchArgs = z.object({ query: z.string() });
const KB: Record<string, string> = {
  "population of france": "68000000",
  "speed of light": "299792458 meters per second",
};
function search(args: z.infer<typeof SearchArgs>): string {
  const key = Object.keys(KB).find((k) => args.query.toLowerCase().includes(k));
  return key ? KB[key] : "No results found.";
}

export async function runAgent(goal: string, maxSteps = 6): Promise<string> {
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
      console.log(`[step ${step}] tool=${block.name} args=${JSON.stringify(block.input)}`);

      let out: string;
      try {
        if (block.name === "calculator") out = calculator(CalcArgs.parse(block.input));
        else if (block.name === "search") out = search(SearchArgs.parse(block.input));
        else out = `Unknown tool: ${block.name}`;
      } catch (e) {
        out = `Tool error: ${(e as Error).message}`;
      }

      console.log(`[step ${step}] result=${out}`);
      results.push({ type: "tool_result", tool_use_id: block.id, content: out });
    }

    messages.push({ role: "user", content: results });
  }

  return "Agent stopped: reached max steps.";
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const answer = await runAgent("What is the population of France divided by 2?");
  console.log("\nFinal answer:", answer);
  // Expect: search → calculator → "34,000,000" (or similar).
}
