import test from "node:test";
import assert from "node:assert/strict";
import { prepareKazakhstanStandings } from "../scripts/content/kazakhstan-results-plan.mjs";
import { loadContentModule } from "../scripts/content/load.mjs";
import { readFileSync } from "node:fs";
const permission = { confirmedBy: "Zhunussov", scope: "public_kaiz_names_and_results_2025_2026", productionExecutionAuthorized: false };
function fixtures() {
  const rows = Array.from({ length: 38 }, (_, i) => ({ rank: i === 36 ? 36 : i + 1, last_name: "Synthetic", first_name: `Row${i + 1}`, city: "QA city", remote: 1, day_1: 2, day_2: 3, total: 6, award: null }));
  const values = [[null, "Final Scores AI Olymp Final 2026"], ["Rank", "Username", "First Name", "Last Name", "Total Score", "Task One", "Task Two", "Task Three"],
    ...Array.from({ length: 39 }, (_, i) => [i < 2 ? 1 : i, `synthetic${i}`, "Synthetic", `Row${i}`, 6, 1, 2, 3])];
  return [{ rows }, values];
}
test("Kazakhstan adapter preserves 77 supplied rows, tied ranks, scores and original labels as drafts", () => {
  const [a, b] = fixtures(), p = prepareKazakhstanStandings(a, b, permission);
  assert.equal(p.productionWrites, 0); assert.equal(p.approvalReady, false);
  assert.deepEqual(p.resultSets.map(s => s.entries.length), [38, 39]);
  assert.equal(p.resultSets[0].entries.filter(r => r.rank === 36).length, 2);
  assert.deepEqual(p.resultSets[1].entries[0].presentation.scores, { source_username: "synthetic0", task_1: 1, task_2: 2, task_3: 3 });
  const { resultSetSchema, competitionResultSchema } = loadContentModule("@/lib/validation/competition-result");
  const { entryForm } = loadContentModule();
  for (const s of p.resultSets) {
    assert.equal(resultSetSchema.parse(s.form).published, false);
    assert.equal(s.coverage, "partial");
    for (const r of s.entries) {
      assert.equal(r.award, null);
      assert.equal(competitionResultSchema.parse(entryForm(r, "91000000-0000-4000-8000-000000000001")).linkedUsername, "");
    }
  }
  assert.equal(p.resultSets[0].entries[7].participantName, "Synthetic Row8");
  assert.equal(p.resultSets[0].entries[11].participantName, "Synthetic Row12");
  assert.equal(p.resultSets[0].entries[14].participantName, "Synthetic Row15");
});
test("No score repair, inferred medal, invented workbook stage or expanded permission", () => {
  const [a, b] = fixtures();
  assert.throws(() => prepareKazakhstanStandings(a, b, { ...permission, productionExecutionAuthorized: true }));
  a.rows[0].total = 7; assert.throws(() => prepareKazakhstanStandings(a, b, permission));
  a.rows[0].total = 6; a.rows[0].award = "Gold"; assert.throws(() => prepareKazakhstanStandings(a, b, permission));
  a.rows[0].award = null; b[0][1] = "Qualification"; assert.throws(() => prepareKazakhstanStandings(a, b, permission));
});
test("Kazakhstan metadata stays separate and held; private sheet links and awards are never invented", () => {
  const review = JSON.parse(readFileSync(new URL("../content/competitions/2026-10-19/kazakhstan-metadata-review.json", import.meta.url)));
  const { competitionSchema } = loadContentModule("@/lib/validation/competition");
  assert.equal(review.approvalReady, false); assert.equal(review.productionWrites, 0);
  assert.deepEqual(review.competitions.map(c => c.editionKey), ["ai-olymp-kazakhstan-2025", "ai-olymp-kazakhstan-2026"]);
  for (const c of review.competitions) {
    assert.equal(competitionSchema.parse(c.form).verified, false);
    assert.equal(c.dateVerification, "OWNER_REPORTED_NOT_INDEPENDENTLY_VERIFIED");
    assert.ok(c.form.presentation.expectedStages.every(s => s.availability === "NOT_YET_PUBLISHED"));
    assert.ok(!JSON.stringify(c).includes("docs.google.com"));
  }
  const [a, b] = fixtures(), plan = prepareKazakhstanStandings(a, b, permission);
  assert.ok(!JSON.stringify(plan).includes("docs.google.com"));
  assert.ok(plan.resultSets.every(s => !s.key.startsWith("ioai-")));
  const oldInventory = JSON.parse(readFileSync(new URL("../content/competitions/2026-10-12/inventory.json", import.meta.url)));
  const oldStages = JSON.parse(readFileSync(new URL("../content/competitions/2026-10-12/stage-catalog.json", import.meta.url)));
  assert.equal(oldInventory.sources.find(s => s.id === "ai-olymp-2026-user-sheet").url, "https://www.gov.kz/org/astana/press/news/details/1199320");
  assert.ok(oldStages.stages.filter(s => s.observedTab === "leaderboard_final").every(s => s.suppliedSourceUrl === null));
});
test("Existing strict planner rehearses all 77 rows, no-op replay and conflict rejection without releasing holds", () => {
  const metadata = JSON.parse(readFileSync(new URL("../content/competitions/2026-10-19/kazakhstan-metadata-review.json", import.meta.url)));
  const [a, b] = fixtures(), p = prepareKazakhstanStandings(a, b, permission);
  const { prepareContentPlan } = loadContentModule();
  // Synthetic inventory for validation only. Not a production inventory or date verification.
  const snapshot = { version: 1, checkedAt: "2026-10-19", scope: "admin_complete",
    competitions: metadata.competitions.map((c, i) => ({ id: `91000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, editionKey: c.editionKey, form: c.form })), resultSets: [] };
  const batch = { version: 1, checkedAt: "2026-10-19", sources: p.sources, competitions: [], resultSets: p.resultSets };
  const first = prepareContentPlan(batch, snapshot);
  assert.equal(first.errors.length, 0, JSON.stringify(first.errors));
  assert.equal(first.actions.filter(a => a.action === "create_draft_set").length, 2);
  assert.equal(first.actions.filter(a => a.action === "add_draft_row").length, 77);
  snapshot.resultSets = p.resultSets.map((s, i) => ({ id: `92000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, competitionId: snapshot.competitions[i].id, form: s.form,
    entries: s.entries.map((data, j) => ({ id: `93000000-0000-4000-8000-${String(i * 100 + j + 1).padStart(12, "0")}`, verified: false, data })) }));
  const replay = prepareContentPlan(batch, snapshot);
  assert.equal(replay.errors.length, 0, JSON.stringify(replay.errors)); assert.equal(replay.actions.length, 77);
  assert.ok(replay.actions.every(a => a.action === "skip"));
  const conflict = structuredClone(batch); conflict.resultSets[0].entries[0].score = 99; conflict.resultSets[0].entries[0].scoreDisplay = "99";
  const rejected = prepareContentPlan(conflict, snapshot);
  assert.equal(rejected.valid, false); assert.equal(rejected.actions.length, 0);
  assert.equal(p.approvalReady, false, "Valid form rehearsal does not clear source/version holds");
});
