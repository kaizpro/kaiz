import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, posix } from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const React = nativeRequire("react");
const { renderToStaticMarkup } = nativeRequire("react-dom/server");
function modules(overrides = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(compiled, { exports, URL, URLSearchParams, require: name => {
      if (name in overrides) return overrides[name];
      if (name === "next/link") return { default: ({ children, ...props }) => React.createElement("a", props, children) };
      if (name.startsWith("@/")) { const ext = name.startsWith("@/components/") ? ".tsx" : ".ts"; return load(name.slice(2) + ext); }
      if (name.startsWith("./")) return load(posix.join(dirname(file).replaceAll("\\", "/"), name) + ".ts");
      return nativeRequire(name);
    } });
    return exports;
  }
  return load;
}

test("three editorial paths have ordered goals, real topics, publisher resources and self-checks", () => {
  const load = modules(); const { journeys, getJourney } = load("lib/learning/journeys.ts");
  const { getTopicBySlug } = load("lib/learning/curriculum.ts");
  assert.deepEqual(Array.from(journeys, p => p.level), ["beginner", "intermediate", "advanced"]);
  for (const path of journeys) {
    assert.equal(path.steps.length, 4); assert.ok(path.audience && path.outcome && path.summary);
    for (const step of path.steps) {
      assert.ok(step.goal && step.milestone); assert.ok(step.topics.length);
      for (const id of step.topics) { assert.ok(getTopicBySlug(id), id); assert.ok(getTopicBySlug(id).resources.length, id); }
    }
  }
  for (const invalid of ["__proto__", "constructor", "javascript:bad", "Beginner", "missing"]) assert.equal(getJourney(invalid), undefined);
});

test("curated resources attach only to real topics and original HTTPS publishers", () => {
  const load = modules(); const { resourcesByTopic } = load("lib/learning/resources.ts");
  const { getTopicBySlug } = load("lib/learning/curriculum.ts");
  const hosts = new Set(["docs.python.org", "developers.google.com", "ocw.mit.edu", "numpy.org", "pandas.pydata.org", "scikit-learn.org", "docs.pytorch.org"]);
  for (const [id, resources] of Object.entries(resourcesByTopic)) {
    assert.ok(getTopicBySlug(id));
    for (const resource of resources) { const url = new URL(resource.href); assert.equal(url.protocol, "https:"); assert.ok(hosts.has(url.hostname)); assert.equal(url.username + url.password, ""); }
  }
});

