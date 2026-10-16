import type { Metadata } from "next";
import Link from "next/link";
import { listProblems } from "@/lib/data/problems";
import { buildPracticeArchive, filterPracticeArchive, archiveAvailability, type ArchiveFilters } from "@/lib/learning/unified-archive";
import { ArchiveList } from "@/components/learning/archive-list";
import styles from "@/components/training/catalog.module.css";
import { getOwnProblemProgress } from "@/lib/data/problem-progress";

export const metadata: Metadata = { title: "Practice archive", description: "One searchable archive of published KAIZ tasks and original olympiad practice, contests and collections." };
const one = (value: string | string[] | undefined) => typeof value === "string" ? value.slice(0, 100) : "";
export default async function ProblemsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  // Fetch published tasks once; use the same view filters as external items.
  // No private attempts, fallback database rows or external imports are involved.
  const items = buildPracticeArchive(await listProblems());
  const filters: ArchiveFilters = {
    q: one(query.q) || one(query.practice), difficulty: one(query.difficulty) || one(query.level),
    source: one(query.source), type: one(query.type), tag: one(query.tag) || one(query.topic),
    availability: one(query.availability), competition: one(query.competition), direction: one(query.direction),
  };
  const personal = await getOwnProblemProgress(items.filter(item=>!item.external).map(item=>item.id.slice(8)));
  const myStatus = ["unattempted","attempted","solved"].includes(one(query.status)) ? one(query.status) : "";
  const byId = new Map(personal.items.map(item=>["problem:"+item.problem_id,item.status]));
  const filtered = filterPracticeArchive(items, filters);
  const visible = myStatus && personal.signedIn && !personal.error ? filtered.filter(item=>!item.external && (byId.get(item.id)??"unattempted")===myStatus) : filtered;
  const fields = [
    ["source", "Source", [...new Set(items.map(item => item.source))]],
    ["type", "Type", [...new Set(items.map(item => item.type))]],
    ["difficulty", "Difficulty", [...new Set(items.map(item => item.difficulty))]],
    ["tag", "Topic / tag", [...new Set(items.flatMap(item => item.tags))]],
    ["competition", "Competition", [...new Set(items.map(item => item.competition))]],
  ] as const;
  return <div className={styles.page}>
    <header className={styles.intro}><div><p>Practice / original sources</p><h1>Practice archive</h1><p>KAIZ tasks, external contests and collections. One list; clearly labelled sources and access.</p></div><Link className={styles.action} href="/roadmaps">Roadmaps</Link></header>
    <form method="get" className={styles.toolbar} aria-label="Archive filters">
      <label>Search<input name="q" aria-label="Search archive" defaultValue={filters.q} maxLength={100} placeholder="Title, source or topic" className={styles.control}/></label>
      {fields.map(([name, label, options]) => <label key={name}>{label}<select name={name} aria-label={label} defaultValue={filters[name]} className={styles.control}><option value="">All</option>{[...options].sort().map(value => <option key={value}>{value}</option>)}</select></label>)}
      <label>Availability<select name="availability" aria-label="Availability" defaultValue={filters.availability} className={styles.control}><option value="">All</option>{Object.entries(archiveAvailability).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {filters.direction && <input type="hidden" name="direction" value={filters.direction}/>}
      {personal.signedIn && !personal.error && <label>My status<select name="status" aria-label="My status" defaultValue={myStatus} className={styles.control}><option value="">All items</option><option value="unattempted">Unattempted tasks</option><option value="attempted">Attempted, not solved</option><option value="solved">Solved — Self-reported</option></select></label>}
      <button className={`${styles.action} ${styles.primary}`}>Apply filters</button>
    </form>
    <p className={styles.count}>{visible.length} of {items.length} items · {items.filter(item => !item.external).length} published KAIZ tasks{Object.values(filters).some(Boolean) && <> · <Link href="/problems" className="text-primary underline underline-offset-4">Clear filters</Link></>}</p>
    {personal.error ? <p role="alert" className={styles.note}>{personal.error} Personal filters are not applied. Refresh to retry.</p> : personal.signedIn && <p className={styles.note} aria-label="Personal task totals">{personal.attempted} attempted individual tasks · {personal.solved} solved — Self-reported · private account totals across published KAIZ tasks. <Link className="text-primary underline" href="/dashboard">My learning</Link>{myStatus && <> · <Link className="text-primary underline" href="/problems">Clear personal filter</Link></>}</p>}
    <ArchiveList items={visible} personal={personal.signedIn&&!personal.error?personal.items:undefined}/>
    <p className={styles.note}>External items are not KAIZ submissions. Source difficulty labels are retained; Unrated is not a difficulty estimate. Open “Source &amp; access” for provenance and requirements.</p>
  </div>;
}
