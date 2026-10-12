import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

// Render the real components and catalogue without Next's router or any services.
function renderRoadmap(query = "", { client = false } = {}) {
  const cache = new Map();
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative);
    const exports = {};
    cache.set(relative, exports);
    const source = readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");
    vm.runInNewContext(ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, {
      exports, URL, URLSearchParams,
      require: (name) => {
        if (name === "next/navigation") return { useSearchParams: () => new URLSearchParams(query) };
        if (name === "next/link") return { default: ({ children, ...props }) => React.createElement("a",
          Object.fromEntries(Object.entries(props).filter(([key]) => key !== "prefetch")), children) };
        if (name.endsWith(".module.css")) return { default: {} };
        if (name === "./roadmap-branch") return load("components/learning/roadmap-branch.tsx");
        if (name === "./curriculum") return load("lib/learning/curriculum.ts");
        if (name.startsWith("@/lib/learning/")) return load(`${name.slice(2)}.ts`);
        if (name === "react" && client) return { ...React, useSyncExternalStore: (_subscribe, snapshot) => snapshot() };
        return require(name);
      },
    });
    return exports;
  }
  const { LearningRoadmap } = load("components/learning/learning-roadmap.tsx");
  return renderToStaticMarkup(React.createElement(LearningRoadmap));
}

test("server-rendered track and disclosure controls wait for hydration", () => {
  const html = renderRoadmap("track=coding-ai&open=programming,python");
  assert.match(html, /id="roadmap"[^>]*aria-busy="true"/);
  const buttons = html.match(/<button\b[^>]*>/g);
  assert.ok(buttons.length > 2);
  for (const button of buttons) assert.match(button, /disabled=""/, "no unhydrated control falsely accepts clicks");
  assert.match(html, /href="\/learn\/python-fundamentals\?from=/, "native topic destinations remain available");
});

test("hydrated controls are enabled without changing the selected track or topic", () => {
  const html = renderRoadmap("track=coding-ai&open=programming,python&topic=numpy", { client: true });
  assert.match(html, /id="roadmap"[^>]*aria-busy="false"/);
  assert.equal((html.match(/<button[^>]*disabled/g) ?? []).length, 0);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.match(html, /id="node-numpy"[^>]*aria-current="location"/);
});

test("sidebar appears only with a track and identifies the selected topic's area", () => {
  assert.equal(renderRoadmap().includes('aria-label="Roadmap guide"'), false);
  const html = renderRoadmap("track=coding-ai&open=programming,python&topic=numpy");
  assert.match(html, /51 topics · 7 learning areas/);
  const nav = html.match(/<nav aria-label="Jump to learning area"[^>]*>(.*?)<\/nav>/s)?.[1];
  assert.ok(nav);
  assert.equal((nav.match(/aria-current="location"/g) ?? []).length, 1);
  assert.match(nav, /href="#node-programming"[^>]*aria-current="location"/);
  assert.match(html, /LAST EXPLORED<\/p><p>NumPy/);
});

test("hierarchy labels and counts describe actual descendant topics, not completion", () => {
  const html = renderRoadmap("track=coding-ai&open=programming,python,cpp");
  assert.match(html, /Learning area · 10 topics/);
  assert.match(html, /Path · 7 topics/);
  assert.match(html, /Path · 3 topics/);
  assert.match(html, /A suggested journey, not a checklist/);
  assert.match(renderRoadmap("track=coding-ai&open=ai-specializations"), /Subcategory · 4 topics/);
  assert.equal(/completed|\d+%/.test(html), false);
});
