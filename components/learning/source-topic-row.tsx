import Link from "next/link";
import { getTopicBySlug, type LearningResource } from "@/lib/learning/curriculum";
import { journeysForTopic } from "@/lib/learning/journeys";
import { sourceTopics } from "@/lib/learning/source-inventory";
import { ResourceCard } from "@/components/learning/resource-card";
import styles from "@/components/training/catalog.module.css";

export function SourceTopicRow({ entry }: { entry: (typeof sourceTopics)[number] }) {
  const matches = entry.topicIds.map(getTopicBySlug).filter(topic => topic !== undefined);
  const sourceMaterials: LearningResource[] = entry.resources.map(resource => ({
    id: resource.cell, title: resource.title, href: resource.url, kind: resource.url.includes("youtube") ? "video" : "course",
    description: "Original topic-sheet selection; module labels preserved.", provenance: `Topics!${resource.cell}`,
    account: resource.url.includes("kaggle") ? "Kaggle account required for exercises" : resource.url.includes("stepik") ? "Provider account may be required" : "Public video; regional access may vary",
    availability: resource.url.includes("stepik") ? "unavailable" : "available",
  }));
  const materials = [...new Map([...sourceMaterials, ...matches.flatMap(topic => topic.resources)].map(resource => [resource.href, resource])).values()];
  const paths = [...new Map(entry.topicIds.flatMap(journeysForTopic).map(path => [path.level, path])).values()];
  const coverage = entry.match === "direct" ? "Tree match" : entry.match === "broader" ? "Related area" : "Awaiting content";
  return <details className={styles.topic}>
    <summary className={styles.topicSummary}><h3 className={styles.rowTitle}>{entry.title}</h3><span className="text-muted-foreground" aria-label="Level not supplied">—</span><span>{materials.length} materials</span><span className="text-muted-foreground">{coverage}</span></summary>
    <div className={styles.topicBody}>
      <p className={styles.meta}>{entry.group} · {entry.mode} · Topics!{entry.cell}{entry.match === "broader" && " · Broader match, not dedicated coverage"}</p>
      {matches.length > 0 && <nav className={styles.chips} aria-label={`Tree topics for ${entry.title}`}>{matches.map(topic => <Link key={topic.id} href={`/learn/${topic.slug}`} className={styles.textAction}>{topic.title}</Link>)}</nav>}
      {materials.length ? <div aria-label={`Materials for ${entry.title}`}>{materials.map(resource => <ResourceCard key={resource.href} resource={resource}/>)}</div> : <p className={styles.note}>No selected material yet. This is not a full KAIZ lesson.</p>}
      <nav className={styles.chips} aria-label={`Continue from ${entry.title}`}>{paths.map(path => <Link key={path.level} href={`/roadmaps/${path.level}`} className={styles.textAction}>{path.title} roadmap</Link>)}<Link href="/problems" className={styles.textAction}>Practice archive</Link></nav>
    </div>
  </details>;
}
