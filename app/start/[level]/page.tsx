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
import { ResourceCard } from "@/components/learning/resource-card";
import { BeginnerSourcePlan } from "@/components/learning/beginner-source-plan";

type Props = { params: Promise<{ level: string }> };
export function generateStaticParams() { return journeys.map(path => ({ level: path.level })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = getJourney((await params).level);
  return path ? { title: `${path.title} AI Olympiad Roadmap`, description: path.summary, alternates: { canonical: `https://kaizpro.com/roadmaps/${path.level}` } } : { title: "Roadmap not found" };
}

export default async function JourneyPage({ params }: Props) {
  const path = getJourney((await params).level);
  if (!path) notFound();
  // Link only editions actually present in the public database. Research drafts
  // are not internal routes and are never substituted for hosted records.
  const practiceHref = path.practiceQuery ? `/problems?${new URLSearchParams({ q: path.practiceQuery })}` : "/problems";
  return <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/roadmaps" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" aria-hidden="true"/>Choose another level</Link>
    <header className="max-w-3xl border-b pb-7"><p className="micro-label text-primary">{path.title} / Curated roadmap</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{path.title} AI Olympiad Roadmap</h1><p className="mt-3 text-base leading-7 text-muted-foreground">{path.summary}</p><p className="mt-4 text-sm leading-6"><span className="font-semibold">Your goal: </span>{path.outcome}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Go at your own pace. Self-checks do not save progress or award credentials.</p></header>
    <div className="grid gap-8 py-7 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <ol className="min-w-0 space-y-8" aria-label="Ordered roadmap stages">{path.steps.map((step, index) => {
        const topics = step.topics.map(id => getTopicBySlug(id)).filter(topic => topic !== undefined);
        const resources = [...new Map(topics.flatMap(topic => topic.resources).map(resource => [resource.href, resource])).values()];
        return <li key={step.title} className="border-b pb-7 last:border-b-0"><p className="micro-label text-primary">Stage {index + 1} / {path.steps.length}</p><h2 className="mt-2 text-xl font-bold">{step.title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{step.goal}</p>
          <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-2">{topics.map(topic => <li key={topic.id}><Link href={`/learn/${topic.slug}`} className="flex min-h-11 items-center justify-between gap-3 border bg-card px-3 py-3 text-sm font-semibold hover:border-primary/50"><span className="min-w-0 [overflow-wrap:anywhere]">{topic.title}</span><ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden="true"/></Link></li>)}</ul>
          {resources.length > 0 && <div className="mt-5"><h3 className="micro-label text-muted-foreground">Selected learning materials / external</h3><div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3">{resources.map(resource => <ResourceCard key={resource.href} resource={resource}/>)}</div></div>}
          <div className="mt-4 border-l-2 border-gold/60 bg-muted/30 px-4 py-3"><h3 className="micro-label text-muted-foreground">Milestone / self-check</h3><p className="mt-2 text-sm leading-6">{step.milestone}</p></div>
          <Link href={roadmapForNode(step.topics[0])} className="mt-3 inline-block text-xs font-semibold text-primary underline underline-offset-4">Locate this stage in the Learning Tree</Link>
        </li>;
      })}</ol>
      <aside className="min-w-0 space-y-7">
        <PracticeSources level={path.level}/>
        <section className="border bg-card p-4"><h2 className="font-bold">Explore the topic inventory</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Browse the 64 source-listed topics and see how they connect to the existing Learning Tree. A related area is not a complete lesson.</p><Button asChild variant="outline" className="mt-4 h-auto min-h-10 w-full whitespace-normal"><Link href="/learn/topics">Explore AI topics</Link></Button></section>
        <section className="border bg-card p-4"><h2 className="font-bold">Put it into practice</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Browse published tasks with their original sources. If none match yet, start with the local exercises in the stage self-checks.</p><Button asChild variant="outline" className="mt-4 w-full"><Link href={practiceHref}>Open problem archive</Link></Button></section>
        <section><h2 className="font-bold">Explore olympiad editions</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Study the format and official information. Past editions are not open registrations; check eligibility and current selection rules with the organizer.</p><Suspense fallback={<p className="mt-3 text-sm text-muted-foreground" role="status">Loading competition editions…</p>}><JourneyCompetitions slugs={path.competitionSlugs}/></Suspense><Link href="/competitions" className="mt-3 inline-block text-sm text-primary underline underline-offset-4">Browse all competitions</Link></section>
        <section className="border-t pt-5"><h2 className="font-bold">You do not have to learn alone</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Ask about a topic, explain what you tried, or share a useful source. Sign in when you are ready to post or reply.</p><Link href="/discussions?category=help" className="mt-3 inline-block text-sm text-primary underline underline-offset-4">Open community questions</Link></section>
      </aside>
    </div>
    {path.level === "beginner" && <BeginnerSourcePlan/>}
    <section className="mt-5 border-t pt-5"><h2 className="text-lg font-bold">Your next action</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Start with the first topic you cannot yet explain, open one material, and attempt its self-check. Return here whenever you want to choose another stage.</p><Button asChild className="mt-4 h-auto min-h-11 whitespace-normal"><Link href={`/learn/${path.steps[0].topics[0]}`}>Open the first topic</Link></Button></section>
  </div>;
}
