// Module 02 — Worked solutions (JavaScript)
// Run: node solutions/solutions.js

// ---------------------------------------------------------------------------
// Exercise 3 — Top-k retrieval (no mutation of input)
// ---------------------------------------------------------------------------
function topK(items, k) {
  return [...items]                          // copy first
    .sort((a, b) => b.score - a.score)       // highest score first
    .slice(0, k)                             // take k
    .map((x) => x.id);                       // just the ids
}
const candidates = [
  { id: "c1", score: 0.42 },
  { id: "c2", score: 0.91 },
  { id: "c3", score: 0.66 },
  { id: "c4", score: 0.88 },
];
console.log("Ex3 topK:", topK(candidates, 3)); // ['c2','c4','c3']

// ---------------------------------------------------------------------------
// Exercise 4 — Config merge (respects temperature: 0)
// ---------------------------------------------------------------------------
function resolveConfig(overrides = {}) {
  const defaults = { model: "opus", temperature: 0.7, maxTokens: 512 };
  return { ...defaults, ...overrides };
}
console.log("Ex4:", resolveConfig({ temperature: 0 })); // temperature: 0 kept

// ---------------------------------------------------------------------------
// Exercise 5 — Usage aggregator
// ---------------------------------------------------------------------------
function aggregateUsage(requests) {
  const totals = {};
  for (const r of requests) {
    totals[r.model] ??= { input: 0, output: 0 };
    totals[r.model].input += r.inputTokens;
    totals[r.model].output += r.outputTokens;
  }
  return totals;
}
console.log("Ex5:", aggregateUsage([
  { model: "opus", inputTokens: 100, outputTokens: 300 },
  { model: "haiku", inputTokens: 500, outputTokens: 50 },
  { model: "opus", inputTokens: 200, outputTokens: 150 },
]));

// ---------------------------------------------------------------------------
// Exercise 6 — Deduplicate by id (preserve order)
// ---------------------------------------------------------------------------
function dedupeById(items) {
  const seen = new Set();
  const result = [];
  let duplicates = 0;
  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates++;
    } else {
      seen.add(item.id);
      result.push(item);
    }
  }
  return { result, duplicates };
}
const dd = dedupeById([{ id: "a" }, { id: "b" }, { id: "a" }, { id: "c" }]);
console.log("Ex6:", dd.result.map((x) => x.id), "removed:", dd.duplicates);

// ---------------------------------------------------------------------------
// Exercise 7 — Vocabulary + encode
// ---------------------------------------------------------------------------
function buildVocab(tokens) {
  const vocab = new Map();
  for (const t of tokens) if (!vocab.has(t)) vocab.set(t, vocab.size);
  return vocab;
}
function encode(tokens, vocab) {
  return tokens.map((t) => vocab.get(t));
}
const vocab = buildVocab(["the", "cat", "sat", "the", "mat"]);
console.log("Ex7 vocab:", Object.fromEntries(vocab));
console.log("Ex7 encode:", encode(["the", "mat"], vocab)); // [0, 3]

// ---------------------------------------------------------------------------
// Exercise 8 — Safe JSON parse (handles fences and garbage)
// ---------------------------------------------------------------------------
function safeParseJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
console.log("Ex8 valid:", safeParseJson('{"ok":true}'));
console.log("Ex8 fenced:", safeParseJson('```json\n{"n":1}\n```'));
console.log("Ex8 garbage:", safeParseJson("not json at all")); // null

// ---------------------------------------------------------------------------
// Exercise 9 — Deep copy for a temperature sweep
// ---------------------------------------------------------------------------
function makeSweep(base, temperatures) {
  return temperatures.map((t) => {
    const cfg = structuredClone(base);
    cfg.params.temperature = t;
    return cfg;
  });
}
const base = { model: "opus", params: { temperature: 0.7, maxTokens: 512 } };
const sweep = makeSweep(base, [0, 0.5, 1]);
sweep[0].params.temperature = 0.0;
console.log("Ex9 base untouched:", base.params.temperature === 0.7); // true
console.log("Ex9 temps:", sweep.map((c) => c.params.temperature)); // [0,0.5,1]

// ---------------------------------------------------------------------------
// Exercise 10 — Cosine similarity + mostSimilar (Float32Array)
// ---------------------------------------------------------------------------
function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
function mostSimilar(query, docs) {
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < docs.length; i++) {
    const s = cosineSimilarity(query, docs[i]);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  return bestIdx;
}
const query = new Float32Array([1, 0, 1]);
const docs = [
  new Float32Array([0, 1, 0]),  // orthogonal
  new Float32Array([1, 0, 1]),  // identical direction (best)
  new Float32Array([1, 1, 0]),
];
console.log("Ex10 mostSimilar index:", mostSimilar(query, docs)); // 1

module.exports = {
  topK, resolveConfig, aggregateUsage, dedupeById,
  buildVocab, encode, safeParseJson, makeSweep,
  cosineSimilarity, mostSimilar,
};
