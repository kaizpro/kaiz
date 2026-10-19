// Offline composition of the existing content validator. No client, credentials,
// network, apply mode or publication operation. Existing editions are immutable.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { loadContentModule } from "./load.mjs";
import { validatePublicationManifest } from "./publication-plan.mjs";

const primaryTasks = {
  "ioai-2024": "https://ioai-official.org/2024-tasks/",
  "faio-2025": "https://github.com/BeksultanSagyndyk/faio-tasks/tree/main/faio-2025",
  "neoai-2025": "https://www.kaggle.com/competitions/neoai-2025/overview",
  "usaaio-2025": "https://forum.beaver-edge.ai/c/ai-olympiads/2025-usa-na-aio-round-2/9",
  "poland-oai-2025": "https://github.com/OlimpiadaAI/II-OlimpiadaAI",
};
const publicUrl = value => {
  const url = new URL(value);
  assert.equal(url.protocol, "https:");
  assert.ok(!url.username && !url.password && ![...url.searchParams.keys()].some(k => /token|secret|password|code|key/i.test(k)));
};
export function prepareEditionRelease(catalog, input, original, snapshot) {
  const manifest = validatePublicationManifest(input);
  assert.equal(catalog.mode, "review_only"); assert.equal(catalog.productionWrites, 0);
  assert.equal(catalog.publicationAuthorization, "NOT_GRANTED");
  assert.equal(snapshot.scope, "admin_complete", "A public inventory cannot reveal hidden duplicates");
  assert.equal(catalog.editions.length, 15);
  assert.deepEqual([...catalog.editions.map(e => e.editionId)].sort(), [...manifest.editions.map(e => e.edition_id)].sort());
  const competitions = [];
  for (const review of catalog.editions) {
    const edition = manifest.editions.find(e => e.edition_id === review.editionId);
    assert.ok(["preserve_existing", "new_candidate", "hold"].includes(review.metadataAction));
    assert.ok(["NOT_ESTABLISHED", "RESTRICTED"].includes(review.resultsRights));
    for (const url of review.metadataSources) publicUrl(url);
    for (const task of review.tasks) {
      publicUrl(task.provenance);
      assert.ok(["public_materials", "account_required", "invitation_required", "unavailable"].includes(task.access));
      assert.equal(task.url === null, task.access === "unavailable");
      if (task.url) publicUrl(task.url);
    }
    for (const stage of review.stages) {
      publicUrl(stage.source);
      if (stage.resultStageId) assert.ok(manifest.stages.some(s => s.stage_id === stage.resultStageId && s.edition_id === review.editionId && s.source_url === stage.source));
    }
    if (review.metadataAction === "hold") {
      assert.equal(edition.metadata, null); assert.equal(review.resultsRights, "RESTRICTED"); continue;
    }
    assert.ok(edition.metadata);
    const existing = snapshot.competitions.find(c => c.editionKey === review.editionId || c.form.slug === edition.metadata.form.slug);
    if (review.metadataAction === "preserve_existing") assert.ok(existing, "Expected production edition missing; stop before recreating it");
    if (existing && review.metadataAction === "preserve_existing") {
      competitions.push({ ...edition.metadata, expectedId: existing.id, form: existing.form,
        notes: "Preserve existing record and UUID exactly; no metadata/presentation update in this release." });
    } else {
      const year = edition.metadata.year;
      const presentation = { seriesSlug: review.editionId.replace(/-20\d\d$/, ""), year,
        sourceNotes: `${edition.metadata.dateScope} No native KAIZ results are published by this metadata-only batch.`.slice(0, 500),
        expectedStages: review.stages.map(s => ({ name: s.label, availability: "NOT_YET_PUBLISHED" })),
        ...(primaryTasks[review.editionId] ? { tasksUrl: primaryTasks[review.editionId] } : {}),
      };
      competitions.push({ ...edition.metadata, ...(existing ? { expectedId: existing.id } : {}),
        form: { ...edition.metadata.form, verified: false, presentation } });
    }
  }
  const batch = { ...original, checkedAt: catalog.checkedAt, competitions, resultSets: [] };
  const { prepareContentPlan } = loadContentModule(); const plan = prepareContentPlan(batch, snapshot);
  assert.ok(!plan.actions.some(a => !["skip", "create_competition"].includes(a.action)), "Unexpected mutation or existing-data conflict");
  return { ...plan, approvalReady: false, ownerAuthorizationRequired: true,
    metadataCandidateValid: plan.valid, nativeResultPublicationAllowed: false,
    heldEditions: catalog.editions.filter(e => e.metadataAction === "hold").map(e => e.editionId), batch };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const snapshotPath = process.argv[2] ?? "content/competitions/2026-10-19/production-snapshot.json";
  if (process.argv.length > 3 || snapshotPath.startsWith("--")) throw Error("Offline preview only: supply an inventory path, never apply flags");
  const read = p => JSON.parse(readFileSync(p, "utf8"));
  const result = prepareEditionRelease(read("content/competitions/2026-10-19/release-catalog.json"),
    read("content/competitions/2026-10-17/publication-manifest.json"), read("content/competitions/2026-10-12/ready-batch.json"), read(snapshotPath));
  console.log(JSON.stringify(result, null, 2)); if (!result.valid) process.exitCode = 1;
}
