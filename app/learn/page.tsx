import type { Metadata } from "next";
import { Suspense } from "react";
import { LearningRoadmap } from "@/components/learning/learning-roadmap";
import styles from "@/components/learning/learning.module.css";

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
          <p className={styles.eyebrow}>LEARN / EXPLORE / CONNECT</p>
          <h1 id="learning-title">A map for your next idea.</h1>
          <p>Find the foundations. Follow your curiosity. Build something that matters.</p>
        </div>
        <span className={styles.availability}>Curriculum map <span aria-hidden="true">·</span> Materials coming soon</span>
      </header>
      <Suspense fallback={<div className={styles.loading} role="status">Opening the learning tree…</div>}>
        <LearningRoadmap />
      </Suspense>
    </section>
  );
}
