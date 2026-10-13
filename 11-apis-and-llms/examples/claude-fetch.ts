// The minimal raw-fetch call to the Anthropic Messages API.
// Requires: npm install zod   and   ANTHROPIC_API_KEY in the environment.
// Run: npx tsx examples/claude-fetch.ts
//
// This is the "what's underneath the SDK" example. Every line is deliberate.

import process from "node:process";
import { z } from "zod";

// Validate only the fields we use. API responses are untrusted input.
const MessageResponseSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
  stop_reason: z.string().nullable(),
  usage: z.object({ input_tokens: z.number(), output_tokens: z.number() }),
});

async function askClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,              // Anthropic's auth header
      "anthropic-version": "2023-06-01", // required API version
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 256,
      temperature: 0, // optional (0.0–1.0); 0 = most deterministic
      messages: [{ role: "user", content: prompt }],
    }),
  });

  // fetch does NOT throw on 4xx/5xx — check yourself and read the error body.
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic API HTTP ${res.status}: ${detail}`);
  }

  const data = MessageResponseSchema.parse(await res.json());
  console.log(`[in=${data.usage.input_tokens} out=${data.usage.output_tokens} stop=${data.stop_reason}]`);
  // The text lives in the first text-type content block.
  return data.content.find((b) => b.type === "text")?.text ?? "";
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.log("Set ANTHROPIC_API_KEY to run. The code above is the reference implementation.");
} else {
  console.log(await askClaude("In one sentence, what is a vector database?"));
}
