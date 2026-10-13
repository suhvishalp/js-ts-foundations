// examples/json-copy-typedarrays.js
// JSON round-trips, shallow vs deep copy, and typed arrays for embeddings.
// Run: node examples/json-copy-typedarrays.js

// --- JSON ------------------------------------------------------------------
const payload = { model: "opus", messages: [{ role: "user", content: "Hi" }] };
const json = JSON.stringify(payload);
console.log("stringify:", json);
console.log("pretty:\n" + JSON.stringify(payload, null, 2));
const parsed = JSON.parse('{"usage":{"total_tokens":128}}');
console.log("parsed tokens:", parsed.usage.total_tokens);

// JSON silently drops undefined/functions; NaN -> null
console.log("lossy:", JSON.stringify({ a: undefined, b: () => 1, c: NaN }));

// --- Shallow vs deep copy --------------------------------------------------
const original = { model: "opus", params: { temperature: 0.7 } };

const shallow = { ...original };
shallow.params.temperature = 0.0;      // leaks into original!
console.log("\nshallow leaked:", original.params.temperature); // 0

const original2 = { params: { temperature: 0.7 } };
const deep = structuredClone(original2);
deep.params.temperature = 0.0;         // isolated
console.log("deep isolated:", original2.params.temperature); // 0.7

// --- Typed arrays + cosine similarity -------------------------------------
function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const query = new Float32Array([1, 0, 1]);
const docA = new Float32Array([1, 0, 1]);
const docB = new Float32Array([0, 1, 0]);
console.log("\nsim(query,docA):", cosineSimilarity(query, docA).toFixed(3)); // 1.000
console.log("sim(query,docB):", cosineSimilarity(query, docB).toFixed(3));   // 0.000
console.log("Float32 precision:", new Float32Array([0.12])[0]); // 0.1199999...
