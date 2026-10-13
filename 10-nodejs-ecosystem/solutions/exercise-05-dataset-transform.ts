// Exercise 5 — Read and transform a JSON dataset (AI/ML themed)
// Requires: npm install zod
// Run: npx tsx solutions/exercise-05-dataset-transform.ts
//
// Creates the sample input on first run so the script is self-contained.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const INPUT = path.join("data", "reviews.json");
const OUTPUT = path.join("out", "reviews.clean.json");

// Untrusted file data -> validate its shape before trusting it.
const ReviewSchema = z.object({ id: z.number().int(), text: z.string() });
const ReviewsSchema = z.array(ReviewSchema);
type Review = z.infer<typeof ReviewSchema>;

async function ensureSampleInput(): Promise<void> {
  await mkdir("data", { recursive: true });
  const sample: Review[] = [
    { id: 1, text: "  Great BATTERY life and fast shipping.  " },
    { id: 2, text: "Screen is TOO dim outdoors.   " },
    { id: 3, text: "  Excellent value for the PRICE." },
  ];
  await writeFile(INPUT, JSON.stringify(sample, null, 2), "utf8");
}

async function main(): Promise<void> {
  await ensureSampleInput();

  // 1. Read raw text, 2. parse JSON, 3. validate with Zod.
  const raw = await readFile(INPUT, "utf8");
  const reviews = ReviewsSchema.parse(JSON.parse(raw));

  // Normalize text the way you would before embedding: trim + lowercase.
  const cleaned = reviews.map((r) => ({
    id: r.id,
    text: r.text.trim().toLowerCase(),
  }));

  // Ensure the output directory exists, then write pretty JSON.
  await mkdir("out", { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(cleaned, null, 2), "utf8");

  console.log(`Cleaned ${cleaned.length} reviews -> ${path.resolve(OUTPUT)}`);
  console.log("Sample:", cleaned[0]);
}

main().catch((e) => {
  console.error("Failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
