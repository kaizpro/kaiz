import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpRight, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Problem } from "@/lib/data/problems";

function difficultyLabel(problem: Problem) {
  if (problem.difficulty_status === "rated" && problem.difficulty_rating !== null) {
    return `${Math.round(problem.difficulty_rating)} rated`;
  }
  return problem.difficulty_status;
}

export function ProblemRow({ problem }: { problem: Problem }) {
  const DirectionIcon = problem.metric_direction === "higher_is_better" ? ArrowUp : ArrowDown;
  return <Link href={`/problems/${problem.slug}`} className="group flex min-w-0 flex-col gap-4 rounded-[5px] border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary">
    <div className="min-w-0"><p className="mb-2 text-xs text-muted-foreground">Published task · {problem.source_label ?? problem.source_provider}</p><h2 className="font-bold leading-6 tracking-tight group-hover:text-primary">{problem.problem_code && <span className="mr-2 font-mono text-xs text-muted-foreground">{problem.problem_code}</span>}{problem.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{problem.competition?.title ?? "Independent practice"} · {problem.category}</p>{problem.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{problem.summary}</p>}<div className="mt-3 flex flex-wrap gap-2">{problem.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}</div></div>
    <div><Badge>{difficultyLabel(problem)}</Badge></div>
    <div className="flex items-center gap-2 text-sm"><DirectionIcon className="size-4 shrink-0 text-primary" aria-hidden="true"/><span>{problem.metric_name}</span></div>
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2 font-mono text-xs text-muted-foreground"><BarChart3 className="size-4 shrink-0" aria-hidden="true"/>{problem.statistics ? `${problem.statistics.sample_size} samples` : "No stats"}</span><span className="inline-flex min-h-10 items-center gap-2 rounded-[4px] border px-3 text-sm font-semibold">View task<ArrowUpRight className="size-4 shrink-0" aria-hidden="true"/></span></div>
  </Link>;
}
