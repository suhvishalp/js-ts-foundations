// Example 03 — satisfies operator + template literal types
// Run: npx tsx 03-satisfies-and-templates.ts

// --- satisfies: validate shape but keep precise keys/values -----------------
interface ModelInfo {
  contextWindow: number;
  supportsTools: boolean;
}

const MODELS = {
  "gpt-4o": { contextWindow: 128000, supportsTools: true },
  "o1-mini": { contextWindow: 128000, supportsTools: false },
} satisfies Record<string, ModelInfo>;

// Because of `satisfies`, keys are preserved exactly:
console.log(MODELS["gpt-4o"].contextWindow); // 128000 (number, autocompletes)
// MODELS["gpt-5"];                            // ❌ not a known key
// A plain `: Record<string, ModelInfo>` annotation would allow MODELS["gpt-5"]
// with no error and lose the exact-key autocomplete.

// --- Template literal types -------------------------------------------------
type Entity = "message" | "tool" | "agent";
type Phase = "start" | "end" | "error";
type EventName = `${Entity}:${Phase}`;
// "message:start" | "message:end" | ... all 9 combinations

function emit(event: EventName, payload: unknown): void {
  console.log(`[${event}]`, payload);
}
emit("tool:start", { name: "search" });
emit("agent:end", { answer: 42 });
// emit("tool:paused", {});   // ❌ not a valid EventName

// --- Intrinsic string manipulators ------------------------------------------
type Loud = Uppercase<"stream">; // "STREAM"
const loud: Loud = "STREAM";
console.log(loud);

// --- Combining: a model id pattern ------------------------------------------
type Provider = "openai" | "anthropic";
type ModelId = `${Provider}/${string}`;
const id: ModelId = "openai/gpt-4o";
console.log("model id:", id);
// const bad: ModelId = "gpt-4o";   // ❌ missing provider prefix
