/**
 * Example: a complete minimal RAG pipeline.
 *
 *   chunk → embed → store → retrieve top-K → stuff into prompt → generate
 *
 * Embeddings are computed LOCALLY with Transformers.js (no embedding API key),
 * so only the final generation step needs the Anthropic key.
 *
 * Setup:
 *   npm install @anthropic-ai/sdk @xenova/transformers
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *
 * Run: npx tsx examples/mini-rag.ts "How does RAG reduce hallucination?"
 */
import Anthropic from "@anthropic-ai/sdk";
import { pipeline } from "@xenova/transformers";

// --- Vector math (from Module 12) ---
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  return ma === 0 || mb === 0 ? 0 : dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

// --- Corpus: knowledge the base LLM doesn't reliably have ---
const documents = [
  "RAG stands for Retrieval-Augmented Generation. It retrieves relevant text from your own documents and puts it in the prompt so the model answers from supplied facts.",
  "RAG reduces hallucination by grounding answers in retrieved context. When instructed to answer only from the provided context, the model is far less likely to invent facts.",
  "Chunking splits documents into passages before embedding. Overlapping chunks preserve context that would otherwise be cut at a boundary.",
  "Cosine similarity ranks how close two embedding vectors point. It is the default distance metric for text retrieval.",
  "A vector database stores embeddings and answers nearest-neighbor queries with indexing, metadata filtering, and persistence.",
];

interface Chunk {
  text: string;
  embedding: number[];
}

function retrieve(queryEmbedding: number[], chunks: Chunk[], k: number): Chunk[] {
  return chunks
    .map((c) => ({ c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.c);
}

async function main() {
  const question = process.argv[2] ?? "How does RAG reduce hallucination?";

  // 1. INDEX (offline in a real app): embed each document chunk once.
  console.log("Embedding corpus locally...");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const embed = async (text: string): Promise<number[]> => {
    const out = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(out.data as Float32Array);
  };

  const chunks: Chunk[] = [];
  for (const text of documents) chunks.push({ text, embedding: await embed(text) });

  // 2. RETRIEVE: embed the question with the SAME model, take top-3.
  const questionEmbedding = await embed(question);
  const relevant = retrieve(questionEmbedding, chunks, 3);

  console.log(`\nQuestion: ${question}`);
  console.log("\nRetrieved chunks:");
  relevant.forEach((c, i) => console.log(`  [${i + 1}] ${c.text.slice(0, 60)}...`));

  // 3. GENERATE: stuff retrieved chunks into a grounded prompt.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("\n(Set ANTHROPIC_API_KEY to generate the grounded answer.)");
    return;
  }
  const context = relevant.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n");
  const client = new Anthropic();
  const res = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system:
      "Answer using ONLY the provided context. If the context lacks the answer, say " +
      "'I don't know based on the provided documents.' Cite sources by [number].",
    messages: [{ role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` }],
  });
  const block = res.content.find((b) => b.type === "text");
  console.log("\nAnswer:", block?.type === "text" ? block.text : "");
}

main().catch(console.error);
