// solutions/exercise-01-dot-product.ts
// Exercise 1 — Test a pure function (dot product), TDD-style.
// This single file contains BOTH the implementation and its tests so it runs
// standalone.  Run:  npx vitest run solutions/exercise-01-dot-product.ts
//
// In a real project: src/math.ts (impl) + src/math.test.ts (tests).

import { describe, it, expect } from "vitest";

// ---- Implementation ----
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vectors must be equal length: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

// ---- Tests ----
describe("dotProduct", () => {
  it("computes a known result", () => {
    // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it("returns 0 when one vector is all zeros", () => {
    expect(dotProduct([0, 0, 0], [7, 8, 9])).toBe(0);
  });

  it("handles negative numbers", () => {
    expect(dotProduct([1, -2], [3, 4])).toBe(3 + -8); // -5
  });

  it("throws on length mismatch", () => {
    expect(() => dotProduct([1], [1, 2])).toThrow(/equal length/);
  });
});
