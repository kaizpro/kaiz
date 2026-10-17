import entries from "@/content/practice/source-catalog.json";
export const practiceCatalog = entries;
export type PracticeFilters = { search?: string; level?: string; topic?: string; competition?: string; source?: string; type?: string };
export function filterPracticeSources(filters: PracticeFilters) {
  const q = (filters.search ?? "").trim().toLocaleLowerCase();
  return practiceCatalog.filter(entry => (!q || `${entry.title} ${entry.sourceLabel} ${entry.topics.join(" ")}`.toLocaleLowerCase().includes(q))
    && (!filters.level || entry.difficulty === filters.level) && (!filters.topic || entry.topics.includes(filters.topic))
    && (!filters.competition || entry.competition === filters.competition) && (!filters.source || entry.source === filters.source)
    && (!filters.type || entry.type === filters.type));
}
