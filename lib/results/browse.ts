import type { Competition } from "@/lib/data/competitions";
import type { CompetitionResultEntry, CompetitionResultSet } from "@/lib/data/competition-results";

export function olympiadName(competition: Pick<Competition, "title">) {
  return competition.title.replace(/\b20\d{2}\b/g, "").replace(/\s+/g, " ").trim();
}
export function officialPublishedSets(sets: readonly CompetitionResultSet[]) {
  // Public directory stays draft/provisional-free even for an admin viewer.
  return sets.filter(set => set.published && set.status === "official");
}
export function filterStandings(entries: readonly CompetitionResultEntry[], query: string, country: string, award: string) {
  const q = query.trim().toLocaleLowerCase();
  return entries.filter(entry => (!q || `${entry.participant_name} ${entry.profiles?.username ?? ""}`.toLocaleLowerCase().includes(q))
    && (!country || entry.country_code === country) && (!award || entry.award === award));
}
