import type { Metadata } from "next";
import Link from "next/link";
import { SourceTopicRow } from "@/components/learning/source-topic-row";
import { filterSourceTopics, sourceInventory, topicGroups } from "@/lib/learning/source-inventory";
import styles from "@/components/training/catalog.module.css";

export const metadata: Metadata = { title: "AI Topics", description: "Browse source-backed AI olympiad topics, selected materials and Learning Tree connections." };
export default async function TopicsPage({ searchParams }: { searchParams: Promise<{ q?: string; group?: string }> }) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.slice(0, 80) : "";
  const group = typeof raw.group === "string" && topicGroups.includes(raw.group) ? raw.group : "";
  const topics = filterSourceTopics(q, group);
  return <div className={styles.page}>
    <header className={styles.intro}><div><p>Learn / topic catalog</p><h1>AI Topics</h1><p>64 source entries, linked to the 85-topic Learning Tree. Expand a row for materials and subtopics.</p></div><nav className={styles.actions} aria-label="Learning routes"><Link href="/roadmaps" className={styles.action}>Roadmaps</Link><Link href="/learn" className={styles.action}>Learning Tree</Link></nav></header>
    <form method="get" className={styles.toolbar} aria-label="Topic filters"><label>Search topics<input name="q" aria-label="Search topics" defaultValue={q} maxLength={80} placeholder="Topic or technique" className={styles.control}/></label><label>Topic group<select name="group" aria-label="Topic group" defaultValue={group} className={styles.control}><option value="">All groups</option>{topicGroups.map(name => <option key={name}>{name}</option>)}</select></label><button className={`${styles.action} ${styles.primary}`}>Apply filters</button></form>
    <p className={styles.count}>{topics.length} source entries{(q || group) && <> · <Link href="/learn/topics" className="text-primary underline">Clear filters</Link></>}</p>
    {!topics.length && <p className={styles.note}>No topics match. Try another group or broader search.</p>}
    {topicGroups.map(name => {
      const entries = topics.filter(topic => topic.group === name);
      return entries.length ? <section key={name} aria-label={name}><h2 className={styles.sectionTitle}>{name} <span className="text-xs font-normal text-muted-foreground">{entries.length}</span></h2><div className={styles.rows}><div className={styles.topicHeader} aria-hidden="true"><span>Topic / expand</span><span>Level</span><span>Materials</span><span>Coverage</span></div>{entries.map(entry => <SourceTopicRow key={entry.id} entry={entry}/>)}</div></section> : null;
    })}
    <p className={styles.note}>Levels were not supplied; “—” is intentional. Materials are external, not full KAIZ lessons. Related-area matches do not certify technique-level coverage.</p>
    <a href={sourceInventory.source} target="_blank" rel="noopener noreferrer" className={styles.textAction}>Original topic sheet<span className="sr-only"> (new tab)</span></a>
  </div>;
}
