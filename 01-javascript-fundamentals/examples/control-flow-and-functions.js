// examples/control-flow-and-functions.js
// Control flow (if/switch/ternary), loops, and functions working together
// in a mini "message router" — the skeleton of a simple agent.
// Run: node examples/control-flow-and-functions.js

// A function with a default parameter.
function classify(score) {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low"; // note: a real 0 lands here correctly
}

// A switch-based router (arrow function).
const route = (intent) => {
  switch (intent) {
    case "greeting": return "Hello! How can I help?";
    case "refund":   return "I can help with refunds.";
    case "goodbye":  return "Take care!";
    default:         return "Routing you to a human.";
  }
};

// Ternary for a quick inline choice.
const label = (score) => (score >= 0.5 ? "relevant" : "irrelevant");

// Simulated classified messages.
const messages = [
  { intent: "greeting", score: 0.95 },
  { intent: "refund", score: 0.72 },
  { intent: "unknown", score: 0.10 },
  { intent: "goodbye", score: 0.0 }, // score of exactly 0 must NOT be dropped
];

// for...of iterates the values.
for (const msg of messages) {
  console.log(
    `intent=${msg.intent.padEnd(8)} ` +
      `conf=${classify(msg.score).padEnd(6)} ` +
      `rel=${label(msg.score).padEnd(10)} ` +
      `→ ${route(msg.intent)}`
  );
}

// Batch processing with a classic for loop and slice.
console.log("\n--- Batching ---");
const docs = ["d1", "d2", "d3", "d4", "d5"];
const batchSize = 2;
for (let i = 0; i < docs.length; i += batchSize) {
  console.log("batch:", docs.slice(i, i + batchSize));
}
