// examples/resilient-model.ts
// A production-shaped, LAYERED model wrapper: observability + retries + timeout,
// all built on a single `ChatModel` interface. Each layer does one job and can be
// tested independently. This demonstrates the decorator pattern for AI apps.
//
// Run the demo:  npx tsx examples/resilient-model.ts
// (Uses a fake flaky model — no network, no API key needed.)

import { pathToFileURL } from "node:url";

export interface ChatModel {
  complete(prompt: string): Promise<string>;
}

// ---------- Layer 1: retries with exponential backoff + jitter ----------

export async function withRetries<T>(
  fn: () => Promise<T>,
  { retries = 3, baseMs = 300 }: { retries?: number; baseMs?: number } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      const retryable = status === 429 || (status ?? 0) >= 500 || status === undefined;
      if (!retryable || attempt === retries) throw err;
      const delay = baseMs * 2 ** attempt + Math.random() * 100;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export function withRetry(inner: ChatModel, opts?: { retries?: number; baseMs?: number }): ChatModel {
  return { complete: (prompt) => withRetries(() => inner.complete(prompt), opts) };
}

// ---------- Layer 2: timeout ----------

export function withTimeout(inner: ChatModel, ms = 15_000): ChatModel {
  return {
    async complete(prompt) {
      return Promise.race([
        inner.complete(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error("timeout"), { status: 504 })), ms),
        ),
      ]);
    },
  };
}

// ---------- Layer 3: observability (logs latency, tokens, cost) ----------

interface Logger {
  info(obj: object, msg: string): void;
  error(obj: object, msg: string): void;
}

const PRICING: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.00015, out: 0.0006 },
};

export function withObservability(inner: ChatModel, model: string, log: Logger = console as unknown as Logger): ChatModel {
  return {
    async complete(prompt) {
      const start = performance.now();
      const requestId = crypto.randomUUID();
      log.info({ requestId, model, promptChars: prompt.length }, "llm.request");
      try {
        const answer = await inner.complete(prompt);
        const latencyMs = Math.round(performance.now() - start);
        const inTok = Math.ceil(prompt.length / 4);
        const outTok = Math.ceil(answer.length / 4);
        const price = PRICING[model];
        const costUsd = price ? (inTok / 1000) * price.in + (outTok / 1000) * price.out : undefined;
        log.info({ requestId, model, latencyMs, inTok, outTok, costUsd }, "llm.response");
        return answer;
      } catch (err) {
        log.error({ requestId, model, err: String(err) }, "llm.error");
        throw err;
      }
    },
  };
}

// ---------- Demo: a fake model that fails twice, then succeeds ----------
// Wrapped in an async function (not top-level await) so it runs under both
// ESM and CommonJS regardless of the project's package.json "type".

async function demo() {
  let calls = 0;
  const flakyModel: ChatModel = {
    async complete(prompt) {
      calls++;
      if (calls < 3) throw Object.assign(new Error("service unavailable"), { status: 503 });
      return `Answer to "${prompt}" on attempt ${calls}`;
    },
  };

  // Compose the layers: observability(retry(timeout(model)))
  const model = withObservability(withRetry(withTimeout(flakyModel), { baseMs: 50 }), "gpt-4o-mini");

  const answer = await model.complete("What is retrieval-augmented generation?");
  console.log("\nFinal answer:", answer);
  console.log(`(Succeeded after ${calls} attempts — the 503s were retried transparently.)`);
}

// pathToFileURL handles paths with spaces/special chars correctly (a plain
// `file://${process.argv[1]}` comparison breaks on those).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  demo().catch((err) => {
    console.error("Demo failed:", err);
    process.exit(1);
  });
}
