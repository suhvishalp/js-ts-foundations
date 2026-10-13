// Exercise 8 — Parse an SSE stream (no network)
// Run: npx tsx solutions/exercise-08-parse-sse.ts
//
// A captured Anthropic streaming response. The parser must ignore `event:` and
// blank lines, act only on `data:` payloads, concatenate text_deltas, and pull
// the final output token count from message_delta.

const CAPTURED_STREAM = `event: message_start
data: {"type":"message_start","message":{"id":"msg_01","role":"assistant","content":[],"usage":{"input_tokens":12,"output_tokens":0}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Vectors "}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"drift "}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"through space."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":9}}

event: message_stop
data: {"type":"message_stop"}
`;

interface StreamEvent {
  type: string;
  delta?: { type?: string; text?: string; stop_reason?: string };
  usage?: { output_tokens?: number };
}

function parseSse(stream: string): { text: string; outputTokens: number } {
  let text = "";
  let outputTokens = 0;

  for (const line of stream.split("\n")) {
    if (!line.startsWith("data:")) continue; // skip event: and blank lines
    const payload = line.slice(5).trim();
    if (!payload) continue;

    const event = JSON.parse(payload) as StreamEvent;
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
      text += event.delta.text ?? "";
    } else if (event.type === "message_delta" && event.usage?.output_tokens != null) {
      outputTokens = event.usage.output_tokens;
    }
  }
  return { text, outputTokens };
}

const { text, outputTokens } = parseSse(CAPTURED_STREAM);
console.log("reconstructed text:", JSON.stringify(text)); // "Vectors drift through space."
console.log("output tokens:", outputTokens); // 9
