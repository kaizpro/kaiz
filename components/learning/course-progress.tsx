import Link from "next/link";
import { courseProgress, lessonHref, type LessonProgress } from "@/lib/learning/course";
import type { Journey } from "@/lib/learning/journeys";
import styles from "./course.module.css";

export function CourseProgress({ path, records, signedIn, error }: { path: Journey; records: readonly LessonProgress[]; signedIn: boolean; error: string | null }) {
  if (error) return <p role="alert" className={`${styles.summary} text-sm text-muted-foreground`}>{error}</p>;
  const progress = courseProgress(path, records);
  if (!signedIn) return <div className={styles.summary}><p>Sign in to save completion across devices. Opening a resource never marks it completed.</p><Link className={styles.smallAction} href={`/auth/login?next=${encodeURIComponent(`/roadmaps/${path.level}`)}`}>Sign in to save progress</Link></div>;
  return <section className={styles.summary} aria-label={`${path.title} saved progress`}>
    <p><strong>{progress.percent}%</strong> · {progress.count} / {progress.total} lessons · <strong>{progress.xp} Learning XP</strong></p>
    <progress className={styles.bar} max={progress.total} value={progress.count} aria-label={`${path.title} completion`}/>
    <p className="text-muted-foreground">Learning XP: 10 per completed lesson in this roadmap, not a competitive rating or verified result.</p>
    {progress.next ? <Link className={styles.smallAction} href={lessonHref(path.level, progress.next.id)}>Continue Learning · {progress.next.number} {progress.next.topic.title}</Link> : <p className="font-semibold">All {progress.total} lessons completed. You can revisit or undo any completion.</p>}
  </section>;
}
