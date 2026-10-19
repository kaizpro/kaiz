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
const sourceTopics = JSON.parse(readFileSync(new URL("../content/learning/source-topics.json", import.meta.url), "utf8"));
const sourcePlan = JSON.parse(readFileSync(new URL("../content/learning/beginner-source-plan.json", import.meta.url), "utf8"));
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
      if (name.endsWith(".module.css")) return { default: new Proxy({}, { get: (_target, key) => String(key) }) };
      if (name.startsWith("@/content/") && name.endsWith(".json")) return { default: JSON.parse(readFileSync(new URL(`../${name.slice(2)}`, import.meta.url), "utf8")) };
      if (name.startsWith("@/")) { const ext = name.startsWith("@/components/") ? ".tsx" : ".ts"; return load(name.slice(2) + ext); }
      if (name.startsWith("./")) return load(posix.join(dirname(file).replaceAll("\\", "/"), name) + ".ts");
      return nativeRequire(name);
    } });
    return exports;
  }
  return load;
}

test("all 64 source topics retain order, groups, mode and honest canonical matches", () => {
  const load = modules(); const { getTopics, getTopicBySlug } = load("lib/learning/curriculum.ts");
  assert.equal(getTopics().length, 85);
  assert.equal(sourceTopics.topics.length, 64);
  assert.equal(new Set(sourceTopics.topics.map(t => t.group)).size, 10);
  assert.equal(sourceTopics.topics.filter(t => t.match === "missing").length, 7);
  let previous = 0;
  for (const topic of sourceTopics.topics) {
    assert.ok(Number(topic.cell.slice(1)) > previous); previous = Number(topic.cell.slice(1));
    assert.ok(["Theory", "Practice", "Both"].includes(topic.mode));
    for (const id of topic.topicIds) assert.ok(getTopicBySlug(id), id);
    assert.equal(topic.match === "missing", topic.topicIds.length === 0);
  }
  const { filterSourceTopics } = load("lib/learning/source-inventory.ts");
  assert.equal(filterSourceTopics("HuBERT", "Audio Processing").length, 1);
  assert.equal(filterSourceTopics("NumPy", "Math").length, 0);
  assert.equal(filterSourceTopics("", "__proto__").length, 0);
});

test("beginner source preserves all cells, parallel lanes, section repeats and provenance", () => {
  assert.equal(sourcePlan.cells.length, 100);
  assert.equal(sourcePlan.cells.filter(c => c.url).length, 44);
  assert.equal(sourcePlan.cells.find(c => c.cell === "B3").value, "Алгебра");
  assert.equal(sourcePlan.cells.find(c => c.cell === "B5").value, "Питон 1-8");
  const path = modules()("lib/learning/journeys.ts").getJourney("beginner");
  assert.ok(path.steps[1].topics.includes("numpy") && path.steps[1].topics.includes("pandas"));
  assert.ok(path.steps[2].topics.includes("building-baselines"));
  assert.ok(path.steps[3].topics.includes("backpropagation"));
  assert.match(path.steps[1].goal, /parallel/);
});

test("resource cards expose useful types/accounts and block unsafe or unavailable actions", () => {
  const { ResourceCard } = modules()("components/learning/resource-card.tsx");
  const resource = { id: "fixture", title: "MIT course", href: "https://ocw.mit.edu/course/", kind: "course", provider: "MIT", description: "Optional selected chapters.", account: "Public reading" };
  const html = renderToStaticMarkup(React.createElement(ResourceCard, { resource }));
  assert.match(html, /Open material/); assert.match(html, /Course/); assert.match(html, /Public reading/); assert.match(html, /noopener noreferrer/);
  for (const href of ["javascript:alert(1)", "https://user:pass@example.com", "http://example.com"]) assert.equal(renderToStaticMarkup(React.createElement(ResourceCard, { resource: { ...resource, href } })), "");
  const held = renderToStaticMarkup(React.createElement(ResourceCard, { resource: { ...resource, availability: "unavailable" } }));
  assert.match(held, /Temporarily unavailable/); assert.doesNotMatch(held, /href=/);
});

