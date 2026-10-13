/**
 * Example: real, model-generated embeddings — computed LOCALLY, no API key.
 *
 * Install first:
 *   npm install @xenova/transformers
 *
 * Run:
 *   npx tsx examples/transformers-embeddings.ts
 *
 * The first run downloads the model (~90 MB) and caches it under
 * node_modules/@xenova/transformers/.cache (or ~/.cache). Later runs are offline.
 */
import { pipeline } from "@xenova/transformers";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  if (ma === 0 || mb === 0) return 0;
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

async function main() {
  console.log("Loading model (first run downloads weights)...");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  const sentences = [
    "The dog barked at the mailman",
    "A puppy chased its tail",
    "Interest rates rose this quarter",
    "The central bank raised rates",
  ];

  // Embed each sentence into a normalized 384-dim vector.
  const embeddings: number[][] = [];
  for (const s of sentences) {
    const out = await extractor(s, { pooling: "mean", normalize: true });
    embeddings.push(Array.from(out.data as Float32Array));
  }

  console.log(`\nEmbedding dimension: ${embeddings[0].length}\n`);

  // Print a cosine-similarity matrix. Same-topic pairs should score high.
  console.log("Cosine similarity matrix:");
  for (let i = 0; i < sentences.length; i++) {
    const row: string[] = [];
    for (let j = 0; j < sentences.length; j++) {
      row.push(cosineSimilarity(embeddings[i], embeddings[j]).toFixed(2));
    }
    console.log(`  [${row.join(", ")}]  ${sentences[i]}`);
  }
  // Rows 0&1 (dogs) score high together; rows 2&3 (rates) score high together;
  // cross-topic pairs score noticeably lower.
}

main().catch(console.error);
