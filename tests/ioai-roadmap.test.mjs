import assert from "node:assert/strict";
import test from "node:test";
import { loadTypescript } from "./helpers/load-typescript.mjs";

const load = loadTypescript();
const { ioaiLevels, startingProfiles, syllabus, topicDestination } = load("lib/learning/ioai-curriculum.ts");
const { learningSteps, nextLearningStep, getLearningStep } = load("lib/learning/learning-steps.ts");
const { ioaiMaterials, publishableMaterial } = load("lib/learning/ioai-materials.ts");
const { getTopicBySlug, getTopics } = load("lib/learning/curriculum.ts");
const { courseLessonFromSegment, courseFor } = load("lib/learning/course.ts");
const { journeys } = load("lib/learning/journeys.ts");

test("six levels organize existing topics without changing released course identities", () => {
  assert.deepEqual(Array.from(ioaiLevels, l => l.number), [1, 2, 3, 4, 5, 6]);
  assert.equal(getTopics().length, 85);
  assert.equal(journeys.flatMap(j => courseFor(j).flatMap(m => m.lessons)).length, 40);
  const ids = new Set();
  for (const level of ioaiLevels) {
    assert.ok(level.summary && level.readiness && level.coverage);
    for (const item of level.topics) {
      assert.ok(item.title && item.mode && item.scope);
      assert.ok(!ids.has(item.id), item.id); ids.add(item.id);
      for (const id of item.topicIds) assert.ok(getTopicBySlug(id), id);
      if (item.scope === "ioai-2026") assert.ok(["Theory", "Practice", "Both"].includes(item.mode));
      else assert.equal(item.mode, "Preparation");
    }
  }
  assert.match(syllabus.href, /^https:\/\/ioai-official\.org\//);
  assert.equal(topicDestination("not-a-topic"), undefined);
});

test("profiles suggest starts rather than gating any lesson or fabricating assessment", () => {
  assert.deepEqual(Array.from(startingProfiles, p => p.id), ["beginner", "intermediate", "advanced"]);
  assert.equal(startingProfiles[0].startTopic, "python-fundamentals");
  assert.equal(startingProfiles[1].startTopic, "numpy");
  assert.equal(startingProfiles[2].startTopic, "validation-strategies");
  for (const profile of startingProfiles) {
    assert.ok(getTopicBySlug(profile.startTopic));
    assert.ok(profile.reason && profile.skipAdvice);
    assert.match(topicDestination(profile.startTopic, profile.id), /^\/roadmaps\//);
  }
});

test("first journey has six reachable stable lessons, specific practice, checks and a safe next action", () => {
  assert.deepEqual(Array.from(learningSteps, s => s.topicId), ["python-fundamentals", "python-control-flow", "numpy", "pandas", "exploratory-analysis", "ml-fundamentals"]);
  for (const [index, step] of learningSteps.entries()) {
    const value = courseLessonFromSegment(step.roadmap, step.lessonId);
    assert.equal(value?.lesson.topic.id, step.topicId);
    assert.ok(step.objective && step.why && step.learnInstruction && step.practice.title);
    assert.ok(step.practice.instructions.length >= 3);
    assert.ok(step.readiness.length >= 2);
    assert.ok(step.practice.code);
    assert.equal(publishableMaterial(step.primary)?.verification.status, "verified");
    for (const id of step.mathTopics) assert.ok(getTopicBySlug(id));
    assert.equal(nextLearningStep(step.topicId)?.topicId, learningSteps[index + 1]?.topicId);
  }
  for (const id of ["__proto__", "missing", "constructor"]) {
    assert.equal(getLearningStep(id), undefined);
    assert.equal(nextLearningStep(id), undefined);
  }
});

test("materials retain provenance, exact scope and access evidence; uncertain resources have no published action", () => {
  assert.equal(new Set(ioaiMaterials.map(r => r.id)).size, ioaiMaterials.length);
  for (const resource of ioaiMaterials) {
    const url = new URL(resource.href);
    assert.equal(url.protocol, "https:");
    assert.equal(url.username + url.password, "");
    for (const key of ["title", "provider", "language", "difficulty", "kind", "access"]) assert.ok(resource[key]);
    assert.ok(Array.isArray(resource.prerequisites));
    assert.ok(resource.verification.checkedAt && resource.verification.notes);
    assert.ok(["verified", "partially-verified", "candidate", "unavailable"].includes(resource.verification.status));
    assert.equal(Boolean(publishableMaterial(resource.id)), resource.verification.status === "verified");
  }
  assert.equal(publishableMaterial("__proto__"), undefined);
  assert.equal(publishableMaterial("kaggle-python"), undefined);
  assert.equal(publishableMaterial("stepik-python"), undefined);
  assert.equal(publishableMaterial("ioai-problems-old"), undefined);
});

test("Iris project separates training and evaluation with a baseline and reproducibility", () => {
  const step = getLearningStep("ml-fundamentals");
  const text = JSON.stringify(step);
  for (const term of ["train_test_split", "stratify", "random_state", "DummyClassifier", "fit", "accuracy_score", "f1_score", "load_iris", "leakage"]) assert.ok(text.includes(term), term);
  assert.ok(step.readiness.some(t => /test|held.out/i.test(t)));
  assert.equal(step.practice.validation, "self-check");
  assert.match(step.after.href, /^\/roadmaps\//);
});
