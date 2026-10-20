import { getTopicBySlug } from "./curriculum";
import { courseFor, getCourseLesson, lessonHref, type LessonProgress } from "./course";
import { getJourney, type JourneyLevel } from "./journeys";
import { ioaiLevels, startingProfiles } from "./ioai-curriculum";
import { getLearningStep, learningSteps } from "./learning-steps";
import { beginnerCore } from "./beginner-learning";

export const areaTitles = ["Python", "Data", "Machine Learning", "Deep Learning", "Specializations", "IOAI Preparation"] as const;
// Existing umbrella lesson; the syllabus inventory maps its individual methods instead.
const umbrellaTopics: Readonly<Record<number, readonly string[]>> = { 3: ["supervised-learning"] };
export function readArea(value: string | string[] | undefined): number | undefined {
  return typeof value === "string" && /^[1-6]$/.test(value) ? Number(value) : undefined;
}
export function areaHref(profile: JourneyLevel, area: number, view?: "map") { return `/roadmaps/${profile}?${view ? "view=map&" : ""}area=${area}#area-lessons`; }
export function areaForTopic(topicId: string, profile?: JourneyLevel): number | undefined {
  if (profile === "beginner") {
    const step = beginnerCore.find(item => item.topicId === topicId);
    if (step) return step.level;
  }
  const umbrella = Object.entries(umbrellaTopics).find(([, topics]) => topics.includes(topicId));
  return getLearningStep(topicId)?.level ?? ioaiLevels.find(level => level.topics.some(topic => topic.topicIds.includes(topicId)))?.number ?? (umbrella ? Number(umbrella[0]) : undefined);
}
export function areaLessons(area: number, profile: JourneyLevel) {
  const level = ioaiLevels.find(item => item.number === area);
  const path = getJourney(profile);
  if (!level || !path) return [];
  const own = courseFor(path).flatMap(unit => unit.lessons);
  const topicIds = new Set([...level.topics.flatMap(topic => topic.topicIds), ...(umbrellaTopics[area] ?? [])]);
  if (profile === "beginner") for (const step of beginnerCore) {
    if (step.level === area) topicIds.add(step.topicId); else topicIds.delete(step.topicId);
  }
  const starters = learningSteps.filter(step => step.level === area).map(step =>
    own.find(lesson => lesson.topic.id === step.topicId) ?? getCourseLesson(step.roadmap, step.lessonId)!.lesson);
  const lessons = [...new Map([...starters, ...own.filter(lesson => topicIds.has(lesson.topic.id) && lesson.topic.track !== "mathematics")].map(lesson => [lesson.id, lesson])).values()];
  if (profile === "beginner") lessons.sort((a, b) => {
    const rank = (id: string) => { const index = beginnerCore.findIndex(step => step.topicId === id); return index < 0 ? beginnerCore.length : index; };
    return rank(a.topic.id) - rank(b.topic.id);
  });
  return lessons.map(lesson => {
    const roadmap = own.some(item => item.id === lesson.id) ? profile : learningSteps.find(step => step.lessonId === lesson.id)!.roadmap;
    return { ...lesson, roadmap, href: lessonHref(roadmap, lesson.id), guided: Boolean(getLearningStep(lesson.topic.id)) };
  });
}
export function areaSupportingLessons(area: number, profile: JourneyLevel) {
  const level = ioaiLevels.find(item => item.number === area);
  const path = getJourney(profile);
  if (!level || !path) return [];
  const ids = new Set(level.topics.flatMap(topic => topic.topicIds));
  return courseFor(path).flatMap(unit => unit.lessons).filter(lesson => lesson.topic.track === "mathematics" && ids.has(lesson.topic.id))
    .map(lesson => ({ ...lesson, roadmap: profile, href: lessonHref(profile, lesson.id) }));
}
// A suggestion, never an access gate. Unavailable/guest progress is not evidence of completion.
export function recommendedAreaLesson(area: number, profile: JourneyLevel, records: readonly LessonProgress[], canSave: boolean) {
  return areaLessons(area, profile).find(lesson => !canSave || !records.some(row =>
    row.roadmap_id === lesson.roadmap && row.lesson_id === lesson.id && row.completed_at !== null));
}
export function recommendedAtlasLesson(profile: JourneyLevel, records: readonly LessonProgress[], canSave: boolean) {
  if (profile === "beginner") {
    for (const step of beginnerCore) {
      if (canSave && records.some(row => row.roadmap_id === step.roadmap && row.lesson_id === step.lessonId && row.completed_at !== null)) continue;
      return areaLessons(step.level, profile).find(lesson => lesson.id === step.lessonId && lesson.roadmap === step.roadmap);
    }
    return;
  }
  const start = startingProfiles.find(item => item.id === profile)!.startLevel;
  const levels = [...ioaiLevels.filter(level => level.number >= start), ...ioaiLevels.filter(level => level.number < start)];
  for (const level of levels) {
    const next = recommendedAreaLesson(level.number, profile, records, canSave);
    if (next) return next;
  }
}
export function areaReferences(area: number, profile: JourneyLevel) {
  const shown = new Set([...areaLessons(area, profile), ...areaSupportingLessons(area, profile)].map(lesson => lesson.topic.id));
  const ids = new Set(ioaiLevels.find(level => level.number === area)?.topics.flatMap(topic => topic.topicIds) ?? []);
  return [...ids].filter(id => !shown.has(id)).map(id => getTopicBySlug(id)!);
}
