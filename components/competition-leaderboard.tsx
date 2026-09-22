import Link from "next/link";
import { ExternalLink, Medal, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CompetitionResultSet } from "@/lib/data/competition-results";
import { RESULT_SOURCE_LABELS } from "@/lib/results/provider";

function awardClass(award: string | null) {
  const value = award?.toLowerCase();
  if (value?.includes("gold")) return "border-gold/40 text-gold";
  if (value?.includes("silver")) return "border-muted-foreground/40 text-foreground";
  if (value?.includes("bronze")) return "border-warning/40 text-warning";
  return "text-muted-foreground";
}

function ResultTable({ resultSet }: { resultSet: CompetitionResultSet }) {
  const sourceLabel = resultSet.source_label || RESULT_SOURCE_LABELS[resultSet.source] || resultSet.source;
  return <section className="border bg-card" aria-labelledby={`result-set-${resultSet.id}`}>
    <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="flex flex-wrap items-center gap-2"><h3 id={`result-set-${resultSet.id}`} className="font-bold">{resultSet.name}</h3><Badge className={resultSet.status === "official" ? "border-success/40 text-success" : "border-warning/40 text-warning"}>{resultSet.status === "official" ? "Official results" : "Live / provisional"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">Source: {resultSet.source_url ? <a href={resultSet.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">{sourceLabel}<ExternalLink className="size-3"/></a> : sourceLabel}</p></div>
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{resultSet.competition_results.length} entries</span>
    </div>
    {resultSet.competition_results.length ? <div className="overflow-x-auto"><table className="w-full min-w-[42rem] border-collapse text-sm"><thead><tr className="border-b bg-muted/40 text-left"><th scope="col" className="w-20 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Rank</th><th scope="col" className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Participant</th><th scope="col" className="w-28 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Country</th><th scope="col" className="w-32 px-4 py-2.5 text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Score</th><th scope="col" className="w-32 px-4 py-2.5 text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Award</th></tr></thead><tbody>{resultSet.competition_results.map((entry) => <tr key={entry.id} className="border-b last:border-b-0"><td className="tabular px-4 py-3 font-mono text-base font-bold">{entry.rank ?? <span className="text-muted-foreground">—</span>}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><span className="font-semibold">{entry.profiles?.username ? <Link href={`/u/${entry.profiles.username}`} className="hover:text-primary">{entry.participant_name}</Link> : entry.participant_name}</span>{entry.participant_type === "team" && <Badge>Team</Badge>}</div>{entry.result_status !== "ranked" && <p className="mt-0.5 text-xs capitalize text-muted-foreground">{entry.result_status}</p>}</td><td className="tabular px-4 py-3 font-mono text-muted-foreground">{entry.country_code || "—"}</td><td className="tabular px-4 py-3 text-right font-mono font-semibold">{entry.score_display ?? entry.score ?? "—"}</td><td className="px-4 py-3 text-right">{entry.award ? <Badge className={awardClass(entry.award)}><Medal className="mr-1 size-3"/>{entry.award}</Badge> : <span className="text-muted-foreground">—</span>}</td></tr>)}</tbody></table></div> : <div className="px-5 py-10 text-center text-sm text-muted-foreground">This result set has no entries.</div>}
  </section>;
}

export function CompetitionLeaderboard({ resultSets }: { resultSets: CompetitionResultSet[] }) {
  return <section id="leaderboard" className="border-t pt-8"><div className="mb-4 flex items-center gap-2"><Trophy className="size-5 text-gold"/><div><p className="micro-label text-primary">Leaderboard</p><h2 className="mt-1 text-xl font-bold">Competition results</h2></div></div>{resultSets.length ? <div className="space-y-5">{resultSets.map((resultSet) => <ResultTable key={resultSet.id} resultSet={resultSet}/>)}</div> : <div className="border bg-card px-5 py-10 text-center"><Trophy className="mx-auto size-5 text-muted-foreground"/><p className="mt-3 font-semibold">Official results have not been added to KAIZ yet.</p><p className="mt-1 text-sm text-muted-foreground">Verified standings will appear here when an administrator publishes them.</p></div>}</section>;
}
