import { getJourney, journeys, type Journey } from "./journeys";
import { getTopicBySlug } from "./curriculum";

// Durable identities, independent of displayed titles and numbering. Do not
// rename a released key: retire it in the registry and migrate explicitly.
export type LessonProgress = { roadmap_id: string; lesson_id: string; completed_at: string | null; updated_at: string; started_at: string };
export function courseFor(path: Journey) {
  return path.steps.map((step, index) => ({
    ...step, number: index + 1,
    lessons: step.topics.map((id, position) => {
      const topic = getTopicBySlug(id);
      if (!topic) throw new Error("A roadmap refers to a missing topic.");
      return { id: `${step.id}:${topic.id}`, number: `${index + 1}.${position + 1}`, topic, moduleId: step.id };
    }),
  }));
}
export function getCourseLesson(roadmapId: string, lessonId: string) {
  const path = getJourney(roadmapId);
  if (!path) return undefined;
  for (const unit of courseFor(path)) {
    const lesson = unit.lessons.find(item => item.id === lessonId);
    if (lesson) return { path, module: unit, lesson };
  }
}
export function lessonHref(roadmapId: string, lessonId: string) {
  return `/roadmaps/${roadmapId}/lessons/${encodeURIComponent(lessonId)}`;
}
// The route boundary may receive an encoded segment (notably ':' in stable
// lesson keys). Decode once, then use the exact registry lookup; never double-decode.
export function courseLessonFromSegment(roadmapId: string, segment: string) {
  if (typeof segment !== "string" || segment.length > 480) return undefined;
  try { return getCourseLesson(roadmapId, decodeURIComponent(segment)); } catch { return undefined; }
}
export function courseProgress(path: Journey, records: readonly LessonProgress[]) {
  const modules = courseFor(path);
  const completed = new Set(records.filter(row => row.roadmap_id === path.level && row.completed_at !== null).map(row => row.lesson_id));
  const lessons = modules.flatMap(module => module.lessons);
  const count = lessons.filter(lesson => completed.has(lesson.id)).length;
  return { modules, completed, total: lessons.length, count, percent: lessons.length ? Math.floor(count / lessons.length * 100) : 0, xp: count * 10, status: count === lessons.length ? "Completed" : count ? "In progress" : "Not started", action: count === lessons.length ? "Review" : count ? "Continue" : "Start", next: lessons.find(lesson => !completed.has(lesson.id)) };
}
export function learningSummary(records: readonly LessonProgress[]) {
  const paths = journeys.map(path => ({ path, ...courseProgress(path, records) }));
  const known = records.filter(row => getCourseLesson(row.roadmap_id, row.lesson_id));
  const recent = [...known].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
  const count = paths.reduce((sum, path) => sum + path.count, 0);
  const total = paths.reduce((sum, path) => sum + path.total, 0);
  return { paths, count, total, percent: total ? Math.floor(count / total * 100) : 0, activeCount: paths.filter(path => path.count > 0 && path.count < path.total).length, xp: count * 10, active: paths.find(path => path.path.level === recent?.roadmap_id) };
}
