import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { journeys } from "@/lib/learning/journeys";
import { courseProgress, type LessonProgress } from "@/lib/learning/course";
import { ProgressUnavailable } from "./progress-unavailable";
import styles from "./course.module.css";

export function RoadmapProgressList({ records, signedIn, error }: { records: readonly LessonProgress[]; signedIn: boolean; error: string | null }) {
  const ready = signedIn && !error;
  return <>
    {error && <ProgressUnavailable message={error}/>}
    {!signedIn && <p className="py-3 text-sm text-muted-foreground">Sign in to save progress across devices.</p>}
    <div>{journeys.map(path => {
      const progress = courseProgress(path, records);
      const href = `/roadmaps/${path.level}`;
      return <section key={path.level} aria-label={`${path.title} roadmap progress`}>
        <Link className={styles.roadmap} href={href} aria-label={`${ready ? progress.action : "Open"} ${path.title} roadmap`} aria-describedby={`roadmap-${path.level}-progress`}>
        <div><strong className="font-semibold">{path.title}</strong><p className="mt-1 text-sm text-muted-foreground">{path.audience}</p></div>
        <div id={`roadmap-${path.level}-progress`}>{ready ? <><p className={styles.progressLabel}><span>{progress.count} / {progress.total} lessons completed</span><strong>{progress.percent}%</strong></p><progress className={styles.bar} max={progress.total} value={progress.count} aria-label={`${path.title} completion`}/><p className={styles.status}>{progress.status} · {progress.xp} Learning XP</p></> : <p className="text-xs text-muted-foreground">{progress.total} curriculum lessons · {path.steps.length} modules</p>}</div>
        <span className={styles.rowDirection} aria-hidden="true">{ready && <span>{progress.action}</span>}<ChevronRight size={20}/></span>
        </Link>
      </section>;
    })}</div>
  </>;
}
