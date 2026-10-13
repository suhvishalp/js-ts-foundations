// retry-backoff.js
// Run with: node retry-backoff.js
//
// LLM and embedding APIs return 429 (rate limited) and 5xx (transient) errors.
// The correct response is NOT to give up or to hammer the server immediately,
// but to RETRY with EXPONENTIAL BACKOFF and JITTER:
//   - exponential: wait longer after each failure (base * 2^attempt)
//   - jitter: add randomness so many clients don't retry in lockstep
//   - a cap on max retries and (optionally) max delay
//   - only retry errors that are actually retryable (429 / 5xx / network),
//     never a 400 "bad request" which will fail again identically.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A fake error type that carries an HTTP-like status code.
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Decide whether an error is worth retrying.
function isRetryable(err) {
  if (err instanceof ApiError) {
    return err.status === 429 || err.status >= 500;
  }
  // Network-ish errors (no status) are usually transient -> retry.
  return true;
}

// The core helper. Runs `fn` (a function returning a promise) and retries it
// with exponential backoff + jitter on retryable failures.
async function retryWithBackoff(fn, {
  maxRetries = 5,
  baseDelayMs = 100,
  maxDelayMs = 5000,
  isRetryable: retryable = isRetryable,
} = {}) {
  let attempt = 0;
  // Loop: attempt 0 is the first try, then up to `maxRetries` more tries.
  while (true) {
    try {
      return await fn(attempt);
    } catch (err) {
      // Give up if it's not retryable, or we've exhausted our attempts.
      if (!retryable(err) || attempt >= maxRetries) {
        throw err;
      }
      // Exponential base delay: base * 2^attempt, capped at maxDelayMs.
      const backoff = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      // Full jitter: pick a random delay in [0, backoff].
      const delay = Math.random() * backoff;
      console.log(
        `  attempt ${attempt + 1} failed (${err.message}); ` +
        `retrying in ${Math.round(delay)}ms`
      );
      await sleep(delay);
      attempt += 1;
    }
  }
}

// --- Demo: an endpoint that fails a few times, then succeeds ----------------
function makeFlakyEndpoint(failTimes) {
  let calls = 0;
  return async () => {
    calls += 1;
    if (calls <= failTimes) {
      throw new ApiError(`429 Too Many Requests (call ${calls})`, 429);
    }
    return `success on call ${calls}`;
  };
}

async function main() {
  console.log('=== flaky endpoint (fails 3x, then succeeds) ===');
  const flaky = makeFlakyEndpoint(3);
  const result = await retryWithBackoff(flaky, { baseDelayMs: 50, maxRetries: 5 });
  console.log('final result:', result);

  console.log('\n=== non-retryable error (400) gives up immediately ===');
  const badRequest = async () => {
    throw new ApiError('400 Bad Request', 400);
  };
  try {
    await retryWithBackoff(badRequest, { baseDelayMs: 50 });
  } catch (err) {
    console.log('did not retry, threw:', err.message);
  }

  console.log('\n=== exhausting retries ===');
  const alwaysFails = makeFlakyEndpoint(Infinity);
  try {
    await retryWithBackoff(alwaysFails, { baseDelayMs: 20, maxRetries: 2 });
  } catch (err) {
    console.log('gave up after retries:', err.message);
  }
}

main();

// -----------------------------------------------------------------------------
// Approximate output (delays are random due to jitter):
//
// === flaky endpoint (fails 3x, then succeeds) ===
//   attempt 1 failed (429 Too Many Requests (call 1)); retrying in 31ms
//   attempt 2 failed (429 Too Many Requests (call 2)); retrying in 74ms
//   attempt 3 failed (429 Too Many Requests (call 3)); retrying in 160ms
// final result: success on call 4
//
// === non-retryable error (400) gives up immediately ===
// did not retry, threw: 400 Bad Request
//
// === exhausting retries ===
//   attempt 1 failed (...); retrying in ...ms
//   attempt 2 failed (...); retrying in ...ms
//   attempt 3 failed (...); retrying in ...ms
// gave up after retries: 429 Too Many Requests (call 3)
// -----------------------------------------------------------------------------

module.exports = { retryWithBackoff, ApiError, isRetryable };
