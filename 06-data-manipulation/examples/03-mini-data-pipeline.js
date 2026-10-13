// Example 03 — A complete mini data pipeline: parse -> clean -> transform -> aggregate
// This mirrors README section 14. Run: node 03-mini-data-pipeline.js

const rawCsv = `id,text,rating
1,"Absolutely love it",5
2,"",4
3,"Broke after a week",1
4,"Great value for money",5
5,"not bad",3
6,"terrible terrible product",1`;

// STEP 1 — PARSE
const [header, ...lines] = rawCsv.trim().split("\n");
const cols = header.split(",");
const parsed = lines.map(line => {
  const cells = line.replace(/"/g, "").split(",");
  return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
});

// STEP 2 — CLEAN
const cleaned = parsed
  .filter(r => r.text.trim() !== "")
  .map(r => ({
    id: Number(r.id),
    text: r.text.toLowerCase().trim(),
    rating: Number(r.rating),
  }));

// STEP 3 — TRANSFORM (feature engineering)
const featured = cleaned.map(r => ({
  ...r,
  wordCount: r.text.split(/\s+/).filter(Boolean).length,
  sentiment:
    r.rating >= 4 ? "positive" : r.rating <= 2 ? "negative" : "neutral",
}));

// STEP 4 — AGGREGATE
const bySentiment = featured.reduce((acc, r) => {
  acc[r.sentiment] = (acc[r.sentiment] ?? 0) + 1;
  return acc;
}, {});
const avgWords =
  featured.reduce((a, r) => a + r.wordCount, 0) / featured.length;

console.log("Clean records:", featured.length);
console.log("Sentiment distribution:", bySentiment);
console.log("Avg word count:", avgWords.toFixed(2));
console.log("Sample record:", featured[0]);
