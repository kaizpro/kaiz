import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypescript } from "./helpers/load-typescript.mjs";
const load = loadTypescript();
const { learningSteps, getLearningStep } = load("lib/learning/learning-steps.ts");
const { journeys } = load("lib/learning/journeys.ts");
const { courseFor } = load("lib/learning/course.ts");
const { beginnerStep } = load("lib/learning/beginner-learning.ts");

test("each guided practice states prerequisites, expected outcome and optional hints", () => {
  for (const step of learningSteps) {
    assert.ok(step.practice.prerequisites?.length, step.title);
    assert.ok(step.practice.expected?.length > 30, step.title);
    assert.ok(step.practice.hints?.length, step.title);
  }
  assert.equal(learningSteps[0].primary, "helsinki-variables");
  assert.equal(learningSteps[5].primary, "inria-first-model");
  assert.ok(learningSteps[0].extraMaterials.includes("python-intro"), "documentation is retained as reference");
});
test("every published beginner lesson has topic-specific, self-contained practice", () => {
  const { beginnerPractice } = load("lib/learning/beginner-practice.ts");
  const beginner = journeys.find(path => path.level === "beginner");
  const titles = new Set();
  for (const lesson of courseFor(beginner).flatMap(unit => unit.lessons)) {
    const practice = beginnerStep(lesson.topic.id)?.practice;
    assert.ok(practice, lesson.id); assert.ok(practice.instructions.length >= 2);
    assert.ok(practice.prerequisites.length); assert.ok(practice.expected); assert.ok(practice.hints.length);
    assert.equal(practice.validation, "self-check"); assert.ok(practice.code);
    titles.add(practice.title);
  }
  assert.equal(titles.size, 15, "not a repeated module-wide exercise");
  assert.equal(beginnerPractice.constructor, undefined);
});
test("all beginner lesson pages expose practice expectations without a code runner or completion writes", async () => {
  const { default: Page } = loadTypescript({
    "@/lib/data/learning-progress": { getOwnLearningState: async () => ({ user: null, records: [], error: null }) },
    "next/navigation": { notFound() { throw Error("Not found"); }, useRouter: () => ({ refresh() {} }) },
  })("app/roadmaps/[level]/lessons/[lesson]/page.tsx");
  for (const lesson of courseFor(journeys[0]).flatMap(unit => unit.lessons)) {
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ level: "beginner", lesson: lesson.id }) }));
    assert.match(html, /Expected outcome/); assert.match(html, /Optional hints/); assert.match(html, /Before you start/);
    assert.doesNotMatch(html, /<iframe|<textarea|Run code|<form/);
  }
});
test("the educational audit names all 40 existing lesson keys", () => {
  const doc = readFileSync(new URL("../docs/educational-quality-audit.md", import.meta.url), "utf8");
  const { publishableMaterial } = load("lib/learning/ioai-materials.ts");
  const rows = doc.split("\n").filter(line => /^\| \d+ \|/.test(line));
  assert.equal(rows.length, 40);
  assert.deepEqual(Object.fromEntries(["A", "B", "C", "D"].map(grade => [grade, rows.filter(row => row.includes(`| ${grade} |`)).length])), { A: 5, B: 18, C: 11, D: 6 });
  let count = 0;
  for (const path of journeys) for (const lesson of courseFor(path).flatMap(unit => unit.lessons)) {
    const key = `\`${path.level}/${lesson.id}\``;
    const row = rows.find(row => row.includes(key));
    assert.ok(row, lesson.id);
    const guided = path.level === "beginner" ? beginnerStep(lesson.topic.id) : getLearningStep(lesson.topic.id);
    const primary = guided ? publishableMaterial(guided.primary) : lesson.topic.resources[0];
    assert.ok(row.includes(primary.href), `audit primary matches rendered selection: ${key}`); count++;
  }
  assert.equal(count, 40);
  assert.match(doc, /not all educationally\s+complete/i);
});
