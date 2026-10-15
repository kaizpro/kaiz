import type { Metadata } from "next";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ProblemRow } from "@/components/problem-row";
import { listProblems } from "@/lib/data/problems";
import { PracticeSources } from "@/components/learning/practice-sources";
import { PracticeCatalog } from "@/components/learning/practice-catalog";

export const metadata: Metadata = {
  title: "Problem archive",
  description: "Browse AI olympiad problems with source-faithful metrics, difficulty context and performance statistics.",
};

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function ProblemsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const q = one(query.q).slice(0, 80);
  const difficulty = one(query.difficulty);
  const direction = one(query.direction);
  const problems = await listProblems({ query: q, difficulty, direction });
  const filtered = Boolean(q || difficulty || direction);
  return <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
    <header className="flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row sm:items-end"><div><p className="micro-label text-primary">Practice</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Problem archive</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">AI olympiad problems with their original metrics, provenance, difficulty state and performance context.</p></div><div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{problems.length} published</div></header>

    <form className="my-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3 border-b pb-5" method="get">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search<input name="q" defaultValue={q} maxLength={80} placeholder="Title or category" className="mt-1.5 min-h-11 min-w-0 w-full rounded-[4px] border bg-background px-3 text-sm normal-case tracking-normal text-foreground"/></label>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difficulty<select name="difficulty" defaultValue={difficulty} className="mt-1.5 min-h-11 min-w-0 w-full rounded-[4px] border bg-background px-3 text-sm normal-case tracking-normal text-foreground"><option value="">All states</option><option value="unrated">Unrated</option><option value="provisional">Provisional</option><option value="rated">Rated</option></select></label>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metric direction<select name="direction" defaultValue={direction} className="mt-1.5 min-h-11 min-w-0 w-full rounded-[4px] border bg-background px-3 text-sm normal-case tracking-normal text-foreground"><option value="">All directions</option><option value="higher_is_better">Higher is better</option><option value="lower_is_better">Lower is better</option></select></label>
      <Button className="h-auto min-h-11 self-end" size="sm"><Filter className="size-4"/>Apply</Button>
    </form>

    {problems.length
      ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{problems.map((problem) => <ProblemRow key={problem.id} problem={problem}/>)}</div>
      : <EmptyState
          title={filtered ? "No problems match these filters" : "No problems published yet"}
          description={filtered ? "Try a broader search or clear the filters." : "Reviewed tasks have not been published yet. Try the original-source exercises below or continue with your learning roadmap."}
        />}
    {!problems.length && <PracticeSources/>}
    {filtered && <Button asChild variant="ghost" className="mt-4"><Link href="/problems"><Search className="size-4"/>Clear filters</Link></Button>}
    <PracticeCatalog filters={{ search: one(query.practice).slice(0, 80), level: one(query.level), topic: one(query.topic), competition: one(query.competition), source: one(query.source), type: one(query.type) }}/>
  </div>;
}
