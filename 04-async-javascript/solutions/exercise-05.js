// Solution to Exercise 5 — Add a timeout with Promise.race
// Run with: node exercise-05.js

function mockLLMCall(prompt, { ms = 100 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(`Completion for "${prompt}"`), ms);
  });
}

// A dedicated error type so callers can distinguish timeouts from other errors
// (e.g. `if (err instanceof TimeoutError) ...`).
class TimeoutError extends Error {
  constructor(ms) {
    super(`timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Resolve/reject with `promise` if it settles within `ms`; otherwise reject
 * with a TimeoutError. Cleans up the timer either way so nothing leaks.
 */
function withTimeout(promise, ms) {
  let timerId;

  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new TimeoutError(ms)), ms);
  });

  // race: whichever of [promise, timeout] settles FIRST wins.
  return Promise.race([promise, timeout]).finally(() => {
    // Bonus: clear the timer once we have a winner so the timeout callback
    // never fires after the fact (and Node can exit cleanly).
    clearTimeout(timerId);
  });
}

async function main() {
  // Fast call: 100ms work under a 500ms limit -> succeeds.
  console.log('=== fast call (limit 500ms, work 100ms) ===');
  try {
    const r = await withTimeout(mockLLMCall('fast', { ms: 100 }), 500);
    console.log('ok:', r);
  } catch (err) {
    console.log('unexpected:', err.message);
  }

  // Slow call: 500ms work under a 100ms limit -> times out.
  console.log('\n=== slow call (limit 100ms, work 500ms) ===');
  try {
    const r = await withTimeout(mockLLMCall('slow', { ms: 500 }), 100);
    console.log('unexpected ok:', r);
  } catch (err) {
    console.log(`${err.name}: ${err.message}`); // TimeoutError: timed out after 100ms
  }

  // Approximate output:
  //   === fast call (limit 500ms, work 100ms) ===
  //   ok: Completion for "fast"
  //
  //   === slow call (limit 100ms, work 500ms) ===
  //   TimeoutError: timed out after 100ms
}

main();

module.exports = { withTimeout, TimeoutError };
