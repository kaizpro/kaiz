import Link from "next/link";
import type { Journey } from "@/lib/learning/journeys";
import type { LessonProgress } from "@/lib/learning/course";
import { classicModules, classicNext } from "@/lib/learning/classic-roadmap";
import { CompletionControl } from "./completion-control";
import styles from "./course.module.css";

export function CourseModules({ path, records, canSave }: { path: Journey; records: readonly LessonProgress[]; canSave: boolean }) {
  const modules = classicModules(path), recommendation = classicNext(path, records, canSave);
  const completed = (lesson: typeof modules[number]["lessons"][number]) => canSave && records.some(row => row.roadmap_id === lesson.roadmap && row.lesson_id === lesson.id && row.completed_at !== null);
  const row = (lesson: typeof modules[number]["lessons"][number]) => <li className={styles.lesson} data-next={recommendation.next?.href === lesson.href} key={`${lesson.roadmap}:${lesson.id}`}>
    <span className={styles.number}>{lesson.number}</span><div className="min-w-0"><Link className="font-semibold text-primary underline-offset-4 hover:underline" href={lesson.href} aria-label={`Open lesson ${lesson.number}: ${lesson.title}`}>{lesson.title}</Link><p className="text-xs text-muted-foreground">{lesson.roadmap !== path.level ? "Shared Intermediate lesson" : "Lesson"}{completed(lesson) ? " · ✓ Completed" : ""}</p></div>
    {canSave && <CompletionControl roadmap={lesson.roadmap} lesson={lesson.id} number={lesson.number} completed={completed(lesson)}/>}
  </li>;
  return <ol className="min-w-0" aria-label="Ordered roadmap stages">{modules.map(module => {
    const shown = [...module.lessons, ...module.supporting], count = shown.filter(completed).length;
    return <li key={module.id}><details className={styles.module} data-course-module open={module.lessons.some(lesson => lesson.href === recommendation.next?.href) || !recommendation.next && module.number === 1}>
      <summary><span>{module.number}. {module.title}{module.optional ? " · Optional next stage" : ""}</span><span className={styles.moduleMeter}>{canSave ? <><span>{count} / {shown.length} completed{count === shown.length ? " ✓" : ""}</span><progress className={styles.bar} value={count} max={shown.length} aria-label={`Module ${module.number} completion`}/></> : `${shown.length} lessons`}</span></summary>
      <ol aria-label={`Module ${module.number} lessons`}>{module.lessons.map(row)}</ol>
      {module.supporting.length > 0 && <details className="my-3 text-sm"><summary className="min-h-11 cursor-pointer text-xs font-semibold">Supporting maths · optional alongside</summary><ol>{module.supporting.map(row)}</ol></details>}
      <details className="my-3 text-sm"><summary className="min-h-11 cursor-pointer text-xs font-semibold">Goals &amp; self-check</summary>{path.level !== "beginner" && <p className="py-2 text-muted-foreground">{module.goal}</p>}<p className="py-2">{module.milestone}</p></details>
      <Link className={styles.smallAction} href={`/problems?${new URLSearchParams({q:path.practiceQuery})}`}>Practice tasks / source collections</Link>
    </details></li>;
  })}</ol>;
}
