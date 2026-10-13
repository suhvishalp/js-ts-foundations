// Exercise 9 — A tiny CLI (AI/ML themed)
// Requires: npm install dotenv zod   (create a .env with LLM_MODEL=claude-sonnet-5)
// Run: npx tsx solutions/exercise-09-cli.ts ask "what is a vector database?"
//
// In Module 11 you'll replace the mock answer with a real fetch() to an LLM API.

import "dotenv/config";
import process from "node:process";
import { z } from "zod";

// --- config (validated once) ---
const EnvSchema = z.object({
  LLM_MODEL: z.string().min(1).default("claude-sonnet-5"),
});
const config = EnvSchema.parse(process.env);

// --- mock model call (swap for a real API in Module 11) ---
function mockAnswer(question: string): string {
  return `[${config.LLM_MODEL}] You asked: "${question}". ` +
    `(This is a mock; wire up a real fetch() call in Module 11.)`;
}

// --- CLI dispatch ---
function usage(): never {
  console.error("Usage: cli <ask> <question...>");
  console.error('Example: tsx cli.ts ask "what is RAG?"');
  process.exit(1);
}

function main(): void {
  // argv[0] = node, argv[1] = script path, real args start at index 2.
  const [command, ...words] = process.argv.slice(2);

  switch (command) {
    case "ask": {
      const question = words.join(" ").trim();
      if (!question) {
        console.error("Error: no question provided.");
        usage();
      }
      console.log(mockAnswer(question));
      break;
    }
    default:
      usage();
  }
}

main();
