// solutions/exercise-01.js — Pure text normalizer
// Run with:  node exercise-01.js

// A PURE function:
//   - output depends only on the input `text`
//   - no side effects (no mutation, no I/O, no globals)
//   - same input always yields the same output (reproducible!)
function normalize(text) {
  return text
    .trim()                 // remove leading/trailing whitespace
    .toLowerCase()          // case-fold for consistency
    .replace(/[^\w\s]/g, "") // drop punctuation (keep letters, digits, _, space)
    .replace(/\s+/g, " ")   // collapse internal whitespace runs to one space
    .trim();                // re-trim in case punctuation removal left edges
}

// --- Demonstration / tests -------------------------------------------------
console.log(normalize("  The QUICK, brown  Fox!! "));
// => "the quick brown fox"

console.log(normalize("Hello,\tWorld\n\n"));
// => "hello world"

// Reproducibility: same input => identical output every time.
const input = "  Repeatable INPUT?? ";
console.log(normalize(input) === normalize(input)); // => true

// Purity: the original string is a primitive and cannot be mutated, but we also
// prove we never touched any external state — calling it again is unaffected.
console.log(normalize("A. B. C."));   // => "a b c"
console.log(normalize("A. B. C."));   // => "a b c"  (identical)

module.exports = { normalize };
