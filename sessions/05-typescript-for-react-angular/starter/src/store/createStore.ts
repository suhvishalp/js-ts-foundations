/**
 * Session 4's closure store. It works for a cart, for request state, for anything,
 * and today the compiler knows nothing about what is inside it.
 */

// TODO(lab-5.3): make the store generic. Add Listener<T>, Updater<T> and an interface Store<T>
// { getState(): T; setState(updater: Updater<T>): void; subscribe(listener: Listener<T>): () => void },
// then write createStore<T>(initial: T): Store<T>.
export function createStore(initial: any) {
  let state = initial;
  const listeners = new Set<(state: any, prev: any) => void>();

  return {
    getState: () => state,
    setState(updater: (state: any) => any) {
      const prev = state;
      const next = updater(prev);
      if (Object.is(next, prev)) return; // same reference: nothing changed, nobody is notified
      state = next;
      listeners.forEach((listener) => listener(next, prev));
    },
    subscribe(listener: (state: any, prev: any) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
