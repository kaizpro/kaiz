import type { ReactNode } from "react";
import { practiceLinkFor } from "@/lib/learning/lesson-practice-links";
import styles from "./classic.module.css";

export function LessonPracticeActions({ topicId, studyHref, completion }: { topicId: string; studyHref: string; completion?: ReactNode }) {
  const resource = practiceLinkFor(topicId);
  return <>
    <div className={styles.practiceActions} data-practice-actions>
      <a href={studyHref} className={styles.studyAction}>Study Material{studyHref.startsWith("https:") ? " ↗" : ""}</a>
      {resource && <a className={styles.kaggleAction} href={resource.href} target="_blank" rel="noopener noreferrer" aria-label={`Practice on Kaggle: ${resource.title} (new tab)`}>Practice on Kaggle ↗</a>}
    </div>
    {resource && <p className={styles.practiceNote}>{resource.title} · {resource.note}</p>}
    <p className={styles.practiceNote}>Completion is a private self-report. KAIZ does not verify external solutions.</p>
    {completion}
  </>;
}
