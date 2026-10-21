import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getJourney, journeys } from "@/lib/learning/journeys";
import { readArea } from "@/lib/learning/ioai-navigation";
import { classicNext } from "@/lib/learning/classic-roadmap";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import { CourseProgress } from "@/components/learning/course-progress";
import { CourseModules } from "@/components/learning/course-modules";
import { IoaiOverview } from "@/components/learning/ioai-overview";
import { JourneyCompetitions } from "@/components/learning/journey-competitions";
import { PracticeSources } from "@/components/learning/practice-sources";
import { ProgressUnavailable } from "@/components/learning/progress-unavailable";
import styles from "@/components/training/catalog.module.css";

type Props = { params: Promise<{ level: string }>; searchParams?: Promise<{ area?: string | string[]; view?: string | string[] }> };
export function generateStaticParams() { return journeys.map(path => ({ level: path.level })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = getJourney((await params).level);
  return path ? { title: `${path.title} AI Olympiad Roadmap`, description: path.summary, alternates: { canonical: `https://kaizpro.com/roadmaps/${path.level}` } } : { title: "Roadmap not found" };
}
export default async function JourneyPage({ params, searchParams }: Props) {
  const path = getJourney((await params).level);
  if (!path) notFound();
  const query = await searchParams, area = readArea(query?.area), map = query?.view === "map";
  const state = await getOwnLearningState(), ready = Boolean(state.user) && !state.error;
  const recommendation = classicNext(path, state.records, ready);
  const practiceHref = path.practiceQuery ? `/problems?${new URLSearchParams({q: path.practiceQuery})}` : "/problems";
  const action = recommendation.next ? <Link className={`${styles.action} ${styles.primary}`} data-classic-next href={recommendation.next.href}>{recommendation.continuing ? "Continue learning" : "Start learning"} · {recommendation.next.title}</Link> : <p className={styles.note}>{path.level === "beginner" ? "Core sequence complete. Review lessons or explore optional study below." : "All lessons complete. Review or undo any completion below."}</p>;
  return <div className={styles.page}>
    <Link href="/roadmaps" className={styles.textAction}>Choose another level</Link>
    <header className={styles.intro}><div><p>Roadmaps / {path.title}</p><h1>{map ? `${path.title} Skill Atlas` : `${path.title} AI Olympiad Roadmap`}</h1><p>{path.audience}</p></div><nav className={styles.actions} aria-label="Roadmap shortcuts"><Link href="/learn/topics" className={styles.action}>AI Topics</Link><Link href={practiceHref} className={styles.action}>Practice</Link></nav></header>
    <nav className={styles.actions} aria-label="Starting profile">{journeys.map(profile => <Link key={profile.level} className={styles.textAction} href={`/roadmaps/${profile.level}`} aria-current={profile.level === path.level ? "page" : undefined}>{profile.title}</Link>)}<Link className={styles.action} href={`/roadmaps/${path.level}${map ? "" : "?view=map"}`}>{map ? "Back to roadmap" : "Explore Skill Atlas"}</Link></nav>
    {map ? <>{state.error && <ProgressUnavailable message={state.error}/>}<IoaiOverview profile={path.level} area={area} records={state.records} canSave={ready}/></> : <>
      <CourseProgress path={path} records={state.records} signedIn={Boolean(state.user)} error={state.error} action={action}/>
      {area && <details className="my-3 text-sm"><summary className={styles.textAction}>Linked course contents</summary><IoaiOverview profile={path.level} area={area} course records={state.records} canSave={ready}/></details>}
      <div className={styles.stageLayout}>
        <CourseModules path={path} records={state.error ? [] : state.records} canSave={ready}/>
        <aside className="min-w-0 space-y-4">
          <p className={styles.note}>{path.outcome}</p>
          <section><h2 className="text-sm font-bold">Olympiad editions</h2><Suspense fallback={<p role="status" className={styles.note}>Loading editions…</p>}><JourneyCompetitions slugs={path.competitionSlugs}/></Suspense><Link href="/competitions" className={styles.textAction}>All competitions</Link></section>
          <details><summary className={styles.textAction}>Practice sources</summary><PracticeSources level={path.level}/></details>
          <Link href="/discussions?category=help" className={styles.textAction}>Ask a question</Link>
        </aside>
      </div>
    </>}
  </div>;
}
