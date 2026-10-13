// solutions/exercise-08-sandboxed-readfile.ts
// Project 4 / Exercise 8 — a path-traversal-safe readFile tool for an agent.
// Includes tests using a temp directory. Run:
//   npx vitest run solutions/exercise-08-sandboxed-readfile.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { z } from "zod";
import { resolve, sep, join } from "node:path";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { readFile as fsReadFile } from "node:fs/promises";
import { tmpdir } from "node:os";

interface Tool<A> {
  name: string;
  description: string;
  parameters: z.ZodType<A>;
  execute(args: A): Promise<string>;
}

/** Build a readFile tool locked to `baseDir`. Any path escaping it is rejected. */
export function makeReadFileTool(baseDir: string): Tool<{ path: string }> {
  const root = resolve(baseDir);
  return {
    name: "readFile",
    description: `Read a UTF-8 text file relative to ${baseDir}.`,
    parameters: z.object({ path: z.string() }),
    async execute({ path }) {
      const target = resolve(root, path);
      // Must live strictly inside root (root + separator prevents /root-evil bypass).
      if (target !== root && !target.startsWith(root + sep)) {
        throw new Error("Access denied: path escapes the sandbox");
      }
      try {
        return await fsReadFile(target, "utf8");
      } catch {
        throw new Error(`File not found: ${path}`);
      }
    },
  };
}

// ---- Tests ----
describe("sandboxed readFile tool", () => {
  let base: string;
  let tool: Tool<{ path: string }>;

  beforeAll(async () => {
    base = await mkdtemp(join(tmpdir(), "agent-sandbox-"));
    await mkdir(join(base, "docs"), { recursive: true });
    await writeFile(join(base, "docs", "hello.txt"), "hi from the sandbox");
    tool = makeReadFileTool(base);
  });

  afterAll(async () => {
    await rm(base, { recursive: true, force: true });
  });

  it("reads a legitimate file inside the sandbox", async () => {
    expect(await tool.execute({ path: "docs/hello.txt" })).toBe("hi from the sandbox");
  });

  it("rejects traversal with ../", async () => {
    await expect(tool.execute({ path: "../../etc/passwd" })).rejects.toThrow(/escapes the sandbox/);
  });

  it("rejects absolute paths outside the sandbox", async () => {
    await expect(tool.execute({ path: "/etc/hosts" })).rejects.toThrow(/escapes the sandbox/);
  });

  it("returns a friendly error for missing files (no stack trace)", async () => {
    await expect(tool.execute({ path: "docs/nope.txt" })).rejects.toThrow(/File not found/);
  });

  it("rejects invalid arguments via its Zod schema", () => {
    expect(tool.parameters.safeParse({ path: 42 }).success).toBe(false);
  });
});
