// Exercise 4 — fetchWithRetry (testable with a mock, no network needed)
// Run: npx tsx solutions/exercise-04-fetch-with-retry.ts

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Accept an injectable `fetchFn` so we can test without real network calls.
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  maxAttempts = 4,
  fetchFn: FetchFn = fetch,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetchFn(url, init);
      if (res.ok || !isRetryableStatus(res.status)) return res;

      if (attempt < maxAttempts - 1) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const backoff =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 2 ** attempt * 50; // small base for a fast demo (use 1000 in prod)
        await sleep(backoff + Math.random() * 25);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err; // network error -> retryable
      if (attempt < maxAttempts - 1) {
        await sleep(2 ** attempt * 50 + Math.random() * 25);
        continue;
      }
      throw lastError;
    }
  }
  throw lastError ?? new Error("exhausted attempts");
}

// --- Test with a mock that fails 503 twice, then succeeds ---
async function main(): Promise<void> {
  let attempts = 0;
  const mockFetch: FetchFn = async () => {
    attempts++;
    if (attempts < 3) {
      return new Response("overloaded", { status: 503 });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const res = await fetchWithRetry("https://example.test/x", {}, 4, mockFetch);
  console.log("final status:", res.status); // 200
  console.log("attempts made:", attempts); // 3
  console.log("body:", await res.json()); // { ok: true }
}

main();
