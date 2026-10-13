// Module 01 — Worked solutions (JavaScript)
// Run: node solutions/solutions.js

// ---------------------------------------------------------------------------
// Exercise 2 — The float trap
// ---------------------------------------------------------------------------
function nearlyEqual(a, b, epsilon = 1e-9) {
  return Math.abs(a - b) < epsilon;
}
console.log("Ex2: 0.1 + 0.2 =", 0.1 + 0.2);
console.log("Ex2: strict === 0.3?", 0.1 + 0.2 === 0.3);   // false
console.log("Ex2: nearlyEqual to 0.3?", nearlyEqual(0.1 + 0.2, 0.3)); // true

// ---------------------------------------------------------------------------
// Exercise 3 — Template-literal RAG prompt builder
// ---------------------------------------------------------------------------
function buildRagPrompt(context, question) {
  return `Answer the question using ONLY the context below.
If the answer is not in the context, say "I don't know."

Context:
${context}

Question: ${question}
Answer:`;
}
console.log("\nEx3:\n" + buildRagPrompt("Refunds within 30 days.", "What is the refund window?"));

// ---------------------------------------------------------------------------
// Exercise 4 — Text normalizer
// ---------------------------------------------------------------------------
function normalize(text) {
  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)             // split on any run of whitespace
    .filter((w) => w.length); // drop any empty strings
}
console.log("\nEx4:", normalize("  Hello   AI World  ")); // ['hello','ai','world']

// ---------------------------------------------------------------------------
// Exercise 5 — Confidence classifier (0 handled correctly)
// ---------------------------------------------------------------------------
function classify(score) {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}
console.log("\nEx5:", classify(0.9), classify(0.6), classify(0)); // high medium low

// ---------------------------------------------------------------------------
// Exercise 6 — Safe field extraction with ?. and ??
// ---------------------------------------------------------------------------
function extractReply(response) {
  return response.choices?.[0]?.message?.content ?? "";
}
console.log("\nEx6 full:", extractReply({ choices: [{ message: { content: "Hi!" } }] })); // "Hi!"
console.log("Ex6 empty:", JSON.stringify(extractReply({}))); // ""

// ---------------------------------------------------------------------------
// Exercise 7 — Intent router (switch)
// ---------------------------------------------------------------------------
function route(intent) {
  switch (intent) {
    case "greeting": return "Hello! How can I help?";
    case "refund":   return "I can start a refund for you.";
    case "cancel":   return "I can cancel your order.";
    default:         return "Let me connect you to a human agent.";
  }
}
console.log("\nEx7:", route("refund"), "|", route("mystery"));

// ---------------------------------------------------------------------------
// Exercise 8 — Batch iterator
// ---------------------------------------------------------------------------
function batchProcess(items, batchSize) {
  let batches = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log("  processing batch:", batch);
    batches++;
  }
  return batches;
}
console.log("\nEx8: batches =", batchProcess(["a", "b", "c", "d", "e"], 2)); // 3

// ---------------------------------------------------------------------------
// Exercise 9 — Retry with a while loop
// ---------------------------------------------------------------------------
function retry(succeedsOnAttempt, maxAttempts) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;
    if (attempts === succeedsOnAttempt) {
      return { success: true, attempts };
    }
  }
  return { success: false, attempts };
}
console.log("\nEx9:", retry(2, 5)); // { success: true, attempts: 2 }
console.log("Ex9:", retry(9, 3));   // { success: false, attempts: 3 }

// ---------------------------------------------------------------------------
// Exercise 10 — Mini cost calculator (NaN-guarded)
// ---------------------------------------------------------------------------
function estimateCost(
  { promptTokens, completionTokens },
  pricing = { inputPer1k: 0.003, outputPer1k: 0.015 }
) {
  const safe = (n) => (Number.isNaN(Number(n)) ? 0 : Number(n));
  const p = safe(promptTokens);
  const c = safe(completionTokens);
  const cost =
    (p / 1000) * pricing.inputPer1k + (c / 1000) * pricing.outputPer1k;
  return Number(cost.toFixed(6));
}
console.log("\nEx10:", estimateCost({ promptTokens: 1200, completionTokens: 800 }));
console.log("Ex10 (bad data):", estimateCost({ promptTokens: "oops", completionTokens: 500 }));

module.exports = {
  nearlyEqual, buildRagPrompt, normalize, classify,
  extractReply, route, batchProcess, retry, estimateCost,
};
