// Exercise 8 — Retry-on-invalid loop (stretch, AI/ML themed)
// Requires: npm install zod
// Run: npx tsx solutions/exercise-08-retry-on-invalid.ts
//
// This is the pattern real production code uses: when an LLM returns malformed
// structured output, feed the validation error back into the prompt and ask it
// to try again. Zod's error messages are precise enough to be useful *to the
// model*, not just to you.

import { z } from "zod";

const TicketTagSchema = z.object({
  category: z.enum(["bug", "feature", "billing", "other"]),
  priority: z.enum(["low", "medium", "high"]),
  features: z.array(z.string()).max(5),
  needsHuman: z.boolean(),
});
type TicketTag = z.infer<typeof TicketTagSchema>;

type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// A fake model: returns invalid JSON until the prompt contains "INVALID"
// (simulating a corrected retry once we've fed the error back).
function fakeLlm(prompt: string): string {
  if (prompt.includes("INVALID")) {
    // "corrected" response
    return '{"category":"bug","priority":"high","features":["login"],"needsHuman":true}';
  }
  // first attempt: priority is wrong
  return '{"category":"bug","priority":"urgent","features":["login"],"needsHuman":true}';
}

function extractWithRetry(text: string, maxAttempts = 3): Result<TicketTag> {
  let prompt = `Classify this ticket as JSON: ${text}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const raw = fakeLlm(prompt);

    // Guard JSON.parse too — a real model could return prose.
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      prompt = `${prompt}\nYour last output was INVALID: not valid JSON.`;
      console.log(`Attempt ${attempt}: not JSON, retrying...`);
      continue;
    }

    const parsed = TicketTagSchema.safeParse(json);
    if (parsed.success) {
      console.log(`Attempt ${attempt}: valid.`);
      return { ok: true, value: parsed.data };
    }

    // Build a corrective prompt from the ZodError messages.
    const reasons = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    console.log(`Attempt ${attempt}: INVALID (${reasons}), retrying...`);
    prompt = `${prompt}\nYour last output was INVALID: ${reasons}. Return corrected JSON.`;
  }

  return { ok: false, error: `Gave up after ${maxAttempts} attempts` };
}

const result = extractWithRetry("Users can't log in on mobile");
if (result.ok) {
  console.log("Final tag:", result.value);
} else {
  console.log("Failed:", result.error);
}

// Expected output:
// Attempt 1: INVALID (priority: Invalid enum value...), retrying...
// Attempt 2: valid.
// Final tag: { category: 'bug', priority: 'high', features: [ 'login' ], needsHuman: true }
