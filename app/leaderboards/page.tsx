import type { Metadata } from "next";
import Link from "next/link";
import { CompetitionLeaderboard } from "@/components/competition-leaderboard";
import { OfficialResultSource } from "@/components/official-result-source";
import { listCompetitions } from "@/lib/data/competitions";
import { getPublishedCompetitionResults } from "@/lib/data/competition-results";
import { filterStandings, officialPublishedSets, olympiadName } from "@/lib/results/browse";
import styles from "@/components/training/catalog.module.css";
import { PageHero, ProductEmptyState } from "@/components/product/page-hero";
import product from "@/components/product/product.module.css";

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
  return <div className={product.page}>
    <PageHero title="Official Leaderboards" description="Original olympiad standings. Choose an edition and stage." motif="ranking"><Link href="/competitions" className={product.action}>Explore competitions →</Link></PageHero>
    {!competitions.length ? <ProductEmptyState title="No published standings"><p>Official results appear here when reviewed and published.</p></ProductEmptyState> : <>
      <form method="get" className={product.filters} aria-label="Standings selection">
        <label>Olympiad<select name="olympiad" aria-label="Olympiad" defaultValue={olympiad} className={product.control}>{names.map(name => <option key={name}>{name}</option>)}</select></label>
        <label>Edition<select name="edition" aria-label="Edition" defaultValue={edition?.slug} className={product.control}>{editions.map(competition => <option key={competition.id} value={competition.slug}>{competition.title}</option>)}</select></label>
        <label>Stage<select name="stage" aria-label="Stage" defaultValue={stage?.id ?? ""} className={product.control} disabled={!sets.length}>{!sets.length && <option value="">No published stages</option>}{sets.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}</select></label>
        <button className={`${product.action} ${product.primary}`}>Apply selection</button>
      </form>
      <p className={styles.note}>Choose an olympiad, then apply to load its editions and stages.</p>
      {edition && <div className={styles.actions}><h2 className="text-sm font-semibold">{edition.title}</h2><Link href={`/competitions/${edition.slug}`} className={styles.textAction} aria-label="Open competition details">Details</Link><Link href="/discussions" className={styles.textAction}>Discuss</Link></div>}
      {stage && <form method="get" className={product.filters} aria-label="Standings filters">
        <input type="hidden" name="olympiad" value={olympiad}/><input type="hidden" name="edition" value={edition?.slug}/><input type="hidden" name="stage" value={stage.id}/>
        <label>Participant / team<input name="q" aria-label="Participant or team" defaultValue={q} maxLength={100} className={product.control}/></label>
        <label>Country<select name="country" aria-label="Country" defaultValue={country} className={product.control}><option value="">All</option>{[...new Set(stage.competition_results.map(entry => entry.country_code).filter(value => value !== null))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Award<select name="award" aria-label="Award" defaultValue={award} className={product.control}><option value="">All</option>{[...new Set(stage.competition_results.map(entry => entry.award).filter(value => value !== null))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
        <button className={product.action}>Filter standings</button>
      </form>}
      {stage && <p className={styles.count}>Showing {entries.length} of {stage.competition_results.length} published rows{!entries.length && " · No rows match these filters"} · <Link href={`/leaderboards?${new URLSearchParams({ olympiad: olympiad ?? "", edition: edition?.slug ?? "", stage: stage.id })}`} className="text-primary underline">Clear row filters</Link></p>}
      <div className={styles.standings}><CompetitionLeaderboard resultSets={stage ? [{ ...stage, competition_results: entries }] : []}/></div>
      {edition && <div className={styles.sourceNote}><OfficialResultSource slug={edition.slug}/></div>}
      <details className={product.details}><summary>Coverage &amp; scoring</summary><p>Only published official sets, not a global KAIZ rating. Partial coverage stays labelled. Missing scores are not zero; ties and original display scores are preserved. Available task-level columns follow the original source.</p></details>
    </>}
  </div>;
}
