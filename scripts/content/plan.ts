import { z } from "zod";
import { competitionSchema } from "@/lib/validation/competition";
import { competitionResultSchema, resultSetSchema } from "@/lib/validation/competition-result";

const key = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, "Use a real ISO calendar date");
const url = z.string().url().refine((value) => {
  const parsed = new URL(value);
  return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.hash
    && ![...parsed.searchParams.keys()].some((param) => /token|secret|password|key|code/i.test(param));
}, "Use a public HTTPS source URL without credentials, tokens or recovery parameters");
const source = z.object({
  id: key, url, checkedAt: date, status: z.enum(["verified", "needs_review", "inaccessible"]),
  fields: z.array(z.string().min(1).max(120)).min(1), notes: z.string().max(2000),
}).strict();
const sources = z.array(key).min(1);
const entry = z.object({
  participantType: z.enum(["individual", "team"]), participantName: z.string().trim().min(1).max(160),
  countryCode: z.string().regex(/^[A-Z]{2,3}$/).nullable(), rank: z.number().int().positive().nullable(),
  score: z.number().finite().nullable(), scoreDisplay: z.string().max(80).nullable(),
  award: z.string().max(80).nullable(), resultStatus: z.enum(["ranked", "unranked", "disqualified"]),
  externalParticipantId: z.string().min(1).max(200).nullable(), sourceIds: sources,
}).strict();
const competition = z.object({
  editionKey: key, year: z.number().int().min(2000).max(2100), expectedId: z.string().uuid().optional(),
  sourceIds: sources, dateScope: z.string().min(1).max(300), notes: z.string().max(2000),
  form: z.record(z.string(), z.unknown()),
}).strict();
const set = z.object({
  key, competitionSlug: key, sourceIds: sources, division: z.string().min(1).max(120),
  coverage: z.enum(["complete", "partial"]), publicationDate: date.nullable(),
  notes: z.string().max(2000), form: z.record(z.string(), z.unknown()),
  entries: z.array(entry).min(1).max(5000),
}).strict();
const batchSchema = z.object({
  version: z.literal(1), checkedAt: date, sources: z.array(source).min(1).max(200),
  competitions: z.array(competition).max(200), resultSets: z.array(set).max(200),
}).strict();
const snapshotSchema = z.object({
  version: z.literal(1), checkedAt: date, scope: z.enum(["public", "admin_complete"]),
  competitions: z.array(z.object({
    id: z.string().uuid(), editionKey: key, form: z.record(z.string(), z.unknown()),
  }).strict()),
  resultSets: z.array(z.object({
    id: z.string().uuid(), competitionId: z.string().uuid(), form: z.record(z.string(), z.unknown()),
    entries: z.array(z.object({ id: z.string().uuid(), verified: z.boolean(), data: entry }).strict()),
  }).strict()),
}).strict();
type Batch = z.infer<typeof batchSchema>;
type Entry = z.infer<typeof entry>;
type Snapshot = z.infer<typeof snapshotSchema>;
type Action = {
  path: string; action: "create_competition" | "review_metadata" | "create_draft_set" | "add_draft_row" | "skip" | "review";
  target: string; route?: string; form?: Record<string, unknown>; changedFields?: string[]; reason?: string;
};
export type ContentPlan = {
  mode: "dry-run"; writes: 0; valid: boolean; approvalReady: boolean;
  errors: { path: string; message: string }[]; warnings: string[]; actions: Action[];
};

const entryIdentity = (row: Entry) => row.externalParticipantId
  ? `external:${row.externalParticipantId}`
  : `display:${row.participantType}:${row.participantName.normalize("NFKC").toLowerCase().replace(/\s+/g, " ")}:${row.countryCode ?? ""}`;
const canonical = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return JSON.stringify(value.map(canonical));
  if (value !== null && typeof value === "object") {
    return JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]));
  }
  return JSON.stringify(value) ?? "undefined";
};
const comparableEntry = (row: Entry) => Object.fromEntries(Object.entries(row).filter(([field]) => field !== "sourceIds"));

// Conversion is explicit: null/zero/N/A are not conflated by HTML form coercion.
export function entryForm(row: Entry, resultSetId: string): Record<string, unknown> {
  return {
    resultSetId, participantType: row.participantType, participantName: row.participantName,
    linkedUsername: "", rank: row.rank ?? "", score: row.score ?? "",
    scoreDisplay: row.scoreDisplay ?? "", countryCode: row.countryCode ?? "",
    award: row.award ?? "", resultStatus: row.resultStatus, externalParticipantId: row.externalParticipantId ?? "",
  };
}

