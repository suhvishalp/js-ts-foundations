// examples/objects-map-set.js
// Objects, computed keys, Map (vocab/cache), and Set (dedup).
// Run: node examples/objects-map-set.js

// --- Objects: access, computed keys, helpers ------------------------------
const config = { model: "claude-opus-4", temperature: 0.7, maxTokens: 1024 };
console.log("dot:", config.model);
const key = "temperature";
console.log("bracket:", config[key]);

const metric = "accuracy";
const results = { [metric]: 0.94, [`${metric}_stddev`]: 0.02 }; // computed keys
console.log("computed keys:", results);

console.log("keys:", Object.keys(config));
console.log("entries doubled:",
  Object.fromEntries(Object.entries({ a: 1, b: 2 }).map(([k, v]) => [k, v * 2])));

// Merge defaults + overrides (spread); temperature:0 is respected.
const merged = { ...config, temperature: 0 };
console.log("merged temp:", merged.temperature); // 0

// --- Map: an embedding cache ----------------------------------------------
const cache = new Map();
cache.set("refund policy", [0.1, 0.2, 0.3]);
cache.set("shipping", [0.4, 0.5, 0.6]);
console.log("\ncache size:", cache.size);
console.log("get:", cache.get("refund policy"));
for (const [q, vec] of cache) console.log("  ", q, "→", vec);

// --- Map: a tokenizer vocabulary ------------------------------------------
function buildVocab(tokens) {
  const vocab = new Map();
  for (const t of tokens) if (!vocab.has(t)) vocab.set(t, vocab.size);
  return vocab;
}
const vocab = buildVocab(["hi", "there", "hi", "world"]);
console.log("\nvocab:", Object.fromEntries(vocab)); // { hi:0, there:1, world:2 }

// --- Set: dedup ------------------------------------------------------------
const ids = ["doc-7", "doc-2", "doc-7", "doc-9"];
console.log("\nunique ids:", [...new Set(ids)]); // ['doc-7','doc-2','doc-9']
