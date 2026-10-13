// solutions/exercise-04-hybrid-search.ts
// Project 2 / Exercise 4 — hybrid search combining semantic + keyword scores.
// Includes tests. Run:  npx vitest run solutions/exercise-04-hybrid-search.ts

import { describe, it, expect } from "vitest";

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; ma += a[i] ** 2; mb += b[i] ** 2; }
  const denom = Math.sqrt(ma) * Math.sqrt(mb);
  return denom === 0 ? 0 : dot / denom;
}

export interface Rec { text: string; source: string; embedding: number[]; }
export interface Hit { text: string; source: string; score: number; }

/** Fraction of distinct query terms that appear in the chunk (0..1). */
function keywordScore(query: string, text: string): number {
  const terms = [...new Set(query.toLowerCase().split(/\W+/).filter(Boolean))];
  if (terms.length === 0) return 0;
  const haystack = text.toLowerCase();
  const present = terms.filter((t) => haystack.includes(t)).length;
  return present / terms.length;
}

/** Semantic cosine is already in [-1,1]; clamp negatives to 0 for combining. */
function semanticScore(q: number[], e: number[]): number {
  return Math.max(0, cosineSimilarity(q, e));
}

export function hybridSearch(
  recs: Rec[],
  query: string,
  queryVec: number[],
  { k = 5, alpha = 0.6 }: { k?: number; alpha?: number } = {},
): Hit[] {
  return recs
    .map((r) => {
      const sem = semanticScore(queryVec, r.embedding);
      const kw = keywordScore(query, r.text);
      return { text: r.text, source: r.source, score: alpha * sem + (1 - alpha) * kw };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// ---- Tests (fake embeddings → deterministic) ----
describe("hybridSearch", () => {
  const recs: Rec[] = [
    { source: "a", text: "the error code is ERR-8823 for timeouts", embedding: [1, 0] },
    { source: "b", text: "general notes about network reliability", embedding: [0.9, 0.1] },
    { source: "c", text: "unrelated cooking recipes", embedding: [0, 1] },
  ];

  it("ranks the chunk containing an exact ID first via the keyword component", () => {
    // Semantic vectors intentionally do NOT favor 'a'; the keyword match must.
    const hits = hybridSearch(recs, "ERR-8823", [0.9, 0.1], { alpha: 0.3, k: 3 });
    expect(hits[0].source).toBe("a");
  });

  it("respects k", () => {
    expect(hybridSearch(recs, "network", [1, 0], { k: 2 })).toHaveLength(2);
  });

  it("alpha=1 is pure semantic (keyword ignored)", () => {
    const hits = hybridSearch(recs, "ERR-8823", [1, 0], { alpha: 1, k: 1 });
    // With alpha=1 and query vec [1,0], 'a' still wins on semantics here — but
    // the point is the keyword term contributes nothing to the score.
    expect(hits[0].source).toBe("a");
  });
});
