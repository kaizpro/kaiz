import Link from "next/link";
import type { Journey } from "@/lib/learning/journeys";
import type { LessonProgress } from "@/lib/learning/course";
import { classicModules } from "@/lib/learning/classic-roadmap";
import styles from "./classic.module.css";

export function ClassicLessonContents({ path, lessonId, records, ready }: { path: Journey; lessonId: string; records: readonly LessonProgress[]; ready: boolean }) {
  return <details className={styles.contents}>
    <summary>Course contents</summary>
    <nav aria-label="Course contents">{classicModules(path).map(module => <section key={module.id}>
      <h2>{module.number}. {module.title}{module.optional ? " · Optional" : ""}</h2>
      <ol>{[...module.lessons, ...module.supporting].map(item => {
        const current = item.roadmap === path.level && item.id === lessonId;
        const completed = ready && records.some(row => row.roadmap_id === item.roadmap && row.lesson_id === item.id && row.completed_at !== null);
        return <li key={`${item.roadmap}:${item.id}`}><Link href={item.href} aria-current={current ? "page" : undefined}>
          {item.number} {item.title}{current ? " · Current lesson" : completed ? " · ✓ Completed" : ""}{item.roadmap !== path.level ? " · Shared Intermediate lesson" : ""}
        </Link></li>;
      })}</ol>
    </section>)}</nav>
  </details>;
}
