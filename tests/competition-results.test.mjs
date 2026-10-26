import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { PostgrestClient } from "@supabase/postgrest-js";
import { z } from "zod";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";
import { loadContentModule } from "../scripts/content/load.mjs";
import { loadTypescript } from "./helpers/load-typescript.mjs";

test('premium edition cards preserve database values and stay one semantic link',()=>{
 const {CompetitionRow}=loadTypescript()('components/competition-row.tsx');
 const html=renderToStaticMarkup(React.createElement(CompetitionRow,{competition:{id:'qa',slug:'synthetic-2026',title:'Synthetic edition 2026',organizer:'Source organizer',start_date:'2026-01-01',city:null,country:'Kazakhstan',format:'hybrid',status:'completed',verified:false}}));
 assert.equal((html.match(/<a /g)??[]).length,1);assert.match(html,/href="\/competitions\/synthetic-2026"/);
 assert.match(html,/Synthetic edition 2026/);assert.match(html,/Source organizer/);assert.match(html,/Hybrid/);assert.match(html,/Kazakhstan/);
 assert.doesNotMatch(html,/<button|>Verified<|fake|rating/);
});

test('premium competition directory preserves server filters and honest empty state',async()=>{
 const calls=[];
 const Page=loadTypescript({'@/lib/data/competitions':{listCompetitions:async(...args)=>{calls.push(args);return [];}}})('app/competitions/page.tsx').default;
 const html=renderToStaticMarkup(await Page({searchParams:Promise.resolve({status:'completed',format:'hybrid',category:'invalid'})}));
 assert.deepEqual(Array.from(calls[0]),['completed','all','hybrid']);
 assert.match(html,/<h1>Competitions<\/h1>/);assert.match(html,/No matching competitions/);assert.match(html,/0 listed editions/);
 assert.doesNotMatch(html,/Synthetic edition|<table/);
});

