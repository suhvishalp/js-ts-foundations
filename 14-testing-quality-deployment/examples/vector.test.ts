// examples/vector.test.ts
// Deterministic unit tests for pure vector math — the testable heart of any
// embeddings app. Run:  npx vitest run examples/vector.test.ts
//
// Note: the functions under test are inlined here so this file is self-contained
// and runnable on its own. In a real project they'd live in src/vector.ts and
// you'd `import { cosineSimilarity, normalize } from "../src/vector.js";`.

import { describe, it, expect } from "vitest";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vectors must be equal length: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function normalize(v: number[]): number[] {
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return mag === 0 ? v.map(() => 0) : v.map((x) => x / mag);
}

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBe(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBe(-1);
  });

  it("is scale-invariant (parallel vectors → 1)", () => {
    // Cosine similarity ignores magnitude, only direction matters.
    expect(cosineSimilarity([0.1, 0.2, 0.3], [0.2, 0.4, 0.6])).toBeCloseTo(1, 5);
  });

  it("treats a zero vector as similarity 0 (no divide-by-zero)", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it("throws on length mismatch", () => {
    expect(() => cosineSimilarity([1, 2], [1])).toThrow(/equal length/);
  });
});

describe("normalize", () => {
  it("produces a unit vector (magnitude ≈ 1)", () => {
    const n = normalize([3, 4]);
    const mag = Math.sqrt(n.reduce((s, x) => s + x * x, 0));
    expect(mag).toBeCloseTo(1, 10);
  });

  it("preserves direction (3,4) → (0.6, 0.8)", () => {
    const n = normalize([3, 4]);
    expect(n[0]).toBeCloseTo(0.6, 10);
    expect(n[1]).toBeCloseTo(0.8, 10);
  });

  it("does not change cosine similarity", () => {
    const a = [1, 2, 3];
    const b = [2, 0, 1];
    const before = cosineSimilarity(a, b);
    const after = cosineSimilarity(normalize(a), normalize(b));
    expect(after).toBeCloseTo(before, 10);
  });

  it("returns zeros for the zero vector (documented behavior)", () => {
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });
});
