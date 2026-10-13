// examples/project2-semantic-search.ts
// Project 2 skeleton — semantic search, fully RUNNABLE WITHOUT AN API KEY.
// It uses a deterministic "toy" embedder (bag-of-words over a fixed vocabulary)
// so you can see chunking → embedding → cosine ranking end-to-end offline.
// In the real project, swap ToyEmbedder for an OpenAI embeddings implementation.
//
// Run:  npx tsx examples/project2-semantic-search.ts "how do promises work"

// ---- cosine similarity (src/vector.ts — reused & tested in Module 14) ----
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; ma += a[i] ** 2; mb += b[i] ** 2; }
  const denom = Math.sqrt(ma) * Math.sqrt(mb);
  return denom === 0 ? 0 : dot / denom;
}

// ---- Embedder interface + a deterministic toy implementation ----
export interface Embedder { embed(texts: string[]): Promise<number[][]>; }

const VOCAB = [
  "promise", "async", "await", "then", "resolve", "reject",
  "array", "map", "filter", "reduce", "loop", "vector", "embedding", "token",
];
class ToyEmbedder implements Embedder {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => {
      const words = t.toLowerCase().split(/\W+/);
      return VOCAB.map((v) => words.filter((w) => w === v).length);
    });
  }
}

// ---- VectorIndex (src/index.ts) ----
interface Rec { text: string; source: string; embedding: number[]; }
interface Hit { text: string; source: string; score: number; }

class VectorIndex {
  private recs: Rec[] = [];
  add(recs: Rec[]) { this.recs.push(...recs); }
  search(q: number[], k = 3): Hit[] {
    return this.recs
      .map((r) => ({ text: r.text, source: r.source, score: cosineSimilarity(q, r.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

// ---- Demo corpus (stands in for files you'd read from disk with fs) ----
const CORPUS: { source: string; text: string }[] = [
  { source: "notes/async.md", text: "A promise represents an async value; use await to resolve it or catch to reject." },
  { source: "notes/arrays.md", text: "Use map to transform an array, filter to select, and reduce to fold into one value." },
  { source: "notes/ml.md", text: "An embedding is a vector; similar tokens produce similar vectors." },
];

async function main() {
  const query = process.argv.slice(2).join(" ") || "how do promises work";
  const embedder: Embedder = new ToyEmbedder();

  // Ingest: embed corpus and build the index (real version reads + chunks files).
  const embeddings = await embedder.embed(CORPUS.map((c) => c.text));
  const index = new VectorIndex();
  index.add(CORPUS.map((c, i) => ({ ...c, embedding: embeddings[i] })));

  // Query: embed the question, rank by cosine similarity.
  const [qVec] = await embedder.embed([query]);
  const hits = index.search(qVec, 3);

  console.log(`\nQuery: ${query}\n`);
  for (const h of hits) {
    console.log(`  [${h.score.toFixed(3)}] ${h.source}`);
    console.log(`         ${h.text}\n`);
  }
}

main();
