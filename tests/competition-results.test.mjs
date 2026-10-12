import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { PostgrestClient } from "@supabase/postgrest-js";
import { z } from "zod";
import { loadContentModule } from "../scripts/content/load.mjs";

const competitionId = "80000000-0000-4000-8000-000000000001";
const setId = "80000000-0000-4000-8000-000000000002";
const resultId = "80000000-0000-4000-8000-000000000003";
const validation = loadContentModule("@/lib/validation/competition-result");
function load(file, imports) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, Date, Object, FormData, URL, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } });
  return exports;
}
function environment({ authorized = true, belongs = true, published = false, databaseError = null } = {}) {
  const calls = [];
  const client = { from(table) {
    let operation = "read", payload; const filters = [];
    const query = {
      select() { return query; }, eq(k, v) { filters.push([k, v]); return query; },
      insert(row) { operation = "insert"; payload = row; return query; },
      update(row) { operation = "update"; payload = row; return query; },
      delete() { operation = "delete"; return query; }, maybeSingle() { return query; }, single() { return query; },
      then(resolve) {
        calls.push({ table, operation, payload, filters });
        let data = { id: resultId };
        if (table === "competition_result_sets" && operation === "read") data = belongs ? { id: setId, status: "official", published } : null;
        if (table === "competitions") data = { slug: "edition-2026" };
        if (table === "profiles") data = null;
        return Promise.resolve({ data, error: operation !== "read" ? databaseError : null }).then(resolve);
      },
    }; return query;
  } };
  const actions = load("app/admin/competitions/[id]/results/actions.ts", {
    "next/cache": { revalidatePath() {} }, zod: { z },
    "@/lib/auth": { requireAdmin: async () => { if (!authorized) throw new Error("admin required"); return { id: "actor" }; } },
    "@/lib/supabase/server": { createClient: async () => client },
    "@/lib/validation/competition-result": validation,
  });
  return { actions, calls };
}
const form = (values) => { const data = new FormData(); for (const [k, v] of Object.entries(values)) data.set(k, String(v)); return data; };
const setForm = () => form({ name: "Official selected rows", status: "official", source: "official_import", sourceLabel: "Organizer", sourceUrl: "https://example.org/results" });
const rowForm = (extra = {}) => form({ resultSetId: setId, participantType: "individual", participantName: "Public contestant", rank: "1", score: "0", scoreDisplay: "0.0000", countryCode: "KZ", award: "", resultStatus: "ranked", ...extra });

