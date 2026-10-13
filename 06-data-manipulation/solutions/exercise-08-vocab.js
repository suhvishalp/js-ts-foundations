// Exercise 8 — Tokenize & build a vocabulary (flatMap + frequency + ranking)
// Run: node exercise-08-vocab.js

/**
 * Build a { token: id } vocabulary from a corpus.
 * - Tokenizes every document into a single token stream (flatMap).
 * - Counts frequencies (reduce into an object).
 * - Ranks by frequency, keeps the top `maxSize`.
 * - Assigns integer ids: most frequent token = 0.
 *
 * This is a miniature of what real tokenizers do.
 */
function buildVocab(corpus, maxSize) {
  // 1. Tokenize: each doc -> many tokens, flattened into one array.
  const tokens = corpus.flatMap(doc =>
    doc.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean)
  );

  // 2. Frequency map: { token: count }.
  const freq = tokens.reduce((acc, tok) => {
    acc[tok] = (acc[tok] ?? 0) + 1;
    return acc;
  }, {});

  // 3. Rank by count (desc), keep top maxSize, assign sequential ids.
  const ranked = Object.entries(freq)
    .sort((a, b) => b[1] - a[1]) // highest count first
    .slice(0, maxSize)
    .map(([token], id) => [token, id]); // [token, newId]

  // 4. Back into an object.
  return Object.fromEntries(ranked);
}

// --- Demo -------------------------------------------------------------------
const corpus = ["the cat sat", "the dog ran", "cat and dog"];

console.log(buildVocab(corpus, 3));
// "the", "cat", "dog" are most frequent (2 each / ties broken by insertion order)
// e.g. { the: 0, cat: 1, dog: 2 }

console.log(buildVocab(corpus, 10));
// full vocab with ids 0..n-1

module.exports = { buildVocab };
