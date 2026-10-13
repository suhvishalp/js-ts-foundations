// Exercise 7 — fetch a public API
// Run: npx tsx solutions/exercise-07-fetch-api.ts
// (Requires internet access. GitHub's public API needs no auth but is rate-limited.)

import { z } from "zod";

// Validate only the fields we care about; the real payload is huge.
const RepoSchema = z.object({
  full_name: z.string(),
  stargazers_count: z.number(),
  open_issues_count: z.number(),
});

async function main(): Promise<void> {
  const url = "https://api.github.com/repos/microsoft/TypeScript";

  const res = await fetch(url, {
    headers: {
      // GitHub asks for a User-Agent; some APIs reject requests without one.
      "user-agent": "learn-js-ts-example",
      accept: "application/vnd.github+json",
    },
  });

  // CRITICAL: fetch does NOT throw on 4xx/5xx. Check res.ok yourself.
  if (!res.ok) {
    throw new Error(`GitHub API returned HTTP ${res.status} ${res.statusText}`);
  }

  // Read the body ONCE. Then validate the shape we depend on.
  const json = await res.json();
  const repo = RepoSchema.parse(json);

  console.log("Repo:   ", repo.full_name);
  console.log("Stars:  ", repo.stargazers_count.toLocaleString());
  console.log("Issues: ", repo.open_issues_count.toLocaleString());
}

main().catch((e) => {
  console.error("Request failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
