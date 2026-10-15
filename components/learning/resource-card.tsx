import { ArrowUpRight } from "lucide-react";
import type { LearningResource } from "@/lib/learning/curriculum";
import styles from "@/components/training/catalog.module.css";

const types: Record<LearningResource["kind"], string> = { article: "Article", video: "Video", exercise: "Interactive exercise", course: "Course", documentation: "Documentation", notebook: "Notebook / examples" };

export function ResourceCard({ resource, topic }: { resource: LearningResource; topic?: string }) {
  // Content is editorial, but still reject unsafe schemes/embedded credentials.
  let url: URL;
  try { url = new URL(resource.href); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const unavailable = resource.availability === "unavailable" || resource.availability === "challenge";
  return <article className={styles.resource}>
    <div><h3 className={styles.rowTitle}>{resource.title}</h3><div className={styles.meta}><span>{types[resource.kind]}</span><span>{resource.provider ?? url.hostname.replace(/^www\./, "")}</span>{topic && <span>{topic}</span>}{resource.difficulty && <span>{resource.difficulty}</span>}{resource.account && /account required|registration.*required/i.test(resource.account) && <span>Account required</span>}</div></div>
    {unavailable ? <span className="self-center text-xs text-muted-foreground">{resource.availability === "challenge" ? "Access unverified" : "Unavailable"}</span> : <a className={`${styles.textAction} min-h-11`} href={resource.href} target="_blank" rel="noopener noreferrer" aria-label={`Open material: ${resource.title} (new tab)`}>Open<ArrowUpRight className="size-3 shrink-0" aria-hidden="true"/></a>}
    <details className={styles.resourceDetails}><summary>Source &amp; access</summary><p>{resource.description ?? "External material, not a hosted KAIZ lesson."}</p>{resource.account && <p>{resource.account}</p>}{resource.provenance && <p>Selection: {resource.provenance}</p>}{unavailable && <p>Temporarily unavailable or blocked at the October 15 check; current access is not verified.</p>}</details>
  </article>;
}
