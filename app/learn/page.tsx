import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LearningRoadmap } from "@/components/learning/learning-roadmap";
import styles from "@/components/learning/learning.module.css";
import catalog from "@/components/training/catalog.module.css";

export const metadata: Metadata = {
  title: "Learning Tree",
  description: "Explore the coding, AI and mathematics foundations for your next idea. An open curriculum roadmap from KAIZ.",
};

export default function Page() {
  return (
    <section className={styles.page} aria-labelledby="learning-title">
      <a className={styles.skip} href="#roadmap">Skip to learning tree</a>
      <header className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>LEARN / FOUNDATIONS</p>
          <h1 id="learning-title">Learning Tree</h1>
          <p>85 connected topics in coding, AI and mathematics.</p>
        </div>
        <nav className={catalog.actions} aria-label="Learning discovery"><Link href="/roadmaps" className={catalog.action}>Roadmaps</Link><Link href="/learn/topics" className={catalog.action}>AI Topics</Link><Link href="/problems" className={catalog.action}>Practice</Link></nav>
      </header>
      <Suspense fallback={<div className={styles.loading} role="status">Opening the learning tree…</div>}>
        <LearningRoadmap />
      </Suspense>
    </section>
  );
}
