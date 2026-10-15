import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getJourney, journeys } from "@/lib/learning/journeys";
import { getTopicBySlug } from "@/lib/learning/curriculum";
import { roadmapForNode } from "@/lib/learning/navigation";
import { JourneyCompetitions } from "@/components/learning/journey-competitions";
import { PracticeSources } from "@/components/learning/practice-sources";
import { ResourceCard } from "@/components/learning/resource-card";
import { BeginnerSourcePlan } from "@/components/learning/beginner-source-plan";
import styles from "@/components/training/catalog.module.css";

type Props = { params: Promise<{ level: string }> };
export function generateStaticParams() { return journeys.map(path => ({ level: path.level })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = getJourney((await params).level);
  return path ? { title: `${path.title} AI Olympiad Roadmap`, description: path.summary, alternates: { canonical: `https://kaizpro.com/roadmaps/${path.level}` } } : { title: "Roadmap not found" };
}
export default async function JourneyPage({ params }: Props) {
  const path = getJourney((await params).level);
  if (!path) notFound();
  const practiceHref = path.practiceQuery ? `/problems?${new URLSearchParams({ q: path.practiceQuery })}` : "/problems";
  return <div className={styles.page}>
    <Link href="/roadmaps" className={styles.textAction}>Choose another level</Link>
    <header className={styles.intro}><div><p>Roadmaps / {path.title}</p><h1>{path.title} AI Olympiad Roadmap</h1><p>{path.audience}</p></div><nav className={styles.actions} aria-label="Roadmap shortcuts"><Link href="/learn/topics" className={styles.action}>AI Topics</Link><Link href={practiceHref} className={styles.action}>Practice</Link></nav></header>
    <p className="max-w-3xl text-sm leading-6"><span className="font-semibold">Goal: </span>{path.outcome}</p>
    <p className={styles.note}>Four suggested stages. Self-checks do not save progress or award credentials.</p>
    <div className={styles.stageLayout}>
      <ol className={styles.steps} aria-label="Ordered roadmap stages">{path.steps.map((step, index) => {
        const topics = step.topics.map(getTopicBySlug).filter(topic => topic !== undefined);
        const resources = [...new Map(topics.flatMap(topic => topic.resources).map(resource => [resource.href, resource])).values()];
        return <li key={step.title} className={styles.stage}>
          <h2>{step.title}</h2>
          <nav className={styles.chips} aria-label={`Stage ${index + 1} topics`}>{topics.map(topic => <Link key={topic.id} href={`/learn/${topic.slug}`} className={styles.textAction}>{topic.title}</Link>)}</nav>
          <details><summary>Goals &amp; self-check</summary><p className="text-muted-foreground">{step.goal}</p><h3 className="mt-2 text-xs font-semibold">Milestone / self-check</h3><p>{step.milestone}</p></details>
          {resources.length > 0 && <details open={index === 0}><summary>Materials · {resources.length}</summary><div>{resources.map(resource => <ResourceCard key={resource.href} resource={resource}/>)}</div></details>}
          <Link href={roadmapForNode(step.topics[0])} className={styles.textAction}>Learning Tree</Link>
        </li>;
      })}</ol>
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
