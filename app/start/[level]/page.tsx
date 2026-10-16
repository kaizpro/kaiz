import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getJourney, journeys } from "@/lib/learning/journeys";
import { JourneyCompetitions } from "@/components/learning/journey-competitions";
import { PracticeSources } from "@/components/learning/practice-sources";
import { BeginnerSourcePlan } from "@/components/learning/beginner-source-plan";
import styles from "@/components/training/catalog.module.css";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import { CourseProgress } from "@/components/learning/course-progress";
import { CourseModules } from "@/components/learning/course-modules";

type Props = { params: Promise<{ level: string }> };
export function generateStaticParams() { return journeys.map(path => ({ level: path.level })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = getJourney((await params).level);
  return path ? { title: `${path.title} AI Olympiad Roadmap`, description: path.summary, alternates: { canonical: `https://kaizpro.com/roadmaps/${path.level}` } } : { title: "Roadmap not found" };
}
export default async function JourneyPage({ params }: Props) {
  const path = getJourney((await params).level);
  if (!path) notFound();
  const learning = await getOwnLearningState();
  const practiceHref = path.practiceQuery ? `/problems?${new URLSearchParams({ q: path.practiceQuery })}` : "/problems";
  return <div className={styles.page}>
    <Link href="/roadmaps" className={styles.textAction}>Choose another level</Link>
    <header className={styles.intro}><div><p>Roadmaps / {path.title}</p><h1>{path.title} AI Olympiad Roadmap</h1><p>{path.audience}</p></div><nav className={styles.actions} aria-label="Roadmap shortcuts"><Link href="/learn/topics" className={styles.action}>AI Topics</Link><Link href={practiceHref} className={styles.action}>Practice</Link></nav></header>
    <p className="max-w-3xl text-sm leading-6"><span className="font-semibold">Goal: </span>{path.outcome}</p>
    <CourseProgress path={path} records={learning.records} signedIn={Boolean(learning.user)} error={learning.error}/>
    <div className={styles.stageLayout}>
      <CourseModules path={path} records={learning.error ? [] : learning.records} canSave={Boolean(learning.user) && !learning.error}/>
      <aside className="min-w-0 space-y-5">
        <section><h2 className="text-sm font-bold">Next action</h2><p className={styles.note}>Open a topic, study one material, then try its self-check.</p><Link href={`/learn/${path.steps[0].topics[0]}`} className={`${styles.action} ${styles.primary}`}>First topic</Link></section>
        <section><h2 className="text-sm font-bold">Olympiad editions</h2><Suspense fallback={<p role="status" className={styles.note}>Loading editions…</p>}><JourneyCompetitions slugs={path.competitionSlugs}/></Suspense><Link href="/competitions" className={styles.textAction}>All competitions</Link></section>
        <PracticeSources level={path.level}/>
        <nav className={styles.actions} aria-label="Keep preparing"><Link href={practiceHref} className={styles.textAction}>Practice archive</Link><Link href="/discussions?category=help" className={styles.textAction}>Ask a question</Link></nav>
      </aside>
    </div>
    {path.level === "beginner" && <BeginnerSourcePlan/>}
  </div>;
}
