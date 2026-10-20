import test from "node:test";
import assert from "node:assert/strict";
import { loadTypescript } from "./helpers/load-typescript.mjs";
const load = loadTypescript();
test("Beginner core teaches Python prerequisites before data and ends at evaluation, not deep learning", () => {
  const { beginnerCore, beginnerStep, beginnerNeighbors } = load("lib/learning/beginner-learning.ts");
  assert.deepEqual(Array.from(beginnerCore, step => step.topicId), ["python-fundamentals", "python-control-flow", "python-functions", "python-collections", "numpy", "pandas", "exploratory-analysis", "supervised-learning", "building-baselines", "ml-fundamentals", "model-evaluation"]);
  const { getCourseLesson } = load("lib/learning/course.ts");
  for (const step of beginnerCore) assert.equal(getCourseLesson(step.roadmap, step.lessonId).lesson.topic.id, step.topicId);
  assert.match(beginnerStep("python-control-flow").practice.code, /for /);
  assert.doesNotMatch(beginnerStep("python-control-flow").practice.code, /def |import |Random/);
  assert.doesNotMatch(beginnerStep("building-baselines").practice.prerequisites.join(" "), /First ML Model/);
  assert.equal(beginnerNeighbors("model-evaluation").after.href, "/roadmaps/beginner");
  for (const id of ["neural-networks", "backpropagation", "pytorch"]) {
    assert.match(beginnerStep(id).learnInstruction, /Optional next-stage/);
    assert.ok(!beginnerCore.some(step => step.topicId === id));
  }
});
test("Beginner recommendations require real matching core completion and never require optional DL", () => {
  const { beginnerCore } = load("lib/learning/beginner-learning.ts");
  const { recommendedAtlasLesson, areaLessons } = load("lib/learning/ioai-navigation.ts");
  const records = beginnerCore.map(step => ({ roadmap_id: step.roadmap, lesson_id: step.lessonId, completed_at: "2026-10-19", updated_at: "2026-10-19", started_at: "2026-10-19" }));
  assert.equal(recommendedAtlasLesson("beginner", records, true), undefined);
  assert.equal(recommendedAtlasLesson("beginner", records, false).topic.id, "python-fundamentals");
  assert.equal(recommendedAtlasLesson("beginner", records.slice(0, 2), true).topic.id, "python-functions");
  assert.deepEqual(Array.from(areaLessons(3, "beginner"), lesson => lesson.topic.id), ["supervised-learning", "building-baselines", "ml-fundamentals", "model-evaluation"]);
  assert.equal(areaLessons(4, "beginner").length, 3, "optional lessons remain independently accessible");
});
test("all Beginner teaching headers agree with the existing course area and preserve verified primaries", () => {
  const { beginnerStep } = load("lib/learning/beginner-learning.ts");
  const { areaForTopic } = load("lib/learning/ioai-navigation.ts");
  const { courseFor } = load("lib/learning/course.ts");
  const { getJourney } = load("lib/learning/journeys.ts");
  const { publishableMaterial } = load("lib/learning/ioai-materials.ts");
  for (const lesson of courseFor(getJourney("beginner")).flatMap(unit => unit.lessons)) {
    const step = beginnerStep(lesson.topic.id);
    assert.equal(step.lessonId, lesson.id);
    assert.equal(step.level, areaForTopic(lesson.topic.id, "beginner"), lesson.id);
    assert.ok(publishableMaterial(step.primary), lesson.id);
  }
});
