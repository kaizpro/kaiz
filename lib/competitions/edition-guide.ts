import { z } from "zod";
import data from "@/content/competitions/edition-guides.json";

const url = z.string().url().refine((value) => {
  const parsed = new URL(value);
  return parsed.protocol === "https:" && !parsed.username && !parsed.password
    && ![...parsed.searchParams.keys()].some((key) => /token|secret|password|code|key/i.test(key))
    && parsed.hostname !== "docs.google.com";
}, "Use a public, non-sensitive source; restricted originals never belong in guides");
const count = z.number().int().nonnegative();
export const editionStatisticsSchema = z.object({
  stage: z.string().min(1), population: z.string().min(1), unit: z.enum(["contestants", "teams", "finalists", "qualifiers"]),
  participants: count.positive(), countries: count.positive().optional(),
  gold: count.optional(), silver: count.optional(), bronze: count.optional(), honorableMentions: count.optional(),
  source: url, checkedAt: z.string().date(), method: z.string().min(1),
}).strict().superRefine((value, context) => {
  const medals = [value.gold, value.silver, value.bronze].filter((n): n is number => n !== undefined);
  if (medals.reduce((sum, n) => sum + n, 0) + (value.honorableMentions ?? 0) > value.participants) {
    context.addIssue({ code: "custom", message: "Awards must share the declared population and not exceed it" });
  }
});
export const editionGuideSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), checkedAt: z.string().date(),
  summary: z.string().min(1).max(1600), structure: z.string().min(1).max(1600),
  sources: z.array(url).min(1), statistics: z.array(editionStatisticsSchema).max(5),
  results: z.array(z.object({ label: z.string().min(1), url, coverage: z.string().min(1) }).strict()),
  tasks: z.array(z.object({ id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().min(1),
    stage: z.string().min(1), day: count.positive().nullable(), kind: z.enum(["task", "collection"]),
    url: url.nullable(), provenance: url, access: z.enum(["public_materials", "account_required", "invitation_required", "unavailable"]),
  }).strict()).superRefine((tasks, context) => {
    if (new Set(tasks.map(t => t.id)).size !== tasks.length || tasks.some(t => (t.url === null) !== (t.access === "unavailable"))) {
      context.addIssue({ code: "custom", message: "Task identities and access states must be consistent" });
    }
  }),
}).strict();
export const editionGuides = z.array(editionGuideSchema).parse(data);
export type EditionGuide = z.infer<typeof editionGuideSchema>;
export type EditionStatistics = z.infer<typeof editionStatisticsSchema>;
export function getEditionGuide(slug: string) { return editionGuides.find(e => e.slug === slug); }
// These are reviewed public facts/links only. Never imports named standings or creates database editions.
export function medalRates(statistics: EditionStatistics) {
  const rate = (value: number | undefined) => value === undefined ? undefined : Math.round(value / statistics.participants * 1000) / 10;
  const { gold, silver, bronze } = statistics;
  return { gold: rate(gold), silver: rate(silver), bronze: rate(bronze),
    total: gold === undefined || silver === undefined || bronze === undefined ? undefined : rate(gold + silver + bronze) };
}
