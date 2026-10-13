/**
 * Example: a minimal in-memory vector store — the conceptual core of a vector DB.
 *
 * Demonstrates upsert, delete, filtered query, and persistence to JSON.
 * No dependencies. Run: npx tsx examples/vector-store.ts
 */
import { writeFile, readFile } from "node:fs/promises";

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

interface VectorRecord<M> {
  id: string;
  vector: number[];
  metadata: M;
}

class InMemoryVectorStore<M = Record<string, unknown>> {
  private records = new Map<string, VectorRecord<M>>();

  upsert(id: string, vector: number[], metadata: M): void {
    this.records.set(id, { id, vector, metadata });
  }

  delete(id: string): void {
    this.records.delete(id);
  }

  get size(): number {
    return this.records.size;
  }

  query(vector: number[], k: number, filter?: (m: M) => boolean) {
    const out: { id: string; score: number; metadata: M }[] = [];
    for (const rec of this.records.values()) {
      if (filter && !filter(rec.metadata)) continue;
      out.push({ id: rec.id, score: cosineSimilarity(vector, rec.vector), metadata: rec.metadata });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, k);
  }

  /** Persist every record to disk as JSON (embedding step is expensive — save it). */
  async save(path: string): Promise<void> {
    await writeFile(path, JSON.stringify([...this.records.values()]), "utf8");
  }

  static async load<M>(path: string): Promise<InMemoryVectorStore<M>> {
    const store = new InMemoryVectorStore<M>();
    const recs = JSON.parse(await readFile(path, "utf8")) as VectorRecord<M>[];
    for (const r of recs) store.upsert(r.id, r.vector, r.metadata);
    return store;
  }
}

async function main() {
  interface Meta {
    text: string;
    category: "animal" | "finance";
  }

  const store = new InMemoryVectorStore<Meta>();
  store.upsert("1", [0.9, 0.1, 0.0], { text: "The dog barked", category: "animal" });
  store.upsert("2", [0.85, 0.15, 0.02], { text: "A puppy played", category: "animal" });
  store.upsert("3", [0.0, 0.05, 0.95], { text: "Revenue grew", category: "finance" });
  console.log("store size:", store.size); // 3

  const query = [0.88, 0.12, 0.01];
  console.log("\nUnfiltered top 3:");
  for (const h of store.query(query, 3)) console.log(" ", h.score.toFixed(3), h.metadata.text);

  console.log("\nOnly finance:");
  for (const h of store.query(query, 3, (m) => m.category === "finance")) {
    console.log(" ", h.score.toFixed(3), h.metadata.text);
  }

  // Persist and reload — the vectors survive a restart.
  const path = "./_vector-store.json";
  await store.save(path);
  const reloaded = await InMemoryVectorStore.load<Meta>(path);
  console.log("\nreloaded size:", reloaded.size); // 3
}

main().catch(console.error);
