// Example 02 — Frequency maps, grouping, and class distribution (NLP/ML staples)
// Run: node 02-frequency-and-grouping.js

// --- Frequency map (word counts) --------------------------------------------
const text = "the cat sat on the mat the cat ran";
const freq = text.split(" ").reduce((acc, tok) => {
  acc[tok] = (acc[tok] ?? 0) + 1;
  return acc;
}, {});
console.log("frequencies:", freq);
// { the: 3, cat: 2, sat: 1, on: 1, mat: 1, ran: 1 }

// Top-k words by frequency
const topK = Object.entries(freq)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3);
console.log("top 3:", topK); // [ ['the',3], ['cat',2], ['sat',1] ]

// --- Grouping records -------------------------------------------------------
const samples = [
  { label: "spam", text: "win money" },
  { label: "ham", text: "lunch?" },
  { label: "spam", text: "free prize" },
  { label: "ham", text: "meeting 3pm" },
  { label: "spam", text: "cheap meds" },
];

// Reduce-based grouping (portable everywhere)
const byLabel = samples.reduce((groups, s) => {
  (groups[s.label] ??= []).push(s);
  return groups;
}, {});
console.log("group counts:", {
  spam: byLabel.spam.length,
  ham: byLabel.ham.length,
});

// Class distribution as percentages (imbalance check before training)
const total = samples.length;
const distribution = Object.fromEntries(
  Object.entries(byLabel).map(([label, items]) => [
    label,
    `${((items.length / total) * 100).toFixed(0)}%`,
  ])
);
console.log("distribution:", distribution); // { spam: '60%', ham: '40%' }

// Modern alternative (Node 21+ / modern browsers):
// const grouped = Object.groupBy(samples, s => s.label);

// --- Building a token -> id vocabulary --------------------------------------
const vocab = Object.fromEntries(
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([token], id) => [token, id])
);
console.log("vocab:", vocab);
// { the: 0, cat: 1, sat: 2, on: 3, mat: 4, ran: 5 }
