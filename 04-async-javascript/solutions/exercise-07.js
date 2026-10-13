// Solution to Exercise 7 — mapWithConcurrency
// Run with: node exercise-07.js

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mock embed with a small, deterministic-ish delay.
async function embed(text) {
  await sleep(100 + (text.length % 3) * 30);
  return { text, vector: [text.length] };
}

/**
 * Map `mapper` over `items` with at most `concurrency` calls in flight.
 * Results are returned in INPUT ORDER.
 *
 * The trick: launch a fixed pool of `concurrency` "workers". Each worker loops,
 * claiming the next index off a shared cursor (`nextIndex++`) and awaiting the
 * mapper, until the queue is drained. Because JS is single-threaded, `nextIndex++`
 * is atomic, so no two workers ever grab the same item.
 */
async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  // --- Instrumentation to PROVE the cap holds -------------------------------
  let inFlight = 0;
  let maxInFlight = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;      // claim this index
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      try {
        results[i] = await mapper(items[i], i);
      } finally {
        inFlight -= 1;
      }
    }
  }

  const poolSize = Math.min(concurrency, items.length);
  const workers = Array.from({ length: poolSize }, () => worker());
  await Promise.all(workers);

  return { results, maxInFlight };
}

async function main() {
  const docs = Array.from({ length: 20 }, (_, i) => `doc-${i}`);

  for (const cap of [1, 4, 20]) {
    const t0 = Date.now();
    const { results, maxInFlight } = await mapWithConcurrency(docs, cap, embed);
    const elapsed = Date.now() - t0;
    console.log(
      `concurrency=${String(cap).padEnd(2)} | time ~${elapsed}ms | ` +
      `maxInFlight observed=${maxInFlight} | order ok=${results[0].text === 'doc-0'}`
    );
  }

  // Approximate output (times vary a little):
  //   concurrency=1  | time ~2400ms | maxInFlight observed=1  | order ok=true
  //   concurrency=4  | time ~600ms  | maxInFlight observed=4  | order ok=true
  //   concurrency=20 | time ~160ms  | maxInFlight observed=20 | order ok=true
  //
  // Notes:
  //   - maxInFlight never exceeds the cap -> the concurrency limit holds.
  //   - results[0] is always 'doc-0' -> output order matches input order.
  //   - Higher concurrency is faster, but in production you cap it to stay
  //     under the provider's rate limit.
}

main();

module.exports = { mapWithConcurrency };
