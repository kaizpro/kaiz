// Source-reviewed metadata overlay, not a second importer. Never writes or connects.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { prepareEditionRelease } from "./edition-release-plan.mjs";

export function preparePriorityEditionRelease(catalog, manifest, original, snapshot) {
  const reviewed = structuredClone(manifest);
  const faio = reviewed.editions.find(e => e.edition_id === "faio-2026");
  assert.equal(faio?.metadata?.form.city, "Almaty", "Historical source changed: review the venue correction again");
  faio.metadata.form.city = "Kaskelen";
  faio.metadata.form.description = "International AI olympiad organized by Fizmat. Online qualification precedes October 27–28 final contest rounds at SDU University, Kaskelen. October 26–30 is arrival/departure programme, not contest duration.";
  faio.metadata.notes = "October 23 source recheck: dedicated final page body and current homepage name SDU University, Kaskelen; older headings/press still say Almaty. Final results remain unavailable. Reconfirm the preliminary programme immediately before execution.";
  const plan = prepareEditionRelease(catalog, reviewed, original, snapshot);
  plan.batch.checkedAt = "2026-10-23";
  const candidateSha256 = createHash("sha256").update(JSON.stringify(plan.batch)).digest("hex");
  return { ...plan, candidateSha256, sourceCorrections: [{ editionKey: "faio-2026", field: "city / description", from: "Almaty", to: "SDU University, Kaskelen", source: "https://www.faio.kz/final/" }], productionExecutionAuthorized: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2] ?? "content/competitions/2026-10-23/production-snapshot.json";
  if (process.argv.length > 3 || path.startsWith("--")) throw Error("Read-only planner: only an admin-complete inventory path is accepted");
  const read = p => JSON.parse(readFileSync(p, "utf8"));
  const plan = preparePriorityEditionRelease(read("content/competitions/2026-10-19/release-catalog.json"), read("content/competitions/2026-10-17/publication-manifest.json"), read("content/competitions/2026-10-12/ready-batch.json"), read(path));
  console.log(JSON.stringify(plan, null, 2));
  if (!plan.valid) process.exitCode = 1;
}
