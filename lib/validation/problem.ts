import { z } from "zod";

// Preserve decimal input rather than rounding it through a JavaScript number.
const decimal = z.string().trim().min(1, "Enter a score").max(100)
  .regex(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/, "Enter a finite decimal number")
  .refine((value) => Number.isFinite(Number(value)), "Enter a finite decimal number");
const optionalDecimal = z.preprocess((value) => value === "" || value == null ? null : value, decimal.nullable());
const optionalText = (max: number, min = 0) => z.preprocess(
  (value) => typeof value === "string" && !value.trim() || value == null ? null : value,
  z.string().trim().min(min).max(max).nullable(),
);
const optionalUrl = z.preprocess((value) => value === "" || value == null ? null : value,
  z.string().trim().max(2000).url("Enter a valid URL")
    .refine((value) => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL").nullable());

export const problemSchema = z.object({
  title: z.string().trim().min(2).max(180),
  slug: z.string().trim().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens"),
  competition_id: z.preprocess((value) => value === "" || value == null ? null : value, z.uuid().nullable()),
  problem_code: optionalText(40), summary: optionalText(600), statement_markdown: optionalText(50000),
  statement_url: optionalUrl,
  category: z.string().trim().min(2).max(80),
  tags: z.string().max(700).default("").transform((value) => [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(50)).max(12, "Use at most 12 tags")),
  metric_name: z.string().trim().min(1).max(80),
  metric_direction: z.enum(["higher_is_better", "lower_is_better"]),
  reference_score: optionalDecimal,
  difficulty_status: z.enum(["unrated", "provisional", "rated"]),
  difficulty_rating: optionalDecimal.refine((value) => value === null || Number(value) >= 0, "Difficulty must be nonnegative"),
  source_provider: z.string().trim().regex(/^[a-z][a-z0-9_]{1,39}$/, "Use a lowercase provider ID, 2–40 characters"),
  source_label: optionalText(120, 2), source_url: optionalUrl, source_external_id: optionalText(200),
  sort_order: z.preprocess((value) => value === "" || value == null ? 0 : value,
    z.coerce.number().int().min(-2147483648).max(2147483647)),
  published: z.preprocess((value) => value === "true" || value === "on" || value === true, z.boolean()),
}).superRefine((data, context) => {
  if (data.difficulty_status === "unrated" && data.difficulty_rating !== null)
    context.addIssue({ code: "custom", path: ["difficulty_rating"], message: "Unrated problems must have no difficulty value" });
  if (data.difficulty_status === "rated" && data.difficulty_rating === null)
    context.addIssue({ code: "custom", path: ["difficulty_rating"], message: "Rated problems require an existing difficulty value" });
});

export const practiceSchema = z.object({
  raw_score: decimal,
  attempted_at: z.preprocess((value) => {
    // The visible datetime-local field is explicitly labeled UTC.
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value))
      return `${value.length === 16 ? `${value}:00` : value}Z`;
    return value;
  }, z.iso.datetime({ offset: true, message: "Enter a valid attempt time (UTC)" })
    .refine((value) => Date.parse(value) <= Date.now(), "Attempt time cannot be in the future")),
});

export type ProblemActionState = { error?: string; fields?: Record<string, string[] | undefined>; success?: string };
export function problemValidationError(error: z.ZodError): ProblemActionState {
  return { error: "Check the highlighted fields.", fields: z.flattenError(error).fieldErrors };
}

export function isEditablePractice(row: {
  status: string; normalized_performance: number | null; source_provider: string | null;
  source_external_id: string | null; source_provenance: Record<string, unknown>;
}) {
  return row.status === "valid" && row.normalized_performance === null && row.source_provider === null
    && row.source_external_id === null && Object.keys(row.source_provenance).length === 0;
}
