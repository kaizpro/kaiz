import type { Metadata } from "next";
import Link from "next/link";
import { CompetitionRow } from "@/components/competition-row";
import { COMPETITION_CATEGORIES, COMPETITION_FORMATS, COMPETITION_STATUSES } from "@/lib/constants";
import { listCompetitions } from "@/lib/data/competitions";
import styles from "@/components/training/catalog.module.css";

export const metadata: Metadata = { title: "Competitions", description: "Source-backed AI olympiad editions, official results and preparation tasks." };
function normalizeFilter(value: string | string[] | undefined, allowed: readonly string[]) {
  return typeof value === "string" && allowed.includes(value) ? value : "all";
}
export default async function CompetitionsPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; format?: string }> }) {
  const query = await searchParams;
  const status = normalizeFilter(query.status, COMPETITION_STATUSES), category = normalizeFilter(query.category, COMPETITION_CATEGORIES), format = normalizeFilter(query.format, COMPETITION_FORMATS);
  const competitions = await listCompetitions(status, category, format);
  const fields = [["status", "Status", status, COMPETITION_STATUSES], ["category", "Category", category, COMPETITION_CATEGORIES], ["format", "Format", format, COMPETITION_FORMATS]] as const;
  return <div className={styles.page}>
    <header className={styles.intro}><div><p>Compete / editions</p><h1>Competition directory</h1><p>Browse editions, tasks and official results. Completed events remain useful preparation references.</p></div><Link href="/leaderboards" className={styles.action}>Official standings</Link></header>
    <form className={styles.toolbar} method="get" aria-label="Competition filters">{fields.map(([name, label, value, options]) => <label key={name}>{label}<select name={name} aria-label={label} defaultValue={value} className={styles.control}><option value="all">All</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>)}<button className={`${styles.action} ${styles.primary}`}>Apply filters</button></form>
    <p className={styles.count}>{competitions.length} listed editions{(status !== "all" || category !== "all" || format !== "all") && <> · <Link href="/competitions" className="text-primary underline">Clear filters</Link></>}</p>
    <div className={`${styles.rows} ${styles.competitionList}`}>{competitions.length ? competitions.map(competition => <CompetitionRow key={competition.id} competition={competition}/>) : <p className="px-3 py-6 text-sm text-muted-foreground">No competitions match these filters.</p>}</div>
    <p className={styles.note}>Only database listings appear here. Research drafts are not published editions.</p>
  </div>;
}
