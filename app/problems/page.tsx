import type { Metadata } from "next";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ProblemRow } from "@/components/problem-row";
import { listProblems } from "@/lib/data/problems";

export const metadata: Metadata = {
  title: "Problem archive",
  description: "Browse AI olympiad problems with source-faithful metrics, difficulty context and performance statistics.",
};

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function ProblemsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; difficulty?: string | string[]; direction?: string | string[] }> }) {
  const query = await searchParams;
  const q = one(query.q).slice(0, 80);
  const difficulty = one(query.difficulty);
  const direction = one(query.direction);
  const problems = await listProblems({ query: q, difficulty, direction });
  const filtered = Boolean(q || difficulty || direction);
  return <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
    <header className="flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row sm:items-end"><div><p className="micro-label text-primary">Practice</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Problem archive</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">AI olympiad problems with their original metrics, provenance, difficulty state and performance context.</p></div><div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{problems.length} published</div></header>

    <form className="my-5 grid gap-3 border-b pb-5 sm:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]" method="get">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search<input name="q" defaultValue={q} maxLength={80} placeholder="Title or category" className="mt-1.5 h-9 w-full rounded-[4px] border bg-background px-3 text-sm normal-case tracking-normal text-foreground"/></label>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difficulty<select name="difficulty" defaultValue={difficulty} className="mt-1.5 h-9 w-full rounded-[4px] border bg-background px-3 text-sm normal-case tracking-normal text-foreground"><option value="">All states</option><option value="unrated">Unrated</option><option value="provisional">Provisional</option><option value="rated">Rated</option></select></label>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metric direction<select name="direction" defaultValue={direction} className="mt-1.5 h-9 w-full rounded-[4px] border bg-background px-3 text-sm normal-case tracking-normal text-foreground"><option value="">All directions</option><option value="higher_is_better">Higher is better</option><option value="lower_is_better">Lower is better</option></select></label>
      <Button className="self-end" size="sm"><Filter className="size-4"/>Apply</Button>
    </form>

    <div className="mb-3 hidden grid-cols-[minmax(0,1fr)_9rem_9rem_9rem] px-5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid"><span>Problem</span><span>Difficulty</span><span>Metric</span><span className="text-right">Statistics</span></div>
    {problems.length
      ? <div className="border bg-card">{problems.map((problem) => <ProblemRow key={problem.id} problem={problem}/>)}</div>
      : <EmptyState
          title={filtered ? "No problems match these filters" : "No problems published yet"}
          description={filtered ? "Try a broader search or clear the filters." : "Source-verified problems will appear after the archive migration is populated."}
        />}
    {filtered && <Button asChild variant="ghost" className="mt-4"><Link href="/problems"><Search className="size-4"/>Clear filters</Link></Button>}
  </div>;
}
