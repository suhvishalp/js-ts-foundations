// compose.js — runnable with:  node compose.js
//
// Composing small, pure transform functions into a single preprocessing
// pipeline, plus a curried configurable tokenizer.

// ---------------------------------------------------------------------------
// pipe: apply functions LEFT-to-RIGHT (first listed runs first)
// compose: apply functions RIGHT-to-LEFT (last listed runs first)
// Both are higher-order functions that return a new function.
// ---------------------------------------------------------------------------
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

// ---------------------------------------------------------------------------
// Small, pure preprocessing steps — each is a plain string => string/array fn.
// ---------------------------------------------------------------------------
const lowercase = (s) => s.toLowerCase();
const stripPunctuation = (s) => s.replace(/[^\w\s]/g, "");
const collapseSpaces = (s) => s.replace(/\s+/g, " ").trim();
const tokenize = (s) => s.split(" ").filter(Boolean);

// Build the pipeline. Reading order matches execution order with `pipe`.
const preprocess = pipe(lowercase, stripPunctuation, collapseSpaces, tokenize);

console.log(preprocess("  The QUICK, brown  Fox!! "));
// => [ 'the', 'quick', 'brown', 'fox' ]

// compose runs right-to-left, so this is the same pipeline written backwards:
const preprocess2 = compose(tokenize, collapseSpaces, stripPunctuation, lowercase);
console.log(preprocess2("  The QUICK, brown  Fox!! "));
// => [ 'the', 'quick', 'brown', 'fox' ]

// ---------------------------------------------------------------------------
// Currying: a configurable tokenizer. Configure once, reuse as text => tokens.
// ---------------------------------------------------------------------------
const makeTokenizer = (config) => (text) => {
  let s = text;
  if (config.lowercase) s = s.toLowerCase();
  if (config.stripPunctuation) s = s.replace(/[^\w\s]/g, "");
  const tokens = s.split(/\s+/).filter(Boolean);
  return config.minLength
    ? tokens.filter((t) => t.length >= config.minLength)
    : tokens;
};

const strictTokenize = makeTokenizer({
  lowercase: true,
  stripPunctuation: true,
  minLength: 3,
});
const looseTokenize = makeTokenizer({ lowercase: false });

console.log(strictTokenize("Hi, the Cat SAT on a mat!"));
// => [ 'the', 'cat', 'sat', 'mat' ]   (dropped "Hi"->"hi"(2), "on", "a")
console.log(looseTokenize("Hi, the Cat SAT on a mat!"));
// => [ 'Hi,', 'the', 'Cat', 'SAT', 'on', 'a', 'mat!' ]

module.exports = { pipe, compose, makeTokenizer };
