import { z } from "zod";

export const RESULT_AVAILABILITY = ["FULL_OFFICIAL_STANDINGS", "OFFICIAL_STAGE_RESULTS", "OFFICIAL_WINNERS_ONLY", "SECONDARY_RESULTS_ONLY", "NOT_FOUND", "NOT_YET_PUBLISHED"] as const;
export const AVAILABILITY_LABELS: Record<(typeof RESULT_AVAILABILITY)[number], string> = {
  FULL_OFFICIAL_STANDINGS: "Full official standings",
  OFFICIAL_STAGE_RESULTS: "Official stage results",
  OFFICIAL_WINNERS_ONLY: "Official winners / medalists only",
  SECONDARY_RESULTS_ONLY: "Secondary source results",
  NOT_FOUND: "Results source not found",
  NOT_YET_PUBLISHED: "Results not published yet",
};
const text = z.string().trim().min(1).max(500);
const publicUrl = z.string().url().max(2000).refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password
    && ![...url.searchParams.keys()].some((key) => /token|secret|password|code|key/i.test(key));
}, "Use a public HTTPS URL without credentials or tokens");
const stage = z.object({ name: z.string().trim().min(1).max(120), availability: z.enum(RESULT_AVAILABILITY) }).strict();
export const editionPresentationSchema = z.object({
  seriesSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  logoUrl: publicUrl.optional(), heroUrl: publicUrl.optional(), tasksUrl: publicUrl.optional(),
  sourceNotes: text.optional(), expectedStages: z.array(stage).max(20).refine((stages) => new Set(stages.map((item) => item.name)).size === stages.length, "Stage names must be unique").optional(),
}).strict();
export const setPresentationSchema = z.object({
  availability: z.enum(RESULT_AVAILABILITY).optional(),
  coverage: z.enum(["complete", "partial", "unknown"]).optional(),
  stageLabel: z.string().trim().min(1).max(120).optional(),
  displayOrder: z.number().int().min(0).max(1000).optional(),
  notes: text.optional(),
  columns: z.array(z.object({ key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/), label: z.string().trim().min(1).max(100) }).strict()).max(20).refine((columns) => new Set(columns.map((column) => column.key)).size === columns.length, "Column keys must be unique").optional(),
}).strict();
export const rowPresentationSchema = z.object({
  city: text.optional(), school: text.optional(), team: text.optional(), comments: text.optional(),
  scores: z.record(z.string().regex(/^[a-z][a-z0-9_]{0,39}$/), z.union([z.number().finite(), z.string().max(100), z.null()])).refine((scores) => Object.keys(scores).length <= 20, "At most 20 score fields").optional(),
}).strict();

// Form JSON is parsed as data, never evaluated. Missing fields preserve old callers.
export function presentationInput<T extends z.ZodType>(schema: T) {
  return z.preprocess((value, context) => {
    if (value === undefined || value === "") return undefined;
    if (typeof value !== "string") return value;
    if (value.length > 12000) { context.addIssue({ code: "custom", message: "Presentation JSON is too large" }); return z.NEVER; }
    try { return JSON.parse(value); }
    catch { context.addIssue({ code: "custom", message: "Enter valid presentation JSON" }); return z.NEVER; }
  }, schema.optional());
}

export type EditionPresentation = z.infer<typeof editionPresentationSchema>;
export type SetPresentation = z.infer<typeof setPresentationSchema>;
export type RowPresentation = z.infer<typeof rowPresentationSchema>;
