import { practiceSources } from "@/lib/learning/practice-sources";
import type { JourneyLevel } from "@/lib/learning/journeys";

export function PracticeSources({ level }: { level?: JourneyLevel }) {
  const entries = level ? [[level, practiceSources[level]] as const] : Object.entries(practiceSources);
  return <section className="mt-5 border-t pt-5" aria-label="Original practice sources"><h2 className="text-base font-bold">Practice at the original source</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">External exercises, not scored KAIZ submissions. No account is needed to browse these links.</p><ul className="mt-3 space-y-4">{entries.map(([key, source]) => <li key={key}><a className="text-sm font-semibold text-primary underline underline-offset-4" href={source.href} target="_blank" rel="noopener noreferrer">{source.title}<span className="sr-only"> (opens in a new tab)</span></a><p className="mt-1 text-xs leading-5 text-muted-foreground">{source.note}</p></li>)}</ul></section>;
}