export function prepareContentPlan(input: unknown, existing: unknown): ContentPlan {
  const plan: ContentPlan = { mode: "dry-run", writes: 0, valid: false, approvalReady: false, errors: [], warnings: [], actions: [] };
  const error = (path: string, message: string) => { plan.errors.push({ path, message }); };
  const report = (prefix: string, issues: z.core.$ZodIssue[]) => {
    for (const issue of issues) error(`${prefix}.${issue.path.join(".")}`, issue.message);
  };
  const parsed = batchSchema.safeParse(input);
  const parsedSnapshot = snapshotSchema.safeParse(existing);
  if (!parsed.success) report("batch", parsed.error.issues);
  if (!parsedSnapshot.success) report("snapshot", parsedSnapshot.error.issues);
  if (!parsed.success || !parsedSnapshot.success) return plan;
  const batch: Batch = parsed.data;
  const snapshot: Snapshot = parsedSnapshot.data;
  if (snapshot.scope !== "admin_complete") plan.warnings.push("Public snapshot cannot reveal private drafts. An admin must inventory all draft and published sets before approved entry.");
  if (snapshot.checkedAt !== batch.checkedAt) plan.warnings.push("Snapshot and batch dates differ. Refresh inventory before approval.");
  const sourceMap = new Map<string, z.infer<typeof source>>();
  batch.sources.forEach((item, i) => {
    if (sourceMap.has(item.id)) error(`sources.${i}.id`, "Duplicate source ID");
    if (item.checkedAt > batch.checkedAt) error(`sources.${i}.checkedAt`, "Check date is after the batch check date");
    sourceMap.set(item.id, item);
  });
  const checkSources = (ids: string[], path: string) => {
    for (const id of ids) {
      const found = sourceMap.get(id);
      if (!found) error(path, "Unknown source reference");
      else if (found.status !== "verified") error(path, "Unverified sources belong in the research inventory, not the ready batch");
    }
  };
  const validateCompetition = (form: Record<string, unknown>, path: string) => {
    // Input files must use actual booleans and calendar dates, never coerced strings.
    if (typeof form.verified !== "boolean") error(`${path}.verified`, "Verified must be a boolean");
    for (const field of ["startDate", "endDate", "registrationDeadline"]) {
      if (field === "registrationDeadline" && (form[field] === "" || form[field] == null)) continue;
      const checked = date.safeParse(form[field]);
      if (!checked.success) error(`${path}.${field}`, "Use a real ISO calendar date");
    }
    for (const field of ["officialWebsite", "registrationUrl"]) {
      if (form[field]) { const checked = url.safeParse(form[field]); if (!checked.success) report(`${path}.${field}`, checked.error.issues); }
    }
    if (typeof form.tags === "string" && form.tags.split(",").filter((tag) => tag.trim()).length > 12) error(`${path}.tags`, "At most 12 tags; no silent truncation");
    const checked = competitionSchema.strict().safeParse(form);
    if (!checked.success) { report(path, checked.error.issues); return null; }
    return checked.data;
  };
  const validateSet = (form: Record<string, unknown>, path: string, draft: boolean) => {
    if (typeof form.published !== "boolean" || (draft && form.published !== false)) error(`${path}.published`, "Prepared imports must have published=false (boolean)");
    if (typeof form.sourceLabel === "string" && form.sourceLabel.length === 1) error(`${path}.sourceLabel`, "Database source label requires at least 2 characters");
    if (form.sourceUrl) { const checked = url.safeParse(form.sourceUrl); if (!checked.success) report(`${path}.sourceUrl`, checked.error.issues); }
    const checked = resultSetSchema.strict().safeParse(form);
    if (!checked.success) { report(path, checked.error.issues); return null; }
    if (draft && !checked.data.sourceUrl) error(`${path}.sourceUrl`, "Official import requires an attributable source URL");
    return checked.data;
  };
  const validateEntry = (row: Entry, path: string) => {
    // Synthetic ID validates the shape only; it is NEVER an import target.
    const checked = competitionResultSchema.strict().safeParse(entryForm(row, "00000000-0000-4000-8000-000000000000"));
    if (!checked.success) report(path, checked.error.issues);
    if (row.score !== null && row.scoreDisplay !== null) {
      const display = row.scoreDisplay.replace(",", ".");
      if (!/^-?\d+(?:\.\d+)?$/.test(display) || Number(display) !== row.score) error(`${path}.scoreDisplay`, "Numeric score and original decimal display must agree");
    }
    if (row.score === null && row.scoreDisplay !== null && /^-?\d+(?:[.,]\d+)?$/.test(row.scoreDisplay)) error(`${path}.score`, "Numeric displayed score must not be stored as missing");
  };
  const bySlug = new Map<string, Snapshot["competitions"][number]>();
  const byEdition = new Map<string, string>();
  const ids = new Set<string>();
  snapshot.competitions.forEach((item, i) => {
    const form = validateCompetition(item.form, `snapshot.competitions.${i}.form`);
    if (!form) return;
    if (ids.has(item.id) || bySlug.has(form.slug) || byEdition.has(item.editionKey)) error(`snapshot.competitions.${i}`, "Duplicate snapshot competition identity");
    ids.add(item.id); bySlug.set(form.slug, item); byEdition.set(item.editionKey, form.slug);
  });
  const existingSets = new Map<string, Snapshot["resultSets"][number]>();
  const setIds = new Set<string>();
  snapshot.resultSets.forEach((item, i) => {
    if (!ids.has(item.competitionId)) error(`snapshot.resultSets.${i}.competitionId`, "Unknown competition foreign key");
    const form = validateSet(item.form, `snapshot.resultSets.${i}.form`, false);
    if (!form) return;
    const identity = `${item.competitionId}:${form.sourceUrl ?? ""}:${form.name}`;
    if (setIds.has(item.id) || existingSets.has(identity)) error(`snapshot.resultSets.${i}`, "Ambiguous/duplicate snapshot result set");
    setIds.add(item.id); existingSets.set(identity, item);
    const rowKeys = new Set<string>();
    item.entries.forEach((row, j) => {
      validateEntry(row.data, `snapshot.resultSets.${i}.entries.${j}`);
      const identity = entryIdentity(row.data);
      if (rowKeys.has(identity)) error(`snapshot.resultSets.${i}.entries.${j}`, "Duplicate snapshot participant identity");
      rowKeys.add(identity);
    });
  });
  const slugs = new Set(bySlug.keys());
  const batchSlugs = new Set<string>();
  const editions = new Set<string>();
  const titleYears = new Set<string>();
  batch.competitions.forEach((item, i) => {
    const path = `competitions.${i}`;
    checkSources(item.sourceIds, `${path}.sourceIds`);
    const form = validateCompetition(item.form, `${path}.form`);
    if (!form) return;
    if (!item.sourceIds.some((id) => sourceMap.get(id)?.url === form.officialWebsite)) error(`${path}.form.officialWebsite`, "Official website must match a referenced verified source");
    if (!item.editionKey.endsWith(`-${item.year}`)) error(`${path}.editionKey`, "Edition key must end in its declared competition year");
    const titleYear = `${form.title.normalize("NFKC").toLowerCase().replace(/\s+/g, " ")}:${item.year}`;
    if (titleYears.has(titleYear)) error(path, "Duplicate title/year under another edition key");
    titleYears.add(titleYear);
    if (batchSlugs.has(form.slug) || editions.has(item.editionKey)) error(path, "Duplicate edition/slug in batch");
    batchSlugs.add(form.slug); editions.add(item.editionKey);
    const sameEditionSlug = byEdition.get(item.editionKey);
    if (sameEditionSlug && sameEditionSlug !== form.slug) error(`${path}.editionKey`, "Edition already exists under another slug; resolve aliases rather than create a duplicate");
    const old = bySlug.get(form.slug);
    if (old && old.editionKey !== item.editionKey) error(`${path}.editionKey`, "Existing slug belongs to another edition key");
    if (item.expectedId && old?.id !== item.expectedId) error(`${path}.expectedId`, "Existing competition foreign key does not match the snapshot slug");
    slugs.add(form.slug);
    if (old) {
      const previous = competitionSchema.parse(old.form);
      const changedFields = Object.keys(form).filter((field) => canonical(form[field as keyof typeof form]) !== canonical(previous[field as keyof typeof previous]));
      plan.actions.push({ path, action: changedFields.length ? "review_metadata" : "skip", target: form.slug,
        route: `/admin/competitions/${old.id}/edit`, changedFields,
        form: changedFields.length ? Object.fromEntries(changedFields.map((field) => [field, item.form[field]])) : undefined,
        reason: "Existing metadata is never overwritten automatically; review only the listed fields." });
    } else {
      if (form.verified) error(`${path}.form.verified`, "New metadata must remain unverified until explicit admin review");
      plan.actions.push({ path, action: "create_competition", target: form.slug, route: "/admin/competitions/new", form: item.form,
        reason: "Competition creation is immediately public, even when verified=false. Explicit admin approval of the complete metadata is required before Save." });
    }
  });
  const batchSetKeys = new Set<string>();
  const batchSetIdentities = new Set<string>();
  batch.resultSets.forEach((item, i) => {
    const path = `resultSets.${i}`;
    checkSources(item.sourceIds, `${path}.sourceIds`);
    if (!slugs.has(item.competitionSlug)) error(`${path}.competitionSlug`, "Unknown competition foreign key (not in batch or snapshot)");
    const form = validateSet(item.form, `${path}.form`, true);
    if (!form) return;
    if (!item.sourceIds.some((id) => sourceMap.get(id)?.url === form.sourceUrl)) error(`${path}.form.sourceUrl`, "Result URL must match a referenced verified source");
    if (item.coverage === "partial" && !/selected|partial/i.test(form.name)) error(`${path}.form.name`, "Partial result-set title must explicitly say selected or partial");
    const identity = `${item.competitionSlug}:${form.sourceUrl}:${form.name}`;
    if (batchSetKeys.has(item.key) || batchSetIdentities.has(identity)) error(path, "Duplicate result set in batch");
    batchSetKeys.add(item.key); batchSetIdentities.add(identity);
    const comp = bySlug.get(item.competitionSlug);
    const old = comp ? existingSets.get(`${comp.id}:${form.sourceUrl}:${form.name}`) : undefined;
    const route = comp ? `/admin/competitions/${comp.id}/results` : undefined;
    if (old && canonical(resultSetSchema.parse(old.form)) !== canonical({ ...form, published: old.form.published })) {
      plan.actions.push({ path, action: "review", target: item.key, route, reason: "Result-set metadata differs; no silent replacement." });
      error(path, "Existing result-set metadata conflict");
    } else if (!old) plan.actions.push({ path, action: "create_draft_set", target: item.key, route, form: item.form,
      reason: "Check ALL admin-visible sets for alternate titles/sources first; create unpublished only. Save its real UUID before adding rows." });
    const rowKeys = new Set<string>();
    item.entries.forEach((row, j) => {
      const rowPath = `${path}.entries.${j}`;
      checkSources(row.sourceIds, `${rowPath}.sourceIds`);
      if (row.sourceIds.some((id) => !item.sourceIds.includes(id))) error(`${rowPath}.sourceIds`, "Row provenance must belong to this result set's sources");
      validateEntry(row, rowPath);
      const key = entryIdentity(row);
      if (rowKeys.has(key)) error(rowPath, "Duplicate participant in result set; identical display names require manual disambiguation, not guessed IDs");
      rowKeys.add(key);
      const previous = old?.entries.find((candidate) => entryIdentity(candidate.data) === key
        || (candidate.data.participantType === row.participantType && candidate.data.participantName.normalize("NFKC").toLowerCase() === row.participantName.normalize("NFKC").toLowerCase()));
      if (previous) {
        const same = canonical(comparableEntry(previous.data)) === canonical(comparableEntry(row));
        plan.actions.push({ path: rowPath, action: same ? "skip" : "review", target: `${item.key}/${key}`, route,
          reason: same ? "Already present with identical values." : "Participant already exists with different values. Never overwrite; admin review required." });
        if (!same) error(rowPath, previous.verified ? "Verified result conflict; protected from overwrite" : "Existing draft result conflict; protected from overwrite");
      } else if (old?.form.published) {
        error(rowPath, "Cannot append to a published result set; prepare a separately reviewed draft instead");
      } else plan.actions.push({ path: rowPath, action: "add_draft_row", target: `${item.key}/${key}`, route,
        form: entryForm(row, old?.id ?? "ADMIN_MUST_SELECT_THE_REAL_DRAFT_SET"), reason: "No automatic KAIZ account/team linking. Preserve original values; never infer missing ranks or scores." });
    });
  });
  plan.valid = plan.errors.length === 0;
  plan.approvalReady = plan.valid && snapshot.scope === "admin_complete" && snapshot.checkedAt === batch.checkedAt;
  if (!plan.valid) plan.actions = []; // Invalid files cannot produce an executable/manual entry queue.
  return plan;
}
