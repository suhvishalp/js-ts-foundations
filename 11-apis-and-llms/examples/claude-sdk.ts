// The same work as claude-fetch.ts and claude-stream.ts, done with the official
// SDK — the preferred approach for real projects.
// Requires: npm install @anthropic-ai/sdk   and   ANTHROPIC_API_KEY set.
// Run: npx tsx examples/claude-sdk.ts
//
// Compare this to the raw-fetch examples: no headers, no res.ok, no TextDecoder,
// no manual SSE parsing, no hand-written retry loop — and fully typed responses.
// The SDK retries 429/5xx with backoff by default (maxRetries, default 2).

import Anthropic from "@anthropic-ai/sdk";
import process from "node:process";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

async function nonStreaming(): Promise<void> {
  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 256,
    system: "You are a concise assistant.",
    messages: [{ role: "user", content: "In one sentence, what is a vector database?" }],
  });

  // content is a typed array of blocks; narrow to the text block.
  for (const block of message.content) {
    if (block.type === "text") console.log(block.text);
  }
  console.log(`[in=${message.usage.input_tokens} out=${message.usage.output_tokens}]`);
}

async function streaming(): Promise<void> {
  const stream = client.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 256,
    messages: [{ role: "user", content: "Write a two-line haiku about vectors." }],
  });

  // The SDK parses SSE for you and emits clean events.
  stream.on("text", (delta) => process.stdout.write(delta));

  const final = await stream.finalMessage(); // full typed message when done
  console.log(`\n[output_tokens=${final.usage.output_tokens}]`);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.log("Set ANTHROPIC_API_KEY to run this example.");
} else {
  await nonStreaming();
  await streaming();
}
