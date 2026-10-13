// Solution to Exercise 3 — Sequential vs parallel timing
// Run with: node exercise-03.js

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mockLLMCall(prompt, { ms = 100 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(`Completion for "${prompt}"`), ms);
  });
}

const prompts = ['p1', 'p2', 'p3', 'p4', 'p5'];

// Sequential: each `await` blocks the next iteration, so the calls run
// one after another. Total time ~= sum of all call durations.
async function runSequential(items) {
  const out = [];
  for (const p of items) {
    out.push(await mockLLMCall(p, { ms: 200 })); // waits 200ms EACH
  }
  return out;
}

// Parallel: start every call FIRST (map returns an array of pending promises),
// then await them together. Total time ~= the slowest single call.
async function runParallel(items) {
  const promises = items.map((p) => mockLLMCall(p, { ms: 200 })); // all start now
  return Promise.all(promises);
}

// Small timing helper: returns [result, elapsedMs].
async function timed(label, fn) {
  const t0 = Date.now();
  const result = await fn();
  const elapsed = Date.now() - t0;
  console.log(`${label}: ${elapsed}ms`);
  return [result, elapsed];
}

async function main() {
  const [, seqMs] = await timed('sequential', () => runSequential(prompts));
  const [, parMs] = await timed('parallel  ', () => runParallel(prompts));
  console.log(`speedup: ~${(seqMs / parMs).toFixed(1)}x`);

  // Approximate output:
  //   sequential: ~1000ms
  //   parallel  : ~200ms
  //   speedup: ~5.0x
  //
  // Takeaway: when calls are INDEPENDENT, never await them in a loop. Fire
  // them all, then Promise.all. Here that is a 5x win for just 5 items.
}

main();
