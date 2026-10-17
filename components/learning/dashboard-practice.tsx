import Link from "next/link";
import { getOwnRecentPractice } from "@/lib/data/personal-practice";
import { getOwnProblemProgress } from "@/lib/data/problem-progress";
import styles from "@/components/training/catalog.module.css";
import { getOwnSourceSummaries } from "@/lib/data/source-practice";
import { getArchiveSource, archiveSourceHref } from "@/lib/learning/unified-archive";
export async function DashboardPractice(){
  const [state,personal,sources]=await Promise.all([getOwnRecentPractice(),getOwnProblemProgress(),getOwnSourceSummaries()]);
  const error=state.error||personal.error;
  return <section><h2 className={styles.sectionTitle}>My practice</h2>{error?<p role="alert" className={styles.note}>{error}</p>:<>
    <p className="my-3 text-sm" aria-label="Personal task totals">{personal.attempted} attempted individual tasks · {personal.solved} solved — Self-reported</p>
    <p className={styles.note}>{state.count} private individual-task attempts · Recent status / latest score per published task (up to 20). Open a task for full attempt history. Metrics are not compared.</p>
    {!!personal.items.length && <ul className="my-3 divide-y border-y" aria-label="Recent personal practice">{personal.items.map(item=><li key={item.problem_id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><div><Link className={styles.textAction} href={`/problems/${item.slug}`}>{item.title}</Link>{item.updated_at && <p className="text-xs text-muted-foreground"><time dateTime={item.updated_at}>{new Date(item.updated_at).toISOString().slice(0,16).replace("T"," ")} UTC</time></p>}</div><span>{item.status === "solved" ? "✓ Solved — Self-reported" : "Attempted"}{item.latest_score !== null && ` · Latest: ${item.latest_score} ${item.metric_name} · Self-reported`}</span></li>)}</ul>}
  </>}{sources.error?<p role="alert" className={styles.note}>{sources.error}</p>:<><p className="my-3 text-sm">{sources.count??0} practiced / finished source collections · Self-reported</p>{!!sources.items.length&&<ul className="my-3 divide-y border-y" aria-label="Recent external practice">{sources.items.map(item=><li key={item.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><div><Link className={styles.textAction} href={archiveSourceHref(item.catalog_id)}>{getArchiveSource(item.catalog_id)?.title??"Private source reference"}</Link>{item.updated_at&&<p className="text-xs text-muted-foreground">{new Date(item.updated_at).toISOString().slice(0,16).replace("T"," ")} UTC</p>}</div><span>{item.status==="finished"?"✓ Finished — Self-reported":"Practiced / Participated"}{item.latest_score!=null&&` · Latest: ${item.latest_score} ${item.metric??""} · Self-reported`}</span></li>)}</ul>}<p className={styles.note}>Open a source for private attempt history, notes, edits and deletion. Collection status is not a judge-verified solved task and earns no Learning XP.</p></>}<Link className={styles.textAction} href="/problems">Open practice archive</Link></section>;
}
