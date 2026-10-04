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
  return <Link href={`/problems/${problem.slug}`} className="group grid gap-4 border-b px-4 py-4 transition-colors last:border-b-0 hover:bg-muted/50 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_9rem] sm:items-center sm:px-5">
    <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate font-semibold tracking-tight group-hover:text-primary">{problem.problem_code && <span className="mr-2 font-mono text-xs text-muted-foreground">{problem.problem_code}</span>}{problem.title}</h2></div><p className="mt-1 truncate text-sm text-muted-foreground">{problem.competition?.title ?? problem.source_label ?? problem.source_provider} · {problem.category}</p></div>
    <div><Badge>{difficultyLabel(problem)}</Badge></div>
    <div className="flex items-center gap-2 text-sm"><DirectionIcon className="size-4 text-primary"/><span className="truncate">{problem.metric_name}</span></div>
    <div className="flex items-center justify-between gap-3 sm:justify-end"><span className="flex items-center gap-2 font-mono text-xs text-muted-foreground"><BarChart3 className="size-4"/>{problem.statistics ? `${problem.statistics.sample_size} samples` : "No stats"}</span><ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary"/></div>
  </Link>;
}
