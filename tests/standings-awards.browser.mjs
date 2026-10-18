// Run after npm run build. Uses actual React components + built application CSS.
// KAIZ_ESBUILD_MODULE and KAIZ_PLAYWRIGHT_MODULE point at optional local tools.
// No Next.js route, Supabase, credentials, imports, publication or external traffic.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { build } = await import(pathToFileURL(resolve(process.env.KAIZ_ESBUILD_MODULE)));
const { chromium } = await import(pathToFileURL(resolve(process.env.KAIZ_PLAYWRIGHT_MODULE)));
const bundle = await build({ entryPoints: ["tests/fixtures/standings-awards-qa.tsx"], bundle: true,
  platform: "browser", format: "esm", write: false, define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" } });
const css = readdirSync(".next/static/chunks").filter(f => f.endsWith(".css"))
  .map(f => readFileSync(resolve(".next/static/chunks", f), "utf8")).join("\n");
const server = createServer((req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.url === "/qa.js") { res.setHeader("Content-Type", "text/javascript"); res.end(bundle.outputFiles[0].contents); }
  else if (req.url === "/qa.css") { res.setHeader("Content-Type", "text/css"); res.end(css); }
  else if (req.url === "/") { res.setHeader("Content-Type", "text/html"); res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Standings layout QA</title><link rel="stylesheet" href="/qa.css"></head><body><div id="qa-root"></div><script type="module" src="/qa.js"></script></body></html>'); }
  else { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const output = process.env.KAIZ_SCREENSHOTS ?? "work/award-wrapping/screenshots";
mkdirSync(output, { recursive: true });
let cases = 0;
const errors = [];
try {
  for (const width of [375, 1440]) for (const theme of ["light", "dark"]) for (const textSize of [100, 200]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
    await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage(); page.on("pageerror", e => errors.push(e.message));
    await page.goto(origin); await page.getByRole("table").waitFor();
    await page.evaluate(({ theme, textSize }) => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      // Text-only enlargement: double every computed font size, including px-based
      // controls, without scaling viewport/layout. More stringent than root rem alone.
      if (textSize === 200) {
        // Persistent rules also enlarge rows mounted later by filtering/pagination.
        const rules = new Map([...document.querySelectorAll("body, body *")].map(el => {
          const classes = el.getAttribute("class");
          const selector = el.tagName.toLowerCase() + (classes === null ? ':not([class])' : `[class=${JSON.stringify(classes)}]`);
          return [selector, parseFloat(getComputedStyle(el).fontSize) * 2];
        }));
        const style = document.createElement("style");
        style.textContent = [...rules].map(([selector, size]) => `${selector}{font-size:${size}px!important}`).join("\n");
        document.head.append(style);
      }
    }, { theme, textSize });
    const table = page.getByRole("table"), rows = table.locator("tbody tr");
    assert.equal(await rows.count(), 50);
    assert.equal(await rows.nth(0).locator("td").nth(0).textContent(), "1");
    assert.equal(await rows.nth(1).locator("td").nth(0).textContent(), "1", "Tie retained");
    assert.equal(await rows.first().locator("td").nth(2).textContent(), "123.4500");
    for (const row of await rows.all()) {
      const award = row.locator("td").nth(3), badge = award.locator("span");
      if (!await badge.count()) continue;
      const dimensions = await badge.evaluate(el => {
        const range = document.createRange(); range.selectNodeContents(el);
        return { lines: [...range.getClientRects()].length, clipped: el.scrollWidth > el.clientWidth + 1,
          whiteSpace: getComputedStyle(el).whiteSpace, cellWidth: el.parentElement.clientWidth,
          fontSize: parseFloat(getComputedStyle(el).fontSize) };
      });
      assert.equal(dimensions.lines, 1, "Award text must stay on one line");
      assert.equal(dimensions.whiteSpace, "nowrap"); assert.equal(dimensions.clipped, false);
      assert.ok(dimensions.cellWidth >= 192); assert.ok(dimensions.fontSize >= (textSize === 200 ? 22 : 11));
    }
    assert.equal(await rows.first().locator("td").nth(3).textContent(), "Honourable Mention");
    const scroll = page.getByRole("region", { name: /standings; scroll horizontally/ });
    await scroll.focus(); await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector('[role="region"]').scrollLeft > 0);
    assert.equal(await scroll.evaluate(el => el === document.activeElement), true);
    assert.notEqual(await scroll.evaluate(el => getComputedStyle(el).outlineStyle), "none");
    await scroll.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    assert.ok(await table.locator("thead th").last().evaluate(el => {
      const r = el.getBoundingClientRect(), parent = el.closest('[role="region"]').getBoundingClientRect();
      return r.right <= parent.right + 1 && r.left >= parent.left;
    }), "Last score column remains reachable");
    const overflow = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll("main > div:first-of-type *")].filter(el => el.getBoundingClientRect().right > innerWidth)
        .map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })) }));
    assert.ok(overflow.width <= overflow.viewport + 1, `No page overflow ${JSON.stringify({width,theme,textSize,...overflow})}`);
    await scroll.evaluate(el => { el.scrollLeft = 0; });
    await page.getByRole("combobox", { name: "Award", exact: true }).selectOption("GAITE Honorable Mention");
    for (const row of await rows.all()) assert.equal(await row.locator("td").nth(3).textContent(), "GAITE Honorable Mention");
    await page.getByRole("combobox", { name: "Award", exact: true }).selectOption("");
    await page.getByRole("searchbox", { name: "Search participant" }).fill("Fixture participant 60");
    assert.equal(await rows.count(), 1); assert.equal(await rows.first().locator("td").first().textContent(), "60");
    await page.getByRole("searchbox").fill(""); await page.getByRole("button", { name: "Next", exact: true }).click();
    assert.equal(await rows.count(), 10); await page.getByRole("button", { name: "Previous", exact: true }).click();
    await rows.first().locator("td").nth(3).evaluate(el => {
      const region = el.closest('[role="region"]');
      region.scrollLeft += el.getBoundingClientRect().left - region.getBoundingClientRect().left;
    });
    assert.ok(await rows.first().locator("td").nth(3).locator("span").evaluate(el => parseFloat(getComputedStyle(el).fontSize)) >= (textSize === 200 ? 22 : 11));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${width}-${theme}-${textSize}.png` });
    await context.close(); cases++;
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "PASS", cases, textZoom: "100% and 200% computed text sizes", themes: ["light", "dark"], widths: [375, 1440], keyboardScroll: true, dataPreserved: true, productionAccess: false }));
} finally { await browser.close(); await new Promise(done => server.close(done)); }
