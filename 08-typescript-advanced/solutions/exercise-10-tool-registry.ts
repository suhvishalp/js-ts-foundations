// Exercise 10 — Type-safe LLM tool registry (capstone)
// Run: npx tsx exercise-10-tool-registry.ts

// A tool knows its argument type (TArgs) and result type (TResult).
interface ToolDef<TArgs, TResult> {
  description: string;
  handler: (args: TArgs) => TResult | Promise<TResult>;
}

// Identity helper that INFERS TArgs/TResult from the handler you pass, so you
// don't have to write them twice.
function defineTool<TArgs, TResult>(
  def: ToolDef<TArgs, TResult>
): ToolDef<TArgs, TResult> {
  return def;
}

// The registry. Each entry declares its own arg shape (in the handler param).
const tools = {
  search: defineTool({
    description: "Search the knowledge base",
    handler: (args: { query: string; topK: number }) =>
      Promise.resolve({
        hits: Array.from({ length: args.topK }, (_, i) => `${args.query} #${i}`),
      }),
  }),
  calculator: defineTool({
    description: "Evaluate an arithmetic expression",
    handler: (args: { expression: string }) => ({
      result: Function(`"use strict"; return (${args.expression})`)() as number,
    }),
  }),
  getWeather: defineTool({
    description: "Get the weather for a city",
    handler: (args: { city: string; units: "c" | "f" }) => ({
      temp: 21,
      units: args.units,
    }),
  }),
};

// Derive everything FROM the registry — single source of truth.
type ToolName = keyof typeof tools;
type ArgsOf<N extends ToolName> = Parameters<(typeof tools)[N]["handler"]>[0];
type ResultOf<N extends ToolName> = Awaited<
  ReturnType<(typeof tools)[N]["handler"]>
>;

// One call site, fully type-safe: `args` is inferred from `name`.
async function callTool<N extends ToolName>(
  name: N,
  args: ArgsOf<N>
): Promise<ResultOf<N>> {
  const tool = tools[name];
  return (tool.handler as (a: ArgsOf<N>) => Promise<ResultOf<N>>)(args);
}

// --- Demo -------------------------------------------------------------------
async function demo() {
  const s = await callTool("search", { query: "embeddings", topK: 2 });
  console.log("search:", s.hits); // { hits: string[] }

  const c = await callTool("calculator", { expression: "6 * 7" });
  console.log("calc:", c.result); // { result: number }

  const w = await callTool("getWeather", { city: "Berlin", units: "c" });
  console.log("weather:", w.temp, w.units); // { temp: number; units: "c" | "f" }

  // COMPILE errors (uncomment any to see the compiler catch the mistake):
  // await callTool("search", { query: "x" });          // missing topK
  // await callTool("search", { q: "x", topK: 1 });     // wrong key
  // await callTool("nope", { x: 1 });                   // unknown tool
  // await callTool("calculator", { expression: 42 });  // wrong arg type
}

demo();

export { callTool, tools };
export type { ToolName, ArgsOf, ResultOf };
