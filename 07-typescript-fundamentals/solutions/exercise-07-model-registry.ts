// Exercise 7 — as const registry and derived union types
// Run: npx tsx exercise-07-model-registry.ts

// `as const` makes this a deeply-readonly object whose values are exact string
// literals, not just `string`. That precision is what lets us derive types.
const MODELS = {
  fast: "gpt-4o-mini",
  smart: "gpt-4o",
  cheap: "o1-mini",
} as const;

// Keys of the object: "fast" | "smart" | "cheap"
type ModelKey = keyof typeof MODELS;

// Values of the object: "gpt-4o-mini" | "gpt-4o" | "o1-mini"
type ModelId = (typeof MODELS)[ModelKey];

// One runtime object powers both a lookup and two precise types — no drift.
function resolveModel(key: ModelKey): ModelId {
  return MODELS[key];
}

// --- Demo -------------------------------------------------------------------
console.log(resolveModel("fast")); // "gpt-4o-mini"
console.log(resolveModel("smart")); // "gpt-4o"

const allKeys: ModelKey[] = ["fast", "smart", "cheap"];
console.log(allKeys.map(resolveModel)); // all model ids

// COMPILE errors (uncomment to see):
// resolveModel("turbo");           // "turbo" is not a ModelKey
// const bad: ModelId = "gpt-3";    // not one of the known model ids

export { MODELS, resolveModel };
export type { ModelKey, ModelId };
