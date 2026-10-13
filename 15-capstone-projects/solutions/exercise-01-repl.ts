// solutions/exercise-01-repl.ts
// Project 1 / Exercise 1 — interactive REPL mode with conversation history.
// RUNNABLE WITHOUT AN API KEY via a FakeModel. Type questions; /exit to quit.
// Run:  npx tsx solutions/exercise-01-repl.ts
//
// `addTurn` is kept a PURE function so it's trivially unit-testable. Example test
// (put in a separate *.test.ts file so this one stays runnable via tsx):
//
//   import { describe, it, expect } from "vitest";
//   import { addTurn } from "./exercise-01-repl.js";
//   describe("addTurn", () => {
//     it("appends without mutating the original", () => {
//       const h0 = [];
//       expect(addTurn(h0, "user", "hi")).toEqual([{ role: "user", content: "hi" }]);
//       expect(h0).toEqual([]); // immutable
//     });
//   });

import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";

export interface Message { role: "user" | "assistant"; content: string; }

export interface ChatModel {
  stream(messages: Message[]): AsyncIterable<string>;
}

class FakeModel implements ChatModel {
  async *stream(messages: Message[]): AsyncIterable<string> {
    const last = messages.at(-1)?.content ?? "";
    const reply = `(${messages.length} msgs so far) You said: "${last}".`;
    for (const w of reply.split(" ")) {
      await new Promise((r) => setTimeout(r, 15));
      yield w + " ";
    }
  }
}

/** Append a turn and return the new history (pure — easy to test). */
export function addTurn(history: Message[], role: Message["role"], content: string): Message[] {
  return [...history, { role, content }];
}

async function repl(model: ChatModel) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let history: Message[] = [];
  console.log('Interactive mode. Type your question, or "/exit" to quit.\n');
  // `for await (const line of rl)` ends cleanly on EOF (e.g. piped input or Ctrl-D),
  // which the earlier `while (true) { rl.question() }` did not handle.
  process.stdout.write("you> ");
  for await (const raw of rl) {
    const line = raw.trim();
    if (line === "/exit" || line === "") break;
    history = addTurn(history, "user", line);
    process.stdout.write("bot> ");
    let answer = "";
    for await (const delta of model.stream(history)) {
      process.stdout.write(delta);
      answer += delta;
    }
    process.stdout.write("\n\n");
    history = addTurn(history, "assistant", answer.trim());
    process.stdout.write("you> ");
  }
  rl.close();
  console.log("Bye!");
}

// Only start the REPL when run directly (not when imported by the test runner).
// pathToFileURL handles paths containing spaces/special characters.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  repl(new FakeModel());
}
