/**
 * Example: the full tool-use (function-calling) loop, Anthropic-shaped.
 *
 * Setup:
 *   npm install @anthropic-ai/sdk zod
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *
 * Run: npx tsx examples/tool-use-loop.ts
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

// --- Tool: definition (for the model) + validation schema + implementation ---
const WeatherArgs = z.object({
  location: z.string(),
  unit: z.enum(["celsius", "fahrenheit"]).default("celsius"),
});

const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description: "Get the current weather for a location. Call whenever the user asks about weather.",
    input_schema: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name, e.g. Tokyo" },
        unit: { type: "string", enum: ["celsius", "fahrenheit"] },
      },
      required: ["location"],
    },
  },
];

function getWeather(args: z.infer<typeof WeatherArgs>): string {
  const temp = args.unit === "fahrenheit" ? "72°F" : "22°C";
  return `${temp} and sunny in ${args.location}`; // mocked; call a real API here
}

async function runWithTools(userMessage: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMessage }];

  for (let step = 0; step < 5; step++) {
    const res = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      tools,
      messages,
    });

    if (res.stop_reason !== "tool_use") {
      const text = res.content.find((b) => b.type === "text");
      return text?.type === "text" ? text.text : "";
    }

    messages.push({ role: "assistant", content: res.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;

      let out: string;
      let isError = false;
      try {
        if (block.name === "get_weather") out = getWeather(WeatherArgs.parse(block.input));
        else {
          out = `Unknown tool: ${block.name}`;
          isError = true;
        }
      } catch (e) {
        out = `Tool error: ${(e as Error).message}`;
        isError = true;
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id, // must match the request
        content: out,
        is_error: isError,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return "Stopped: exceeded max tool iterations.";
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("Set ANTHROPIC_API_KEY to run this example.");
    return;
  }
  console.log(await runWithTools("What's the weather in Tokyo?"));
}

main().catch(console.error);
