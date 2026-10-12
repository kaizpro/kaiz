import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadContentModule } from "../scripts/content/load.mjs";

const { prepareContentPlan, entryForm } = loadContentModule();
const file = (name) => JSON.parse(readFileSync(new URL(`../content/competitions/2026-10-12/${name}.json`, import.meta.url), "utf8"));
const batch = () => file("ready-batch");
const snapshot = () => file("public-snapshot");
const uuid = (n) => `90000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function existingSet({ published = false, verified = false } = {}) {
  const b = batch(); const s = snapshot();
  const prepared = b.resultSets[0];
  s.scope = "admin_complete";
  s.resultSets = [{
    id: uuid(1), competitionId: s.competitions.find((c) => c.form.slug === prepared.competitionSlug).id,
    form: { ...prepared.form, published }, entries: prepared.entries.map((data, i) => ({ id: uuid(i + 2), verified, data: structuredClone(data) })),
  }];
  return { b, s };
}
function rejected(change, message) {
  const b = batch(); const s = snapshot(); change(b, s);
  const plan = prepareContentPlan(b, s);
  assert.equal(plan.valid, false);
  assert.equal(plan.writes, 0);
  assert.equal(plan.actions.length, 0);
  assert.ok(plan.errors.some((e) => e.message.includes(message)), JSON.stringify(plan.errors));
}

test("real starter batch: 10 new editions, 2 review-only metadata patches, 8 partial sets and 25 rows; zero writes", () => {
  const p = prepareContentPlan(batch(), snapshot());
  assert.equal(p.valid, true); assert.equal(p.approvalReady, false); assert.equal(p.mode, "dry-run"); assert.equal(p.writes, 0);
  for (const [action, count] of [["create_competition", 10], ["review_metadata", 2], ["create_draft_set", 8], ["add_draft_row", 25]]) {
    assert.equal(p.actions.filter((a) => a.action === action).length, count);
  }
  assert.match(p.warnings[0], /private drafts/);
});
test("all 17 candidates have real source references; held editions cannot leak into the ready batch", () => {
  const inventory = file("inventory"); const ready = new Set(batch().competitions.map((c) => c.editionKey));
  assert.equal(inventory.candidates.length, 17);
  assert.equal(inventory.candidates.filter((c) => c.status === "needs_review").length, 7);
  for (const c of inventory.candidates) {
    for (const id of c.sourceIds) assert.ok(inventory.sources.some((s) => s.id === id && s.status === "verified"));
    assert.equal(ready.has(c.editionKey), c.status === "ready_for_admin_review");
  }
});
test("ties are legal and are not recomputed", () => {
  const b = batch(); const apoai = b.resultSets.find((s) => s.key === "apoai-2026-individual");
  assert.equal(apoai.entries.filter((e) => e.rank === 122).length, 2);
  assert.equal(prepareContentPlan(b, snapshot()).valid, true);
});
test("real zero, N/A and remote unranked rows preserve form semantics", () => {
  const sets = batch().resultSets;
  const rows = sets.flatMap((s) => s.entries);
  const zero = rows.find((e) => e.score === 0);
  const missing = rows.find((e) => e.scoreDisplay === "N/A");
  const remote = sets.find((s) => s.division === "Remote").entries[0];
  assert.equal(entryForm(zero, uuid(1)).score, 0);
  assert.equal(entryForm(missing, uuid(1)).score, "");
  assert.equal(entryForm(missing, uuid(1)).rank, 125);
  assert.equal(entryForm(remote, uuid(1)).rank, "");
  assert.equal(entryForm(remote, uuid(1)).resultStatus, "unranked");
  assert.equal(rows.find((e) => e.participantType === "team").participantName, "Poland Team 1");
});
test("re-import of identical draft rows skips rather than duplicates", () => {
  const { b, s } = existingSet(); const p = prepareContentPlan(b, s);
  assert.equal(p.valid, true); assert.equal(p.approvalReady, true);
  assert.equal(p.actions.filter((a) => a.path.startsWith("resultSets.0") && a.action === "skip").length, 3);
  assert.equal(p.actions.some((a) => a.path === "resultSets.0" && a.action === "create_draft_set"), false);
});
test("re-import of identical published verified rows is a no-op", () => {
  const { b, s } = existingSet({ published: true, verified: true });
  assert.equal(prepareContentPlan(b, s).valid, true);
});
test("changed verified result is a conflict, never an overwrite", () => {
  const { b, s } = existingSet({ published: true, verified: true });
  b.resultSets[0].entries[0].award = "Changed";
  const p = prepareContentPlan(b, s);
  assert.equal(p.valid, false); assert.match(p.errors[0].message, /Verified result conflict/); assert.equal(p.actions.length, 0);
});
test("changed draft is also protected; additional published row is not appended", () => {
  const { b, s } = existingSet(); b.resultSets[0].entries[0].award = "Changed";
  assert.equal(prepareContentPlan(b, s).valid, false);
  const other = existingSet({ published: true }); other.s.resultSets[0].entries.pop();
  assert.ok(prepareContentPlan(other.b, other.s).errors.some((e) => /Cannot append/.test(e.message)));
});
test("identical competition re-import skips; metadata change stays review-only", () => {
  const b = batch(); const s = snapshot(); b.competitions = [{ ...b.competitions[0], expectedId: uuid(1) }]; b.resultSets = [];
  s.competitions.push({ id: uuid(1), editionKey: b.competitions[0].editionKey, form: b.competitions[0].form });
  assert.equal(prepareContentPlan(b, s).actions[0].action, "skip");
  b.competitions[0].form = { ...b.competitions[0].form, city: "Changed" };
  assert.equal(prepareContentPlan(b, s).actions[0].action, "review_metadata");
});
test("source, edition, slug, set and participant duplicates are rejected", () => {
  rejected((b) => b.sources.push(b.sources[0]), "Duplicate source ID");
  rejected((b) => b.competitions.push(b.competitions[0]), "Duplicate edition/slug");
  rejected((b) => b.resultSets.push(b.resultSets[0]), "Duplicate result set");
  rejected((b) => b.resultSets[0].entries.push({ ...b.resultSets[0].entries[0], participantName: " KRZYSZTOF  ROJEK " }), "Duplicate participant");
});
test("same external ID with different names is still a duplicate", () => {
  rejected((b) => { b.resultSets[0].entries[0].externalParticipantId = "official-id"; b.resultSets[0].entries[1].externalParticipantId = "official-id"; }, "Duplicate participant");
});
test("same annual edition under alternate slug requires alias resolution", () => {
  rejected((b) => { const c = b.competitions.find((c) => c.editionKey === "ioai-2025"); c.form.slug = "ioai-beijing-2025"; }, "Edition already exists under another slug");
});
test("invalid competition/result-set foreign keys and mismatched UUIDs reject the whole queue", () => {
  rejected((b) => { b.resultSets[0].competitionSlug = "unknown-2025"; }, "Unknown competition foreign key");
  rejected((b) => { b.competitions.find((c) => c.expectedId).expectedId = uuid(99); }, "foreign key does not match");
  const { b, s } = existingSet(); s.resultSets[0].competitionId = uuid(99);
  assert.ok(prepareContentPlan(b, s).errors.some((e) => /Unknown competition foreign key/.test(e.message)));
});
test("year/key mismatch, duplicate title/year and premature verification are rejected", () => {
  rejected((b) => { b.competitions[0].year = 2026; }, "declared competition year");
  rejected((b) => { const c = structuredClone(b.competitions[0]); c.editionKey = "another-2027"; c.form.slug = "another-2027"; b.competitions.push(c); }, "Duplicate title/year");
  rejected((b) => { b.competitions[0].form.verified = true; }, "unverified until explicit admin review");
});
test("a complete same-value reviewed snapshot makes the entire batch idempotent", () => {
  const b = batch(); const s = snapshot(); s.scope = "admin_complete";
  b.competitions.forEach((c, i) => {
    const old = s.competitions.find((x) => x.form.slug === c.form.slug);
    if (old) old.form = structuredClone(c.form);
    else s.competitions.push({ id: uuid(100 + i), editionKey: c.editionKey, form: structuredClone(c.form) });
  });
  s.resultSets = b.resultSets.map((set, i) => ({ id: uuid(200 + i),
    competitionId: s.competitions.find((c) => c.form.slug === set.competitionSlug).id,
    form: structuredClone(set.form), entries: set.entries.map((data, j) => ({ id: uuid(1000 + 100 * i + j), verified: false, data: structuredClone(data) })),
  }));
  const p = prepareContentPlan(b, s);
  assert.equal(p.valid, true); assert.ok(p.actions.every((a) => a.action === "skip")); assert.equal(p.writes, 0);
});
test("malformed ranks and scores produce row-level errors", () => {
  rejected((b) => { b.resultSets[0].entries[0].rank = null; }, "Rank is required");
  rejected((b) => { b.resultSets[0].entries[0].resultStatus = "unranked"; }, "cannot have a rank");
  rejected((b) => { b.resultSets[0].entries[0].score = "542.05"; }, "Invalid input");
  rejected((b) => { b.resultSets[0].entries[0].score = Infinity; }, "Invalid input");
  rejected((b) => { b.resultSets[0].entries[0].scoreDisplay = "1"; }, "must agree");
  rejected((b) => { b.resultSets[0].entries[0].score = null; }, "must not be stored as missing");
  const b = batch(); b.resultSets[0].entries[0].rank = -1;
  assert.match(prepareContentPlan(b, snapshot()).errors[0].path, /resultSets\.0\.entries\.0\.rank/);
});
test("missing country and awards remain null; original decimal comma is preserved", () => {
  const b = batch(); b.resultSets[0].entries[0].countryCode = null; b.resultSets[0].entries[0].award = null;
  assert.equal(prepareContentPlan(b, snapshot()).valid, true);
  assert.equal(b.resultSets[3].entries[0].scoreDisplay, "428,4866");
});
test("reject impossible dates, reversed dates, truncated tags, missing required form fields", () => {
  rejected((b) => { b.competitions[0].form.startDate = "2027-02-30"; }, "real ISO calendar");
  rejected((b) => { b.competitions[0].form.endDate = "2026-01-01"; }, "End date must be after");
  rejected((b) => { b.competitions[0].form.tags = Array(13).fill("AI").join(","); }, "no silent truncation");
  rejected((b) => { delete b.competitions[0].form.organizer; }, "Invalid input");
});
test("string booleans and auto-publication are forbidden", () => {
  rejected((b) => { b.resultSets[0].form.published = true; }, "published=false");
  rejected((b) => { b.resultSets[0].form.published = "false"; }, "published=false");
  rejected((b) => { b.competitions[0].form.verified = "false"; }, "must be a boolean");
});
test("unverified/unknown sources, source URL mismatch and misleading partial titles are rejected", () => {
  rejected((b) => { b.sources[0].status = "needs_review"; }, "Unverified sources");
  rejected((b) => { b.resultSets[0].entries[0].sourceIds = ["unknown"]; }, "Unknown source");
  rejected((b) => { b.resultSets[0].form.sourceUrl = "https://example.org/other"; }, "match a referenced");
  rejected((b) => { b.resultSets[0].form.name = "Full leaderboard"; }, "explicitly say selected");
  rejected((b) => { b.competitions[0].form.officialWebsite = "https://example.org/other"; }, "match a referenced verified source");
  rejected((b) => { b.resultSets[0].entries[0].sourceIds = ["apoai-2026"]; }, "belong to this result set");
});
test("unsafe/credential-bearing/recovery URLs and injected privilege/profile IDs are rejected", () => {
  for (const url of ["javascript:alert(1)", "https://user:credential@example.org/", "https://example.org/?access_token=value", "https://example.org/#token=value"]) {
    rejected((b) => { b.sources[0].url = url; }, url.startsWith("javascript") ? "public HTTPS" : "public HTTPS");
  }
  rejected((b) => { b.resultSets[0].entries[0].user_id = uuid(1); }, "Unrecognized key");
  rejected((b) => { b.competitions[0].form.role = "admin"; }, "Unrecognized key");
});
test("ambiguous snapshot result sets and changed set metadata are blocked", () => {
  const { b, s } = existingSet(); s.resultSets.push({ ...s.resultSets[0], id: uuid(50) });
  assert.equal(prepareContentPlan(b, s).valid, false);
  const other = existingSet(); other.s.resultSets[0].form.sourceLabel = "Another label";
  assert.equal(prepareContentPlan(other.b, other.s).valid, false);
});
test("one-character source labels cannot bypass the DB minimum", () => {
  rejected((b) => { b.resultSets[0].form.sourceLabel = "X"; }, "at least 2");
});
test("stale or public snapshots cannot be approved, even with valid data", () => {
  const s = snapshot(); s.scope = "admin_complete"; s.checkedAt = "2026-10-11";
  assert.equal(prepareContentPlan(batch(), s).approvalReady, false);
});
test("CLI refuses apply/credentials flags and defaults to dry-run without reading environment", () => {
  const command = fileURLToPath(new URL("../scripts/content/preview.mjs", import.meta.url));
  const refused = spawnSync(process.execPath, [command, "unused.json", "unused.json", "--apply"], { encoding: "utf8" });
  assert.equal(refused.status, 2); assert.match(refused.stderr, /forbidden/);
  const text = readFileSync(new URL("../scripts/content/preview.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(text, /process\.env|fetch\(|createClient\(|dotenv/);
});
