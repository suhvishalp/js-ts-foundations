// Module 00 — Worked solutions (JavaScript)
// Each exercise is wrapped in its own function so this file runs top-to-bottom.
// Run: node solutions/solutions.js

// ---------------------------------------------------------------------------
// Exercise 2 — Your first script
// ---------------------------------------------------------------------------
function exercise2(name = "Vishal") {
  console.log(`Hello, ${name}! Today is a good day to learn JS.`);
}

// ---------------------------------------------------------------------------
// Exercise 6 — CLI bot
// Reads a prompt (here we accept it as an argument for testability) and
// returns a canned reply. In a real file you'd read process.argv[2].
// ---------------------------------------------------------------------------
function cliBot(prompt = "hello") {
  const replies = {
    hello: "Hey there! I'm a tiny canned bot.",
    help: "Try saying 'hello' or ask me anything (I'll shrug).",
    bye: "Goodbye! Come back in Module 11 for a real model.",
  };
  const key = prompt.trim().toLowerCase();
  const reply = replies[key] ?? `I don't understand "${prompt}" yet.`;
  console.log("User:", prompt);
  console.log("Bot: ", reply);
  return reply;
}

// ---------------------------------------------------------------------------
// Exercise 7 — Token estimator (~4 chars per token heuristic)
// ---------------------------------------------------------------------------
function estimateTokens(text = "Hello, world!") {
  const chars = text.length;
  const tokens = Math.ceil(chars / 4);
  console.log(`${chars} chars ≈ ${tokens} tokens`);
  return tokens;
}

// --- Demo run -------------------------------------------------------------
exercise2("Ada");
console.log("---");
cliBot("help");
console.log("---");
estimateTokens("The quick brown fox jumps over the lazy dog.");

// Export for potential reuse/testing.
module.exports = { cliBot, estimateTokens };
