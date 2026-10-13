/**
 * The Observable idea in about 30 lines: the mental model behind RxJS and
 * Angular's HttpClient.
 *
 * An observable is a function waiting to be called. Nothing happens until
 * you subscribe (lazy). Once subscribed it can deliver many values over time
 * (next), then finish (complete) or fail (error). Unsubscribing runs the
 * teardown the producer returned, which is how cancellation works.
 */
export function createObservable(subscribe) {
  return {
    subscribe(observerOrNext) {
      // Accept a plain function as shorthand for { next }.
      const observer = typeof observerOrNext === "function" ? { next: observerOrNext } : observerOrNext;

      let closed = false;
      let teardown = null;
      const cleanup = () => {
        if (typeof teardown === "function") teardown();
        teardown = null;
      };

      // After error/complete/unsubscribe, nothing else reaches the observer.
      const safe = {
        next: (value) => { if (!closed) observer.next?.(value); },
        error: (err) => { if (!closed) { closed = true; observer.error?.(err); cleanup(); } },
        complete: () => { if (!closed) { closed = true; observer.complete?.(); cleanup(); } },
      };

      teardown = subscribe(safe);
      if (closed) cleanup(); // the producer finished synchronously

      return {
        unsubscribe() {
          if (closed) return;
          closed = true;
          cleanup();
        },
      };
    },
  };
}

/** DOM events as an observable. Unsubscribing removes the listener. */
export function fromEvent(target, type) {
  return createObservable((observer) => {
    const handler = (event) => observer.next(event);
    target.addEventListener(type, handler);
    return () => target.removeEventListener(type, handler);
  });
}
