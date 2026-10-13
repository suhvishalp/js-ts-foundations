/**
 * The one place the app talks HTTP. Session 4 wrote this in JavaScript; here every
 * function says what it takes and what it promises back.
 */

/** A failed request, with the facts the UI needs. `status` is 0 when there was no HTTP response at all. */
export class ApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
  }

  /** 5xx and "no response" are worth retrying; a 404 will be a 404 again. */
  get retryable(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

/** A TYPE GUARD: returns a boolean at runtime, and tells the compiler what `value` is when it is true. */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** `controller.abort()` makes fetch reject with a DOMException named "AbortError". It is not a failure. */
export function isAbortError(value: unknown): boolean {
  return value instanceof DOMException && value.name === 'AbortError';
}

/** A `catch` gives you `unknown`. This turns whatever was thrown into the one error type the UI renders. */
export function toApiError(value: unknown, url = ''): ApiError {
  if (isApiError(value)) return value;
  if (value instanceof Error) return new ApiError(value.message, 0, url);
  return new ApiError(String(value), 0, url);
}

export interface RequestOptions {
  signal?: AbortSignal;
}

/**
 * GET a URL and parse JSON as `T`. The caller chooses T: `fetchJson<Category[]>(url)`.
 * Honest note: `res.json()` is `any`, and `as T` is a promise TypeScript cannot check.
 * When the shape matters, ask for `unknown` and validate it (see products.ts).
 */
export async function fetchJson<T>(url: string, { signal }: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err: unknown) {
    if (isAbortError(err)) throw err; // cancellation is not an ApiError
    throw toApiError(err, url); // offline, DNS, CORS: no HTTP response
  }
  if (!res.ok) {
    throw new ApiError(`${res.status} ${res.statusText || 'Request failed'}`, res.status, url);
  }
  return (await res.json()) as T;
}

/** Resolves after `ms`, or rejects straight away if the signal aborts first. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

export interface RetryOptions extends RequestOptions {
  retries?: number;
  baseMs?: number;
  onRetry?: (attempt: number, error: ApiError) => void;
}

/** Runs `task` and retries retryable ApiErrors with exponential backoff. Whatever T the task returns, you get back. */
export async function withRetry<T>(
  task: () => Promise<T>,
  { retries = 2, baseMs = 400, signal, onRetry }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await task();
    } catch (err: unknown) {
      if (!isApiError(err) || !err.retryable || attempt >= retries) throw err;
      onRetry?.(attempt + 1, err);
      await delay(baseMs * 2 ** attempt, signal);
    }
  }
}
