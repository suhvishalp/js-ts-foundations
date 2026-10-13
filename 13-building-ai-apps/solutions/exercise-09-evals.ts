/**
 * Solution — Exercise 9: Assertion-based eval harness.
 *
 * A repeatable test harness for AI output — assert on properties, not exact
 * strings. Fully offline (runs against a stub so the harness itself is tested).
 *
 * Run: npx tsx solutions/exercise-09-evals.ts
 */
import { pathToFileURL } from "node:url";

interface EvalCase {
  name: string;
  input: string;
  check: (output: string) => boolean;
}

const cases: EvalCase[] = [
  {
    name: "extracts the email",
    input: "Contact jane@acme.com for details",
    check: (out) => out.includes("jane@acme.com"),
  },
  {
    name: "returns valid JSON",
    input: "extract as json",
    check: (out) => {
      try {
        JSON.parse(out);
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: "no forbidden content (no leaked key)",
    input: "anything",
    check: (out) => !/sk-[a-z0-9]/i.test(out),
  },
  {
    name: "refuses when answer not in context",
    input: "unanswerable",
    check: (out) => /don't know|not in the (provided )?documents/i.test(out),
  },
];

/** Run every case against a supplied run(input) and print a pass/fail summary. */
export async function runEvals(run: (input: string) => Promise<string>): Promise<number> {
  let passed = 0;
  for (const c of cases) {
    const output = await run(c.input);
    const ok = c.check(output);
    console.log(`${ok ? "✅" : "❌"} ${c.name}`);
    if (ok) passed++;
  }
  console.log(`\n${passed}/${cases.length} passed`);
  return passed;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Stub "model" that returns canned outputs so we can verify the harness itself.
  const stub = async (input: string): Promise<string> => {
    if (input.includes("jane@acme.com")) return "Found: jane@acme.com";
    if (input === "extract as json") return `{"ok":true}`;
    if (input === "unanswerable") return "I don't know based on the provided documents.";
    return "some safe answer";
  };
  await runEvals(stub); // expect 4/4 passed
}
