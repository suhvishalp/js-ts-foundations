// A minimal "dataset in -> processed out" pipeline using node:fs/promises.
// Run: npx tsx examples/fs-pipeline.ts
//
// This mirrors the shape of a real embeddings job: read a corpus, transform each
// record (here: a fake 8-dim vector; in reality an API call), write results.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const DATA_DIR = "data";
const OUT_DIR = "out";
const INPUT = path.join(DATA_DIR, "corpus.json");
const OUTPUT = path.join(OUT_DIR, "embeddings.json");

const DocSchema = z.object({ id: z.number().int(), text: z.string().min(1) });
const CorpusSchema = z.array(DocSchema);
type Doc = z.infer<typeof DocSchema>;

// Stand in for a real embeddings API call. Deterministic-ish fake vector.
function fakeEmbed(text: string): number[] {
  const seed = text.length;
  return Array.from({ length: 8 }, (_, i) => Number(((Math.sin(seed + i) + 1) / 2).toFixed(4)));
}

async function seedInput(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const docs: Doc[] = [
    { id: 1, text: "wireless headphones with long battery life" },
    { id: 2, text: "ergonomic mechanical keyboard" },
    { id: 3, text: "4k monitor with usb-c" },
  ];
  await writeFile(INPUT, JSON.stringify(docs, null, 2), "utf8");
}

async function main(): Promise<void> {
  await seedInput();

  // 1. Read + validate the corpus.
  const corpus = CorpusSchema.parse(JSON.parse(await readFile(INPUT, "utf8")));

  // 2. Transform. Promise.all runs the (async, in real life) work concurrently.
  const records = await Promise.all(
    corpus.map(async (doc) => ({
      id: doc.id,
      text: doc.text,
      vector: fakeEmbed(doc.text), // <- real code: await callEmbeddingsApi(doc.text)
    })),
  );

  // 3. Write the output.
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(records, null, 2), "utf8");

  console.log(`Wrote ${records.length} embeddings -> ${path.resolve(OUTPUT)}`);
}

main().catch((e) => {
  console.error("Pipeline failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
