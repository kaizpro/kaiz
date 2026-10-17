import { ExternalLink, Trophy } from "lucide-react";
import { CompetitionStandings } from "@/components/competition-standings";
import { Badge } from "@/components/ui/badge";
import { CompetitionResultSwitcher } from "@/components/competition-result-switcher";
import type { CompetitionResultSet } from "@/lib/data/competition-results";
import { RESULT_SOURCE_LABELS } from "@/lib/results/provider";
import { AVAILABILITY_LABELS, rowPresentationSchema, setPresentationSchema, type EditionPresentation } from "@/lib/validation/competition-presentation";

export function ResultTable({ resultSet }: { resultSet: CompetitionResultSet }) {
  const presentation = setPresentationSchema.safeParse(resultSet.presentation ?? {}).data ?? {};
  const columns = presentation.columns ?? [];
  const sourceLabel = resultSet.source_label || RESULT_SOURCE_LABELS[resultSet.source] || resultSet.source;
  return <section className="border bg-card" aria-labelledby={`result-set-${resultSet.id}`}>
    <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:justify-between">
      <div><div className="flex flex-wrap items-center gap-2"><h3 id={`result-set-${resultSet.id}`} className="font-bold">{resultSet.name}</h3><Badge>{presentation.availability === "SECONDARY_RESULTS_ONLY" ? "Secondary source" : resultSet.status === "official" ? "Official results" : "Live / provisional"}</Badge></div>
        <p className="mt-2 text-xs text-muted-foreground">{presentation.availability ? AVAILABILITY_LABELS[presentation.availability] : "Coverage not classified"} · {presentation.coverage === "complete" ? "Complete source coverage" : presentation.coverage === "partial" ? "Selected entries — not full standings" : "Completeness has not been verified"}</p>
        {presentation.notes && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{presentation.notes}</p>}
        <p className="mt-2 text-xs text-muted-foreground">Source: {resultSet.source_url ? <a href={resultSet.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">{sourceLabel}<ExternalLink className="size-3"/></a> : sourceLabel}</p>
        {resultSet.verified_at && <p className="mt-1 text-xs text-muted-foreground">Last verified: {resultSet.verified_at.slice(0, 10)}</p>}
      </div><span className="shrink-0 font-mono text-xs text-muted-foreground">{resultSet.competition_results.length} entries</span>
    </div>
    {resultSet.competition_results.length ? <CompetitionStandings name={resultSet.name} columns={columns} rows={resultSet.competition_results.map((entry) => {
        const details = rowPresentationSchema.safeParse(entry.presentation ?? {}).data ?? {};
        return {id:entry.id,rank:entry.rank,name:entry.participant_name,username:entry.profiles?.username,team:entry.participant_type==="team",country:entry.country_code,detail:[details.city,details.school,details.team].filter(Boolean).join(" · "),status:entry.result_status,comments:details.comments,scores:details.scores??{},total:entry.score_display??entry.score,award:entry.award};
      })}/> : <MissingResults/>}
  </section>;
}

function MissingResults({ label = "Results are not available yet" }: { label?: string }) {
  return <div className="border bg-card px-5 py-10 text-center"><Trophy className="mx-auto size-5 text-muted-foreground"/><p className="mt-3 font-semibold">{label}</p><p className="mt-2 text-sm text-muted-foreground">Only reviewed, published results appear here. A missing final is never replaced by qualification scores.</p></div>;
}

export function CompetitionLeaderboard({ resultSets, expectedStages = [] }: { resultSets: CompetitionResultSet[]; expectedStages?: EditionPresentation["expectedStages"] }) {
  const ordered = resultSets.map((set) => ({ set, presentation: setPresentationSchema.safeParse(set.presentation ?? {}).data ?? {} }))
    .sort((a, b) => (a.presentation.displayOrder ?? 0) - (b.presentation.displayOrder ?? 0));
  const panels = ordered.map(({ set, presentation }) => ({ key: set.id, label: presentation.stageLabel ?? set.name, content: <ResultTable resultSet={set}/> }));
  for (const stage of expectedStages) {
    if (!panels.some((panel) => panel.label === stage.name)) panels.push({ key: `missing-${stage.name}`, label: stage.name, content: <MissingResults label={stage.availability === "NOT_FOUND" ? "Results source has not been found" : "Results are not available yet"}/> });
  }
  return <section id="leaderboard" className="py-8"><div className="mb-5 flex items-center gap-2"><Trophy className="size-5 text-gold"/><h2 className="text-xl font-bold">Competition results</h2></div>{panels.length ? <CompetitionResultSwitcher panels={panels}/> : <MissingResults/>}</section>;
}