test("practice catalog models contests, preserves parents and withholds capability links", () => {
  const load = modules(); const { practiceCatalog, filterPracticeSources } = load("lib/learning/practice-catalog.ts");
  assert.equal(practiceCatalog.length, 28);
  assert.equal(practiceCatalog.filter(entry => entry.availability === "held").length, 3);
  assert.equal(practiceCatalog.filter(entry => entry.availability === "unavailable").length, 3);
  assert.equal(practiceCatalog.filter(entry => entry.parent).length, 7);
  for (const entry of practiceCatalog) {
    assert.ok(entry.description && entry.provenance && entry.login);
    assert.notEqual(entry.type, "individual task");
    if (entry.parent) assert.ok(practiceCatalog.find(parent => parent.id === entry.parent));
    if (entry.availability === "held") assert.equal(entry.url, null);
    if (entry.url) { assert.equal(new URL(entry.url).protocol, "https:"); assert.doesNotMatch(entry.url, /\/t\/[a-f0-9]{32}/); }
  }
  assert.equal(filterPracticeSources({ competition: "NEOAI 2025", topic: "NLP" }).length, 3);
  assert.equal(filterPracticeSources({ search: "__proto__" }).length, 0);
  const { buildPracticeArchive, filterPracticeArchive } = load("lib/learning/unified-archive.ts");
  const items = filterPracticeArchive(buildPracticeArchive([]), { competition: "FAIO", difficulty: "Beginner (source label)" });
  const html = renderToStaticMarkup(React.createElement(load("components/learning/archive-list.tsx").ArchiveList, { items }));
  assert.match(html, /Held/); assert.match(html, /\/problems\/sources\/source-a-problem-2/); assert.doesNotMatch(html, /\/t\/|href="https:/);
});

test("official directory filters out private/provisional data and never rewrites scores or ties", () => {
  const { officialPublishedSets, filterStandings, olympiadName } = modules()("lib/results/browse.ts");
  const rows = [
    { id: "a", participant_name: "Team Alpha", participant_type: "team", rank: 1, score: 0, score_display: "0.000", country_code: "KZ", award: "Gold", profiles: null },
    { id: "b", participant_name: "Beta", rank: 1, score: null, country_code: "RO", award: null, profiles: { username: "beta" } },
  ];
  const sets = [ { id: "public", published: true, status: "official", competition_results: rows }, { id: "draft", published: false, status: "official" }, { id: "live", published: true, status: "provisional" } ];
  assert.equal(officialPublishedSets(sets).length, 1);
  assert.equal(officialPublishedSets(sets)[0], sets[0]);
  assert.equal(filterStandings(rows, "ALPHA", "KZ", "Gold")[0], rows[0]);
  assert.equal(filterStandings(rows, "", "", "")[1].score, null);
  assert.equal(filterStandings(rows, "beta", "", "")[0].rank, 1);
  assert.equal(filterStandings(rows, "", "KZ", "Silver").length, 0);
  assert.equal(olympiadName({ title: "International AI Olympiad 2026" }), "International AI Olympiad");
});

test("unified archive combines published tasks and collections without exposing drafts or private scores", () => {
  const load = modules();
  const { buildPracticeArchive, filterPracticeArchive } = load("lib/learning/unified-archive.ts");
  const problem = { id: "fixture-task", slug: "fixture-task", title: "Fixture classification", published: true, category: "Machine Learning", tags: ["tabular"], source_label: "Kaggle", source_provider: "kaggle", source_url: "https://example.test/source", difficulty_status: "unrated", difficulty_rating: null, metric_name: "Accuracy", metric_direction: "higher_is_better", competition: { title: "Fixture Olympiad" }, statistics: { sample_size: 7 }, private_score: 99999 };
  const items = buildPracticeArchive([problem, { ...problem, id: "draft", title: "PRIVATE DRAFT", published: false }]);
  assert.equal(items.length, 32);
  assert.equal(items.filter(item => !item.external).length, 1);
  assert.equal(items.filter(item => item.availability === "held").length, 3);
  assert.equal(filterPracticeArchive(items, { source: "Kaggle", tag: "Machine Learning" }).some(item => !item.external), true);
  assert.equal(filterPracticeArchive(items, { type: "KAIZ task", difficulty: "unrated", availability: "public" }).length, 1);
  assert.equal(filterPracticeArchive(items, { competition: "NEOAI 2025", tag: "NLP" }).length, 3);
  assert.equal(filterPracticeArchive(items, { direction: "higher_is_better" }).length, 1);
  assert.equal(filterPracticeArchive(items, { availability: "__proto__" }).length, 0);
  const html = renderToStaticMarkup(React.createElement(load("components/learning/archive-list.tsx").ArchiveList, { items }));
  assert.match(html, /\/problems\/fixture-task/); assert.match(html, /View details/); assert.match(html, /Account required/); assert.match(html, /7 samples/);
  assert.doesNotMatch(html, /PRIVATE DRAFT|99999|\/t\/[a-f0-9]{32}/);
  const rated = buildPracticeArchive([{ ...problem, difficulty_status: "rated", difficulty_rating: 1420.4 }]);
  assert.equal(filterPracticeArchive(rated, { difficulty: "rated" }).length, 1);
  assert.match(renderToStaticMarkup(React.createElement(load("components/learning/archive-list.tsx").ArchiveList, { items: rated })), /1420 rated/);
});

test("one archive page applies the same source filter to internal and external items", async () => {
  const problem = { id: "fixture-task", slug: "fixture-task", title: "Fixture classification", published: true, category: "Machine Learning", tags: [], source_label: "Kaggle", source_provider: "kaggle", difficulty_status: "unrated", difficulty_rating: null, metric_name: "Accuracy", metric_direction: "higher_is_better", competition: null, statistics: null };
  const Page = modules({ "@/lib/data/source-practice": { getOwnSourceSummaries:async()=>({signedIn:false,items:[],error:null,count:null}) }, "@/lib/data/problems": { listProblems: async () => [problem] }, "@/lib/data/problem-progress": { getOwnProblemProgress: async () => ({signedIn:false,items:[],error:null,attempted:null,solved:null}) } })("app/problems/page.tsx").default;
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ source: "Kaggle" }) }));
  assert.match(html, /Fixture classification/); assert.match(html, /Northern Eurasia OAI 2025/);
  assert.equal((html.match(/<form/g) ?? []).length, 1);
  assert.doesNotMatch(html, /Filter external practice|No problems published yet|Kazakhstan-oriented practice/);
  const filtered = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ type: "KAIZ task" }) }));
  assert.match(filtered, /Fixture classification/); assert.doesNotMatch(filtered, /Northern Eurasia OAI 2025/);
});

