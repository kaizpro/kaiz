import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { journeys } from "@/lib/learning/journeys";

export function JourneyChoices() {
  return <div className="grid gap-3 md:grid-cols-3">{journeys.map((path, index) => <Link key={path.level} href={`/roadmaps/${path.level}`} className="group flex min-w-0 flex-col rounded-[5px] border bg-card p-5 transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
    <p className="micro-label text-primary">Path 0{index + 1}</p>
    <div className="mt-3 flex items-center justify-between gap-3"><h3 className="text-lg font-bold">{path.title}</h3><ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true"/></div>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{path.audience}</p>
    <p className="mt-4 border-t pt-3 text-xs leading-5 text-muted-foreground">{path.summary}</p>
    <p className="mt-3 text-sm leading-6"><span className="font-semibold">Goal: </span>{path.outcome}</p>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">{path.steps.map(step => step.title).join(" → ")}</p>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">4 self-check milestones · {path.level === "beginner" ? "Python and NumPy exercises" : path.level === "intermediate" ? "Reproducible model baselines" : "Official tasks and upsolving"}</p>
    <span className="mt-auto pt-5"><span className="inline-flex min-h-10 items-center gap-2 rounded-[4px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Start roadmap<ArrowRight className="size-4 shrink-0" aria-hidden="true"/></span></span>
  </Link>)}</div>;
}
