import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { archiveAvailability, type ArchiveItem } from "@/lib/learning/unified-archive";
import styles from "@/components/training/catalog.module.css";
import type { PersonalProblem } from "@/lib/data/problem-progress";
import personalStyles from "./personal-practice.module.css";

export function ArchiveList({ items, personal }: { items: readonly ArchiveItem[]; personal?: readonly PersonalProblem[] }) {
  const states = new Map(personal?.map(item => ["problem:"+item.problem_id,item]));
  return <div id="practice-sources" className={`${styles.rows} ${styles.archiveList}`} aria-label="Practice archive">
    {!!items.length && <div className={styles.archiveHeader} aria-hidden="true"><span>Task / collection</span><span>Source / type</span><span>Level</span><span>Access</span><span>Action</span></div>}
    {!items.length && <p className="px-3 py-6 text-sm text-muted-foreground">No practice items match. Clear the filters or try a broader search.</p>}
    {items.map(item => <article key={item.id} className={`${styles.row} ${personalStyles.row}`} data-status={!item.external && personal ? states.get(item.id)?.status ?? "unattempted" : undefined} data-archive-kind={item.external ? "external" : "internal"}>
      <div className={styles.archiveRow}>
        <div className={styles.archiveTitle}><h2 className={styles.rowTitle}>{item.title}</h2><div className={styles.meta}><span>{item.competition}</span><span>{item.tags.join(" · ")}</span></div><details className={styles.resourceDetails}><summary>Source &amp; access</summary><p>{item.details}</p><p>{item.account}</p><p>{item.provenance}</p><p>{item.external ? "External collection or contest; not an individual scored KAIZ task." : "Published KAIZ task. Practice remains owner-private and self-reported."}</p></details></div>
        <div className={styles.meta}><span>{item.source}</span><span>{item.type}</span></div>
        <span className={styles.meta}>{item.difficultyLabel ?? item.difficulty}</span>
        <div><span className={styles.meta}>{archiveAvailability[item.availability]}</span>{!item.external && personal && <><p className={personalStyles.status} data-status={states.get(item.id)?.status ?? "unattempted"}>{states.get(item.id)?.status === "solved" ? "✓ Solved — Self-reported" : states.has(item.id) ? "Attempted" : "Unattempted"}</p>{states.get(item.id)?.latest_score != null && <p className="mt-1 text-xs">Latest: {states.get(item.id)!.latest_score} {states.get(item.id)!.metric_name} · Self-reported</p>}</>}</div>
        {item.href ? item.external ? <a href={item.href} target="_blank" rel="noopener noreferrer" className={styles.textAction} aria-label={`Open source: ${item.title} (new tab)`}>Open<ArrowUpRight className="size-3 shrink-0" aria-hidden="true"/></a> : <Link href={item.href} className={styles.textAction} aria-label={`View task: ${item.title}`}>View task</Link> : <span className="py-2 text-xs text-muted-foreground">{item.availability === "held" ? "Link held" : "Unavailable"}</span>}
      </div>
    </article>)}
  </div>;
}
