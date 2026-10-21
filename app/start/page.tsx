import type { Metadata } from "next";
import Link from "next/link";
import { RoadmapProgressList } from "@/components/learning/roadmap-progress-list";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import styles from "@/components/training/catalog.module.css";

export const metadata: Metadata = { title: "AI Olympiad Roadmaps", description: "Beginner, Intermediate and Advanced AI olympiad preparation, with courses, practice and saved progress.", alternates: { canonical: "https://kaizpro.com/roadmaps" } };

export default async function StartPage() {
  const state = await getOwnLearningState();
  return <div className={styles.page}>
    <header className={styles.intro}><div><p>Preparation / roadmaps</p><h1>AI Olympiad Roadmaps</h1><p>Choose your level. Study, practise and save your progress.</p></div></header>
    <h2 className="sr-only">Choose your starting point</h2>
    <RoadmapProgressList records={state.records} signedIn={Boolean(state.user)} error={state.error}/>
    <nav className={styles.actions} aria-label="Explore learning"><Link href="/learn/topics" className={styles.action}>AI Topics</Link><Link href="/learn" className={styles.action}>Learning Tree</Link><Link href="/problems" className={styles.action}>Practice archive</Link></nav>
  </div>;
}
