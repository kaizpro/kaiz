import type { Problem } from "@/lib/data/problems";
import { practiceCatalog } from "./practice-catalog";
import { practiceSources } from "./practice-sources";

export type ArchiveItem = {
  id: string; title: string; href: string | null; external: boolean;
  source: string; type: string; difficulty: string; difficultyLabel?: string; tags: readonly string[];
  availability: "public" | "account_required" | "held" | "unavailable";
  competition: string; details: string; provenance: string; account: string;
  originalHref?: string | null; parentId?: string | null;
  direction?: string;
};
export type ArchiveFilters = { q?: string; source?: string; type?: string; difficulty?: string; tag?: string; availability?: string; competition?: string; direction?: string };
export const archiveAvailability = { public: "Public", account_required: "Account required", held: "Held", unavailable: "Unavailable" } as const;

export function publicExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !/^\/t\//.test(url.pathname) ? url.href : null; } catch { return null; }
}

export function archiveSourceHref(id: string) { return `/problems/sources/${encodeURIComponent(id)}`; }
export function getArchiveSource(segment: string): ArchiveItem | undefined {
  if (segment.length > 240) return undefined;
  try { const id = decodeURIComponent(segment); return buildPracticeArchive([]).find(item => item.external && item.id === id); } catch { return undefined; }
}

// A view-model adapter only. It never inserts external collections as problems,
// invents task metrics, reads private attempts, or bypasses published-row checks.
export function buildPracticeArchive(problems: readonly Problem[]): ArchiveItem[] {
  const internal: ArchiveItem[] = problems.filter(problem => problem.published).map(problem => ({
    id: `problem:${problem.id}`, title: problem.title, href: `/problems/${problem.slug}`, originalHref: publicExternalUrl(problem.statement_url || problem.source_url), external: false,
    source: problem.source_label || problem.source_provider, type: "KAIZ task", difficulty: problem.difficulty_status,
    difficultyLabel: problem.difficulty_status === "rated" && problem.difficulty_rating !== null ? `${Math.round(problem.difficulty_rating)} rated` : problem.difficulty_status,
    tags: [...new Set([problem.category, ...problem.tags])], availability: "public", competition: problem.competition?.title ?? "Independent",
    details: `${problem.metric_name} · ${problem.metric_direction === "higher_is_better" ? "Higher is better" : "Lower is better"}${problem.difficulty_rating !== null ? ` · Difficulty ${problem.difficulty_rating}` : ""}${problem.statistics ? ` · ${problem.statistics.sample_size} samples` : " · No statistics"}`,
    provenance: problem.source_url ?? problem.source_provider, account: "Sign in to save private self-reported practice. External source access may differ.", direction: problem.metric_direction,
  }));
  const external: ArchiveItem[] = practiceCatalog.map(entry => ({
    id: entry.id, title: entry.title, href: archiveSourceHref(entry.id), originalHref: entry.availability === "available" ? publicExternalUrl(entry.url) : null, parentId: entry.parent, external: true,
    source: entry.source, type: entry.type, difficulty: entry.difficulty, tags: entry.topics,
    availability: entry.availability === "held" ? "held" : entry.availability === "unavailable" ? "unavailable" : entry.source === "FAIO" ? "public" : "account_required",
    competition: entry.competition, details: entry.description, provenance: `${entry.provenance} · Checked ${entry.checkedOn}${entry.parent ? " · NEOAI parent contest retained" : ""}`, account: entry.login,
  }));
  const originals: ArchiveItem[] = Object.entries(practiceSources).map(([level, source]) => ({
    id: `publisher:${level}`, title: source.title, href: archiveSourceHref(`publisher:${level}`), originalHref: publicExternalUrl(source.href), external: true,
    source: level === "beginner" ? "MIT OpenCourseWare" : level === "intermediate" ? "scikit-learn" : "IOAI",
    type: level === "intermediate" ? "worked examples" : "task collection", difficulty: "Unrated",
    tags: [level === "beginner" ? "Algorithms" : "Machine Learning"], availability: "public", competition: level === "advanced" ? "IOAI 2024" : "Independent",
    details: source.note, provenance: "KAIZ publisher selection · Checked 2026-10-14", account: "Public reading; external execution or submissions may have separate requirements.",
  }));
  const seen = new Set<string>();
  return [...internal, ...external, ...originals].filter(entry => {
    const key = entry.external ? entry.originalHref ?? entry.id : entry.id;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function filterPracticeArchive(items: readonly ArchiveItem[], filters: ArchiveFilters) {
  const q = (filters.q ?? "").trim().toLocaleLowerCase();
  return items.filter(item => (!q || `${item.title} ${item.source} ${item.tags.join(" ")} ${item.competition}`.toLocaleLowerCase().includes(q))
    && (!filters.source || item.source === filters.source) && (!filters.type || item.type === filters.type)
    && (!filters.difficulty || item.difficulty.toLocaleLowerCase() === filters.difficulty.toLocaleLowerCase())
    && (!filters.tag || item.tags.includes(filters.tag)) && (!filters.availability || item.availability === filters.availability)
    && (!filters.competition || item.competition === filters.competition) && (!filters.direction || item.direction === filters.direction));
}
