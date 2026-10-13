// examples/hello-ai.ts
// The TypeScript twin of hello-ai.js. Note the type annotations.
// Run:  npx tsx examples/hello-ai.ts hello

// A record type: an object whose keys are strings and values are strings.
type CannedResponses = Record<string, string>;

function fakeChatModel(prompt: string): string {
  const canned: CannedResponses = {
    hello: "Hi! I'm a typed stand-in model. Real ones arrive in Module 11.",
    help: "TypeScript is guarding your inputs already — nice.",
  };
  const key = prompt.trim().toLowerCase();
  return canned[key] ?? `You said: "${prompt}". I don't know that one yet.`;
}

const userPrompt: string = process.argv[2] ?? "hello";

console.log("User:", userPrompt);
console.log("AI:  ", fakeChatModel(userPrompt));
