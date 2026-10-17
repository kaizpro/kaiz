import type { Metadata } from "next";
import Link from "next/link";
import { CompetitionLeaderboard } from "@/components/competition-leaderboard";
import { OfficialResultSource } from "@/components/official-result-source";
import { listCompetitions } from "@/lib/data/competitions";
import { getPublishedCompetitionResults } from "@/lib/data/competition-results";
import { filterStandings, officialPublishedSets, olympiadName } from "@/lib/results/browse";
import styles from "@/components/training/catalog.module.css";

export const metadata: Metadata = { title: "Official Olympiad Leaderboards", description: "Published olympiad standings by edition and stage, with original scores and sources." };
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
  return <div className={styles.page}>
    <header className={styles.intro}><div><p>Compete / published standings</p><h1>Official leaderboards</h1><p>Original olympiad ranks, medals and scores—not a global KAIZ rating.</p></div><Link href="/competitions" className={styles.action}>Competitions</Link></header>
    {!competitions.length ? <p className={styles.note}>No competition editions are listed yet.</p> : <>
      <form method="get" className={styles.toolbar} aria-label="Standings selection">
        <label>Olympiad<select name="olympiad" aria-label="Olympiad" defaultValue={olympiad} className={styles.control}>{names.map(name => <option key={name}>{name}</option>)}</select></label>
        <label>Edition<select name="edition" aria-label="Edition" defaultValue={edition?.slug} className={styles.control}>{editions.map(competition => <option key={competition.id} value={competition.slug}>{competition.title}</option>)}</select></label>
        <label>Stage<select name="stage" aria-label="Stage" defaultValue={stage?.id ?? ""} className={styles.control} disabled={!sets.length}>{!sets.length && <option value="">No published stages</option>}{sets.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}</select></label>
        <button className={`${styles.action} ${styles.primary}`}>Apply selection</button>
      </form>
      <p className={styles.note}>Apply an olympiad selection to load its editions and stages.</p>
      {edition && <div className={styles.actions}><h2 className="text-sm font-semibold">{edition.title}</h2><Link href={`/competitions/${edition.slug}`} className={styles.textAction} aria-label="Open competition details">Details</Link><Link href="/discussions" className={styles.textAction}>Discuss</Link></div>}
      {stage && <form method="get" className={styles.toolbar} aria-label="Standings filters">
        <input type="hidden" name="olympiad" value={olympiad}/><input type="hidden" name="edition" value={edition?.slug}/><input type="hidden" name="stage" value={stage.id}/>
        <label>Participant / team<input name="q" aria-label="Participant or team" defaultValue={q} maxLength={100} className={styles.control}/></label>
        <label>Country<select name="country" aria-label="Country" defaultValue={country} className={styles.control}><option value="">All</option>{[...new Set(stage.competition_results.map(entry => entry.country_code).filter(value => value !== null))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Award<select name="award" aria-label="Award" defaultValue={award} className={styles.control}><option value="">All</option>{[...new Set(stage.competition_results.map(entry => entry.award).filter(value => value !== null))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
        <button className={styles.action}>Filter standings</button>
      </form>}
      {stage && <p className={styles.count}>Showing {entries.length} of {stage.competition_results.length} published rows{!entries.length && " · No rows match these filters"} · <Link href={`/leaderboards?${new URLSearchParams({ olympiad: olympiad ?? "", edition: edition?.slug ?? "", stage: stage.id })}`} className="text-primary underline">Clear row filters</Link></p>}
      <div className={styles.standings}><CompetitionLeaderboard resultSets={stage ? [{ ...stage, competition_results: entries }] : []}/></div>
      {edition && <div className={styles.sourceNote}><OfficialResultSource slug={edition.slug}/></div>}
      <details className={styles.resourceDetails}><summary>Coverage &amp; scoring</summary><p>Only published official sets. Partial coverage stays labelled in the stage name. Missing scores are not zero; ties and original display scores are preserved. Task-level columns require the separate presentation release; consult the source for breakdowns.</p></details>
    </>}
  </div>;
}
