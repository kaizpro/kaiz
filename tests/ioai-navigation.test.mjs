import assert from "node:assert/strict";
import test from "node:test";
import { loadTypescript } from "./helpers/load-typescript.mjs";
const load = loadTypescript();
const { areaHref, readArea, areaLessons, areaSupportingLessons, areaReferences, areaForTopic } = load("lib/learning/ioai-navigation.ts");
const { ioaiLevels, startingProfiles } = load("lib/learning/ioai-curriculum.ts");
const { courseFor } = load("lib/learning/course.ts");
const { journeys } = load("lib/learning/journeys.ts");
test("next lesson uses only matching available persisted completion and never gates other lessons", () => {
  const { recommendedAreaLesson } = load("lib/learning/ioai-navigation.ts");
  const rows = areaLessons(1, "beginner");
  const done = rows.map(row => ({ roadmap_id: row.roadmap, lesson_id: row.id, completed_at: "2026-10-19T00:00:00Z" }));
  assert.equal(recommendedAreaLesson(1, "beginner", [], false).id, rows[0].id);
  assert.equal(recommendedAreaLesson(1, "beginner", done, false).id, rows[0].id, "guest/error state ignores supplied records");
  assert.equal(recommendedAreaLesson(1, "beginner", done.slice(0, 1), true).id, rows[1].id);
  assert.equal(recommendedAreaLesson(1, "beginner", [{ ...done[0], roadmap_id: "advanced" }], true).id, rows[0].id);
  assert.equal(recommendedAreaLesson(1, "beginner", [{ ...done[0], completed_at: null }], true).id, rows[0].id);
  assert.equal(recommendedAreaLesson(1, "beginner", done, true), undefined);
  assert.equal(recommendedAreaLesson(999, "beginner", [], true), undefined);
  assert.equal(areaLessons(1, "beginner").length, rows.length, "completion never removes a lesson");
});
test("atlas recommendation continues into the next open area and respects starting profiles", () => {
  const { recommendedAtlasLesson } = load("lib/learning/ioai-navigation.ts");
  assert.equal(recommendedAtlasLesson("beginner", [], false).topic.id, "python-fundamentals");
  assert.equal(recommendedAtlasLesson("intermediate", [], false).topic.id, "numpy");
  assert.equal(recommendedAtlasLesson("advanced", [], false).topic.id, "validation-strategies");
  const done = areaLessons(1, "beginner").map(row => ({ roadmap_id: row.roadmap, lesson_id: row.id, completed_at: "2026-10-19T00:00:00Z" }));
  assert.equal(recommendedAtlasLesson("beginner", done, true).topic.id, "numpy");
  const allDone = ioaiLevels.flatMap(level => areaLessons(level.number, "beginner")).map(row => ({ roadmap_id: row.roadmap, lesson_id: row.id, completed_at: "2026-10-19T00:00:00Z" }));
  assert.equal(recommendedAtlasLesson("beginner", allDone, true), undefined);
});
test("area selection is an optional, bounded URL value, never a content gate", () => {
  for (const value of [undefined, "", "0", "7", "-1", "1.2", "__proto__", "01", ["1", "2"]]) assert.equal(readArea(value), undefined);
  for (let i = 1; i <= 6; i++) assert.equal(readArea(String(i)), i);
  assert.equal(areaHref("beginner", 1), "/roadmaps/beginner?area=1#area-lessons");
});
test("every released lesson remains reachable through the three profiles and six areas", () => {
  const found = new Set();
  for (const profile of startingProfiles) for (const level of ioaiLevels) {
    const lessons = [...areaLessons(level.number, profile.id), ...areaSupportingLessons(level.number, profile.id)];
    assert.equal(new Set(lessons.map(l => l.id)).size, lessons.length);
    for (const item of lessons) {
      assert.ok(item.href.startsWith("/roadmaps/"));
      found.add(item.roadmap + "/" + item.id);
    }
  }
  const expected = journeys.flatMap(path => courseFor(path).flatMap(unit => unit.lessons.map(lesson => path.level + "/" + lesson.id)));
  for (const key of expected) assert.ok(found.has(key), key);
  assert.equal(expected.length, 40);
  assert.equal(areaLessons(999, "beginner").length, 0);
});
test("Beginner core keeps prerequisite order while maths and topic references remain optional", () => {
  const { beginnerCore } = load("lib/learning/beginner-learning.ts");
  for (const level of ioaiLevels) {
    const steps = beginnerCore.filter(step => step.level === level.number);
    const rows = areaLessons(level.number, "beginner");
    assert.ok(rows.every(row => row.topic.track !== "mathematics"), "supporting maths is not numbered as required Python work");
    assert.ok(areaSupportingLessons(level.number, "beginner").every(row => row.topic.track === "mathematics"));
    assert.deepEqual(Array.from(rows.slice(0, steps.length), r => r.topic.id), Array.from(steps, s => s.topicId));
    const references = areaReferences(level.number, "beginner");
    assert.equal(new Set(references.map(r => r.id)).size, references.length);
    for (const item of references) assert.ok(!rows.some(row => row.topic.id === item.id));
  }
  assert.equal(areaForTopic("numpy"), 2);
  assert.equal(areaForTopic("algebra"), 1);
  assert.equal(areaForTopic("missing"), undefined);
});
