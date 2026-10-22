import type { Metadata } from "next";
import Link from "@/components/learning/learning-link";
import { learningMetadata } from "@/lib/learning/seo";
import { TopicCatalog } from "@/components/learning/topic-catalog";
import { sourceInventory } from "@/lib/learning/source-inventory";
import styles from "@/components/training/catalog.module.css";

export const dynamic = "error";
export const metadata: Metadata = { title: "AI Topics", description: "Browse source-backed AI olympiad topics, selected materials and Learning Tree connections.", ...learningMetadata("/learn/topics") };
export default function TopicsPage() {
  return <div className={styles.page}>
    <header className={styles.intro}><div><p>Learn / topic catalog</p><h1>AI Topics</h1><p>64 source entries, linked to the 85-topic Learning Tree. Expand a row for materials and subtopics.</p></div><nav className={styles.actions} aria-label="Learning routes"><Link href="/roadmaps" className={styles.action}>Roadmaps</Link><Link href="/learn" className={styles.action}>Learning Tree</Link></nav></header>
    <TopicCatalog/>
    <p className={styles.note}>Levels were not supplied; “—” is intentional. Materials are external, not full KAIZ lessons. Related-area matches do not certify technique-level coverage.</p>
    <a href={sourceInventory.source} target="_blank" rel="noopener noreferrer" className={styles.textAction}>Original topic sheet<span className="sr-only"> (new tab)</span></a>
  </div>;
}
