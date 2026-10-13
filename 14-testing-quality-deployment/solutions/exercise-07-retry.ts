// solutions/exercise-07-retry.ts
// Exercise 7 — Retry wrapper with backoff, tested deterministically with fake timers.
// Run:  npx vitest run solutions/exercise-07-retry.ts

import { describe, it, expect, vi, afterEach } from "vitest";

// ---- Implementation ----
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
      // Retry rate-limits (429), server errors (5xx), and unknown/network errors.
      const retryable = status === 429 || (status ?? 0) >= 500 || status === undefined;
      if (!retryable || attempt === retries) throw err;
      const delay = baseMs * 2 ** attempt + Math.random() * 100;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function httpError(status: number): Error {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

// ---- Tests ----
afterEach(() => vi.useRealTimers());

describe("withRetries", () => {
  it("retries transient 503s then returns the success value", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(httpError(503))
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce("ok");

    const promise = withRetries(fn, { retries: 3, baseMs: 100 });
    // Flush all pending backoff timers so the retries proceed without real waiting.
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does NOT retry a 400 (bad request)", async () => {
    vi.useFakeTimers();
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(httpError(400));

    const promise = withRetries(fn, { retries: 3, baseMs: 100 });
    // Attach rejection expectation, then advance timers (none should be scheduled).
    const assertion = expect(promise).rejects.toThrow(/HTTP 400/);
    await vi.runAllTimersAsync();
    await assertion;

    expect(fn).toHaveBeenCalledOnce();
  });

  it("gives up after exhausting retries and rethrows the last error", async () => {
    vi.useFakeTimers();
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(httpError(500));

    const promise = withRetries(fn, { retries: 2, baseMs: 100 });
    const assertion = expect(promise).rejects.toThrow(/HTTP 500/);
    await vi.runAllTimersAsync();
    await assertion;

    // 1 initial attempt + 2 retries = 3 calls.
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
