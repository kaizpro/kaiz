import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";

const nodeRequire = createRequire(import.meta.url);
function loadModule(file, overrides = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, Date, Object, Number,
    require: (name) => name in overrides ? overrides[name] : nodeRequire(name),
  });
  return exports;
}
const validation = () => loadModule("lib/validation/problem.ts");
const problemInput = (extra = {}) => ({
  title: "Source-faithful problem", slug: "source-problem", category: "AI", metric_name: "F1",
  metric_direction: "higher_is_better", difficulty_status: "unrated", source_provider: "manual",
  ...extra,
});

test("problem validation accepts schema-supported metadata and normalizes optional blanks", () => {
  const parsed = validation().problemSchema.parse(problemInput({ competition_id: "", reference_score: "0", tags: "AI, vision" }));
  assert.equal(parsed.competition_id, null);
  assert.equal(parsed.reference_score, "0");
  assert.deepEqual(Array.from(parsed.tags), ["AI", "vision"]);
});
test("invalid slug, unsafe URLs and inconsistent difficulty are rejected", () => {
  for (const extra of [{ slug: "bad slug" }, { statement_url: "javascript:alert(1)" },
    { difficulty_status: "rated", difficulty_rating: "" }, { difficulty_rating: "10" }]) {
    assert.equal(validation().problemSchema.safeParse(problemInput(extra)).success, false);
  }
});
test("problem summary follows the database's 600-character boundary", () => {
  assert.equal(validation().problemSchema.safeParse(problemInput({ summary: "x".repeat(600) })).success, true);
  assert.equal(validation().problemSchema.safeParse(problemInput({ summary: "x".repeat(601) })).success, false);
});
test("practice accepts zero/negative decimal scores and UTC times, never NaN or Infinity", () => {
  for (const raw_score of ["0", "-1.25", "0.842"]) {
    assert.equal(validation().practiceSchema.safeParse({ raw_score, attempted_at: "2026-10-01T10:00:00Z" }).success, true);
  }
  for (const raw_score of ["", "NaN", "Infinity", "1e999"]) {
    assert.equal(validation().practiceSchema.safeParse({ raw_score, attempted_at: "2026-10-01T10:00:00Z" }).success, false);
  }
  assert.equal(validation().practiceSchema.safeParse({ raw_score: "1", attempted_at: "not a date" }).success, false);
  assert.equal(validation().practiceSchema.parse({ raw_score: "1", attempted_at: "2026-10-01T10:00:00.123" }).attempted_at, "2026-10-01T10:00:00.123Z");
});

// A stateful database boundary, not a mock of application business logic.
function environment({ user = "owner", admin = true, error = null, published = true, reviewed = false } = {}) {
  const problems = new Map();
  const attempts = new Map();
  attempts.set("60000000-0000-4000-8000-000000000001", {
    id: "60000000-0000-4000-8000-000000000001", problem_id: "50000000-0000-4000-8000-000000000001",
    user_id: "owner", attempt_type: "practice", status: reviewed ? "invalidated" : "valid",
    normalized_performance: null, source_provider: null, source_external_id: null, source_provenance: {},
  });
  const client = { from(table) {
    let operation = "read", payload, filters = [];
    const matches = (row) => filters.every(([key, value]) => row[key] === value);
    const query = {
      select() { return query; }, eq(key, value) { filters.push([key, value]); return query; },
      insert(row) { operation = "insert"; payload = row; return query; },
      update(row) { operation = "update"; payload = row; return query; },
      delete() { operation = "delete"; return query; },
      async maybeSingle() { return query; }, async single() { return query; },
      then(resolve) {
        if (error && operation !== "read") return Promise.resolve({ data: null, error }).then(resolve);
        if (table === "problems" && operation === "read") return Promise.resolve({
          data: published ? { id: "50000000-0000-4000-8000-000000000001", slug: "source-problem", competition_id: null, published: true } : null, error: null,
        }).then(resolve);
        if (table === "competitions") return Promise.resolve({ data: null, error: null }).then(resolve);
        const records = table === "problems" ? problems : attempts;
        let data = null;
        if (operation === "insert") { data = { id: "new", ...payload }; records.set(data.id, data); }
        else {
          data = [...records.values()].find(matches) ?? null;
          if (data && operation === "update") { Object.assign(data, payload); }
          if (data && operation === "delete") records.delete(data.id);
        }
        return Promise.resolve({ data, error: null }).then(resolve);
      },
    };
    return query;
  } };
  const common = {
    "@/lib/supabase/server": { createClient: async () => client },
    "@/lib/auth": {
      requireAdmin: async () => { if (!admin) throw new Error("denied"); return { id: "admin" }; },
      getCurrentUser: async () => user ? { id: user } : null,
    },
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect: (url) => { throw new Error(`redirect:${url}`); } },
    "@/lib/validation/problem": validation(),
  };
  return { problems, attempts,
    adminActions: loadModule("app/admin/problems/actions.ts", common),
    practiceActions: loadModule("app/problems/actions.ts", common),
  };
}
function form(input) { const result = new FormData(); for (const [key, value] of Object.entries(input)) result.set(key, String(value)); return result; }
const problemId = "50000000-0000-4000-8000-000000000001";
const attemptId = "60000000-0000-4000-8000-000000000001";

