// solutions/exercise-05.js — Curried, configurable tokenizer
// Run with:  node exercise-05.js

// Currying: `makeTokenizer` takes config and RETURNS a `(text) => tokens`
// function. Configure once, reuse everywhere as a simple single-arg function.
const makeTokenizer = (config = {}) => (text) => {
  let s = text;

  // Apply optional lowercasing.
  if (config.lowercase) s = s.toLowerCase();

  // Split on whitespace and drop empty strings.
  let tokens = s.split(/\s+/).filter(Boolean);

  // Strip punctuation from token edges, then remove now-empty tokens.
  tokens = tokens.map((t) => t.replace(/[^\w]/g, "")).filter(Boolean);

  // Drop purely numeric tokens if requested.
  if (config.dropNumbers) {
    tokens = tokens.filter((t) => !/^\d+$/.test(t));
  }

  // Drop tokens shorter than minLength if requested.
  if (config.minLength) {
    tokens = tokens.filter((t) => t.length >= config.minLength);
  }

  return tokens;
};

// --- Demonstration: two tokenizers from the same factory -------------------
const strict = makeTokenizer({ lowercase: true, minLength: 3, dropNumbers: true });
const loose = makeTokenizer({ lowercase: false });

const sample = "The Cat sat on 42 mats, quickly!";

console.log(strict(sample));
// => [ 'the', 'cat', 'sat', 'mats', 'quickly' ]
//    (dropped "on" (len 2) and "42" (numeric); punctuation stripped)

console.log(loose(sample));
// => [ 'The', 'Cat', 'sat', 'on', '42', 'mats', 'quickly' ]

// Same input, different behavior => currying let us pre-bake the config.
module.exports = { makeTokenizer };
