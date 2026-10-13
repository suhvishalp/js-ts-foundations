// Example 03 — LLM config (optional/readonly), literal unions, and as-const vs enum
// Run: npx tsx 03-llm-config-and-enums.ts

// --- Optional & readonly properties on a request config ---------------------
type Role = "system" | "user" | "assistant" | "tool";

interface RequestConfig {
  model: string; // required
  readonly apiKey: string; // required, immutable after creation
  temperature?: number; // optional knobs
  maxTokens?: number;
  stream?: boolean;
}

function withDefaults(cfg: RequestConfig) {
  return {
    model: cfg.model,
    apiKey: cfg.apiKey,
    temperature: cfg.temperature ?? 0.7,
    maxTokens: cfg.maxTokens ?? 1024,
    stream: cfg.stream ?? false,
  };
}

const resolved = withDefaults({ model: "gpt-4o", apiKey: "sk-demo" });
console.log("resolved config:", resolved);
// cfg.apiKey = "sk-other";  // ❌ readonly — cannot reassign

// --- Literal union in action ------------------------------------------------
const role: Role = "assistant";
console.log("role:", role);
// const bad: Role = "robot";  // ❌ not a valid Role

// --- as const object (preferred over enum) ----------------------------------
const LogLevel = {
  Debug: "debug",
  Info: "info",
  Warn: "warn",
  Error: "error",
} as const;

type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];
// "debug" | "info" | "warn" | "error"

function setLevel(level: LogLevel) {
  console.log("log level set to:", level);
}
setLevel(LogLevel.Warn); // "warn"
setLevel("info"); // also fine — accepts the literal
// setLevel("trace");     // ❌ not a valid level

// --- Comparison: a numeric enum (note the quirks) ---------------------------
enum Priority {
  Low, // 0
  Medium, // 1
  High, // 2
}
console.log("enum values:", Priority.Low, Priority.High); // 0 2
console.log("reverse map:", Priority[2]); // "High" (numeric enums allow this)
