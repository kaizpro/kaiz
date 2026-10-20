import Link from "next/link";
import { Check } from "lucide-react";
import type { LessonProgress } from "@/lib/learning/course";
import type { JourneyLevel } from "@/lib/learning/journeys";
import { areaHref, areaLessons, areaSupportingLessons, areaTitles } from "@/lib/learning/ioai-navigation";
import { getLearningStep } from "@/lib/learning/learning-steps";
import { CourseContents } from "./course-contents";
import styles from "./ioai.module.css";

export function LessonCourseNavigation({ profile, area, lessonId, records, ready }: {
  profile: JourneyLevel; area: number; lessonId: string; records: readonly LessonProgress[]; ready: boolean;
}) {
  const main = areaLessons(area, profile);
  const supporting = areaSupportingLessons(area, profile);
  return <CourseContents>
    <p className={styles.eyebrow}>COURSE CONTENTS</p><Link className={styles.contentsTitle} href={areaHref(profile, area)}>{areaTitles[area - 1]}</Link>
    {[{ label: "Lessons", items: main }, { label: "Maths alongside", items: supporting }].map(group => group.items.length > 0 && <div key={group.label}>
      {group.label !== "Lessons" && <p className={styles.contentsGroup}>{group.label}</p>}
      <ol aria-label={group.label}>{group.items.map((item, index) => {
        const current = item.roadmap === profile && item.id === lessonId;
        const completed = ready && records.some(row => row.roadmap_id === item.roadmap && row.lesson_id === item.id && row.completed_at !== null);
        return <li key={item.id}><Link href={item.href} aria-current={current ? "page" : undefined}>
          <span aria-hidden="true">{completed ? <Check size={14}/> : String(index + 1).padStart(2, "0")}</span>
          <span>{getLearningStep(item.topic.id)?.title ?? item.topic.title}{current ? <small>Current lesson</small> : completed ? <small>Completed · self-reported</small> : null}</span>
        </Link></li>;
      })}</ol>
    </div>)}
    <Link className={styles.contentsReturn} href={`/roadmaps/${profile}`}>← All courses</Link>
  </CourseContents>;
}
