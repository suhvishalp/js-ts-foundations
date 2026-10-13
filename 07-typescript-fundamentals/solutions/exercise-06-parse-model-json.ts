// Exercise 6 — Type guard for untrusted model JSON
// Run: npx tsx exercise-06-parse-model-json.ts

// The shape we WANT the model to return.
type Sentiment = {
  sentiment: "positive" | "negative";
  confidence: number;
};

// A type predicate (`x is Sentiment`). If it returns true, TS treats the value
// as Sentiment for the rest of the branch. We validate every field explicitly
// because model output is untrusted — it may be missing fields or wrong types.
function isSentiment(x: unknown): x is Sentiment {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  return (
    (obj.sentiment === "positive" || obj.sentiment === "negative") &&
    typeof obj.confidence === "number"
  );
}

// Parse defensively: model output may not even be valid JSON, and if it parses
// it may not match our shape. Return null so the caller can handle failure.
function parseSentiment(raw: string): Sentiment | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw); // starts life as unknown, NOT any
  } catch {
    return null; // not valid JSON at all
  }
  return isSentiment(parsed) ? parsed : null;
}

// --- Demo -------------------------------------------------------------------
console.log(parseSentiment('{"sentiment":"positive","confidence":0.92}'));
// { sentiment: 'positive', confidence: 0.92 }

console.log(parseSentiment("Sure! The sentiment is positive."));
// null  (not valid JSON)

console.log(parseSentiment('{"sentiment":"maybe","confidence":0.5}'));
// null  (invalid sentiment value)

console.log(parseSentiment('{"sentiment":"negative","confidence":"high"}'));
// null  (confidence is not a number)

export { Sentiment, isSentiment, parseSentiment };
