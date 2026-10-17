import type { Metadata } from "next";
import Link from "next/link";
import { RoadmapProgressList } from "@/components/learning/roadmap-progress-list";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import styles from "@/components/training/catalog.module.css";

export const metadata: Metadata = { title: "Start Your AI Olympiad Journey", description: "Choose a beginner, intermediate or advanced preparation roadmap with official learning resources, practice and olympiad discovery.", alternates: { canonical: "https://kaizpro.com/roadmaps" } };

export default async function StartPage() {
  const state = await getOwnLearningState();
  return <div className={styles.page}>
    <header className={styles.intro}><div><p>Preparation / roadmaps</p><h1>Start Your AI Olympiad Journey</h1><p>Choose a starting level. Four stages, selected materials and practical self-checks.</p></div></header>
    <h2 className="sr-only">Choose your starting point</h2><RoadmapProgressList records={state.records} signedIn={!!state.user} error={state.error}/>
    <p className={styles.note}>Opening a lesson does not complete it. Explicitly mark lessons completed to save progress; Learning XP is not a competitive rating.</p>
    <nav className={styles.actions} aria-label="Explore learning"><Link href="/learn/topics" className={styles.action}>AI Topics</Link><Link href="/learn" className={styles.action}>Learning Tree</Link><Link href="/problems" className={styles.action}>Practice archive</Link></nav>
  </div>;
}
