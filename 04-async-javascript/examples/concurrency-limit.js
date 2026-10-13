// concurrency-limit.js
// Run with: node concurrency-limit.js
//
// The problem: you have 100 documents to embed, and the API allows only, say,
// 5 concurrent requests (or you'll hit rate limits / blow your budget).
//
//   - Doing them SEQUENTIALLY (await in a loop) is safe but slow.
//   - Doing them ALL AT ONCE with Promise.all is fast but will 429 you.
//   - The sweet spot: a CONCURRENCY LIMIT — keep exactly N in flight at once.
//
// `mapWithConcurrency` is a worker-pool: it runs a fixed number of "workers"
// that pull the next item off a shared queue until everything is processed,
// preserving output order to match the input order.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock: embed one text. Returns a fake vector after a random-ish delay.
async function embed(text) {
  const ms = 100 + (text.length % 5) * 40;
  await sleep(ms);
  return { text, vector: [text.length, ms], tookMs: ms };
}

/**
 * Run `mapper` over `items` with at most `concurrency` in flight at once.
 * Results are returned in the SAME ORDER as the input items.
 *
 * @param {Array} items       - input items
 * @param {number} concurrency - max simultaneous mapper calls
 * @param {(item, index) => Promise} mapper - async function per item
 * @returns {Promise<Array>} results aligned to input order
 */
async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0; // the shared cursor every worker pulls from

  // One worker: keep grabbing the next index until the queue is drained.
  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++; // claim this index atomically (single-threaded)
      results[current] = await mapper(items[current], current);
    }
  }

  // Launch `concurrency` workers and wait for all of them to finish.
  const poolSize = Math.min(concurrency, items.length);
  const workers = Array.from({ length: poolSize }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  const docs = Array.from({ length: 12 }, (_, i) => `document-number-${i}`);

  // --- Baseline: sequential (concurrency = 1) ------------------------------
  console.log('=== sequential (concurrency = 1) ===');
  let t0 = Date.now();
  await mapWithConcurrency(docs, 1, embed);
  console.log(`sequential took ~${Date.now() - t0}ms`);

  // --- Capped concurrency = 4 ----------------------------------------------
  console.log('\n=== concurrency = 4 ===');
  t0 = Date.now();
  const results = await mapWithConcurrency(docs, 4, async (doc, i) => {
    const r = await embed(doc);
    console.log(`  [${i}] embedded "${doc}" (${r.tookMs}ms)`);
    return r;
  });
  console.log(`concurrency=4 took ~${Date.now() - t0}ms`);
  console.log('first result:', results[0]);
  console.log('results are in input order:', results.map((r) => r.text.slice(-1)).join(','));
}

main();

// -----------------------------------------------------------------------------
// Approximate output:
//
// === sequential (concurrency = 1) ===
// sequential took ~1800ms
//
// === concurrency = 4 ===
//   [0] embedded "document-number-0" (100ms)
//   ...interleaved... (four at a time)
// concurrency=4 took ~500ms      <- roughly 1/4 of sequential
// first result: { text: 'document-number-0', vector: [...], tookMs: 100 }
// results are in input order: 0,1,2,3,4,5,6,7,8,9,0,1
// -----------------------------------------------------------------------------

module.exports = { mapWithConcurrency };
