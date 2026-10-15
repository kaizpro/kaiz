import type { Metadata } from "next";
import Link from "next/link";
import { listProblems } from "@/lib/data/problems";
import { buildPracticeArchive, filterPracticeArchive, archiveAvailability, type ArchiveFilters } from "@/lib/learning/unified-archive";
import { ArchiveList } from "@/components/learning/archive-list";
import styles from "@/components/training/catalog.module.css";

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
  const visible = filterPracticeArchive(items, filters);
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
      <button className={`${styles.action} ${styles.primary}`}>Apply filters</button>
    </form>
    <p className={styles.count}>{visible.length} of {items.length} items · {items.filter(item => !item.external).length} published KAIZ tasks{Object.values(filters).some(Boolean) && <> · <Link href="/problems" className="text-primary underline underline-offset-4">Clear filters</Link></>}</p>
    <ArchiveList items={visible}/>
    <p className={styles.note}>External items are not KAIZ submissions. Source difficulty labels are retained; Unrated is not a difficulty estimate. Open “Source &amp; access” for provenance and requirements.</p>
  </div>;
}
