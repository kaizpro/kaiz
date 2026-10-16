import Link from "next/link";
import type { Journey } from "@/lib/learning/journeys";
import { courseProgress, lessonHref, type LessonProgress } from "@/lib/learning/course";
import { CompletionControl } from "./completion-control";
import styles from "./course.module.css";

export function CourseModules({ path, records, canSave }: { path: Journey; records: readonly LessonProgress[]; canSave: boolean }) {
  const progress = courseProgress(path, records);
  return <ol className="min-w-0" aria-label="Ordered roadmap stages">{progress.modules.map(module => {
    const count = module.lessons.filter(lesson => progress.completed.has(lesson.id)).length;
    return <li key={module.id}><details className={styles.module} data-course-module open={module.id === progress.next?.moduleId || !progress.next && module.number === 1}>
      <summary><span>{module.number}. {module.title}</span><span>{canSave ? `${count} / ${module.lessons.length} completed${count === module.lessons.length ? " ✓" : ""}` : `${module.lessons.length} lessons`} · Expand / collapse</span></summary>
      <ol aria-label={`Module ${module.number} lessons`}>{module.lessons.map(lesson => <li className={styles.lesson} data-next={progress.next?.id === lesson.id} key={lesson.id}>
        <span className={styles.number}>{lesson.number}</span><div className="min-w-0"><Link className="font-semibold text-primary underline-offset-4 hover:underline" href={lessonHref(path.level, lesson.id)} aria-label={`Open lesson ${lesson.number}: ${lesson.topic.title}`}>{lesson.topic.title}</Link><p className="text-xs text-muted-foreground">Topic · {lesson.topic.resources.length} external materials{canSave && progress.completed.has(lesson.id) ? " · Completed" : ""}</p></div>
        {canSave && <CompletionControl roadmap={path.level} lesson={lesson.id} number={lesson.number} completed={progress.completed.has(lesson.id)}/>}
      </li>)}</ol>
      <details className="my-3 text-sm"><summary className="min-h-9 cursor-pointer text-xs font-semibold">Goals &amp; self-check</summary><p className="py-2 text-muted-foreground">{module.goal}</p><h3 className="text-xs font-semibold">Milestone / self-check</h3><p className="py-2">{module.milestone}</p></details>
      <Link className={styles.smallAction} href={`/problems?${new URLSearchParams({q:path.practiceQuery})}`}>Practice tasks / source collections</Link>
    </details></li>;
  })}</ol>;
}
