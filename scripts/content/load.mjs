import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

// Fixed, repository-owned modules only. Input JSON is never evaluated as code.
const require = createRequire(import.meta.url);
const modules = {
  "@/lib/constants": "../../lib/constants.ts",
  "@/lib/validation/competition": "../../lib/validation/competition.ts",
  "@/lib/validation/competition-result": "../../lib/validation/competition-result.ts",
  "content-plan": "./plan.ts",
};
const cache = new Map();

export function loadContentModule(name = "content-plan") {
  if (cache.has(name)) return cache.get(name);
  if (!Object.hasOwn(modules, name)) throw new Error("Module is not allowlisted");
  const source = readFileSync(new URL(modules[name], import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  cache.set(name, exports);
  vm.runInNewContext(compiled, {
    exports, URL, Date, Map, Set,
    require: (dependency) => dependency === "zod" ? require("zod") : loadContentModule(dependency),
  }, { timeout: 5000 });
  return exports;
}