test("topic rows keep source order, unspecified levels and resource disclosure without fabricated lessons", () => {
  const load = modules(); const { SourceTopicRow } = load("components/learning/source-topic-row.tsx");
  const html = renderToStaticMarkup(React.createElement(SourceTopicRow, { entry: sourceTopics.topics[0] }));
  assert.match(html, /<details/); assert.match(html, /Level not supplied/); assert.match(html, /Topics!B4/); assert.match(html, /\/learn\/vectors/);
  assert.match(html, /materials/); assert.doesNotMatch(html, /\d+%|lesson complete/i);
});

test("official directory renders shared table and GET filters using only published official sets", async () => {
  const edition = { id: "fixture-edition", slug: "fixture-2026", title: "Fixture Olympiad 2026" };
  const row = { id: "fixture-row", participant_name: "Fixture team", participant_type: "team", rank: 1, score: 0, score_display: "0.000", country_code: "KZ", award: "Gold", profiles: null, result_status: "ranked" };
  const base = { id: "fixture-set", name: "Final — selected rows", status: "official", published: true, source: "manual", source_label: "Organizer", source_url: "https://example.test/results", competition_results: [row] };
  const Page = modules({ "@/lib/data/competitions": { listCompetitions: async () => [edition] }, "@/lib/data/competition-results": { getPublishedCompetitionResults: async () => [base, { ...base, id: "private", name: "PRIVATE DRAFT", published: false }] } })("app/leaderboards/page.tsx").default;
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ q: "fixture", country: "KZ" }) }));
  for (const text of ["Fixture team", "0.000", "Final — selected rows", "https://example.test/results", "Showing 1 of 1", "Open competition details"]) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /PRIVATE DRAFT/);
  assert.match(html, /overflow-x-auto/); assert.match(html, /<table/);
  const empty = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ country: "RO" }) }));
  assert.match(empty, /No rows match/); assert.doesNotMatch(empty, /Fixture team/);
});

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
  const hosts = new Set(["docs.python.org", "developers.google.com", "ocw.mit.edu", "numpy.org", "pandas.pydata.org", "scikit-learn.org", "docs.pytorch.org", "www.kaggle.com", "www.youtube.com", "github.com", "teach-in.ru", "cu.ru", "cs231n.stanford.edu", "web.stanford.edu", "lena-voita.github.io", "stepik.org"]);
  for (const [id, resources] of Object.entries(resourcesByTopic)) {
    assert.ok(getTopicBySlug(id));
    for (const resource of resources) { const url = new URL(resource.href); assert.equal(url.protocol, "https:"); assert.ok(hosts.has(url.hostname)); assert.equal(url.username + url.password, ""); }
  }
});

test("level choice renders exactly three real roadmap links without ratings or simulated progress", () => {
  const { JourneyChoices } = modules()("components/learning/journey-choices.tsx");
  const html = renderToStaticMarkup(React.createElement(JourneyChoices));
  assert.equal((html.match(/href="\/roadmaps\//g) ?? []).length, 3);
  for (const level of ["beginner", "intermediate", "advanced"]) assert.ok(html.includes(`/roadmaps/${level}`));
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
  assert.match(html, /Editorial suggestions/); assert.match(html, /\/roadmaps/); assert.match(html, /\/learn\/ml-fundamentals/); assert.match(html, /\/discussions\?category=help/);
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
