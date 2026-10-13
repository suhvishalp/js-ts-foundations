/**
 * Example: in-memory semantic search with brute-force top-K.
 *
 * Uses hand-made embeddings so it runs instantly with no network or model.
 * (See transformers-embeddings.ts for real, model-generated vectors.)
 *
 * Run: npx tsx examples/semantic-search.ts
 */

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("length mismatch");
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

interface Doc {
  id: string;
  text: string;
  embedding: number[];
}

function topK(query: number[], corpus: Doc[], k: number) {
  return corpus
    .map((doc) => ({ doc, score: cosineSimilarity(query, doc.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// Dimensions loosely mean: [animals, weather, finance]
const corpus: Doc[] = [
  { id: "a1", text: "The golden retriever fetched the ball", embedding: [0.95, 0.05, 0.00] },
  { id: "a2", text: "Cats nap in the afternoon sun", embedding: [0.80, 0.18, 0.02] },
  { id: "w1", text: "Heavy rain is expected tomorrow", embedding: [0.05, 0.92, 0.03] },
  { id: "w2", text: "A cold front moves in this weekend", embedding: [0.08, 0.88, 0.04] },
  { id: "f1", text: "The company beat earnings estimates", embedding: [0.02, 0.05, 0.93] },
  { id: "f2", text: "Investors sold off tech stocks", embedding: [0.03, 0.07, 0.90] },
];

// Pretend these are the query's embedding (from the same model as the corpus).
const queries: Record<string, number[]> = {
  "puppies playing": [0.9, 0.08, 0.02],
  "forecast for the week": [0.06, 0.9, 0.04],
  "quarterly profits": [0.02, 0.06, 0.92],
};

for (const [label, q] of Object.entries(queries)) {
  console.log(`\nQuery: "${label}"`);
  for (const { doc, score } of topK(q, corpus, 2)) {
    console.log(`  ${score.toFixed(3)}  ${doc.text}`);
  }
}
