import Link from "next/link";
import { archiveAvailability, type ArchiveItem } from "@/lib/learning/unified-archive";
import { ArrowRight } from "lucide-react";
import { ProductEmptyState } from "@/components/product/page-hero";
import product from "@/components/product/product.module.css";
import styles from "@/components/product/practice.module.css";
import type { PersonalProblem } from "@/lib/data/problem-progress";
import personalStyles from "./personal-practice.module.css";

export function ArchiveList({ items, personal }: { items: readonly ArchiveItem[]; personal?: readonly PersonalProblem[] }) {
  const states = new Map(personal?.map(item => ["problem:"+item.problem_id,item]));
  return <div id="practice-sources" className={product.list} aria-label="Practice archive">
    {!items.length && <ProductEmptyState title="No matching practice"><p>Clear the filters or try a broader search.</p><Link className={product.action} href="/problems">Clear filters</Link></ProductEmptyState>}
    {items.map(item => <article key={item.id} className={`${styles.entry} ${personalStyles.row}`} data-status={!item.external && personal ? states.get(item.id)?.status ?? "unattempted" : undefined} data-archive-kind={item.external ? "external" : "internal"}>
      <Link href={item.href!} className={`${product.card} ${styles.archiveLink}`} aria-label={`View details: ${item.title}`}>
        <div><div className={product.meta}><span>{item.source}</span><span className={product.pill}>{item.type}</span></div><h2 className={product.cardTitle}>{item.title}</h2><p className={product.meta}>{item.tags.join(" · ")}</p></div>
        <div className={styles.access}><span className={product.pill}>{archiveAvailability[item.availability]}</span><span className={product.meta}>{item.difficultyLabel ?? item.difficulty}</span>
          {!item.external && personal && <><p className={personalStyles.status} data-status={states.get(item.id)?.status ?? "unattempted"}>{states.get(item.id)?.status === "solved" ? "✓ Solved — Self-reported" : states.has(item.id) ? "Attempted" : "Unattempted"}</p>{states.get(item.id)?.latest_score != null && <p className="text-sm">Latest: {states.get(item.id)!.latest_score} {states.get(item.id)!.metric_name} · Self-reported</p>}</>}
        </div><span className={product.direction} aria-hidden="true">View details <ArrowRight size={20}/></span>
      </Link>
      <details className={styles.sourceDetails}><summary>View source details</summary><p>{item.competition}</p><p>{item.details}</p><p>{item.account}</p><p>{item.provenance}</p><p>{item.external ? "External collection or contest; not an individual scored KAIZ task." : "Published KAIZ task. Practice remains owner-private and self-reported."}</p></details>
    </article>)}
  </div>;
}
