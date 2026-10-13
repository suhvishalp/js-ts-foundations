// examples/project1-cli-bot.ts
// Project 1 skeleton — a streaming CLI Q&A bot.
// This example is RUNNABLE WITHOUT AN API KEY: it ships a FakeModel that
// streams a canned answer word-by-word, so you can see the streaming mechanics.
// Swap FakeModel for OpenAIModel (commented below) to use a real LLM.
//
// Run:  npx tsx examples/project1-cli-bot.ts "What is streaming?"

// ---- The interface (src/model.ts) ----
export interface ChatModel {
  stream(prompt: string, system?: string): AsyncIterable<string>;
}

// ---- A fake model: streams a canned answer, no network ----
class FakeModel implements ChatModel {
  async *stream(prompt: string): AsyncIterable<string> {
    const answer = `You asked: "${prompt}". Streaming means we emit the answer ` +
      `token-by-token as it is generated, so the user sees output immediately ` +
      `instead of waiting for the whole response.`;
    for (const word of answer.split(" ")) {
      await new Promise((r) => setTimeout(r, 25)); // simulate network latency
      yield word + " ";
    }
  }
}

// ---- A real model would look like this (requires `npm i openai` + key) ----
// import OpenAI from "openai";
// class OpenAIModel implements ChatModel {
//   constructor(private client = new OpenAI(), private model = "gpt-4o-mini") {}
//   async *stream(prompt: string, system = "You are concise.") {
//     const res = await this.client.chat.completions.create({
//       model: this.model, stream: true,
//       messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
//     });
//     for await (const chunk of res) {
//       const delta = chunk.choices[0]?.delta?.content;
//       if (delta) yield delta;
//     }
//   }
// }

// ---- Arg parsing (src/cli.ts) — a pure, testable function ----
export function parseArgs(argv: string[]): { question: string; system?: string } {
  let system: string | undefined;
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--system") system = argv[++i];
    else rest.push(argv[i]);
  }
  return { question: rest.join(" ").trim(), system };
}

// ---- Entry point (src/index.ts) ----
async function main() {
  const { question, system } = parseArgs(process.argv.slice(2));
  if (!question) {
    console.error('Usage: npx tsx project1-cli-bot.ts "your question" [--system "..."]');
    process.exit(1);
  }
  // For real usage: const model = new OpenAIModel();  (and check the API key)
  const model: ChatModel = new FakeModel();
  for await (const delta of model.stream(question, system)) {
    process.stdout.write(delta);
  }
  process.stdout.write("\n");
}

main().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
