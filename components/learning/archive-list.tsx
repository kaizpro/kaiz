import Link from "next/link";
import { archiveAvailability, type ArchiveItem } from "@/lib/learning/unified-archive";
import styles from "@/components/training/catalog.module.css";
import type { PersonalProblem } from "@/lib/data/problem-progress";
import personalStyles from "./personal-practice.module.css";
import type { SourceSummary } from "@/lib/data/source-practice";

export function ArchiveList({ items, personal, sources }: { items: readonly ArchiveItem[]; personal?: readonly PersonalProblem[]; sources?:readonly SourceSummary[] }) {
  const states = new Map(personal?.map(item => ["problem:"+item.problem_id,item]));
  const sourceStates = new Map(sources?.map(item=>[item.catalog_id,item]));
  return <div id="practice-sources" className={`${styles.rows} ${styles.archiveList}`} aria-label="Practice archive">
    {!!items.length && <div className={styles.archiveHeader} aria-hidden="true"><span>Task / collection</span><span>Source / type</span><span>Level</span><span>Access</span><span>Action</span></div>}
    {!items.length && <p className="px-3 py-6 text-sm text-muted-foreground">No practice items match. Clear the filters or try a broader search.</p>}
    {items.map(item => <article key={item.id} className={`${styles.row} ${personalStyles.row}`} data-status={item.external ? sources ? sourceStates.get(item.id)?.status??"unattempted" : undefined : personal ? states.get(item.id)?.status ?? "unattempted" : undefined} data-archive-kind={item.external ? "external" : "internal"}>
      <div className={styles.archiveRow}>
        <div className={styles.archiveTitle}><h2 className={styles.rowTitle}><Link href={item.href!} className="hover:text-primary hover:underline">{item.title}</Link></h2><div className={styles.meta}><span>{item.competition}</span><span>{item.tags.join(" · ")}</span></div><details className={styles.resourceDetails}><summary className="my-1 rounded-sm border px-2">View source details</summary><p>{item.details}</p><p>{item.account}</p><p>{item.provenance}</p><p>{item.external ? "External collection or contest; not an individual scored KAIZ task." : "Published KAIZ task. Practice remains owner-private and self-reported."}</p></details></div>
        <div className={styles.meta}><span>{item.source}</span><span>{item.type}</span></div>
        <span className={styles.meta}>{item.difficultyLabel ?? item.difficulty}</span>
        <div><span className={styles.meta}>{archiveAvailability[item.availability]}</span>{!item.external && personal && <><p className={personalStyles.status} data-status={states.get(item.id)?.status ?? "unattempted"}>{states.get(item.id)?.status === "solved" ? "✓ Solved — Self-reported" : states.has(item.id) ? "Attempted" : "Unattempted"}</p>{states.get(item.id)?.latest_score != null && <p className="mt-1 text-xs">Latest: {states.get(item.id)!.latest_score} {states.get(item.id)!.metric_name} · Self-reported</p>}</>}
        {item.external&&sources&&<div className="text-xs"><p className={personalStyles.status} data-status={sourceStates.get(item.id)?.status}>{sourceStates.get(item.id)?.status==="finished"?"✓ Finished — Self-reported":sourceStates.has(item.id)?"Practiced / Participated":"Not started"}</p>{sourceStates.get(item.id)?.latest_score!=null&&<p>Latest: {sourceStates.get(item.id)!.latest_score} {sourceStates.get(item.id)!.metric} · Self-reported</p>}</div>}
        </div><div className="flex flex-wrap gap-2"><Link href={item.href!} className={styles.action} aria-label={`View details: ${item.title}`}>View details</Link>{item.originalHref ? <a href={item.originalHref} target="_blank" rel="noopener noreferrer" className={`${styles.action} ${styles.primary}`} aria-label={`Solve: ${item.title} (new tab)`}>SOLVE ↗</a>:<Link href={`${item.href}?record=1#source-practice`} className={`${styles.action} ${styles.primary}`}>Record practice</Link>}</div>
      </div>
    </article>)}
  </div>;
}
