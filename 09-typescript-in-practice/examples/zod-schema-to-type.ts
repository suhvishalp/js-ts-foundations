// One schema -> both a runtime validator AND a static type.
// Requires: npm install zod
// Run: npx tsx examples/zod-schema-to-type.ts

import { z } from "zod";

// 1. Declare the schema once.
const EmbeddingRecordSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  model: z.string(),
  vector: z.array(z.number()).length(1536), // OpenAI-style dimension check
  createdAt: z.coerce.date(),               // ISO string in -> Date out
  tags: z.array(z.string()).default([]),    // optional on input, always present on output
});

// 2. Derive the TypeScript type — no hand-written interface to drift.
type EmbeddingRecord = z.infer<typeof EmbeddingRecordSchema>;

// 3a. Valid data: .parse returns a fully-typed, validated object.
const raw = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  text: "wireless noise-cancelling headphones",
  model: "text-embedding-3-small",
  vector: Array.from({ length: 1536 }, () => Math.random()),
  createdAt: "2026-07-26T10:00:00.000Z", // string...
  // tags omitted — the .default([]) fills it in
};

const record: EmbeddingRecord = EmbeddingRecordSchema.parse(raw);
console.log("id:", record.id);
console.log("createdAt is a Date?", record.createdAt instanceof Date); // true (coerced)
console.log("tags defaulted to:", record.tags);                        // []
console.log("vector length:", record.vector.length);                   // 1536

// 3b. Invalid data: .safeParse returns a discriminated-union result.
const bad = { ...raw, vector: [1, 2, 3] }; // wrong dimension
const result = EmbeddingRecordSchema.safeParse(bad);
if (!result.success) {
  const issue = result.error.issues[0];
  console.log(`Rejected -> ${issue.path.join(".")}: ${issue.message}`);
  // Rejected -> vector: Array must contain exactly 1536 element(s)
}