test("members cannot create or edit/publish problems through actions", async () => {
  const env = environment({ admin: false });
  await assert.rejects(env.adminActions.createProblem({}, form(problemInput())), /denied/);
  await assert.rejects(env.adminActions.updateProblem(problemId, {}, form(problemInput({ published: "true" }))), /denied/);
  assert.equal(env.problems.size, 0);
});
test("admin creates valid problem data with server-derived attribution", async () => {
  const env = environment();
  await assert.rejects(env.adminActions.createProblem({}, form(problemInput({ created_by: "spoofed", published: "true" }))), /redirect:/);
  const row = env.problems.get("new");
  assert.equal(row.created_by, "admin");
  assert.equal(row.published, true);
  assert.equal(row.title, "Source-faithful problem");
});
test("duplicate slug database conflict gives a clear error; invalid slug does not write", async () => {
  const env = environment({ error: { code: "23505" } });
  assert.match((await env.adminActions.createProblem({}, form(problemInput()))).error, /slug|source identity/i);
  assert.ok((await env.adminActions.createProblem({}, form(problemInput({ slug: "invalid slug" })))).error);
  assert.equal(env.problems.size, 0);
});
test("admin edits and unpublishes a problem without overwriting provenance or creator", async () => {
  const env = environment();
  env.problems.set(problemId, { id: problemId, created_by: "original", source_provenance: { approved: true } });
  await assert.rejects(env.adminActions.updateProblem(problemId, {}, form(problemInput({ title: "Edited problem", published: "false", source_provenance: "{}" }))), /redirect:/);
  const row = env.problems.get(problemId);
  assert.equal(row.title, "Edited problem");
  assert.equal(row.published, false);
  assert.equal(row.created_by, "original");
  assert.deepEqual(row.source_provenance, { approved: true });
  assert.equal(row.updated_by, "admin");
});
test("missing competition is a validation error, not a silent detach", async () => {
  const env = environment();
  const result = await env.adminActions.createProblem({}, form(problemInput({ competition_id: "20000000-0000-4000-8000-000000000001" })));
  assert.match(result.error, /competition/i);
  assert.equal(env.problems.size, 0);
});
test("anonymous cannot create practice", async () => {
  const env = environment({ user: null });
  assert.ok((await env.practiceActions.createPracticeAttempt(problemId, {}, form({ raw_score: "1", attempted_at: "2026-10-01T10:00:00Z" }))).error);
  assert.equal(env.attempts.size, 1);
});
test("practice create derives owner and strips every trusted field", async () => {
  const env = environment();
  const result = await env.practiceActions.createPracticeAttempt(problemId, {}, form({ raw_score: "0.842", attempted_at: "2026-10-01T10:00:00Z",
    user_id: "other", normalized_performance: "1", status: "valid", source_provider: "trusted",
    source_provenance: '{"trusted":true}', source_external_id: "x", attempt_type: "official", competition_result_id: attemptId, created_by: "admin" }));
  assert.ok(result.success);
  const row = env.attempts.get("new");
  assert.equal(row.user_id, "owner");
  assert.equal(row.attempt_type, "practice");
  for (const field of ["normalized_performance", "status", "source_provider", "source_provenance", "source_external_id", "competition_result_id", "created_by"]) assert.equal(field in row, false);
});
test("unpublished problem cannot receive application practice submissions", async () => {
  const env = environment({ published: false });
  assert.ok((await env.practiceActions.createPracticeAttempt(problemId, {}, form({ raw_score: "1", attempted_at: "2026-10-01T10:00:00Z" }))).error);
  assert.equal(env.attempts.size, 1);
});
test("another user cannot edit or delete an owner's attempt", async () => {
  const env = environment({ user: "other" });
  assert.ok((await env.practiceActions.updatePracticeAttempt(problemId, attemptId, {}, form({ raw_score: "999", attempted_at: "2026-10-01T10:00:00Z" }))).error);
  assert.ok((await env.practiceActions.deletePracticeAttempt(problemId, attemptId, {}, form({ confirm: "true" }))).error);
  assert.equal(env.attempts.size, 1);
});
test("owner edit allows only raw score/time; reviewed attempts cannot be edited or deleted", async () => {
  const env = environment();
  assert.ok((await env.practiceActions.updatePracticeAttempt(problemId, attemptId, {}, form({ raw_score: "9", attempted_at: "2026-10-01T10:00:00Z", normalized_performance: "1" }))).success);
  assert.equal(env.attempts.get(attemptId).raw_score, "9");
  assert.equal(env.attempts.get(attemptId).normalized_performance, null);
  const reviewed = environment({ reviewed: true });
  assert.ok((await reviewed.practiceActions.updatePracticeAttempt(problemId, attemptId, {}, form({ raw_score: "9", attempted_at: "2026-10-01T10:00:00Z" }))).error);
  assert.ok((await reviewed.practiceActions.deletePracticeAttempt(problemId, attemptId, {}, form({ confirm: "true" }))).error);
  assert.equal(reviewed.attempts.size, 1);
});
test("delete requires explicit confirmation and removes an eligible owner attempt", async () => {
  const env = environment();
  assert.ok((await env.practiceActions.deletePracticeAttempt(problemId, attemptId, {}, form({}))).error);
  assert.equal(env.attempts.size, 1);
  assert.ok((await env.practiceActions.deletePracticeAttempt(problemId, attemptId, {}, form({ confirm: "true" }))).success);
  assert.equal(env.attempts.size, 0);
});
