/**
 * Solution — Exercise 3: Top-K retriever.
 *
 * The core of semantic search: rank a corpus against a query by cosine
 * similarity and return the best K.
 *
 * Run: npx tsx solutions/exercise-03-topk.ts
 */
import { cosineSimilarity } from "./exercise-01-vec.js";

interface Doc {
  id: string;
  text: string;
  embedding: number[];
}

interface ScoredDoc {
  doc: Doc;
  score: number;
}

/**
 * Brute-force top-K by cosine similarity. O(n·d) — exact and simple, ideal up
 * to tens of thousands of vectors. Beyond that, reach for an ANN index (a
 * vector database). Sorting is fine here; a heap only helps when k << n.
 */
function topK(query: number[], corpus: Doc[], k: number): ScoredDoc[] {
  const scored: ScoredDoc[] = corpus.map((doc) => ({
    doc,
    score: cosineSimilarity(query, doc.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

// Hand-made 3-D "embeddings": dimension 0 ~ animals, dimension 2 ~ finance.
const corpus: Doc[] = [
  { id: "1", text: "The dog barked loudly", embedding: [0.90, 0.10, 0.00] },
  { id: "2", text: "A puppy played in the yard", embedding: [0.85, 0.15, 0.02] },
  { id: "3", text: "Quarterly revenue increased", embedding: [0.00, 0.05, 0.95] },
  { id: "4", text: "The cat chased a mouse", embedding: [0.70, 0.30, 0.05] },
  { id: "5", text: "Stock prices fell sharply", embedding: [0.02, 0.08, 0.90] },
  { id: "6", text: "Kittens are baby cats", embedding: [0.65, 0.35, 0.03] },
];

const query = [0.88, 0.12, 0.01]; // "something about dogs"

console.log(`Query: something dog-like → top 3\n`);
for (const { doc, score } of topK(query, corpus, 3)) {
  console.log(`${score.toFixed(3)}  ${doc.text}`);
}
// Expected: the two dog/puppy docs on top, cat docs next, finance docs last.
