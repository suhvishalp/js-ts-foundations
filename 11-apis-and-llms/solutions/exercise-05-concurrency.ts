// Exercise 5 — Bounded concurrency
// Run: npx tsx solutions/exercise-05-concurrency.ts
//
// Prove the pool never exceeds `limit` in-flight calls by tracking a live
// counter and recording its peak.

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run(): Promise<void> {
    while (next < items.length) {
      const current = next++; // atomically claim an index (single-threaded JS)
      results[current] = await worker(items[current]!, current);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(runners);
  return results;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const items = Array.from({ length: 20 }, (_, i) => i);
  let active = 0;
  let peak = 0;

  const results = await mapWithConcurrency(items, 3, async (n) => {
    active++;
    peak = Math.max(peak, active);
    try {
      await sleep(30 + Math.random() * 40); // simulate a network call
      return n * n;
    } finally {
      active--; // always release the slot
    }
  });

  console.log("first 5 results:", results.slice(0, 5)); // [0, 1, 4, 9, 16]
  console.log("peak concurrency:", peak, "(should be <= 3)");
}

main();
