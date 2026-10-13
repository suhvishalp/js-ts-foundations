/**
 * Example: reliable structured output from an LLM, validated with Zod.
 *
 * Setup:
 *   npm install @anthropic-ai/sdk zod
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *
 * Run: npx tsx examples/structured-output.ts
 *
 * The bottom half runs OFFLINE (validates canned strings) so you can see the
 * pattern without a key; the top half makes a real call if a key is present.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  company: z.string().nullable(),
  interestedIn: z.array(z.string()),
  wantsDemo: z.boolean(),
});
type Contact = z.infer<typeof ContactSchema>;

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function parseContact(raw: string): Contact {
  return ContactSchema.parse(JSON.parse(stripFences(raw)));
}

async function extractContact(text: string): Promise<Contact> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system:
      "You extract structured contact info. Respond with ONLY a JSON object, " +
      "no markdown fences, no commentary.",
    messages: [
      {
        role: "user",
        content:
          `Extract contact info as JSON with keys name, email, company (or null), ` +
          `interestedIn (string[]), wantsDemo (boolean).\n\nText: "${text}"`,
      },
    ],
  });
  const block = res.content.find((b) => b.type === "text");
  return parseContact(block?.type === "text" ? block.text : "");
}

async function main() {
  // --- Offline: prove the validation layer works regardless of the model ---
  console.log("=== Offline validation ===");
  const good = `{"name":"Jane","email":"jane@acme.com","company":null,"interestedIn":["API"],"wantsDemo":true}`;
  console.log("valid parsed:", parseContact(good));
  try {
    parseContact(`{"name":"X","email":"nope"}`);
  } catch (e) {
    console.log("bad rejected:", (e as Error).message.split("\n")[0]);
  }

  // --- Network: only runs if a key is set ---
  if (process.env.ANTHROPIC_API_KEY) {
    console.log("\n=== Live extraction ===");
    const c = await extractContact(
      "Hi, I'm Jane from Acme (jane@acme.com). We'd love a demo of your embeddings API and SDKs.",
    );
    console.log(c);
  } else {
    console.log("\n(Set ANTHROPIC_API_KEY to run the live extraction.)");
  }
}

main().catch(console.error);
