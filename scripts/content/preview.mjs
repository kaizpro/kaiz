#!/usr/bin/env node
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { loadContentModule } from "./load.mjs";

// Deliberately no apply mode, environment access, network client or DB credential.
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--help") {
  console.log("Usage: node scripts/content/preview.mjs BATCH.json SNAPSHOT.json [--dry-run]\nOffline preview only. Approved entry/publication uses the existing authenticated admin UI.");
} else if (args.length < 2 || args.length > 3 || (args[2] && args[2] !== "--dry-run") || args.some((arg) => arg.startsWith("--") && arg !== "--dry-run")) {
  console.error("Provide batch and snapshot JSON paths. Only --dry-run is supported; writes/apply are forbidden.");
  process.exitCode = 2;
} else {
  try {
    const read = (path) => {
      const absolute = resolve(path);
      if (!absolute.endsWith(".json") || statSync(absolute).size > 5_000_000) throw new Error("Input must be a JSON file smaller than 5 MB");
      return JSON.parse(readFileSync(absolute, "utf8").replace(/^\uFEFF/, ""));
    };
    const { prepareContentPlan } = loadContentModule();
    const plan = prepareContentPlan(read(args[0]), read(args[1]));
    console.log(JSON.stringify(plan, null, 2));
    if (!plan.valid) process.exitCode = 1;
  } catch {
    // Do not echo invalid source content or OS errors that could disclose data.
    console.error("Unable to preview. Check file paths, JSON syntax, file size and installed dependencies.");
    process.exitCode = 2;
  }
}
