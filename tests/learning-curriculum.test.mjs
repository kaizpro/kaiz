import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(file) {
  const source = readFileSync(new URL(`../lib/learning/${file}.ts`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, URL, URLSearchParams, require: (name) => load(name.replace("./", "")) });
  return exports;
}

test("catalogue has a single root and two equal top-level tracks", () => {
  const { curriculum, getChildren } = load("curriculum");
  assert.equal(curriculum.filter((node) => node.parentId === null).length, 1);
  assert.deepEqual(Array.from(getChildren("kaiz-learning"), (node) => node.id), ["coding-ai", "mathematics"]);
});

test("IDs, slugs, parent relationships and sibling ordering are stable and unique", () => {
  const { curriculum, getNode, getChildren, getPath } = load("curriculum");
  for (const key of ["id", "slug"]) assert.equal(new Set(curriculum.map((node) => node[key])).size, curriculum.length);
  for (const node of curriculum) {
    assert.match(node.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(node.description.trim());
    const path = getPath(node.id);
    assert.equal(new Set(path.map((entry) => entry.id)).size, path.length, "no hierarchy cycles");
    assert.equal(path[0].id, "kaiz-learning");
    assert.equal(path.at(-1).id, node.id);
    if (node.parentId) {
      assert.ok(getNode(node.parentId));
      assert.ok(getChildren(node.parentId).some((child) => child.id === node.id));
    }
    const children = getChildren(node.id);
    assert.equal(new Set(children.map((child) => child.order)).size, children.length);
    assert.deepEqual(Array.from(children, (child) => child.order), Array.from(children, (child) => child.order).sort((a, b) => a - b));
    assert.deepEqual(Array.from(node.children, (child) => child.id), Array.from(children, (child) => child.id));
  }
  assert.equal(getNode("__proto__"), undefined);
  assert.equal(getPath("missing").length, 0);
});

test("every topic has reviewed external resources or an honest empty state and a navigable route", () => {
  const { getTopics, getTopicBySlug, topicHref } = load("curriculum");
  assert.equal(getTopics().length, 85);
  assert.equal(getTopics("coding-ai").length, 51);
  assert.equal(getTopics("mathematics").length, 34);
  for (const node of getTopics()) {
    assert.equal(new Set(node.resources.map(resource => resource.id)).size, node.resources.length);
    for (const resource of node.resources) {
      const url = new URL(resource.href);
      assert.equal(url.protocol, "https:");
      assert.equal(url.username + url.password, "");
      assert.ok(resource.title.trim());
      assert.ok(["article", "video", "exercise"].includes(resource.kind));
    }
    assert.equal(node.children.length, 0);
    assert.equal(topicHref(node), `/learn/${node.slug}`);
    assert.equal(getTopicBySlug(node.slug)?.id, node.id);
    assert.ok(["coding-ai", "mathematics"].includes(node.track));
  }
  assert.equal(getTopicBySlug("programming"), undefined);
  assert.equal(getTopicBySlug("unknown"), undefined);
  assert.ok(getTopics().some(node => node.resources.length > 0));
  assert.ok(getTopics().some(node => node.resources.length === 0));
});

test("Python and C++ are independent and prerequisites exist without cycles", () => {
  const { curriculum, getNode } = load("curriculum");
  assert.equal(getNode("python").parentId, "programming");
  assert.equal(getNode("cpp").parentId, "programming");
  assert.equal(getNode("python").prerequisites.includes("cpp"), false);
  assert.equal(getNode("cpp").prerequisites.includes("python"), false);
  function visit(id, path = []) {
    assert.equal(path.includes(id), false, `prerequisite cycle: ${path} -> ${id}`);
    for (const prerequisite of getNode(id).prerequisites) {
      assert.ok(getNode(prerequisite), prerequisite);
      visit(prerequisite, [...path, id]);
    }
  }
  for (const node of curriculum) visit(node.id);
  assert.ok(getNode("machine-learning").prerequisites.includes("python-fundamentals"));
  assert.ok(getNode("machine-learning").prerequisites.includes("vectors"));
  assert.ok(getNode("deep-learning").prerequisites.includes("ml-fundamentals"));
  assert.ok(getNode("computer-vision").prerequisites.includes("neural-networks"));
  assert.ok(getNode("nlp-llms").prerequisites.includes("transformers"));
  assert.equal(curriculum.filter((node) => node.title === "Transformers").length, 1);
  assert.equal(curriculum.filter((node) => node.title === "Gradient Descent").length, 1);
});

test("presentation stages cover every major area exactly once", () => {
  const { stages, getChildren, getNode } = load("curriculum");
  for (const track of ["coding-ai", "mathematics"]) {
    const ids = stages[track].flatMap((stage) => stage.areas);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual([...ids].sort(), Array.from(getChildren(track), (node) => node.id).sort());
    for (const id of ids) assert.equal(getNode(id).track, track);
  }
});

test("unknown query values cannot create nodes, routes or cross-track selection", () => {
  const { readRoadmapState } = load("navigation");
  assert.equal(readRoadmapState(new URLSearchParams()).track, null);
  const state = readRoadmapState(new URLSearchParams("track=mathematics&open=python,calculus,missing&topic=python-fundamentals"));
  assert.equal(state.track, "mathematics");
  assert.deepEqual(Array.from(state.open), ["calculus"]);
  assert.equal(state.topic, null);
  assert.equal(readRoadmapState(new URLSearchParams("track=javascript:bad&open=__proto__")).track, null);
});

test("topic return URLs restore its entire path and active context", () => {
  const { getTopics, getPath } = load("curriculum");
  const { roadmapForNode, readRoadmapState } = load("navigation");
  for (const topic of getTopics()) {
    const url = new URL(roadmapForNode(topic.id), "http://localhost");
    const state = readRoadmapState(url.searchParams);
    assert.equal(state.track, topic.track);
    assert.equal(state.topic, topic.id);
    assert.equal(url.hash, `#node-${topic.id}`);
    for (const parent of getPath(topic.id).filter((node) => node.kind === "group")) assert.ok(state.open.includes(parent.id));
  }
});

test("disclosure state round-trips and collapse prunes descendants without reopening selected paths", () => {
  const { readRoadmapState, toggleBranch, roadmapHref } = load("navigation");
  let state = readRoadmapState(new URLSearchParams("track=coding-ai&open=programming,python&topic=python-fundamentals"));
  state = toggleBranch(state, "programming");
  assert.equal(state.open.includes("python"), false);
  assert.equal(state.topic, "python-fundamentals");
  const restored = readRoadmapState(new URL(roadmapHref(state), "http://localhost").searchParams);
  assert.deepEqual(Array.from(restored.open), []);
  assert.equal(restored.topic, "python-fundamentals");
  state = toggleBranch(restored, "python");
  assert.ok(state.open.includes("programming"));
  assert.ok(state.open.includes("python"));
});

test("return navigation keeps exploration context without accepting untrusted destinations", () => {
  const { topicReturnHref, readRoadmapState, roadmapForNode } = load("navigation");
  const href = topicReturnHref("numpy", "/learn?track=coding-ai&open=data-science,programming&topic=pandas#node-pandas");
  const state = readRoadmapState(new URL(href, "http://localhost").searchParams);
  assert.equal(state.topic, "numpy");
  for (const id of ["data-science", "programming", "python"]) assert.ok(state.open.includes(id));
  for (const unsafe of [null, "https://example.invalid", "//example.invalid", "javascript:alert(1)", "/learn/../auth/login", "/learn?track=mathematics", "/learn?" + "x".repeat(4001)]) {
    assert.equal(topicReturnHref("numpy", unsafe), roadmapForNode("numpy"));
  }
});
