// examples/arrays-and-matrices.js
// Array mutation, slice/splice, and 2D arrays as matrices.
// Run: node examples/arrays-and-matrices.js

// --- Mutation basics ------------------------------------------------------
const queue = ["a", "b", "c"];
queue.push("d");     // back
queue.unshift("z");  // front
console.log("after push/unshift:", queue); // ['z','a','b','c','d']
console.log("popped:", queue.pop());        // 'd'
console.log("shifted:", queue.shift());     // 'z'
console.log("now:", queue);                 // ['a','b','c']

// --- slice (copy) vs splice (mutate) --------------------------------------
const nums = [10, 20, 30, 40, 50];
console.log("\nslice(1,3):", nums.slice(1, 3)); // [20,30]
console.log("original unchanged:", nums);        // [10,20,30,40,50]

const removed = nums.splice(1, 2, 99);           // remove 2 at idx 1, insert 99
console.log("splice removed:", removed);          // [20,30]
console.log("original mutated:", nums);           // [10,99,40,50]

// --- Sort numbers correctly (copy + comparator) ---------------------------
const scores = [0.42, 0.91, 0.66, 0.88];
const ranked = [...scores].sort((a, b) => b - a);
console.log("\nranked desc:", ranked);            // [0.91,0.88,0.66,0.42]
console.log("top 2:", ranked.slice(0, 2));         // [0.91,0.88]

// --- 2D array as a matrix -------------------------------------------------
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
];
console.log("\nmatrix[1][2] =", matrix[1][2]);     // 6
console.log("rows:", matrix.length, "cols:", matrix[0].length);

// Zero-initialized vector (common when accumulating an embedding sum)
const zeros = Array(5).fill(0);
console.log("zero vector:", zeros);                // [0,0,0,0,0]
