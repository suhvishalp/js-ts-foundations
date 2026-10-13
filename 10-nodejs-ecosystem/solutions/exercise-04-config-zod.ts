// Exercise 4 — Config with Zod
// Requires: npm install dotenv zod
// Create a .env with LLM_MODEL, MAX_TOKENS (and optionally ANTHROPIC_API_KEY).
// Run: npx tsx solutions/exercise-04-config-zod.ts

import "dotenv/config"; // side-effect import: loads .env into process.env
import process from "node:process";
import { z } from "zod";

// Validate the ENVIRONMENT at startup. If config is wrong, we want to fail
// immediately and loudly — not halfway through a request.
const EnvSchema = z.object({
  LLM_MODEL: z.string().min(1, "LLM_MODEL is required"),
  // z.coerce turns the env string "1024" into the number 1024, then validates.
  MAX_TOKENS: z.coerce.number().int().min(1).max(128_000),
  ANTHROPIC_API_KEY: z.string().min(10).optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Print EVERY problem, not just the first — much friendlier than fixing them
  // one restart at a time.
  console.error("Invalid configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1); // non-zero exit tells shells/CI the process failed
}

// Freeze so nothing mutates config after load. `parsed.data` is fully typed.
export const config = Object.freeze(parsed.data);

console.log("Config OK:");
console.log("  model:", config.LLM_MODEL);
console.log("  maxTokens:", config.MAX_TOKENS, `(type: ${typeof config.MAX_TOKENS})`);
console.log("  apiKey set:", config.ANTHROPIC_API_KEY !== undefined);
