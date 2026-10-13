/**
 * Solution — Exercise 5: In-memory vector store with metadata filtering.
 *
 * The conceptual core of any vector database: upsert + filtered nearest-neighbor
 * query. Metadata filtering is what makes multi-tenant search possible.
 *
 * Run: npx tsx solutions/exercise-05-vector-store.ts
 */
import { pathToFileURL } from "node:url";
import { cosineSimilarity } from "./exercise-01-vec.js";

interface VectorRecord<M> {
  id: string;
  vector: number[];
  metadata: M;
}

export class InMemoryVectorStore<M = Record<string, unknown>> {
  private records = new Map<string, VectorRecord<M>>();

  /** Insert or overwrite a vector by id. */
  upsert(id: string, vector: number[], metadata: M): void {
    this.records.set(id, { id, vector, metadata });
  }

  delete(id: string): void {
    this.records.delete(id);
  }

  get size(): number {
    return this.records.size;
  }

  /**
   * Nearest-neighbor query. `filter` runs BEFORE scoring, so excluded records
   * cost nothing — critical for multi-tenant setups where each query must only
   * see one customer's data.
   */
  query(
    vector: number[],
    k: number,
    filter?: (m: M) => boolean,
  ): { id: string; score: number; metadata: M }[] {
    const results: { id: string; score: number; metadata: M }[] = [];
    for (const rec of this.records.values()) {
      if (filter && !filter(rec.metadata)) continue;
      results.push({
        id: rec.id,
        score: cosineSimilarity(vector, rec.vector),
        metadata: rec.metadata,
      });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }
}

// --- demo: multi-tenant search --------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  interface Meta {
    text: string;
    tenant: "a" | "b";
  }

  const store = new InMemoryVectorStore<Meta>();
  store.upsert("1", [0.9, 0.1, 0.0], { text: "Tenant A: dog article", tenant: "a" });
  store.upsert("2", [0.85, 0.15, 0.0], { text: "Tenant A: puppy article", tenant: "a" });
  store.upsert("3", [0.88, 0.12, 0.0], { text: "Tenant B: dog article", tenant: "b" });

  const query = [0.88, 0.12, 0.01];

  console.log("All tenants:");
  for (const h of store.query(query, 5)) console.log(" ", h.score.toFixed(3), h.metadata.text);

  console.log("\nOnly tenant A (metadata filter):");
  for (const h of store.query(query, 5, (m) => m.tenant === "a")) {
    console.log(" ", h.score.toFixed(3), h.metadata.text);
  }
  // The tenant-B document never appears in the filtered results.
}
