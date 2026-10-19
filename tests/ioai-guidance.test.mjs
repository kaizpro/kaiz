import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypescript } from "./helpers/load-typescript.mjs";
const load = loadTypescript();
const { LearningOverview, IoaiOverview } = load("components/learning/ioai-overview.tsx");
const { areaHref, areaLessons } = load("lib/learning/ioai-navigation.ts");
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const record = { roadmap_id: "beginner", lesson_id: "python-algebra:python-fundamentals", completed_at: "2026-10-19T00:00:00Z" };

test("profile overview offers a direct next lesson before six compact courses, with a secondary map", () => {
  const html = render(LearningOverview, { profile: "beginner" });
  assert.match(html, /YOUR NEXT LESSON/); assert.match(html, /Python Basics/); assert.match(html, /Start Learning/);
  assert.match(html, /Explore Skill Map/); assert.match(html, /view=map/);
  assert.equal((html.match(/data-course-area=/g) ?? []).length, 6);
  assert.doesNotMatch(html, /data-atlas-root|data-atlas-branch|<progress|\bXP\b/);
  assert.ok(html.indexOf("Start Learning") < html.indexOf("data-course-area"));
});
test("continue requires a reliable matching completion, not guest, failed, unknown or merely opened records", () => {
  for (const props of [
    { records: [record] },
    { records: [{ ...record, completed_at: null }], canSave: true },
    { records: [{ ...record, roadmap_id: "advanced" }], canSave: true },
    { records: [{ ...record, lesson_id: "unknown" }], canSave: true },
  ]) assert.match(render(LearningOverview, { profile: "beginner", ...props }), /Start Learning/);
  const html = render(LearningOverview, { profile: "beginner", records: [record], canSave: true });
  assert.match(html, /Continue Learning/); assert.match(html, /Python Practice/);
});
test("all-complete overview stays explorable without fabricating a next lesson", () => {
  const records = Array.from({ length: 6 }, (_, i) => areaLessons(i + 1, "beginner")).flat().map(item => ({ roadmap_id: item.roadmap, lesson_id: item.id, completed_at: record.completed_at }));
  const html = render(LearningOverview, { profile: "beginner", records, canSave: true });
  assert.doesNotMatch(html, /Start Learning|Continue Learning|data-next-lesson/);
  assert.match(html, /Review any course/); assert.match(html, /Explore Skill Map/);
});
test("legitimate supporting mathematics completion also counts as saved progress, not as a Python prerequisite", () => {
  const html = render(LearningOverview, { profile: "beginner", canSave: true, records: [{ ...record, lesson_id: "python-algebra:algebra" }] });
  assert.match(html, /Continue Learning/); assert.match(html, /Python Basics/);
  assert.doesNotMatch(html, /prerequisite|locked|required maths/i);
});
test("course mode exposes ordered existing lessons without requiring map expansion", () => {
  const html = render(IoaiOverview, { profile: "beginner", area: 1, course: true });
  assert.match(html, /Python Basics/); assert.match(html, /Python Practice/);
  assert.match(html, /aria-label="Python lessons"/); assert.match(html, /Maths alongside/);
  assert.doesNotMatch(html, /data-path-area|data-atlas-root|data-atlas-connections/);
  for (const item of areaLessons(1, "beginner")) assert.ok(html.includes(item.href));
});
test("map selection preserves map mode while original course URLs remain stable", () => {
  assert.equal(areaHref("beginner", 1), "/roadmaps/beginner?area=1#area-lessons");
  assert.equal(areaHref("beginner", 1, "map"), "/roadmaps/beginner?view=map&area=1#area-lessons");
  const html = render(IoaiOverview, { profile: "beginner", area: 1 });
  assert.match(html, /view=map&amp;area=2/);
});

test("each released lesson has one current course entry, stable return links and mobile contents control", async () => {
  const pageLoad = loadTypescript({
    "@/lib/data/learning-progress": { getOwnLearningState: async () => ({ user: null, records: [], error: null }) },
    "next/navigation": { notFound() { throw Error("Not found"); }, useRouter: () => ({ refresh() {} }) },
  });
  const { default: Page } = pageLoad("app/roadmaps/[level]/lessons/[lesson]/page.tsx");
  const { journeys } = load("lib/learning/journeys.ts");
  const { courseFor } = load("lib/learning/course.ts");
  let count = 0;
  for (const path of journeys) for (const item of courseFor(path).flatMap(unit => unit.lessons)) {
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ level: path.level, lesson: encodeURIComponent(item.id) }) }));
    assert.match(html, /Course Contents/);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1, item.id);
    assert.match(html, /aria-controls="course-contents"/);
    assert.match(html, /aria-label="Lesson sequence"/);
    assert.doesNotMatch(html, /<form|<progress|Mark completed|\d+ Learning XP/);
    count++;
  }
  assert.equal(count, 40);
});
