import Link from "next/link";
import { ArrowRight, BrainCircuit, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/section-heading";
import { UnavailablePanel } from "@/components/unavailable-panel";
import type { Problem } from "@/lib/data/problems";

export function CompetitionProblems({ problems, tasksUrl }: { problems: Problem[]; tasksUrl?: string }) {
  return <section className="border-t py-8">
    <SectionHeading eyebrow="Archive" title="Competition problems" href="/problems"/>
    {tasksUrl && <div className="mb-5"><a href={tasksUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground">Solve ↗ <span className="sr-only">Official tasks</span><ExternalLink className="size-4"/></a><p className="mt-2 text-xs text-muted-foreground">Official task source. Publisher account or registration requirements may apply.</p></div>}
    {problems.length ? <div className="border bg-card">{problems.map((problem) => <Link key={problem.id} href={`/problems/${problem.slug}`} className="group flex items-center gap-4 border-b px-4 py-4 last:border-b-0 hover:bg-muted/50 sm:px-5"><BrainCircuit className="size-4 shrink-0 text-primary"/><div className="min-w-0 flex-1"><p className="truncate font-semibold group-hover:text-primary">{problem.problem_code ? `${problem.problem_code} · ` : ""}{problem.title}</p><p className="mt-1 truncate text-sm text-muted-foreground">{problem.category} · {problem.metric_name}</p></div><Badge>{problem.difficulty_status}</Badge><ArrowRight className="size-4 shrink-0 text-muted-foreground"/></Link>)}</div> : <UnavailablePanel title="No archived problems yet" description="Published problems from this competition will appear here."/>}
  </section>;
}
