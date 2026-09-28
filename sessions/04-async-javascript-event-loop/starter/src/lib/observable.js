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
  // TODO(lab-5.1): return { subscribe(observerOrNext) } that calls the producer with a
  // "safe" observer (next/error/complete that stop once closed) and returns
  // { unsubscribe() } that runs the producer's teardown. For now: nothing happens.
  return {
    subscribe() {
      return { unsubscribe() {} };
    },
  };
}

/** DOM events as an observable. Unsubscribing removes the listener. */
export function fromEvent(target, type) {
  // TODO(lab-5.2): add a listener that calls observer.next(event), and return a
  // teardown function that removes it.
  return createObservable(() => {});
}
