import { practiceSources } from "@/lib/learning/practice-sources";
import type { JourneyLevel } from "@/lib/learning/journeys";
import styles from "@/components/training/catalog.module.css";

export function PracticeSources({ level }: { level?: JourneyLevel }) {
  const entries = level ? [[level, practiceSources[level]] as const] : Object.entries(practiceSources);
  return <section className="border-t pt-3" aria-label="Original practice sources"><h2 className="text-sm font-bold">Practice at the original source</h2><ul>{entries.map(([key, source]) => <li key={key}><a className={styles.textAction} href={source.href} target="_blank" rel="noopener noreferrer">{source.title}<span className="sr-only"> (opens in a new tab)</span></a><details className={styles.resourceDetails}><summary>About this source</summary><p>{source.note}</p></details></li>)}</ul><p className={styles.note}>External exercises, not scored KAIZ submissions.</p></section>;
}
