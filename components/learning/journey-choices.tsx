import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { journeys } from "@/lib/learning/journeys";

export function JourneyChoices() {
  return <div className="grid gap-3 md:grid-cols-3">{journeys.map((path, index) => <Link key={path.level} href={`/start/${path.level}`} className="group min-w-0 border bg-card p-5 transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
    <p className="micro-label text-primary">Path 0{index + 1}</p>
    <div className="mt-3 flex items-center justify-between gap-3"><h3 className="text-lg font-bold">{path.title}</h3><ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true"/></div>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{path.audience}</p>
    <p className="mt-4 border-t pt-3 text-xs leading-5 text-muted-foreground">{path.summary}</p>
  </Link>)}</div>;
}
