// examples/primitives-and-types.js
// Tour of primitive types, typeof, and the null quirk.
// Run: node examples/primitives-and-types.js

const text = "embeddings";        // string
const dimension = 1536;           // number (a common embedding size)
const huge = 9007254740993n;      // bigint (note the trailing n)
const isReady = true;             // boolean
let notSetYet;                    // undefined
const empty = null;               // null
const uniqueKey = Symbol("id");   // symbol

console.log("string:   ", text, "→", typeof text);
console.log("number:   ", dimension, "→", typeof dimension);
console.log("bigint:   ", huge, "→", typeof huge);
console.log("boolean:  ", isReady, "→", typeof isReady);
console.log("undefined:", notSetYet, "→", typeof notSetYet);
console.log("symbol:   ", uniqueKey.toString(), "→", typeof uniqueKey);

// The famous quirk: typeof null is "object", not "null".
console.log("null:     ", empty, "→", typeof empty, "(quirk!)");
console.log("null test:", empty === null); // the correct way to check for null

// null vs undefined by convention
let cache;                 // undefined: never assigned
let result = null;         // null: deliberately empty
console.log("\nundefined means 'not set yet':", cache);
console.log("null means 'intentionally empty':", result);
