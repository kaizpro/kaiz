import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResourceCard } from "@/components/learning/resource-card";
import { filterSourceTopics, sourceInventory, topicGroups } from "@/lib/learning/source-inventory";
import { getTopicBySlug } from "@/lib/learning/curriculum";
import { journeysForTopic } from "@/lib/learning/journeys";

export const metadata: Metadata = { title: "AI Topics", description: "Explore 64 source-listed AI olympiad topics, their links to KAIZ's Learning Tree, selected external materials and honest content gaps." };
type Query = { q?: string; group?: string };
export default async function TopicsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.slice(0, 80) : "";
  const group = typeof raw.group === "string" && topicGroups.includes(raw.group) ? raw.group : "";
  const topics = filterSourceTopics(q, group);
  return <div className="mx-auto max-w-[1200px] px-4 py-9 sm:px-6 lg:px-8">
    <header className="max-w-3xl"><p className="micro-label text-primary">Learn / source-backed inventory</p><h1 className="mt-3 text-3xl font-black tracking-tight">AI Topics</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">64 entries from the AI Olympiad topic sheet, in its original groups and order. The existing Learning Tree has 85 topics; this is a coverage view, not a second curriculum. Theory/practice labels are not difficulty ratings.</p><p className="mt-2 text-xs leading-6 text-muted-foreground">Selected resources are external. Topic landings are not full KAIZ lessons. Broader matches do not mean every listed technique has teaching materials.</p><nav className="mt-4 flex flex-wrap gap-2" aria-label="Learning routes"><Button asChild variant="outline"><Link href="/roadmaps">Choose a roadmap</Link></Button><Button asChild variant="outline"><Link href="/learn">Learning Tree</Link></Button></nav></header>
    <form method="get" className="my-6 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><label className="text-sm font-medium">Search topics<input name="q" defaultValue={q} maxLength={80} placeholder="Try tensors, NLP or clustering" className="mt-2 min-h-11 w-full min-w-0 rounded-[4px] border bg-background px-3 text-sm"/></label><label className="text-sm font-medium">Topic group<select name="group" defaultValue={group} className="mt-2 min-h-11 w-full min-w-0 rounded-[4px] border bg-background px-3 text-sm"><option value="">All groups</option>{topicGroups.map(name => <option key={name}>{name}</option>)}</select></label><Button>Apply filters</Button></form>
    <p className="mb-4 text-sm text-muted-foreground">{topics.length} source entries{(q || group) && <> · <Link href="/learn/topics" className="text-primary underline">Clear filters</Link></>}</p>
    {!topics.length && <p className="border p-6 text-sm text-muted-foreground">No source topics match. Try another group or a broader search.</p>}
    {topicGroups.map(name => {
      const entries = topics.filter(topic => topic.group === name);
      if (!entries.length) return null;
      return <section key={name} className="mb-8" aria-label={name}><h2 className="mb-4 border-b pb-3 text-xl font-bold">{name}</h2><div className="grid gap-3 md:grid-cols-2">{entries.map(entry => {
        const matches = entry.topicIds.map(getTopicBySlug).filter(t => t !== undefined);
        const materials = [...new Map(matches.flatMap(t => t.resources).map(r => [r.href, r])).values()];
        const paths = [...new Map(entry.topicIds.flatMap(journeysForTopic).map(p => [p.level, p])).values()];
        return <article key={entry.id} className="min-w-0 rounded-[5px] border bg-card p-4"><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{entry.mode}</span><span>Source: {sourceInventory.worksheet}!{entry.cell}</span><span>{entry.match === "direct" ? "Matched tree topic" : entry.match === "broader" ? "Broader area only" : "No dedicated tree topic"}</span></div><h3 className="mt-2 text-base font-bold leading-6">{entry.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{materials.length ? "Related area has selected external resources · no full KAIZ lesson" : "Awaiting learning content · no full KAIZ lesson"}</p>
          <div className="mt-3 flex flex-wrap gap-2">{matches.map(topic => <Button key={topic.id} asChild size="sm" variant="outline" className="h-auto min-h-10 whitespace-normal"><Link href={`/learn/${topic.slug}`}>Explore {topic.title}</Link></Button>)}</div>
          {entry.resources.length > 0 && <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Resources attached in the source ({entry.resources.length})</summary><div className="mt-3 space-y-3">{entry.resources.map(r => <ResourceCard key={r.cell} resource={{ id: r.cell, title: r.title, href: r.url, kind: r.url.includes("youtube") ? "video" : r.url.includes("kaggle") ? "course" : "course", description: "Original topic-sheet selection; module labels are preserved from the source.", provenance: `Topics!${r.cell}`, account: r.url.includes("kaggle") ? "Kaggle account required for interactive exercises" : r.url.includes("stepik") ? "Provider account may be required" : "Public video; regional access may vary", availability: r.url.includes("stepik") ? "unavailable" : "available" }}/>)}</div></details>}
          <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs" aria-label={`Continue from ${entry.title}`}>{paths.map(p => <Link key={p.level} href={`/roadmaps/${p.level}`} className="inline-flex min-h-10 items-center font-semibold text-primary underline underline-offset-4">{p.title} roadmap</Link>)}<Link href="/problems#practice-sources" className="inline-flex min-h-10 items-center text-primary underline underline-offset-4">Explore external practice</Link></nav>
        </article>;
      })}</div></section>;
    })}
    <a href={sourceInventory.source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4">Original topic sheet · checked October 15, 2026<span className="sr-only"> (new tab)</span></a>
  </div>;
}
