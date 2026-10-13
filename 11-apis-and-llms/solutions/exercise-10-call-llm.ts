// Exercise 10 — reusable typed callLLM() with timeout + retry
// Requires: npm install zod   (and ANTHROPIC_API_KEY set to run it live)
// Run: npx tsx solutions/exercise-10-call-llm.ts
//
// This is the production-shaped helper. The SDK version at the bottom shows how
// much of this the official @anthropic-ai/sdk handles for you.

import process from "node:process";
import { z } from "zod";

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}
export interface CallLlmOptions {
  model?: string;
  maxTokens?: number;
  system?: string;
  timeoutMs?: number;
  maxAttempts?: number;
}
export interface LlmResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
  stopReason: string | null;
}

// Validate the response shape we depend on. The API is untrusted input.
const ResponseSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
  stop_reason: z.string().nullable(),
  usage: z.object({ input_tokens: z.number(), output_tokens: z.number() }),
});

const retryable = (s: number) => s === 408 || s === 429 || s >= 500;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function callLLM(
  messages: LlmMessage[],
  opts: CallLlmOptions = {},
): Promise<LlmResult> {
  const {
    model = "claude-sonnet-5",
    maxTokens = 1024,
    system,
    timeoutMs = 30_000,
    maxAttempts = 4,
  } = opts;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  // NOTE: `temperature` is optional (0.0–1.0); omit it to use the default.
  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages,
  });

  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        if (!retryable(res.status)) {
          throw new Error(`LLM HTTP ${res.status}: ${detail}`); // client error: stop
        }
        if (attempt < maxAttempts - 1) {
          const ra = Number(res.headers.get("retry-after"));
          const wait = Number.isFinite(ra) && ra > 0 ? ra * 1000 : 2 ** attempt * 1000;
          await sleep(wait + Math.random() * 250);
          continue;
        }
        throw new Error(`LLM HTTP ${res.status} after ${maxAttempts} attempts: ${detail}`);
      }

      const data = ResponseSchema.parse(await res.json());
      return {
        text: data.content.find((b) => b.type === "text")?.text ?? "",
        usage: {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
        },
        stopReason: data.stop_reason,
      };
    } catch (err) {
      lastErr = err;
      const aborted = err instanceof Error && err.name === "AbortError";
      const isRetryable = aborted || err instanceof TypeError; // TypeError ~ network
      if (isRetryable && attempt < maxAttempts - 1) {
        await sleep(2 ** attempt * 1000 + Math.random() * 250);
        continue;
      }
      throw lastErr;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error("callLLM: exhausted attempts");
}

// --- Demo (only runs live if ANTHROPIC_API_KEY is set) ---
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("Set ANTHROPIC_API_KEY to run this live. Logic is ready to go.");
  } else {
    const result = await callLLM(
      [{ role: "user", content: "Name three vector databases, comma-separated." }],
      { system: "Answer with only a comma-separated list.", maxTokens: 64 },
    );
    console.log(result.text);
    console.log(`tokens in=${result.usage.inputTokens} out=${result.usage.outputTokens}`);
    console.log("stop_reason:", result.stopReason);
  }
}

// --- The same call with the official SDK (npm install @anthropic-ai/sdk) ---
// Look how much disappears: no headers, no res.ok, no retry loop, no Zod — and
// the response is fully typed. This is why you use the SDK in production.
//
//   import Anthropic from "@anthropic-ai/sdk";
//   const client = new Anthropic(); // reads ANTHROPIC_API_KEY
//   const msg = await client.messages.create({
//     model: "claude-sonnet-5",
//     max_tokens: 64,
//     system: "Answer with only a comma-separated list.",
//     messages: [{ role: "user", content: "Name three vector databases." }],
//   });
//   const text = msg.content.find((b) => b.type === "text")?.text ?? "";
//   console.log(text, msg.usage.output_tokens);
