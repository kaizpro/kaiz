import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { prepareEditionRelease } from "../scripts/content/edition-release-plan.mjs";
import { loadContentModule } from "../scripts/content/load.mjs";
const read = p => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const dir = "content/competitions/2026-10-19/";
const catalog = read(dir + "release-catalog.json"), snapshot = read(dir + "production-snapshot.json");
const manifest = read("content/competitions/2026-10-17/publication-manifest.json");
const original = read("content/competitions/2026-10-12/ready-batch.json");
const prepare = (c = catalog, s = snapshot) => prepareEditionRelease(c, manifest, original, s);

test("metadata-only release prepares eight missing editions and preserves all five production records", () => {
  const plan = prepare(); assert.equal(plan.valid, true); assert.equal(plan.writes, 0);
  assert.equal(plan.actions.filter(a => a.action === "create_competition").length, 8);
  assert.equal(plan.actions.filter(a => a.action === "skip").length, 5);
  assert.deepEqual(plan.batch.resultSets, []); assert.equal(plan.approvalReady, false);
  assert.equal(plan.nativeResultPublicationAllowed, false);
  for (const before of snapshot.competitions) {
    const after = plan.batch.competitions.find(c => c.editionKey === before.editionKey);
    assert.equal(after.expectedId, before.id); assert.deepEqual(after.form, before.form);
  }
});

test("metadata replay is a no-op and neither Kazakhstan edition enters the import batch", () => {
  const plan = prepare(), after = structuredClone(snapshot);
  const created = plan.batch.competitions.filter(c => !c.expectedId);
  for (const [i, c] of created.entries()) after.competitions.push({ id: `91000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, editionKey: c.editionKey, form: c.form });
  const replay = prepare(catalog, after); assert.equal(replay.valid, true);
  assert.equal(replay.actions.length, 13); assert.ok(replay.actions.every(a => a.action === "skip"));
  assert.deepEqual(plan.heldEditions, ["ai-olymp-kazakhstan-2025", "ai-olymp-kazakhstan-2026"]);
  assert.ok(plan.batch.competitions.every(c => !c.editionKey.startsWith("ai-olymp-kazakhstan")));
  const changed = structuredClone(after);
  changed.competitions.find(c => c.editionKey === created[0].editionKey).form.title = "Unexpected existing title";
  assert.throws(() => prepare(catalog, changed), /Unexpected mutation or existing-data conflict/);
});

test("public snapshots, missing existing editions and unauthorized publication flags fail closed", () => {
  assert.throws(() => prepare(catalog, { ...snapshot, scope: "public" }));
  assert.throws(() => prepare(catalog, { ...snapshot, competitions: snapshot.competitions.slice(1) }));
  assert.throws(() => prepare({ ...catalog, publicationAuthorization: "APPROVED" }));
  const invalid = structuredClone(catalog); invalid.editions[0].tasks[0].url = "https://example.org/?token=private";
  assert.throws(() => prepare(invalid));
});

test("new task links use only existing presentation schema; no finals or stage rankings are invented", () => {
  const { editionPresentationSchema } = loadContentModule("@/lib/validation/competition-presentation");
  for (const c of prepare().batch.competitions.filter(c => !c.expectedId)) assert.equal(editionPresentationSchema.safeParse(c.form.presentation).success, true);
  assert.ok(catalog.editions.find(e => e.editionId === "faio-2026").missing.some(x => x.includes("not occurred")));
  assert.ok(catalog.editions.find(e => e.editionId === "iaio-2026").stageNotes.includes("not independently ranked qualification"));
  assert.ok(catalog.editions.find(e => e.editionId === "euroai-2026").stageNotes.includes("Remote/Guest blanks stay null"));
  assert.ok(catalog.editions.every(e => e.resultsRights !== "APPROVED"));
  const selection = catalog.editions.find(e => e.editionId === "onia-2026").stages.filter(s => s.kind === "team_selection");
  assert.deepEqual(selection.map(s => s.label), ["Extended Team", "Restricted Team"]);
});

test("release artifacts remain metadata-only and source summaries contain no private student rows", () => {
  assert.deepEqual(read(dir + "metadata-batch.json"), prepare().batch);
  const state = read(dir + "production-state.json"); assert.equal(state.appliedMigrations.length, 9);
  assert.equal(state.resultSets, 0); assert.equal(state.resultRows, 0); assert.equal(state.productionWrites, 0);
  const summary = read(dir + "restricted-source-summary.json");
  assert.equal(summary.screenshot2025.rows, 38); assert.equal(summary.workbook2026.rows, 39);
  assert.equal(summary.workbook2026.freshAnonymousExportCellsMatch, true);
  assert.equal(summary.restrictedRowsCopiedToGit, 0);
  assert.doesNotMatch(JSON.stringify(summary), /first_name|last_name|participant_name|display_name|Username|AGE-SECRET|sb_secret|service_role/);
});
