// Centralized, validated config — the pattern every real Node app should use.
// Requires: npm install dotenv zod
// Run: npx tsx examples/env-config.ts
//
// Load + validate the environment ONCE, here, and import `config` everywhere
// else. No scattered `process.env.FOO` reads, no "is it a string or number?"
// confusion — the schema answers both.

import "dotenv/config"; // loads .env into process.env (dev only; prod sets real env vars)
import process from "node:process";
import { z } from "zod";

const EnvSchema = z.object({
  // A secret. Optional here so the example runs without a real key; in a real
  // app you'd make it required and fail fast if it's missing.
  ANTHROPIC_API_KEY: z.string().min(10).optional(),
  LLM_MODEL: z.string().min(1).default("claude-sonnet-5"),
  MAX_TOKENS: z.coerce.number().int().positive().max(128_000).default(1024),
  // Coerce a boolean-ish env string; "true"/"1" -> true.
  DEBUG: z
    .enum(["true", "false", "1", "0"])
    .transform((v) => v === "true" || v === "1")
    .default("false"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:");
  for (const i of parsed.error.issues) {
    console.error(`  - ${i.path.join(".")}: ${i.message}`);
  }
  process.exit(1);
}

// Export a frozen, fully-typed config object.
export const config = Object.freeze(parsed.data);

// Demo (only runs when this file is executed directly, not when imported):
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("model:    ", config.LLM_MODEL);
  console.log("maxTokens:", config.MAX_TOKENS, `(${typeof config.MAX_TOKENS})`);
  console.log("debug:    ", config.DEBUG, `(${typeof config.DEBUG})`);
  console.log("apiKey:   ", config.ANTHROPIC_API_KEY ? "set" : "not set");
}
