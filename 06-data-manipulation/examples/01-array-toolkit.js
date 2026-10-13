// Example 01 — The core array toolkit at a glance
// Run: node 01-array-toolkit.js

const nums = [5, 2, 8, 1, 9, 3];

// map: transform every element (same length)
console.log("map:", nums.map(n => n * 2)); // [10,4,16,2,18,6]

// filter: keep matches (same-or-shorter)
console.log("filter:", nums.filter(n => n > 4)); // [5,8,9]

// reduce: fold to a single value
console.log("reduce sum:", nums.reduce((a, n) => a + n, 0)); // 28

// find / findIndex
console.log("find >5:", nums.find(n => n > 5)); // 8
console.log("findIndex >5:", nums.findIndex(n => n > 5)); // 2

// some / every (short-circuit)
console.log("some >8:", nums.some(n => n > 8)); // true
console.log("every >0:", nums.every(n => n > 0)); // true

// sort — COPY first (sort mutates) and pass a numeric comparator
console.log("sort asc:", [...nums].sort((a, b) => a - b)); // [1,2,3,5,8,9]
console.log("sort desc:", [...nums].sort((a, b) => b - a)); // [9,8,5,3,2,1]
console.log("original untouched:", nums); // [5,2,8,1,9,3]

// flat / flatMap
console.log("flat:", [[1, 2], [3], [4, 5]].flat()); // [1,2,3,4,5]
console.log("flatMap:", ["a b", "c d"].flatMap(s => s.split(" "))); // [a,b,c,d]

// chaining: read top to bottom, one step per line
const result = nums
  .filter(n => n % 2 === 1) // odds: [5,1,9,3]
  .map(n => n * 10) // [50,10,90,30]
  .sort((a, b) => a - b); // [10,30,50,90]
console.log("chained:", result);

// Array.from — range and dedupe
console.log("range:", Array.from({ length: 5 }, (_, i) => i)); // [0,1,2,3,4]
console.log("dedupe:", Array.from(new Set([1, 1, 2, 3, 3]))); // [1,2,3]
