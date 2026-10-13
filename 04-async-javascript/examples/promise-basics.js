// promise-basics.js
// Run with: node promise-basics.js
//
// Demonstrates: creating promises, then/catch/finally, chaining,
// error propagation, and the four combinators (all/allSettled/race/any).
// Everything is mocked with setTimeout so it runs offline.

// A mock "call an LLM" function. Resolves after `ms` with a fake completion,
// or rejects if `shouldFail` is true (simulating an API error).
function mockLLMCall(prompt, { ms = 100, shouldFail = false } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(`LLM call failed for prompt: "${prompt}"`));
      } else {
        resolve(`Completion for "${prompt}"`);
      }
    }, ms);
  });
}

async function main() {
  // --- 1. Basic then/catch/finally -----------------------------------------
  console.log('=== 1. then/catch/finally ===');
  await mockLLMCall('hello', { ms: 50 })
    .then((text) => console.log('resolved:', text))
    .catch((err) => console.log('caught:', err.message))
    .finally(() => console.log('finally: always runs (cleanup, close spinner)'));

  // --- 2. Chaining + error propagation -------------------------------------
  // A rejection anywhere in the chain skips all following .then handlers and
  // jumps to the next .catch. This is how errors "propagate" through a chain.
  console.log('\n=== 2. chaining + error propagation ===');
  await mockLLMCall('step 1', { ms: 30 })
    .then((r1) => {
      console.log('got:', r1);
      return mockLLMCall('step 2', { ms: 30, shouldFail: true }); // rejects
    })
    .then((r2) => {
      // SKIPPED, because the previous step rejected.
      console.log('this never runs:', r2);
    })
    .catch((err) => console.log('chain error caught:', err.message));

  // --- 3. Promise.all: fail-fast batch -------------------------------------
  // Use when you need EVERY result and want to abort if any fails.
  console.log('\n=== 3. Promise.all (fail-fast batch) ===');
  try {
    const results = await Promise.all([
      mockLLMCall('a', { ms: 40 }),
      mockLLMCall('b', { ms: 60 }),
      mockLLMCall('c', { ms: 20 }),
    ]);
    console.log('all resolved:', results);
  } catch (err) {
    console.log('Promise.all rejected because one failed:', err.message);
  }

  // --- 4. Promise.allSettled: never rejects --------------------------------
  // Use when you want every outcome (success OR failure) — e.g. a batch
  // embedding job where partial failures are acceptable and reported.
  console.log('\n=== 4. Promise.allSettled (report every outcome) ===');
  const settled = await Promise.allSettled([
    mockLLMCall('doc-1', { ms: 30 }),
    mockLLMCall('doc-2', { ms: 30, shouldFail: true }),
    mockLLMCall('doc-3', { ms: 30 }),
  ]);
  settled.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      console.log(`  [${i}] ok    -> ${res.value}`);
    } else {
      console.log(`  [${i}] error -> ${res.reason.message}`);
    }
  });

  // --- 5. Promise.race: first to settle wins (used for timeouts) -----------
  console.log('\n=== 5. Promise.race (timeout guard) ===');
  function timeout(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
    );
  }
  try {
    const winner = await Promise.race([
      mockLLMCall('slow request', { ms: 500 }),
      timeout(100),
    ]);
    console.log('race winner:', winner);
  } catch (err) {
    console.log('race lost to timeout:', err.message);
  }

  // --- 6. Promise.any: first SUCCESS wins (redundant providers) ------------
  // Ignores rejections; resolves with the first fulfilled value. Rejects only
  // if ALL reject (with an AggregateError).
  console.log('\n=== 6. Promise.any (first successful provider) ===');
  try {
    const fastest = await Promise.any([
      mockLLMCall('via provider A', { ms: 200, shouldFail: true }),
      mockLLMCall('via provider B', { ms: 80 }),
      mockLLMCall('via provider C', { ms: 120 }),
    ]);
    console.log('first successful:', fastest);
  } catch (err) {
    // err is an AggregateError when everything fails
    console.log('all providers failed:', err.message);
  }
}

main();

// -----------------------------------------------------------------------------
// Approximate output:
//
// === 1. then/catch/finally ===
// resolved: Completion for "hello"
// finally: always runs (cleanup, close spinner)
//
// === 2. chaining + error propagation ===
// got: Completion for "step 1"
// chain error caught: LLM call failed for prompt: "step 2"
//
// === 3. Promise.all (fail-fast batch) ===
// all resolved: [ 'Completion for "a"', 'Completion for "b"', 'Completion for "c"' ]
//
// === 4. Promise.allSettled (report every outcome) ===
//   [0] ok    -> Completion for "doc-1"
//   [1] error -> LLM call failed for prompt: "doc-2"
//   [2] ok    -> Completion for "doc-3"
//
// === 5. Promise.race (timeout guard) ===
// race lost to timeout: timed out after 100ms
//
// === 6. Promise.any (first successful provider) ===
// first successful: Completion for "via provider B"
// -----------------------------------------------------------------------------
