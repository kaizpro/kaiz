// Optional actual-component browser QA. Run after build with bundled esbuild /
// Playwright paths in KAIZ_ESBUILD_MODULE / KAIZ_PLAYWRIGHT_MODULE. No DB traffic.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { build } = await import(pathToFileURL(resolve(process.env.KAIZ_ESBUILD_MODULE)));
const { chromium } = await import(pathToFileURL(resolve(process.env.KAIZ_PLAYWRIGHT_MODULE)));
const bundle = await build({ entryPoints: ["tests/fixtures/edition-release-qa.tsx"], bundle: true, platform: "browser", format: "esm", write: false,
  define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" } });
const css = readdirSync(".next/static/chunks").filter(f => f.endsWith(".css")).map(f => readFileSync(".next/static/chunks/" + f)).join("\n");
const server = createServer((req, res) => {
  if (req.url === "/qa.js") { res.setHeader("Content-Type", "text/javascript"); res.end(bundle.outputFiles[0].contents); }
  else if (req.url === "/qa.css") { res.setHeader("Content-Type", "text/css"); res.end(css); }
  else { res.setHeader("Content-Type", "text/html"); res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/qa.css"><title>Local content review</title></head><body><div id="qa-root"></div><script type="module" src="/qa.js"></script></body></html>'); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const read = p => JSON.parse(readFileSync(p, "utf8"));
const manifest = read("content/competitions/2026-10-17/publication-manifest.json"), catalog = read("content/competitions/2026-10-19/release-catalog.json");
const output = "work/edition-release/browser"; mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [], visualBlockers = new Set(); let editionViews = 0, stageViews = 0, taskLinks = 0;
try {
  for (const width of [375, 1440]) for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
    await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage(); page.on("pageerror", e => errors.push(e.message));
    await page.goto(origin); await page.getByRole("heading", { level: 1 }).waitFor();
    await page.evaluate(t => document.documentElement.classList.toggle("dark", t === "dark"), theme);
    for (const edition of catalog.editions) {
      await page.getByLabel("Review edition").selectOption(edition.editionId);
      await page.getByRole("button", { name: "Results", exact: true }).click();
      const stages = manifest.stages.filter(s => s.edition_id === edition.editionId);
      if (!stages.length) await page.getByText("Results are not available yet", { exact: true }).waitFor();
      for (const stage of stages) {
        await page.getByRole("navigation", { name: "Result stages" }).getByRole("button", { name: stage.stage_label, exact: true }).click();
        const table = page.getByRole("table"), rows = table.locator("tbody tr"), first = stage.rows[0];
        assert.equal(await rows.count(), Math.min(50, stage.rows.length));
        assert.equal(await rows.first().locator("td").nth(0).textContent(), String(first.rank ?? "—"));
        assert.equal(await rows.first().locator("td").nth(2).textContent(), String(first.score_display ?? first.score ?? "—"));
        assert.equal(await rows.first().locator("td").nth(3).textContent(), first.award ?? "—");
        for (const [i, col] of stage.columns.entries()) {
          await table.getByRole("columnheader", { name: col.label, exact: true }).waitFor();
          assert.equal(await rows.first().locator("td").nth(5 + i).textContent(), String(first.score_columns[col.key] ?? "—"));
        }
        if (stage.rows.length > 50) { await page.getByRole("button", { name: "Next", exact: true }).click(); await table.getByText(stage.rows[50].display_name, { exact: true }).waitFor(); }
        await page.getByRole("searchbox", { name: "Search participant" }).fill(first.display_name);
        await table.getByText(first.display_name, { exact: true }).waitFor();
        await page.getByRole("searchbox").fill("");
        if (first.award) { await page.getByRole("combobox", { name: "Award", exact: true }).selectOption(first.award); assert.equal(await rows.count(), Math.min(50, stage.rows.filter(r => r.award === first.award).length)); await page.getByRole("combobox", { name: "Award", exact: true }).selectOption(""); }
        const scroll = page.getByRole("region", { name: /standings; scroll horizontally/ }); await scroll.focus();
        assert.equal(await scroll.getAttribute("tabindex"), "0"); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        for (const badge of await rows.locator("td:nth-child(4) span").all()) {
          if (await badge.evaluate(el => { const r = document.createRange(); r.selectNodeContents(el); return r.getClientRects().length > 1; })) visualBlockers.add("PR44_UNMERGED_AWARD_WRAPPING");
        }
        stageViews++;
      }
      await page.getByRole("button", { name: "Tasks", exact: true }).click();
      for (const task of edition.tasks) if (task.url) { assert.equal(await page.getByRole("link", { name: task.label, exact: true }).getAttribute("href"), task.url); taskLinks++; }
      await page.getByRole("button", { name: "Overview", exact: true }).click();
      editionViews++;
    }
    await page.screenshot({ path: `${output}/${width}-${theme}.png` }); await context.close();
  }
  assert.deepEqual(errors, []);
  const report = { functional: "PASS", editionViews, stageViews, taskLinkChecks: taskLinks,
    visual: visualBlockers.size ? "BLOCKED_BY_SEPARATE_PR44" : "PASS", visualBlockers: [...visualBlockers],
    source: "Existing public-source draft manifest; no restricted Kazakhstan rows", productionAccess: false, databaseImports: 0 };
  writeFileSync(output + "/result.json", JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} finally { await browser.close(); await new Promise(done => server.close(done)); }
