/**
 * The network layer: every request in the app goes through fetchJson().
 *
 * - fetchJson  throws an ApiError on a bad HTTP status (fetch itself does not)
 * - delay      a promise-based wait that can be cancelled with an AbortSignal
 * - withRetry  retries a failing async function with exponential backoff
 *
 * It also publishes an event for every request (start / success / abort /
 * error) so the Network log panel can show what is really happening.
 */

/** An HTTP response that arrived but was not OK (status outside 200–299). */
export class ApiError extends Error {
  constructor(message, status, url) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}

/** Switches the toolbar toggles flip. Read by fetchJson on every request. */
export const network = {
  slow: false, // add a random 300–1500 ms delay before each request
  fail: false, // send every request to an endpoint that answers 503
};

const FAILING_URL = "https://dummyjson.com/http/503";
const TIMEOUT_MS = 8000;

// --- a tiny pub/sub, the same shape as the cart store's subscribe() ---
const listeners = new Set();
export function onNetworkEvent(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function emit(event) {
  listeners.forEach((listener) => listener(event));
}

let nextId = 1;

/** True when a request was cancelled on purpose (not a failure). */
export function isAbortError(err) {
  return err?.name === "AbortError";
}

/**
 * Wait `ms` milliseconds. If `signal` aborts first, reject with its reason
 * and clear the timer, so a cancelled wait does not linger.
 */
export function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

const randomBetween = (min, max) => Math.round(min + Math.random() * (max - min));

/**
 * GET a URL and return the parsed JSON body.
 * Rejects with: ApiError (bad status), AbortError (cancelled),
 * TimeoutError (took longer than TIMEOUT_MS) or TypeError (network down).
 */
export async function fetchJson(url, { signal } = {}) {
  // One signal that aborts when the caller cancels OR the timeout fires.
  const requestSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)])
    : AbortSignal.timeout(TIMEOUT_MS);

  const id = nextId++;
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);
  emit({ id, type: "start", url });

  try {
    if (network.slow) await delay(randomBetween(300, 1500), requestSignal);

    const response = await fetch(network.fail ? FAILING_URL : url, { signal: requestSignal });

    if (!response.ok) {
      // Error bodies are not always JSON (some servers send an HTML page), so never trust them.
      const body = await response.json().catch(() => null);
      throw new ApiError(body?.message ?? `HTTP ${response.status}`, response.status, url);
    }

    const data = await response.json();
    emit({ id, type: "success", url, ms: elapsed(), status: response.status });
    return data;
  } catch (err) {
    emit({ id, type: isAbortError(err) ? "abort" : "error", url, ms: elapsed(), error: err });
    throw err;
  }
}

/** Worth trying again? Server trouble and flaky networks, yes. Our own mistakes, no. */
function isRetryable(err) {
  if (isAbortError(err)) return false; // cancelled on purpose
  if (err instanceof ApiError) return err.status >= 500 || err.status === 429;
  return true; // TypeError (network down) or TimeoutError
}

/**
 * Call `fn`; if it fails with a retryable error, wait and try again.
 * Waits grow exponentially: baseMs, 2×baseMs, 4×baseMs … plus a little jitter.
 * `retries: 2` means up to 3 attempts in total.
 */
export async function withRetry(fn, { retries = 2, baseMs = 400, signal, onRetry } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const wait = baseMs * 2 ** attempt + randomBetween(0, 100);
      onRetry?.({ attempt: attempt + 1, wait, error: err });
      await delay(wait, signal);
    }
  }
}
