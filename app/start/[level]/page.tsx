import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getJourney, journeys } from "@/lib/learning/journeys";
import { getTopicBySlug } from "@/lib/learning/curriculum";
import { roadmapForNode } from "@/lib/learning/navigation";
import { JourneyCompetitions } from "@/components/learning/journey-competitions";
import { PracticeSources } from "@/components/learning/practice-sources";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ level: string }> };
export function generateStaticParams() { return journeys.map(path => ({ level: path.level })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = getJourney((await params).level);
  return path ? { title: `${path.title} AI Olympiad Roadmap`, description: path.summary } : { title: "Roadmap not found" };
}

export default async function JourneyPage({ params }: Props) {
  const path = getJourney((await params).level);
  if (!path) notFound();
  // Link only editions actually present in the public database. Research drafts
  // are not internal routes and are never substituted for hosted records.
  const practiceHref = path.practiceQuery ? `/problems?${new URLSearchParams({ q: path.practiceQuery })}` : "/problems";
  return <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/start" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" aria-hidden="true"/>Choose another level</Link>
    <header className="max-w-3xl border-b pb-7"><p className="micro-label text-primary">{path.title} / Curated roadmap</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{path.title} AI Olympiad Roadmap</h1><p className="mt-3 text-base leading-7 text-muted-foreground">{path.summary}</p><p className="mt-4 text-sm leading-6"><span className="font-semibold">Your goal: </span>{path.outcome}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Go at your own pace. Self-checks do not save progress or award credentials.</p></header>
    <div className="grid gap-8 py-7 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <ol className="min-w-0 space-y-8" aria-label="Ordered roadmap stages">{path.steps.map((step, index) => {
        const topics = step.topics.map(id => getTopicBySlug(id)).filter(topic => topic !== undefined);
        const resources = [...new Map(topics.flatMap(topic => topic.resources).map(resource => [resource.href, resource])).values()];
        return <li key={step.title} className="border-b pb-7 last:border-b-0"><p className="micro-label text-primary">Stage {index + 1} / {path.steps.length}</p><h2 className="mt-2 text-xl font-bold">{step.title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{step.goal}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">{topics.map(topic => <li key={topic.id}><Link href={`/learn/${topic.slug}`} className="flex min-h-11 items-center justify-between gap-3 border bg-card px-3 py-3 text-sm font-semibold hover:border-primary/50"><span>{topic.title}</span><ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden="true"/></Link></li>)}</ul>
          {resources.length > 0 && <div className="mt-4"><h3 className="micro-label text-muted-foreground">Official resources / external</h3><ul className="mt-2 space-y-2">{resources.map(resource => <li key={resource.href}><a href={resource.href} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-primary underline underline-offset-4">{resource.title}<span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></div>}
          <div className="mt-4 border-l-2 border-gold/60 bg-muted/30 px-4 py-3"><h3 className="micro-label text-muted-foreground">Milestone / self-check</h3><p className="mt-2 text-sm leading-6">{step.milestone}</p></div>
          <Link href={roadmapForNode(step.topics[0])} className="mt-3 inline-block text-xs font-semibold text-primary underline underline-offset-4">Locate this stage in the Learning Tree</Link>
        </li>;
      })}</ol>
      <aside className="min-w-0 space-y-7">
        <PracticeSources level={path.level}/>
        <section className="border bg-card p-4"><h2 className="font-bold">Put it into practice</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Browse published tasks with their original sources. If none match yet, start with the local exercises in the stage self-checks.</p><Button asChild variant="outline" className="mt-4 w-full"><Link href={practiceHref}>Open problem archive</Link></Button></section>
        <section><h2 className="font-bold">Explore olympiad editions</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Study the format and official information. Past editions are not open registrations; check eligibility and current selection rules with the organizer.</p><Suspense fallback={<p className="mt-3 text-sm text-muted-foreground" role="status">Loading competition editions…</p>}><JourneyCompetitions slugs={path.competitionSlugs}/></Suspense><Link href="/competitions" className="mt-3 inline-block text-sm text-primary underline underline-offset-4">Browse all competitions</Link></section>
        <section className="border-t pt-5"><h2 className="font-bold">You do not have to learn alone</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Ask about a topic, explain what you tried, or share a useful source. Sign in when you are ready to post or reply.</p><Link href="/discussions?category=help" className="mt-3 inline-block text-sm text-primary underline underline-offset-4">Open community questions</Link></section>
      </aside>
    </div>
  </div>;
}
