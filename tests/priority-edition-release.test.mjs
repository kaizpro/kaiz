import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { preparePriorityEditionRelease } from "../scripts/content/priority-edition-plan.mjs";
const read = p => JSON.parse(readFileSync(new URL("../" + p, import.meta.url), "utf8"));
const catalog = read("content/competitions/2026-10-19/release-catalog.json"), manifest = read("content/competitions/2026-10-17/publication-manifest.json"), original = read("content/competitions/2026-10-12/ready-batch.json"), snapshot = read("content/competitions/2026-10-23/production-snapshot.json");
const prepare = s => preparePriorityEditionRelease(catalog, manifest, original, s ?? snapshot);
test("revised Batch A corrects only the unimported FAIO 2026 venue; eight creates, five preserved", () => {
 const plan = prepare(); assert.equal(plan.valid, true); assert.equal(plan.writes, 0);
 assert.equal(plan.actions.filter(a => a.action === "create_competition").length, 8);
 assert.equal(plan.actions.filter(a => a.action === "skip").length, 5);
 assert.deepEqual(plan.batch.resultSets, []); assert.equal(plan.productionExecutionAuthorized, false);
 assert.equal(plan.candidateSha256,read("content/competitions/2026-10-23-priority/metadata-batch-reference.json").candidateSha256,"Frozen candidate matches the existing validator composition");
 for (const c of snapshot.competitions) assert.deepEqual(plan.batch.competitions.find(p => p.editionKey === c.editionKey).form, c.form);
 assert.equal(plan.batch.competitions.find(c => c.editionKey === "faio-2026").form.city, "Kaskelen");
 assert.equal(manifest.editions.find(e => e.edition_id === "faio-2026").metadata.form.city, "Almaty", "Historical evidence stays unchanged");
 assert.ok(!plan.batch.competitions.some(c => c.editionKey.startsWith("ai-olymp-kazakhstan")));
});
test("revised metadata replays without duplicates and stops on an existing incompatible venue", () => {
 const plan = prepare(), after = structuredClone(snapshot);
 for (const [i,c] of plan.batch.competitions.filter(c => !c.expectedId).entries()) after.competitions.push({id:`92000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`,editionKey:c.editionKey,form:c.form});
 assert.ok(prepare(after).actions.every(a => a.action === "skip"));
 after.competitions.find(c => c.editionKey === "faio-2026").form.city = "Almaty";
 assert.throws(() => prepare(after), /conflict/);
});
test("FAIO populations and external standings remain edition/stage-scoped without inferred medals", () => {
 const guides = read("content/competitions/edition-guides.json"), old = guides.find(e => e.slug === "faio-2025"), current = guides.find(e => e.slug === "faio-2026");
 assert.equal(old.statistics[0].participants,47); assert.equal(old.statistics[0].unit,"teams");
 assert.equal(old.results.length,1); assert.match(old.results[0].coverage,/47/);
 assert.deepEqual(current.statistics.map(s => [s.participants,s.countries]),[[578,28],[410,25]]);
 assert.ok(current.statistics.every(s => s.unit === "teams" && s.gold === undefined));
 assert.match(current.summary,/SDU University, Kaskelen/); assert.match(current.structure,/approximately 1,500/);
 assert.equal(current.results.length,1); assert.match(current.results[0].coverage,/Qualification only/);
 for (const e of guides.filter(e => /kazakhstan/.test(e.slug))) {assert.deepEqual(e.results,[]);assert.equal(e.statistics[0].gold,undefined);}
});
