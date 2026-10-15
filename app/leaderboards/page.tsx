import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompetitionLeaderboard } from "@/components/competition-leaderboard";
import { OfficialResultSource } from "@/components/official-result-source";
import { listCompetitions } from "@/lib/data/competitions";
import { getPublishedCompetitionResults } from "@/lib/data/competition-results";
import { filterStandings, officialPublishedSets, olympiadName } from "@/lib/results/browse";

export const metadata: Metadata = { title: "Official Olympiad Leaderboards", description: "Browse published olympiad standings by edition and stage, with original sources. No invented global KAIZ ratings." };
const one = (value: string | string[] | undefined) => typeof value === "string" ? value.slice(0, 100) : "";
export default async function LeaderboardsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const competitions = await listCompetitions();
  const names = [...new Set(competitions.map(olympiadName))].sort();
  const olympiad = names.includes(one(query.olympiad)) ? one(query.olympiad) : names[0];
  const editions = competitions.filter(competition => olympiadName(competition) === olympiad);
  const edition = editions.find(competition => competition.slug === one(query.edition)) ?? editions.at(-1);
  const sets = edition ? officialPublishedSets(await getPublishedCompetitionResults(edition.id)) : [];
  const stage = sets.find(set => set.id === one(query.stage)) ?? sets[0];
  const q = one(query.q), country = one(query.country), award = one(query.award);
  const entries = stage ? filterStandings(stage.competition_results, q, country, award) : [];
  const selectClass = "mt-2 min-h-11 w-full min-w-0 rounded-[4px] border bg-background px-3 text-sm";
  return <div className="mx-auto min-w-0 max-w-[1200px] px-4 py-9 sm:px-6 lg:px-8">
    <header className="max-w-3xl"><p className="micro-label text-primary">Competition results / source-backed</p><h1 className="mt-3 text-3xl font-black tracking-tight">Official leaderboards</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">Explore published olympiad standings by edition and stage. These are organizer results, not a global KAIZ user rating. Qualification, finals, teams and other official tracks remain distinct.</p></header>
    {!competitions.length ? <p className="mt-6 border p-5 text-sm text-muted-foreground">No competition editions are listed yet.</p> : <>
      <form method="get" className="mt-6 grid items-end gap-3 border-b pb-5 sm:grid-cols-2 lg:grid-cols-4"><label className="min-w-0 text-sm font-medium">Olympiad<select name="olympiad" defaultValue={olympiad} className={selectClass}>{names.map(name => <option key={name}>{name}</option>)}</select></label><label className="min-w-0 text-sm font-medium">Edition / year<select name="edition" defaultValue={edition?.slug} className={selectClass}>{editions.map(competition => <option key={competition.id} value={competition.slug}>{competition.title}</option>)}</select></label><label className="min-w-0 text-sm font-medium">Official stage<select name="stage" defaultValue={stage?.id ?? ""} className={selectClass} disabled={!sets.length}>{!sets.length && <option value="">No published stages</option>}{sets.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}</select></label><Button className="h-auto min-h-11 whitespace-normal">Apply selection</Button></form>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">When changing olympiad, apply the selection to load its editions and stages. Stage names retain their source coverage labels; do not assume a partial set is complete.</p>
      {edition && <nav className="my-5 flex flex-wrap gap-3" aria-label="Edition actions"><Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal"><Link href={`/competitions/${edition.slug}`}>Open competition details</Link></Button><Button asChild variant="outline"><Link href="/discussions">Discuss a result</Link></Button></nav>}
      {stage && <form method="get" className="my-5 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"><input type="hidden" name="olympiad" value={olympiad}/><input type="hidden" name="edition" value={edition?.slug}/><input type="hidden" name="stage" value={stage.id}/><label className="min-w-0 text-sm font-medium">Participant or team<input name="q" defaultValue={q} maxLength={100} className={selectClass}/></label><label className="min-w-0 text-sm font-medium">Country<select name="country" defaultValue={country} className={selectClass}><option value="">All countries</option>{[...new Set(stage.competition_results.map(entry => entry.country_code).filter(value => value !== null))].sort().map(value => <option key={value}>{value}</option>)}</select></label><label className="min-w-0 text-sm font-medium">Award<select name="award" defaultValue={award} className={selectClass}><option value="">All awards</option>{[...new Set(stage.competition_results.map(entry => entry.award).filter(value => value !== null))].sort().map(value => <option key={value}>{value}</option>)}</select></label><Button variant="outline" className="h-auto min-h-11 whitespace-normal">Filter standings</Button></form>}
      {stage && <p className="mb-4 text-sm text-muted-foreground">Showing {entries.length} of {stage.competition_results.length} published rows · ranks and scores are never recalculated.{!entries.length && " No rows match these filters."} <Link href={`/leaderboards?${new URLSearchParams({ olympiad: olympiad ?? "", edition: edition?.slug ?? "", stage: stage.id })}`} className="text-primary underline underline-offset-4">Clear row filters</Link></p>}
      <div className="min-w-0 max-w-full"><CompetitionLeaderboard resultSets={stage ? [{ ...stage, competition_results: entries }] : []}/></div>
      {edition && <div className="mt-6"><OfficialResultSource slug={edition.slug}/></div>}
      <p className="mt-5 text-xs leading-6 text-muted-foreground">Only published official sets are shown here. Missing values are not zero; tied ranks and original display scores are preserved. Original task-level columns are not stored in the current production model; consult the official source for breakdowns. Detailed breakdowns require a separately verified presentation release.</p>
    </>}
  </div>;
}
