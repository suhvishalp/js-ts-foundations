/**
 * The one place the app talks HTTP. Session 4 wrote this in JavaScript; the logic is the
 * same here, and the types are still loose.
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

// TODO(lab-5.4): `any` in, `boolean` out tells the compiler nothing. Take `unknown`, and return
// the TYPE PREDICATE `value is ApiError`. Then change toApiError's parameter to `unknown` too.
export function isApiError(value: any): boolean {
  return value instanceof ApiError;
}

/** `controller.abort()` makes fetch reject with a DOMException named "AbortError". It is not a failure. */
export function isAbortError(value: unknown): boolean {
  return value instanceof DOMException && value.name === 'AbortError';
}

/** A `catch` gives you `unknown`. This turns whatever was thrown into the one error type the UI renders. */
export function toApiError(value: any, url = ''): ApiError {
  if (isApiError(value)) return value;
  if (value instanceof Error) return new ApiError(value.message, 0, url);
  return new ApiError(String(value), 0, url);
}

export interface RequestOptions {
  signal?: AbortSignal;
}

// TODO(lab-5.3): Promise<any> means every caller gets `any` back. Make it fetchJson<T>(…): Promise<T>
// and return `(await res.json()) as T`. Do the same for withRetry below: withRetry<T>(task: () => Promise<T>, …): Promise<T>.
export async function fetchJson(url: string, { signal }: RequestOptions = {}): Promise<any> {
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
  return res.json();
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

/** Runs `task` and retries retryable ApiErrors with exponential backoff. */
export async function withRetry(
  task: () => Promise<any>,
  { retries = 2, baseMs = 400, signal, onRetry }: RetryOptions = {},
): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await task();
    } catch (err: any) {
      if (!isApiError(err) || !err.retryable || attempt >= retries) throw err;
      onRetry?.(attempt + 1, err);
      await delay(baseMs * 2 ** attempt, signal);
    }
  }
}