test("all six result write actions require an admin before touching the database", async () => {
  const { actions, calls } = environment({ authorized: false });
  for (const call of [
    () => actions.createResultSet(competitionId, {}, setForm()), () => actions.updateResultSet(competitionId, setId, {}, setForm()),
    () => actions.deleteResultSet(competitionId, form({ resultSetId: setId })), () => actions.createResult(competitionId, {}, rowForm()),
    () => actions.updateResult(competitionId, resultId, {}, rowForm()), () => actions.deleteResult(competitionId, form({ resultId })),
  ]) await assert.rejects(call, /admin required/);
  assert.equal(calls.length, 0);
});
test("set creation without the published checkbox is draft and timestamps/actor are server-derived", async () => {
  const { actions, calls } = environment(); assert.ok((await actions.createResultSet(competitionId, {}, setForm())).success);
  const row = calls.find((c) => c.operation === "insert").payload;
  assert.equal(row.published, false); assert.equal(row.verified_at, null); assert.equal(row.created_by, "actor");
});
test("a result set from a different competition rejects entry creation before insertion", async () => {
  const { actions, calls } = environment({ belongs: false });
  assert.match((await actions.createResult(competitionId, {}, rowForm())).error, /does not belong/);
  assert.equal(calls.some((c) => c.operation === "insert"), false);
});
test("zero and missing scores, team type and absent account links remain source-faithful", async () => {
  const { actions, calls } = environment();
  await actions.createResult(competitionId, {}, rowForm({ participantType: "team" }));
  await actions.createResult(competitionId, {}, rowForm({ score: "", scoreDisplay: "N/A", rank: "125" }));
  const rows = calls.filter((c) => c.operation === "insert").map((c) => c.payload);
  assert.equal(rows[0].score, 0); assert.equal(rows[0].participant_type, "team"); assert.equal(rows[0].user_id, null);
  assert.equal(rows[0].verified, false); assert.equal(rows[1].score, null); assert.equal(rows[1].score_display, "N/A"); assert.equal(rows[1].rank, 125);
});
test("remote unranked rows retain null ranks and an award", async () => {
  const { actions, calls } = environment();
  await actions.createResult(competitionId, {}, rowForm({ rank: "", resultStatus: "unranked", award: "Gold" }));
  const row = calls.find((c) => c.operation === "insert").payload;
  assert.equal(row.rank, null); assert.equal(row.result_status, "unranked"); assert.equal(row.award, "Gold");
});
test("client-supplied verified/user_id/actor fields cannot elevate result trust", async () => {
  const { actions, calls } = environment();
  await actions.createResult(competitionId, {}, rowForm({ verified: "true", user_id: "other", created_by: "other" }));
  const row = calls.find((c) => c.operation === "insert").payload;
  assert.equal(row.verified, false); assert.equal(row.user_id, null); assert.equal(row.created_by, "actor");
});
test("invalid ranked/unranked input and nonexistent profile links do not insert", async () => {
  const { actions, calls } = environment();
  assert.ok((await actions.createResult(competitionId, {}, rowForm({ rank: "" }))).error);
  assert.ok((await actions.createResult(competitionId, {}, rowForm({ linkedUsername: "unknown" }))).error);
  assert.equal(calls.some((c) => c.operation === "insert"), false);
});
test("update/delete scope includes the competition ID; DB/RLS errors surface as failures", async () => {
  const { actions, calls } = environment({ databaseError: { message: "write denied by RLS" } });
  assert.match((await actions.updateResult(competitionId, resultId, {}, rowForm())).error, /denied by RLS/);
  await assert.rejects(() => actions.deleteResult(competitionId, form({ resultId })), /Unable to delete/);
  assert.ok(calls.filter((c) => c.operation !== "read").every((c) => c.filters.some(([k, v]) => k === "competition_id" && v === competitionId)));
});
test("public data query explicitly filters published sets, preserves ties and puts absent ranks last", async () => {
  let inspected = false;
  const client = new PostgrestClient("https://example.org/rest/v1", { fetch: async (input) => {
    const query = new URL(input).searchParams;
    assert.equal(query.get("published"), "eq.true"); assert.equal(query.get("competition_id"), `eq.${competitionId}`);
    assert.match(query.get("competition_results.order"), /rank.asc.nullslast/); inspected = true;
    return new Response("[]", { headers: { "Content-Type": "application/json" } });
  } });
  const data = load("lib/data/competition-results.ts", { "server-only": {}, "@/lib/supabase/server": { createClient: async () => client } });
  assert.equal((await data.getPublishedCompetitionResults(competitionId)).length, 0); assert.equal(inspected, true);
});
test("migration contract retains draft/public read boundary, admin writes, composite FK and tie support", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202609210002_competition_results_foundation.sql", import.meta.url), "utf8");
  assert.match(sql, /enable row level security/); assert.match(sql, /using \(published or public\.is_admin\(\)\)/);
  assert.match(sql, /where id = competition_results\.result_set_id and published/);
  assert.equal((sql.match(/with check \(public\.is_admin\(\)\)/g) ?? []).length, 4);
  assert.match(sql, /foreign key \(result_set_id, competition_id\)/);
  assert.doesNotMatch(sql, /unique[^;]*\(result_set_id, rank\)/i);
});
