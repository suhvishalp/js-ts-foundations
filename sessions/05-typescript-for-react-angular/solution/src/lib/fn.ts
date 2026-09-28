/** Small generic helpers. Each one works for any type, and keeps that type intact. */

/**
 * Delays `fn` until the calls stop for `ms`. `Args` captures the parameter list,
 * so the debounced function takes exactly what the original takes.
 */
export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, ms: number): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * A CONSTRAINT: T can be anything that has a numeric `id`. Products, cart lines and log
 * entries all qualify, and the result keeps its full type (Product in, Product out).
 */
export function byId<T extends { id: number }>(items: readonly T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}
