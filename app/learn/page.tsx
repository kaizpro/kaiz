import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LearningRoadmap } from "@/components/learning/learning-roadmap";
import styles from "@/components/learning/learning.module.css";
import { Button } from "@/components/ui/button";

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
        <div className="space-y-3"><span className={styles.availability}>Curriculum map <span aria-hidden="true">·</span> Selected external resources</span><nav className="flex flex-wrap gap-2" aria-label="Learning discovery"><Button asChild><Link href="/roadmaps">Choose a roadmap</Link></Button><Button asChild variant="outline"><Link href="/learn/topics">Explore AI topics</Link></Button></nav></div>
      </header>
      <Suspense fallback={<div className={styles.loading} role="status">Opening the learning tree…</div>}>
        <LearningRoadmap />
      </Suspense>
    </section>
  );
}
