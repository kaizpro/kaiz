import Link from "next/link";
import { getOwnRecentPractice } from "@/lib/data/personal-practice";
import styles from "@/components/training/catalog.module.css";
export async function DashboardPractice(){
  const state=await getOwnRecentPractice();
  return <section><h2 className={styles.sectionTitle}>My practice</h2>{state.error?<p role="alert" className={styles.note}>{state.error}</p>:<>
    <p className={styles.note}>{state.count} private self-reported attempts · {state.attempts.length ? "Recent 20 or fewer, newest attempt time first. Metrics are not compared." : "No practice recorded yet. External collections are not individual scored tasks."}</p>
    {!!state.attempts.length&&<ul className={styles.rows}>{state.attempts.map(attempt=><li className={styles.row} key={attempt.id}><div className={styles.meta}><span>{new Date(attempt.attempted_at).toISOString().slice(0,16).replace("T"," ")} UTC</span><span>{attempt.status}</span></div>{attempt.problem?.published?<Link className={styles.textAction} href={`/problems/${attempt.problem.slug}#practice`}>{attempt.problem.title}</Link>:<p className="text-sm">Archived / unpublished task</p>}<p className="text-sm">{attempt.raw_score} {attempt.problem?.metric_name??"score"} · Self-reported</p></li>)}</ul>}
  </>}<Link className={styles.textAction} href="/problems">Open practice archive</Link></section>;
}