const competitionId = "80000000-0000-4000-8000-000000000001";
const setId = "80000000-0000-4000-8000-000000000002";
const resultId = "80000000-0000-4000-8000-000000000003";
const validation = loadContentModule("@/lib/validation/competition-result");
function load(file, imports) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, Date, Object, FormData, URL, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } });
  return exports;
}
function environment({ authorized = true, belongs = true, published = false, databaseError = null } = {}) {
  const calls = [];
  const client = { rpc(name, payload) {
    calls.push({ operation: "rpc", name, payload });
    return Promise.resolve({ data: databaseError ? null : payload.p_result_set_ids.map(id => ({ id, published: payload.p_published })), error: databaseError });
  }, from(table) {
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

test("all result write actions require an admin before touching the database", async () => {
  const { actions, calls } = environment({ authorized: false });
  for (const call of [
    () => actions.createResultSet(competitionId, {}, setForm()), () => actions.updateResultSet(competitionId, setId, {}, setForm()),
    () => actions.deleteResultSet(competitionId, form({ resultSetId: setId })), () => actions.createResult(competitionId, {}, rowForm()),
    () => actions.updateResult(competitionId, resultId, {}, rowForm()), () => actions.deleteResult(competitionId, form({ resultId })),
    () => actions.setResultsPublication(competitionId, {}, form({ resultSetId: setId, published: "true" })),
  ]) await assert.rejects(call, /admin required/);
  assert.equal(calls.length, 0);
});

test("publication is separate from set metadata editing and never updates participant rows", async () => {
  const { actions, calls } = environment();
  const forged = setForm(); forged.set("published", "true");
  assert.ok((await actions.createResultSet(competitionId, {}, forged)).error);
  assert.ok((await actions.updateResultSet(competitionId, setId, {}, forged)).error);
  assert.equal(calls.length, 0);
  assert.ok((await actions.updateResultSet(competitionId, setId, {}, setForm())).success);
  const updates=calls.filter(c=>c.operation==='update');assert.equal(updates.length,1);
  assert.equal(updates[0].table,'competition_result_sets');
  for(const k of ['published','verified_at'])assert.equal(Object.hasOwn(updates[0].payload,k),false);
  assert.equal(calls.some(c=>c.table==='competition_results'),false);
});

test("publication validates exact UUID targets and boolean strings before any database call", async () => {
  const { actions, calls } = environment();
  for(const values of [{published:'true'},{resultSetId:'bad',published:'true'},{resultSetId:setId,published:'false-ish'}])assert.ok((await actions.setResultsPublication(competitionId,{},form(values))).error);
  const repeated=form({resultSetId:setId,published:'true'});repeated.append('resultSetId',setId);
  assert.ok((await actions.setResultsPublication(competitionId,{},repeated)).error);
  await assert.rejects(actions.setResultsPublication('bad',{},form({resultSetId:setId,published:'true'})));
  assert.equal(calls.length,0);
});

test("publication sends only scoped targets and publication state to a non-elevated RPC",async()=>{
 const {actions,calls}=environment();
 for(const published of ['true','false'])assert.ok((await actions.setResultsPublication(competitionId,{},form({resultSetId:setId,published,score:'999',updated_by:'forged'}))).success);
 const writes=calls.filter(c=>c.operation==='rpc');assert.equal(writes.length,2);
 assert.equal(writes[0].name,'set_competition_results_publication');
 assert.deepEqual(JSON.parse(JSON.stringify(writes[0].payload)),{p_competition_id:competitionId,p_result_set_ids:[setId],p_published:true});
 assert.equal(writes[1].payload.p_published,false);
 assert.equal(calls.some(c=>['insert','update','delete'].includes(c.operation)),false);
});

test("publication errors are not retried or followed by participant updates",async()=>{
 const {actions,calls}=environment({databaseError:{message:'denied'}});
 assert.match((await actions.setResultsPublication(competitionId,{},form({resultSetId:setId,published:'true'}))).error,/Recheck/);
 assert.equal(calls.length,1);assert.equal(calls[0].operation,'rpc');
});

test("publication normalizes UUID case before duplicate checks and readback validation",async()=>{
 const {actions,calls}=environment();const target='aa000000-0000-4000-8000-000000000001';
 assert.ok((await actions.setResultsPublication(competitionId,{},form({resultSetId:target.toUpperCase(),published:'true'}))).success);
 assert.equal(calls.find(c=>c.operation==='rpc').payload.p_result_set_ids[0],target);
 const duplicate=form({resultSetId:target,published:'true'});duplicate.append('resultSetId',target.toUpperCase());const n=calls.length;
 assert.ok((await actions.setResultsPublication(competitionId,{},duplicate)).error);assert.equal(calls.length,n);
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
    assert.doesNotMatch(query.get("select"), /created_by|updated_by|metadata|external_reference|\*/);
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

const presentation = loadContentModule("@/lib/validation/competition-presentation");
test("presentation validates source-safe media, bounded score fields and unique columns", () => {
  assert.equal(presentation.editionPresentationSchema.safeParse({ logoUrl: "https://example.org/logo.png", year: 2026 }).success, true);
  for (const logoUrl of ["javascript:alert(1)", "https://user:private@example.org/logo", "https://example.org/logo?token=private"]) assert.equal(presentation.editionPresentationSchema.safeParse({ logoUrl }).success, false);
  assert.equal(presentation.setPresentationSchema.safeParse({ columns: [{ key: "day_1", label: "Day 1" }, { key: "day_1", label: "Duplicate" }] }).success, false);
  assert.equal(presentation.editionPresentationSchema.safeParse({ expectedStages: [{ name: "Final", availability: "NOT_FOUND" }, { name: "Final", availability: "NOT_FOUND" }] }).success, false);
  assert.equal(presentation.rowPresentationSchema.safeParse({ scores: { day_1: 0, day_2: null, remote: "N/A" } }).success, true);
  assert.equal(presentation.rowPresentationSchema.safeParse({ scores: { day_1: { html: "not a scalar" } } }).success, false);
  assert.equal(validation.competitionResultSchema.safeParse({ ...Object.fromEntries(rowForm()), presentation: "{broken" }).success, false);
});
test("admin stores validated stage/score presentation and legacy form callers do not erase it", async () => {
  const { actions, calls } = environment();
  const data = rowForm({ presentation: JSON.stringify({ scores: { day_1: "0.000", day_2: null }, city: "Almaty" }) });
  assert.ok((await actions.createResult(competitionId, {}, data)).success);
  const saved = calls.find((call) => call.operation === "insert").payload;
  assert.equal(saved.presentation.scores.day_1, "0.000"); assert.equal(saved.presentation.scores.day_2, null);
  await actions.updateResult(competitionId, resultId, {}, rowForm());
  assert.equal(Object.hasOwn(calls.find((call) => call.operation === "update").payload, "presentation"), false);
});
test("presentation migration is additive and does not touch data, grants or policies", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202610120001_competition_presentation.sql", import.meta.url), "utf8").replace(/--[^\n]*/g, "");
  assert.equal((sql.match(/add column presentation jsonb/g) ?? []).length, 3);
  assert.doesNotMatch(sql, /\b(drop|delete|update|insert|grant|revoke|disable|policy|truncate)\b/i);
  assert.equal((sql.match(/jsonb_typeof/g) ?? []).length, 3);
});
function renderedLeaderboard(sets, expectedStages = []) {
  const imports = {
    react: React, "react/jsx-runtime": jsxRuntime, "lucide-react": icons,
    "next/link": { default: ({ children, ...props }) => React.createElement("a", props, children) },
    "@/components/ui/badge": { Badge: ({ children, ...props }) => React.createElement("span", props, children) },
    "@/components/ui/button": { Button: ({ children, disabled, onClick }) => React.createElement("button", {disabled,onClick}, children) },
    "@/lib/results/provider": { RESULT_SOURCE_LABELS: { official_import: "Organizer" } },
    "@/lib/validation/competition-presentation": presentation,
  };
  imports["@/components/competition-result-switcher"] = load("components/competition-result-switcher.tsx", imports);
  imports["@/components/competition-standings"] = load("components/competition-standings.tsx", imports);
  const { CompetitionLeaderboard } = load("components/competition-leaderboard.tsx", imports);
  return renderToStaticMarkup(React.createElement(CompetitionLeaderboard, { resultSets: sets, expectedStages }));
}
test("results SSR smoke: separate stage panels, partial coverage, source link, original columns and escaping", () => {
  const set = { id: setId, name: "Qualification — selected entries", status: "official", source: "official_import", source_url: "https://example.org/results", verified_at: null,
    presentation: { stageLabel: "Qualification", availability: "OFFICIAL_STAGE_RESULTS", coverage: "partial", columns: [{ key: "day_1", label: "Day 1" }, { key: "day_2", label: "Day 2" }] },
    competition_results: [{ id: resultId, participant_name: "<script>unsafe</script>", participant_type: "individual", rank: 1, country_code: null, score: 0, score_display: "0.000", award: null, result_status: "ranked", presentation: { scores: { day_1: 0, day_2: null } } }] };
  const html = renderedLeaderboard([set], [{ name: "Final", availability: "NOT_YET_PUBLISHED" }]);
  assert.match(html, /Result stages/); assert.match(html, /aria-pressed="true"/); assert.match(html, /hidden=""/);
  assert.match(html, /Selected entries — not full standings/); assert.match(html, /Day 1/); assert.match(html, /Day 2/);
  assert.match(html, /0\.000/); assert.match(html, /Results are not available yet/); assert.match(html, /https:\/\/example\.org\/results/);
  assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>unsafe/);
});
test("results SSR smoke: missing sets show an honest empty state and winners stay labelled", () => {
  assert.match(renderedLeaderboard([]), /Results are not available yet/);
  const html = renderedLeaderboard([{ id: setId, name: "Winners", status: "official", source: "official_import", presentation: { availability: "OFFICIAL_WINNERS_ONLY", coverage: "partial" }, competition_results: [] }]);
  assert.match(html, /Official winners \/ medalists only/); assert.match(html, /Results are not available yet/);
  const secondary = renderedLeaderboard([{ id: setId, name: "Selected entries", status: "official", source: "official_import", presentation: { availability: "SECONDARY_RESULTS_ONLY", coverage: "partial" }, competition_results: [] }]);
  assert.match(secondary, /Secondary source/); assert.doesNotMatch(secondary, /Official results/);
});

test("standings search and awards preserve original order, tied ranks, missing and zero scores",()=>{
 const imports={react:React,"react/jsx-runtime":jsxRuntime,"next/link":{default:()=>null},"@/components/ui/badge":{Badge:()=>null},"@/components/ui/button":{Button:()=>null}};
 const {filterStandings}=load('components/competition-standings.tsx',imports);
 const rows=[{id:'a',name:'First',rank:2,award:'Gold',total:0,country:'KZ',detail:'Almaty'},{id:'b',name:'Second',rank:2,award:null,total:null,country:null,detail:''}];
 assert.deepEqual(Array.from(filterStandings(rows,'almaty','Gold')).map(row=>row.id),['a']);
 assert.deepEqual(Array.from(filterStandings(rows,'','')).map(row=>row.rank),[2,2]);
 assert.equal(filterStandings(rows,'Second','')[0].total,null);
 assert.equal(filterStandings(rows,'','Gold')[0].total,0);
});

test("award labels retain original text in a non-clipping, keyboard-scrollable standings table", () => {
  const award = "GAITE Honorable Mention";
  const html = renderedLeaderboard([{ id: setId, name: "Final", status: "official", source: "official_import",
    competition_results: [{ id: resultId, participant_name: "Fixture participant", participant_type: "individual",
      rank: 2, score: 0, score_display: "0.0000", country_code: null, award, result_status: "ranked" }] }]);
  assert.match(html, /role="region"[^>]*tabindex="0"[^>]*overflow-x-auto/);
  assert.match(html, /<td class="min-w-48 whitespace-nowrap px-4 py-3"><span class="whitespace-nowrap text-\[0\.6875rem\]">GAITE Honorable Mention<\/span><\/td>/);
  assert.doesNotMatch(html, /truncate|line-clamp|text-ellipsis/);
  assert.match(html, /0\.0000/);
});
