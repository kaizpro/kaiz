import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypescript } from "./helpers/load-typescript.mjs";
const load = loadTypescript();
const { StartingPoints, IoaiOverview, AreaStudyNotes } = load("components/learning/ioai-overview.tsx");
const { GuidedLesson } = load("components/learning/guided-lesson.tsx");
const { learningSteps, learningStepHref } = load("lib/learning/learning-steps.ts");
const { startingProfiles } = load("lib/learning/ioai-curriculum.ts");
const render = (component, props = {}) => renderToStaticMarkup(React.createElement(component, props));

test("landing is exactly three entry cards, not a curriculum or resource catalogue", () => {
  const html = render(StartingPoints, { records: [], ready: false });
  assert.equal((html.match(/data-entry-profile=/g) ?? []).length, 3);
  for (const profile of startingProfiles) assert.ok(html.includes(`href="/roadmaps/${profile.id}"`));
  for (const text of ["Start from zero", "I know Python", "I know ML"]) assert.ok(html.includes(text));
  assert.doesNotMatch(html, /<details|<progress|\d+%|\bXP\b|href="https:|self-check|prerequisites/i);
});
test("atlas contains six area actions and exactly one next lesson, not a lesson catalogue", () => {
  const html = render(IoaiOverview, { profile: "beginner" });
  assert.equal((html.match(/data-path-area=/g) ?? []).length, 6);
  for (const title of ["Python", "Data", "Machine Learning", "Deep Learning", "Specializations", "IOAI Preparation"]) assert.ok(html.includes(title));
  assert.match(html, /Suggested order/); assert.match(html, /Start here/);
  assert.equal((html.match(/data-next-lesson=/g) ?? []).length, 1);
  assert.equal((html.match(/href="[^\"]*\/lessons\//g) ?? []).length, 1);
  assert.match(html, /Recommended next/);
  assert.doesNotMatch(html, /data-primary-material|href="https:|<details|Ready for|readiness/);
});
test("second layer reveals only the selected area, with preserved real lesson links and optional references", () => {
  const html = render(IoaiOverview, { profile: "beginner", area: 1 });
  assert.match(html, /id="area-lessons"/); assert.match(html, /Python Basics/); assert.match(html, /Python Practice/);
  assert.ok(html.includes(learningStepHref(learningSteps[0])));
  assert.equal((html.match(/data-path-area=/g) ?? []).length, 6, "area context stays in the map");
  assert.equal((html.match(/aria-current="step"/g) ?? []).length, 1);
  assert.equal((html.match(/<ol[^>]*aria-label="[^\"]* lessons"/g) ?? []).length, 1);
  assert.equal((html.match(/data-next-lesson=/g) ?? []).length, 1);
  assert.match(html, /<summary>Maths alongside/);
  assert.doesNotMatch(html, /<details[^>]*open|scikit-learn|data-primary-material|href="https:|What you’ll learn/);
  assert.match(html, /All areas/);
  assert.match(render(IoaiOverview, { profile: "advanced", area: 5 }), /Upcoming/);
  const notes = render(AreaStudyNotes, { topicId: "python-fundamentals", profile: "beginner" });
  assert.match(notes, /IOAI 2026 syllabus/); assert.match(notes, /original mentor plan/i);
});
test("only matching persisted lesson rows show completion, never inferred area mastery", () => {
  const props = { profile: "beginner", area: 1, records: [{ roadmap_id: "beginner", lesson_id: "python-algebra:python-fundamentals", completed_at: "2026-10-18T00:00:00Z" }] };
  assert.doesNotMatch(render(IoaiOverview, props), /Completed · self-reported/);
  assert.match(render(IoaiOverview, { ...props, canSave: true }), /Completed · self-reported/);
  assert.doesNotMatch(render(IoaiOverview, { ...props, canSave: true, records: [{ ...props.records[0], roadmap_id: "advanced" }] }), /Completed · self-reported/);
});
test("profile read failures stay visible without claiming empty or completed progress", async () => {
  const { default: Page } = loadTypescript({
    "@/lib/data/learning-progress": { getOwnLearningState: async () => ({ user: { id: "fixture" }, records: [], error: "Saved progress is unavailable." }) },
    "next/navigation": { notFound() { throw Error("Not found"); }, useRouter: () => ({ refresh() {} }) },
  })("app/start/[level]/page.tsx");
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ level: "beginner" }) }));
  assert.equal((html.match(/role="alert"/g) ?? []).length, 1);
  assert.ok(html.indexOf('role="alert"') < html.indexOf("<details") || !html.includes("<details"), "failure is not buried in a closed disclosure");
  assert.doesNotMatch(html, /<progress|\d+%|\d+ Learning XP|Completed · self-reported/);
});
test("known resource access gaps remain inactive even in older course selections", () => {
  const { LessonMaterials } = load("components/learning/lesson-materials.tsx");
  for (const href of ["https://www.kaggle.com/learn/python", "https://stepik.org/course/58852", "https://ioai-official.org/problems/"]) {
    const html = render(LessonMaterials, { resources: [{ id: "old-selection", title: "Existing selection", kind: "course", href }] });
    assert.doesNotMatch(html, /target="_blank"/); assert.match(html, /No active resource link/);
  }
});
test("all verified materials and original profile practice sources remain reachable at lesson depth", () => {
  const { ioaiMaterials } = load("lib/learning/ioai-materials.ts");
  const { practiceSources } = load("lib/learning/practice-sources.ts");
  const { journeys } = load("lib/learning/journeys.ts");
  const { courseFor } = load("lib/learning/course.ts");
  let html = learningSteps.map(step => render(GuidedLesson, { step })).join("");
  const { beginnerStep } = load("lib/learning/beginner-learning.ts");
  for (const lesson of courseFor(journeys[0]).flatMap(unit => unit.lessons)) html += render(GuidedLesson, { step: beginnerStep(lesson.topic.id) });
  for (const path of journeys) for (const lesson of courseFor(path).flatMap(unit => unit.lessons)) html += render(AreaStudyNotes, { topicId: lesson.topic.id, profile: path.level });
  for (const resource of ioaiMaterials.filter(item => item.verification.status === "verified")) assert.ok(html.includes(resource.href), resource.id);
  for (const resource of Object.values(practiceSources)) assert.ok(html.includes(resource.href), resource.title);
});
test("lesson content is preserved behind the Learn Practice Next hierarchy", () => {
  for (const [index, step] of learningSteps.entries()) {
    const html = render(GuidedLesson, { step });
    for (const id of ["learn", "practice", "check", "next"]) assert.ok(html.includes(`id="${id}"`));
    for (const text of [step.objective, step.why, ...step.readiness]) assert.ok(html.includes(text.replaceAll("&", "&amp;").replaceAll("'", "&#x27;")));
    assert.match(html, /KAIZ does not run or judge code/); assert.match(html, /Worked example/); assert.match(html, /Ready to move on/);
    assert.equal((html.match(/data-primary-material/g) ?? []).length, 1);
    assert.doesNotMatch(html, /automatic assessment|mastery badge/);
    assert.match(html, /Practice on Kaggle/);assert.match(html,/KAIZ does not verify external solutions/);
    assert.match(html, /data-practice-instructions="true"><summary>Task instructions/);
    assert.ok(html.includes(learningSteps[index + 1] ? learningStepHref(learningSteps[index + 1]) : step.after.href));
    assert.match(html, /Local Python setup/);
  }
});
