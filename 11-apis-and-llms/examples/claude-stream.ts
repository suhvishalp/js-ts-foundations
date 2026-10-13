// Streaming from the Anthropic Messages API with raw fetch + SSE parsing.
// Requires: ANTHROPIC_API_KEY in the environment.
// Run: npx tsx examples/claude-stream.ts
//
// Shows exactly what an SDK's `.stream()` does under the hood: read the
// ReadableStream, decode bytes, buffer partial lines, parse `data:` events.

import process from "node:process";

async function streamClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 512,
      stream: true, // <- request SSE streaming
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Streaming request failed: HTTP ${res.status}: ${detail}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Bytes may split multi-byte chars or mid-line — { stream: true } + buffer.
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep the trailing partial line for next read

    for (const line of lines) {
      if (!line.startsWith("data:")) continue; // ignore event: / blank lines
      const payload = line.slice(5).trim();
      if (!payload) continue;

      const event = JSON.parse(payload);
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        process.stdout.write(event.delta.text); // print each token as it arrives
        full += event.delta.text;
      } else if (event.type === "message_delta" && event.usage) {
        process.stdout.write(`\n[output_tokens=${event.usage.output_tokens}]\n`);
      }
    }
  }
  return full;
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.log("Set ANTHROPIC_API_KEY to run. See exercise-08 for parsing a captured stream offline.");
} else {
  await streamClaude("Write a two-line haiku about vectors.");
}