test("level choice renders exactly three real roadmap links without ratings or simulated progress", () => {
  const { JourneyChoices } = modules()("components/learning/journey-choices.tsx");
  const html = renderToStaticMarkup(React.createElement(JourneyChoices));
  assert.equal((html.match(/href="\/start\//g) ?? []).length, 3);
  for (const level of ["beginner", "intermediate", "advanced"]) assert.ok(html.includes(`/start/${level}`));
  assert.doesNotMatch(html, /\d+%|rating|completed/i);
});

test("topic membership and category suggestions are editorial, valid and prototype-safe", () => {
  const load = modules(); const { journeysForTopic, preparationTopics } = load("lib/learning/journeys.ts");
  const { getTopicBySlug } = load("lib/learning/curriculum.ts");
  assert.equal(journeysForTopic("python-fundamentals")[0].level, "beginner");
  assert.equal(journeysForTopic("not-a-topic").length, 0);
  for (const category of ["Machine Learning", "Computer Vision", "NLP", "LLM", "Algorithms"]) for (const id of preparationTopics(category)) assert.ok(getTopicBySlug(id));
  assert.equal(preparationTopics("__proto__").length, 0);
  const html = renderToStaticMarkup(React.createElement(load("components/learning/preparation-links.tsx").PreparationLinks, { category: "Machine Learning" }));
  assert.match(html, /Editorial suggestions/); assert.match(html, /\/start/); assert.match(html, /\/learn\/ml-fundamentals/); assert.match(html, /\/discussions\?category=help/);
});

test("competition recommendations show only actual listed records, not unimported research", async () => {
  const listed = [{ id: "fixture", slug: "ioai-2026", title: "Listed edition", status: "completed" }];
  const load = modules({ "@/lib/data/competitions": { listCompetitions: async () => listed } });
  const html = renderToStaticMarkup(await load("components/learning/journey-competitions.tsx").JourneyCompetitions({ slugs: ["ioai-2026", "unimported-edition"] }));
  assert.match(html, /\/competitions\/ioai-2026/); assert.doesNotMatch(html, /unimported-edition/);
});

test("recommendation empty/error states do not fabricate records or replace the roadmap", async () => {
  const empty = modules({ "@/lib/data/competitions": { listCompetitions: async () => [] } });
  const failed = modules({ "@/lib/data/competitions": { listCompetitions: async () => { throw Error("unit-only outage"); } } });
  assert.match(renderToStaticMarkup(await empty("components/learning/journey-competitions.tsx").JourneyCompetitions({ slugs: [] })), /No suggested editions/);
  assert.match(renderToStaticMarkup(await failed("components/learning/journey-competitions.tsx").JourneyCompetitions({ slugs: [] })), /roadmap and official learning resources remain available/);
});

test("homepage discovery keeps empty and failed live reads honest without leaking errors", async () => {
  const empty = modules({
    "@/lib/data/competitions": { listCompetitions: async () => [] },
    "@/lib/data/discussions": { listDiscussionPosts: async () => ({ posts: [] }) },
  })("components/home-discovery.tsx");
  assert.match(renderToStaticMarkup(await empty.HomeCompetitions()), /No competition editions listed/);
  assert.match(renderToStaticMarkup(await empty.HomeDiscussions()), /No discussions yet/);
  const fail = async () => { throw Error("private provider diagnostic"); };
  const failed = modules({
    "@/lib/data/competitions": { listCompetitions: fail },
    "@/lib/data/discussions": { listDiscussionPosts: fail },
  })("components/home-discovery.tsx");
  const html = renderToStaticMarkup(await failed.HomeCompetitions()) + renderToStaticMarkup(await failed.HomeDiscussions());
  assert.match(html, /temporarily unavailable/);
  assert.doesNotMatch(html, /private provider diagnostic/);
});

test("homepage discussions renders actual returned threads, not starter-question suggestions", async () => {
  const { HomeDiscussions } = modules({
    "@/lib/data/competitions": { listCompetitions: async () => [] },
    "@/lib/data/discussions": { listDiscussionPosts: async () => ({ posts: [{ id: "unit-thread", title: "Returned thread", reply_count: 2, created_at: "2026-10-14T00:00:00Z" }] }) },
  })("components/home-discovery.tsx");
  const html = renderToStaticMarkup(await HomeDiscussions());
  assert.match(html, /Returned thread/);
  assert.match(html, /\/discussions\/unit-thread/);
  assert.doesNotMatch(html, /How do I start preparing for IOAI/);
});

test("external practice remains source-only, with no fake problem UUIDs or scores", () => {
  const load = modules(); const { PracticeSources } = load("components/learning/practice-sources.tsx");
  const html = renderToStaticMarkup(React.createElement(PracticeSources, { level: "advanced" }));
  assert.match(html, /https:\/\/ioai-official.org\/2024-tasks\//); assert.match(html, /not scored KAIZ submissions/);
  assert.doesNotMatch(html, /href="\/problems\//);
});

test("official results are external source links, not automatic publication or inferred final ranks", () => {
  const load = modules(); const { getOfficialResultLink } = load("lib/results/official-links.ts");
  assert.equal(getOfficialResultLink("__proto__"), undefined); assert.equal(getOfficialResultLink("neoai-2026"), undefined);
  const { OfficialResultSource } = load("components/official-result-source.tsx");
  const html = renderToStaticMarkup(React.createElement(OfficialResultSource, { slug: "euroai-2026" }));
  assert.match(html, /Member standings and remote awards/); assert.match(html, /do not mean a complete leaderboard/);
  const unknown = renderToStaticMarkup(React.createElement(OfficialResultSource, { slug: "unknown" }));
  assert.match(unknown, /does not mean results are unavailable/);
});
