import Link from "next/link";
import type { ReactNode } from "react";
import { courseProgress, lessonHref, type LessonProgress } from "@/lib/learning/course";
import type { Journey } from "@/lib/learning/journeys";
import styles from "./course.module.css";
import { ProgressUnavailable } from "./progress-unavailable";

export function CourseProgress({ path, records, signedIn, error, action }: { path: Journey; records: readonly LessonProgress[]; signedIn: boolean; error: string | null; action?: ReactNode }) {
  if (error) return <ProgressUnavailable message={error}/>;
  const progress = courseProgress(path, records);
  if (!signedIn) return <div className={styles.summary}>{action}<p>Sign in to save completion across devices.</p><Link className={styles.smallAction} href={`/auth/login?next=${encodeURIComponent(`/roadmaps/${path.level}`)}`}>Sign in to save progress</Link></div>;
  return <section className={styles.summary} aria-label={`${path.title} saved progress`}>
    <p className={styles.status}>{progress.status}</p>
    <p><strong>{progress.percent}%</strong> · {progress.count} / {progress.total} lessons · <strong>{progress.xp} Learning XP</strong></p>
    <progress className={styles.bar} max={progress.total} value={progress.count} aria-label={`${path.title} completion`}/>
    <p className="text-muted-foreground">Learning XP: 10 per completed lesson in this roadmap, not a competitive rating or verified result.</p>
    {action !== undefined ? action : progress.next ? <Link className={styles.smallAction} href={lessonHref(path.level, progress.next.id)}>{progress.count ? "Continue with next lesson" : "Start first lesson"} · {progress.next.number} {progress.next.topic.title}</Link> : <p className="font-semibold">All {progress.total} lessons completed. You can revisit or undo any completion.</p>}
  </section>;
}
