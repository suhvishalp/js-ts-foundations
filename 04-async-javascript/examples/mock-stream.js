// mock-stream.js
// Run with: node mock-stream.js
//
// Real LLM APIs (OpenAI, Anthropic, etc.) can "stream" a completion back
// token-by-token instead of making you wait for the whole thing. This lets
// a UI show text as it is generated (the "typing" effect).
//
// Under the hood the network layer differs, but from JavaScript the ergonomic
// way to CONSUME a stream is an ASYNC ITERATOR. Here we mock the server with
// an `async function*` (async generator) that yields tokens with small delays.

// Utility: sleep for `ms` milliseconds, returning a promise.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A mock streaming endpoint. An async generator yields one "token" at a time.
// `yield` pauses the generator until the consumer asks for the next value.
async function* streamCompletion(prompt) {
  const fullText = `Here is a streamed answer to: ${prompt}`;
  const tokens = fullText.split(' ');
  for (const token of tokens) {
    await sleep(60); // simulate network + generation latency per token
    yield token + ' '; // yield the token to whoever is consuming the stream
  }
}

// --- Consumer 1: for await...of --------------------------------------------
// This is the idiomatic way to drain an async iterator. The loop awaits each
// value as it becomes available.
async function consumeWithForAwait(prompt) {
  console.log('=== for await...of consumer ===');
  let assembled = '';
  process.stdout.write('streaming: ');
  for await (const token of streamCompletion(prompt)) {
    process.stdout.write(token); // render as it arrives (the typing effect)
    assembled += token; // also accumulate the full text
  }
  console.log('\nfull completion:', JSON.stringify(assembled.trim()));
  return assembled.trim();
}

// --- Consumer 2: callback-per-token ----------------------------------------
// Some APIs / SDKs expose a callback style: you pass an `onToken` function
// that fires for each chunk, and you await a promise that resolves when the
// stream ends. We build that on top of the same async generator.
async function consumeWithCallback(prompt, onToken) {
  let assembled = '';
  for await (const token of streamCompletion(prompt)) {
    onToken(token); // hand each token to the caller's callback
    assembled += token;
  }
  return assembled.trim();
}

async function main() {
  await consumeWithForAwait('what is an event loop?');

  console.log('\n=== callback-per-token consumer ===');
  let tokenCount = 0;
  const full = await consumeWithCallback('summarize the docs', (token) => {
    tokenCount += 1;
    process.stdout.write(token);
  });
  console.log(`\ntokens received: ${tokenCount}`);
  console.log('full completion:', JSON.stringify(full));
}

main();

// -----------------------------------------------------------------------------
// Approximate output (the streamed lines appear gradually, word by word):
//
// === for await...of consumer ===
// streaming: Here is a streamed answer to: what is an event loop?
// full completion: "Here is a streamed answer to: what is an event loop?"
//
// === callback-per-token consumer ===
// Here is a streamed answer to: summarize the docs
// tokens received: 8
// full completion: "Here is a streamed answer to: summarize the docs"
// -----------------------------------------------------------------------------
