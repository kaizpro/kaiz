import type { Metadata } from "next";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompetitionRow } from "@/components/competition-row";
import { EmptyState } from "@/components/empty-state";
import { COMPETITION_CATEGORIES, COMPETITION_FORMATS, COMPETITION_STATUSES } from "@/lib/constants";
import { listCompetitions } from "@/lib/data/competitions";

export const metadata: Metadata = { title: "Competitions", description: "Verified AI, ML, algorithm, research and hackathon opportunities for students in Kazakhstan." };

function normalizeFilter(value: string | string[] | undefined, allowed: readonly string[]) {
  return typeof value === "string" && (value === "all" || allowed.includes(value)) ? value : "all";
}

export default async function CompetitionsPage({ searchParams }: { searchParams: Promise<{ status?: string | string[]; category?: string | string[]; format?: string | string[] }> }) {
  const query = await searchParams;
  const status = normalizeFilter(query.status, COMPETITION_STATUSES);
  const category = normalizeFilter(query.category, COMPETITION_CATEGORIES);
  const format = normalizeFilter(query.format, COMPETITION_FORMATS);
  const competitions = await listCompetitions(status, category, format);
  return <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
    <header className="flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row sm:items-end"><div><p className="micro-label text-primary">Compete</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Competition directory</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Verified AI, ML, research, algorithm and hackathon opportunities.</p></div><div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{competitions.length} listed</div></header>

    <form className="my-5 grid gap-3 border-b pb-5 sm:grid-cols-[1fr_1fr_1fr_auto]" method="get">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status<select name="status" defaultValue={status} className="mt-1.5 h-9 w-full rounded-[4px] border bg-background px-3 text-sm normal-case tracking-normal text-foreground"><option value="all">All statuses</option><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="completed">Completed</option></select></label>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category<select name="category" defaultValue={category} className="mt-1.5 h-9 w-full rounded-[4px] border bg-background px-3 text-sm normal-case tracking-normal text-foreground"><option value="all">All categories</option>{COMPETITION_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format<select name="format" defaultValue={format} className="mt-1.5 h-9 w-full rounded-[4px] border bg-background px-3 text-sm normal-case tracking-normal text-foreground"><option value="all">All formats</option><option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option></select></label>
      <Button className="self-end" size="sm"><Filter className="size-4"/>Apply</Button>
    </form>

    <div className="mb-3 hidden grid-cols-[minmax(0,1fr)_9rem_7rem_10rem_7rem] px-5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid"><span>Competition</span><span>Start date</span><span>Format</span><span>Location</span><span className="text-right">Status</span></div>
    {competitions.length ? <div className="border bg-card">{competitions.map((competition) => <CompetitionRow key={competition.id} competition={competition}/>)}</div> : <EmptyState title="No competitions match these filters" description="Try a broader filter or return when verified competitions have been published."/>}
    {(status !== "all" || category !== "all" || format !== "all") && <Button asChild variant="ghost" className="mt-4"><Link href="/competitions"><Search className="size-4"/>Clear filters</Link></Button>}
  </div>;
}
