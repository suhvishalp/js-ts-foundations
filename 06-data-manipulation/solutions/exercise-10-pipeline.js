// Exercise 10 — Full mini pipeline: parse -> clean -> transform -> aggregate
// Run: node exercise-10-pipeline.js

// --- STEP 1: PARSE ----------------------------------------------------------
function parseCsv(csv) {
  const [header, ...lines] = csv.trim().split("\n");
  const cols = header.split(",");
  return lines.map(line => {
    // Strip the surrounding quotes; naive but fine for this dataset.
    const cells = line.replace(/"/g, "").split(",");
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
}

// --- STEP 2: CLEAN ----------------------------------------------------------
function clean(rows) {
  return rows
    .filter(r => r.text.trim() !== "") // drop empty reviews
    .map(r => ({
      id: Number(r.id),
      text: r.text.toLowerCase().trim(),
      rating: Number(r.rating),
    }));
}

// --- STEP 3: TRANSFORM (feature engineering) --------------------------------
function addFeatures(rows) {
  return rows.map(r => ({
    ...r,
    wordCount: r.text.split(/\s+/).filter(Boolean).length,
    sentiment:
      r.rating >= 4 ? "positive" : r.rating <= 2 ? "negative" : "neutral",
  }));
}

// --- STEP 4: AGGREGATE ------------------------------------------------------
function aggregate(rows) {
  const sentimentDistribution = rows.reduce((acc, r) => {
    acc[r.sentiment] = (acc[r.sentiment] ?? 0) + 1;
    return acc;
  }, {});

  const avgWordCount =
    rows.length === 0
      ? 0
      : rows.reduce((a, r) => a + r.wordCount, 0) / rows.length;

  return { count: rows.length, sentimentDistribution, avgWordCount };
}

// --- ORCHESTRATION ----------------------------------------------------------
function runPipeline(rawCsv) {
  const parsed = parseCsv(rawCsv);
  const cleaned = clean(parsed);
  const featured = addFeatures(cleaned);
  return aggregate(featured);
}

// --- Demo -------------------------------------------------------------------
const rawCsv = `id,text,rating
1,"Absolutely love it",5
2,"",4
3,"Broke after a week",1
4,"Great value for money",5
5,"not bad",3`;

console.log(runPipeline(rawCsv));
// {
//   count: 4,
//   sentimentDistribution: { positive: 2, negative: 1, neutral: 1 },
//   avgWordCount: 3
// }

module.exports = { parseCsv, clean, addFeatures, aggregate, runPipeline };
