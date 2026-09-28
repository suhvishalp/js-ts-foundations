/** Small helpers. Today they work for anything by throwing the types away. */

// TODO(lab-5.3): make both helpers generic.
// debounce<Args extends unknown[]>(fn: (...args: Args) => void, ms: number): (...args: Args) => void
// byId<T extends { id: number }>(items: readonly T[], id: number): T | undefined
export function debounce(fn: (...args: any[]) => void, ms: number) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function byId(items: any[], id: number): any {
  return items.find((item) => item.id === id);
}
