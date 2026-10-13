/**
 * Solution — Exercise 3: Zod-validated structured output.
 *
 * The offline core: define a schema, then robustly parse + validate model text.
 * Run: npx tsx solutions/exercise-03-structured-output.ts
 */
import { pathToFileURL } from "node:url";
import { z } from "zod";

// One schema → runtime validation AND a static type.
const ContactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  company: z.string().nullable(),
  interestedIn: z.array(z.string()),
  wantsDemo: z.boolean(),
});

type Contact = z.infer<typeof ContactSchema>;

/** Models sometimes wrap JSON in ```json fences — strip them before parsing. */
function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

/**
 * Parse + validate raw model output into a typed Contact.
 * Throws a descriptive error if the JSON is malformed or the shape is wrong.
 */
export function parseContact(raw: string): Contact {
  const cleaned = stripFences(raw);
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    throw new Error(`Model did not return valid JSON: ${cleaned.slice(0, 80)}...`);
  }
  return ContactSchema.parse(json); // throws ZodError with details if shape is wrong
}

// --- offline tests ---------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const valid = `{"name":"Jane","email":"jane@acme.com","company":"Acme","interestedIn":["API"],"wantsDemo":true}`;
  console.log("valid:", parseContact(valid)); // parses to a typed object

  const fenced = "```json\n" + valid + "\n```";
  console.log("fenced:", parseContact(fenced)); // fences stripped, still parses

  const invalid = `{"name":"Jane","email":"not-an-email","interestedIn":[],"wantsDemo":true}`;
  try {
    parseContact(invalid); // missing company + bad email
  } catch (e) {
    console.log("invalid rejected:", (e as Error).message.split("\n")[0]);
  }
}
