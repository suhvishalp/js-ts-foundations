/**
 * Session 4's closure store, made generic. Write it once; use it for a cart, for request
 * state, for anything. T is fixed by the initial value, so every later call is checked.
 */
export type Listener<T> = (state: T, prev: T) => void;
export type Updater<T> = (state: T) => T;

export interface Store<T> {
  getState(): T;
  setState(updater: Updater<T>): void;
  subscribe(listener: Listener<T>): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener<T>>();

  return {
    getState: () => state,
    setState(updater) {
      const prev = state;
      const next = updater(prev);
      if (Object.is(next, prev)) return; // same reference: nothing changed, nobody is notified
      state = next;
      listeners.forEach((listener) => listener(next, prev));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
