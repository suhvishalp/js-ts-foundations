// examples/hello-ai.js
// A pretend "AI" that echoes a canned response — no API key needed.
// Run:  node examples/hello-ai.js hello
//       node examples/hello-ai.js "what is ml"

function fakeChatModel(prompt) {
  const canned = {
    hello: "Hi! I'm a stand-in model. Real ones arrive in Module 11.",
    help: "I can only say a few things for now — but you ran Node correctly!",
  };
  const key = prompt.trim().toLowerCase();
  // ?? is the "nullish coalescing" operator: use the right side only if the
  // left side is null or undefined. We cover it in depth in Module 01/05.
  return canned[key] ?? `You said: "${prompt}". I don't know that one yet.`;
}

// process.argv is an array of command-line arguments.
// [0] = path to node, [1] = path to this script, [2] = first real argument.
const userPrompt = process.argv[2] ?? "hello";

console.log("User:", userPrompt);
console.log("AI:  ", fakeChatModel(userPrompt));
