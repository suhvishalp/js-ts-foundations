/**
 * Solution — Exercise 6: Chunking strategies.
 *
 * Three ways to split documents for RAG, with a note on which to prefer.
 * Fully offline. Run: npx tsx solutions/exercise-06-chunking.ts
 */
import { pathToFileURL } from "node:url";

/** Blindly split every `size` chars. Simple, but cuts mid-sentence. */
export function chunkFixed(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

/**
 * Fixed size with overlap: consecutive chunks share `overlap` chars so a fact
 * that straddles a boundary still appears whole in at least one chunk.
 */
export function chunkWithOverlap(text: string, size: number, overlap: number): string[] {
  if (overlap >= size) throw new Error("overlap must be smaller than size");
  const chunks: string[] = [];
  const step = size - overlap;
  for (let i = 0; i < text.length; i += step) {
    chunks.push(text.slice(i, i + size));
    if (i + size >= text.length) break;
  }
  return chunks;
}

/** Split on blank lines, then merge small paragraphs up to a size budget. */
export function chunkBySemantics(text: string, maxSize: number): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length > maxSize && current) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const doc = `RAG combines retrieval with generation. The retriever finds relevant text.

The generator then writes an answer grounded in that text. This reduces hallucination.

Chunking decides what the retriever can find. Good chunks are coherent and self-contained.`;

  const preview = (s: string) => s.replace(/\n/g, " ").slice(0, 45) + "...";

  console.log("Fixed (80):");
  chunkFixed(doc, 80).forEach((c, i) => console.log(`  ${i}: ${preview(c)}`));

  console.log("\nOverlap (80, 20):");
  chunkWithOverlap(doc, 80, 20).forEach((c, i) => console.log(`  ${i}: ${preview(c)}`));

  console.log("\nSemantic (120):");
  chunkBySemantics(doc, 120).forEach((c, i) => console.log(`  ${i}: ${preview(c)}`));

  // For RAG I'd default to overlap (preserves boundary context with little code)
  // and move to semantic when documents have clear paragraph/heading structure —
  // coherent chunks embed better and retrieve more precisely.
}
