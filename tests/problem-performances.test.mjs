import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { PostgrestClient } from "@supabase/postgrest-js";

// Run the actual data function through the real query builder, with an in-memory
// PostgREST response. No environment files, credentials or network are used.
const source = readFileSync(new URL("../lib/data/problems.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function loadData(rows) {
  const client = new PostgrestClient("http://127.0.0.1:54321/rest/v1", {
    fetch: async (input) => {
      const query = new URL(input).searchParams;
      const filtered = rows.filter((row) =>
        ["problem_id", "user_id", "attempt_type", "status"].every((key) =>
          query.get(key) === `eq.${row[key]}`));
      const order = query.get("order").split(",").map((value) => value.split("."));
      filtered.sort((a, b) => {
        for (const [key, direction, nulls] of order) {
          if (a[key] === b[key]) continue;
          if (a[key] === null) return nulls === "nullslast" ? 1 : -1;
          if (b[key] === null) return nulls === "nullslast" ? -1 : 1;
          return (a[key] < b[key] ? -1 : 1) * (direction === "asc" ? 1 : -1);
        }
        return 0;
      });
      return new Response(JSON.stringify(filtered.slice(0, Number(query.get("limit")))), {
        headers: { "Content-Type": "application/json" },
      });
    },
  });
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === "server-only") return {};
      if (name === "@/lib/supabase/server") return { createClient: async () => client };
      if (name === "@/lib/supabase/env") return { hasSupabaseEnv: () => true };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return exports;
}

function attempt(id, raw, normalized = null, date = "2026-10-01T00:00:00Z") {
  return {
    id, raw_score: raw, normalized_performance: normalized, attempted_at: date,
    problem_id: "problem", user_id: "owner", attempt_type: "practice", status: "valid",
  };
}

for (const [direction, expected] of [["higher_is_better", "high"], ["lower_is_better", "low"]]) {
  test(`null normalization uses the best raw score: ${direction}`, async () => {
    const data = loadData([attempt("high", 90), attempt("low", 10), attempt("new", 50, null, "2026-10-02T00:00:00Z")]);
    assert.equal((await data.getBestPracticePerformance("problem", "owner", direction)).id, expected);
  });
}

test("normalized values outrank unnormalized raw scores, including zero", async () => {
  const data = loadData([attempt("raw", 1000), attempt("zero", 1, 0)]);
  assert.equal((await data.getBestPracticePerformance("problem", "owner", "higher_is_better")).id, "zero");
});

test("canonical normalized comparison is direction-independent", async () => {
  const data = loadData([attempt("best", 50, 0.9), attempt("other", 10, 0.8)]);
  assert.equal((await data.getBestPracticePerformance("problem", "owner", "lower_is_better")).id, "best");
});

test("raw score breaks equal normalized scores", async () => {
  const data = loadData([attempt("high", 90, 0.8), attempt("low", 10, 0.8)]);
  assert.equal((await data.getBestPracticePerformance("problem", "owner", "lower_is_better")).id, "low");
});

test("equal scores use newest attempt, then stable id", async () => {
  const data = loadData([attempt("old", 50, null, "2026-09-01T00:00:00Z"), attempt("b", 50), attempt("a", 50)]);
  assert.equal((await data.getBestPracticePerformance("problem", "owner", "higher_is_better")).id, "a");
});

test("invalid, official and other-user attempts are excluded; empty result is null", async () => {
  const data = loadData([
    { ...attempt("invalid", 100), status: "invalidated" },
    { ...attempt("official", 100), attempt_type: "official" },
    { ...attempt("other", 100), user_id: "other" },
  ]);
  assert.equal(await data.getBestPracticePerformance("problem", "owner", "higher_is_better"), null);
});
