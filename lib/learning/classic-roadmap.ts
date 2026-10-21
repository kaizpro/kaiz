import { courseFor, courseProgress, getCourseLesson, lessonHref, type LessonProgress } from "./course";
import { beginnerCore, beginnerStep } from "./beginner-learning";
import { getLearningStep } from "./learning-steps";
import type { Journey, JourneyLevel } from "./journeys";

// Display projection only. Never rename/reorder the durable course registry or XP keys.
export function classicModules(path: Journey) {
  const rank = (topicId: string) => {
    const index = beginnerCore.findIndex(step => step.topicId === topicId);
    return index < 0 ? beginnerCore.length : index;
  };
  return courseFor(path).map(module => {
    const project = (lesson: typeof module.lessons[number], roadmap: JourneyLevel = path.level) => ({
      ...lesson, roadmap, href: lessonHref(roadmap, lesson.id),
      title: (path.level === "beginner" ? beginnerStep(lesson.topic.id) : getLearningStep(lesson.topic.id))?.title ?? lesson.topic.title,
    });
    const own = module.lessons.map(lesson => project(lesson));
    const supporting = path.level === "beginner" ? own.filter(lesson => lesson.topic.track === "mathematics") : [];
    const lessons = own.filter(lesson => !supporting.includes(lesson));
    if (path.level === "beginner") {
      // Analysis keeps its released Intermediate identity: no duplicated progress key.
      if (module.id === "arrays-dataframes") {
        const bridge = beginnerCore.find(step => step.topicId === "exploratory-analysis")!;
        lessons.push(project(getCourseLesson(bridge.roadmap, bridge.lessonId)!.lesson, bridge.roadmap));
      }
      lessons.sort((a, b) => rank(a.topic.id) - rank(b.topic.id));
    }
    return { ...module, lessons, supporting, optional: path.level === "beginner" && module.id === "training-direction" };
  });
}

export function classicNext(path: Journey, records: readonly LessonProgress[], ready: boolean) {
  const safeRecords = ready ? records : [];
  const progress = courseProgress(path, safeRecords);
  if (path.level === "beginner") {
    const step = beginnerCore.find(item => !safeRecords.some(row => row.roadmap_id === item.roadmap && row.lesson_id === item.lessonId && row.completed_at !== null));
    const continuing = progress.count > 0 || beginnerCore.some(item => safeRecords.some(row => row.roadmap_id === item.roadmap && row.lesson_id === item.lessonId && row.completed_at !== null));
    return { continuing, next: step ? { title: step.title, href: lessonHref(step.roadmap, step.lessonId) } : null };
  }
  return { continuing: progress.count > 0, next: progress.next ? { title: getLearningStep(progress.next.topic.id)?.title ?? progress.next.topic.title, href: lessonHref(path.level, progress.next.id) } : null };
}
