import Link from "next/link";
import { ArrowRight, BrainCircuit, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/section-heading";
import { UnavailablePanel } from "@/components/unavailable-panel";
import type { Problem } from "@/lib/data/problems";
import product from "./product/product.module.css";
import styles from "./product/competitions.module.css";

export function CompetitionProblems({ problems, tasksUrl }: { problems: Problem[]; tasksUrl?: string }) {
  return <section className="border-t py-8">
    <SectionHeading eyebrow="Archive" title="Competition problems" href="/problems"/>
    {tasksUrl && <div className="mb-5"><a href={tasksUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground">Solve ↗ <span className="sr-only">Official tasks</span><ExternalLink className="size-4"/></a><p className="mt-2 text-xs text-muted-foreground">Official task source. Publisher account or registration requirements may apply.</p></div>}
    {problems.length ? <div className={product.list}>{problems.map((problem) => <Link key={problem.id} href={`/problems/${problem.slug}`} className={`${product.card} ${styles.task}`}><BrainCircuit className="size-5 text-primary" aria-hidden="true"/><div className="min-w-0"><h3>{problem.problem_code ? `${problem.problem_code} · ` : ""}{problem.title}</h3><p className={product.meta}>{problem.category} · {problem.metric_name} <Badge>{problem.difficulty_status}</Badge></p></div><ArrowRight className="size-5 text-primary" aria-hidden="true"/></Link>)}</div> : <UnavailablePanel title="No archived problems yet" description="Published problems from this competition will appear here."/>}
  </section>;
}
