// Exercise 7 — Validate LLM structured output (core AI/ML task)
// Requires: npm install zod
// Run: npx tsx solutions/exercise-07-validate-llm-output.ts

import { z } from "zod";

// The contract we want the model to honor. This schema is the SINGLE source of
// truth — both the runtime validator and the static type come from it.
const TicketTagSchema = z.object({
  category: z.enum(["bug", "feature", "billing", "other"]),
  priority: z.enum(["low", "medium", "high"]),
  features: z.array(z.string()).max(5),
  needsHuman: z.boolean(),
});

type TicketTag = z.infer<typeof TicketTagSchema>;

function parseTicketTag(raw: string): TicketTag {
  // Layer 1: is it even JSON? Model output is often prose or truncated.
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Model did not return JSON. First 60 chars: "${raw.slice(0, 60)}"`);
  }
  // Layer 2: is it the RIGHT shape? Zod validates and returns a typed value.
  // .parse throws a ZodError with a precise, path-aware issue list on failure.
  return TicketTagSchema.parse(json);
}

// --- Test 1: valid JSON ---
const validRaw =
  '{"category":"bug","priority":"high","features":["checkout","payments"],"needsHuman":true}';
const tag = parseTicketTag(validRaw);
console.log("Valid ->", tag.category, tag.priority, `(needsHuman=${tag.needsHuman})`);

// --- Test 2: non-JSON text (model refused / rambled) ---
try {
  parseTicketTag("Sorry, I can't do that.");
} catch (e) {
  console.log("Non-JSON ->", (e as Error).message);
}

// --- Test 3: JSON but invalid priority ("urgent" is not in the enum) ---
try {
  parseTicketTag('{"category":"bug","priority":"urgent","features":[],"needsHuman":false}');
} catch (e) {
  if (e instanceof z.ZodError) {
    // e.issues is an array; each has a `path` and a `message`.
    const first = e.issues[0];
    console.log(`Bad shape -> ${first.path.join(".")}: ${first.message}`);
  }
}

// Expected output:
// Valid -> bug high (needsHuman=true)
// Non-JSON -> Model did not return JSON. First 60 chars: "Sorry, I can't do that."
// Bad shape -> priority: Invalid enum value. Expected 'low' | 'medium' | 'high', received 'urgent'
