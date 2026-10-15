import { ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LearningResource } from "@/lib/learning/curriculum";

const types: Record<LearningResource["kind"], string> = { article: "Article", video: "Video", exercise: "Interactive exercise", course: "Course", documentation: "Documentation", notebook: "Notebook / examples" };

export function ResourceCard({ resource, topic }: { resource: LearningResource; topic?: string }) {
  // Content is editorial, but still reject unsafe schemes/embedded credentials.
  let url: URL;
  try { url = new URL(resource.href); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const unavailable = resource.availability === "unavailable" || resource.availability === "challenge";
  return <article className="flex min-w-0 flex-col rounded-[5px] border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><BookOpen className="size-3.5 shrink-0" aria-hidden="true"/>{types[resource.kind]}</span><span>{resource.provider ?? url.hostname.replace(/^www\./, "")}</span><span>External</span>{resource.difficulty && <span>{resource.difficulty}</span>}</div>
    <h3 className="mt-3 text-base font-bold leading-6 [overflow-wrap:anywhere]">{resource.title}</h3>
    {topic && <p className="mt-1 text-xs text-primary">{topic}</p>}
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{resource.description ?? "Read the original source and work through a small example. This is external material, not a hosted KAIZ lesson."}</p>
    {resource.account && <p className="mt-3 text-xs leading-5 text-muted-foreground">{resource.account}</p>}
    {resource.provenance && <p className="mt-1 text-xs leading-5 text-muted-foreground">Selection: {resource.provenance}</p>}
    <div className="mt-auto pt-4">{unavailable ? <p className="text-sm font-semibold text-muted-foreground">{resource.availability === "challenge" ? "Access not verified · browser challenge" : "Temporarily unavailable · checked October 15"}</p> : <Button asChild variant="outline" size="sm" className="h-auto min-h-11 max-w-full whitespace-normal"><a href={resource.href} target="_blank" rel="noopener noreferrer">Open material<ArrowUpRight className="size-4 shrink-0" aria-hidden="true"/><span className="sr-only">: {resource.title} (new tab)</span></a></Button>}</div>
  </article>;
}
