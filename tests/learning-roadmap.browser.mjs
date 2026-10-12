// Opt-in localhost-only browser regression. Uses an already-installed Playwright module.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const base = new URL(process.env.KAIZ_LEARNING_URL ?? "http://localhost:3100");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname), "Never run against hosted KAIZ");
const moduleName = process.env.KAIZ_PLAYWRIGHT_MODULE;
assert.ok(moduleName, "Set KAIZ_PLAYWRIGHT_MODULE to an existing Playwright index.mjs; no installation is performed");
const { chromium } = await import(pathToFileURL(moduleName).href);
const output = process.env.KAIZ_SCREENSHOTS ?? "/tmp/kaiz-learning-browser";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const unexpectedRequests = [];
await context.route("**/*", (route) => {
  const url = new URL(route.request().url());
  if (url.origin === base.origin) return route.continue();
  unexpectedRequests.push(url.origin);
  return route.abort();
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const routes = new Set();
const mapUrl = (track, open, topic = "") => `${base.origin}/learn?${new URLSearchParams({ track, open, topic })}`;
async function settle() {
  await page.locator("#roadmap").evaluate(async (element) => {
    await Promise.all(element.getAnimations({ subtree: true }).filter((animation) => animation.playState !== "finished")
      .map((animation) => animation.finished.catch(() => {})));
  });
}
async function checkLayout({ featureOnly = false } = {}) {
  if (!featureOnly) assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "horizontal overflow");
  const featureFits = await page.locator('section[aria-labelledby="learning-title"]').evaluate((section) => [section, ...section.querySelectorAll("*")]
    .filter((element) => !element.closest("[inert]")).every((element) => {
      const box = element.getBoundingClientRect();
      return box.left >= -1 && box.right <= innerWidth + 1;
    }));
  assert.equal(featureFits, true, "Learning content overflows the viewport");
  const nodes = await page.locator("#roadmap button, #roadmap a").evaluateAll((elements) => elements
    .filter((element) => !element.closest("[inert]")).map((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height, label: element.textContent };
    }));
  for (const node of nodes) {
    assert.ok(node.width >= 44 && node.height >= 44, `small touch target: ${node.label}`);
  }
  const tracks = await page.locator('button[aria-controls="track-content"]').evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  assert.equal(tracks.length, 2);
  assert.ok(Math.abs(tracks[0].width - tracks[1].width) < 1, "tracks have unequal prominence");
  assert.ok(Math.abs(tracks[0].y - tracks[1].y) < 1);
  assert.ok(tracks[0].x + tracks[0].width < tracks[1].x, "track nodes overlap");
  const aligned = await page.locator('[id^="node-"]').evaluateAll((elements) => elements
    .filter((element) => !element.closest("[inert]")).every((element) => {
      const box = element.getBoundingClientRect();
      const parent = element.parentElement.getBoundingClientRect();
      return box.left >= parent.left - 1 && box.right <= parent.right + 1;
    }));
  assert.equal(aligned, true, "nodes escape their layout containers");
  const connectors = await page.locator('#roadmap li > a[id^="node-"], #roadmap li > div > button[id^="node-"]').evaluateAll((elements) => elements
    .filter((element) => !element.closest("[inert]")).map((element) => {
      const item = element.closest("li");
      const itemBox = item.getBoundingClientRect();
      const nodeBox = element.getBoundingClientRect();
      const horizontal = getComputedStyle(item, "::after");
      const vertical = getComputedStyle(item, "::before");
      if (horizontal.display === "none") {
        return { label: element.textContent, xError: Math.abs(itemBox.left + parseFloat(vertical.left) - (nodeBox.left + nodeBox.width / 2)), yError: Math.abs(itemBox.top + parseFloat(vertical.top) + parseFloat(vertical.height) - nodeBox.top) };
      }
      const y = itemBox.top + parseFloat(horizontal.top);
      return { label: element.textContent, xError: Math.abs(itemBox.left + parseFloat(horizontal.left) + parseFloat(horizontal.width) - nodeBox.left), yError: y < nodeBox.top ? nodeBox.top - y : Math.max(0, y - nodeBox.bottom) };
    }));
  for (const connector of connectors) {
    assert.ok(connector.xError <= 1 && connector.yError <= 1, `detached connector: ${connector.label}`);
  }
}

try {
  await page.goto(`${base.origin}/learn`);
  await page.getByRole("button", { name: /Coding & AI/ }).waitFor();
  const expectedRoutes = (await page.locator('button[aria-controls="track-content"]').allTextContents())
    .reduce((sum, label) => sum + Number(label.match(/(\d+) topics/)?.[1]), 0);
  assert.equal(await page.locator('button[aria-pressed="true"]').count(), 0);
  assert.equal(await page.getByRole("complementary", { name: "Roadmap guide" }).count(), 0, "no empty sidebar before choosing a track");
  await page.getByRole("button", { name: /Coding & AI/ }).click();
  await page.locator("#node-programming").focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector("#node-programming")?.getAttribute("aria-expanded") === "true");
  await page.locator("#node-python").focus();
  await page.keyboard.press("Space");
  await page.waitForFunction(() => document.querySelector("#node-python")?.getAttribute("aria-expanded") === "true");
  const expansionAnchors = await page.locator("#node-python-fundamentals").evaluate(async (element) => {
    const samples = [];
    for (let frame = 0; frame < 12; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const item = element.closest("li");
      const itemBox = item.getBoundingClientRect();
      const nodeBox = element.getBoundingClientRect();
      const line = getComputedStyle(item, "::after");
      samples.push(Math.abs(itemBox.left + parseFloat(line.left) + parseFloat(line.width) - nodeBox.left));
    }
    return samples;
  });
  assert.ok(expansionAnchors.every((error) => error <= 1), "connector anchors stay attached throughout expansion frames");
  await settle();
  await page.locator("#node-python-fundamentals").focus();
  const outline = await page.locator("#node-python-fundamentals").evaluate((element) => getComputedStyle(element).outlineStyle);
  assert.notEqual(outline, "none", "keyboard focus must be visible");
  // Focus/hover can finish native smooth scrolling; compare document coordinates.
  const documentBox = (element) => {
    const box = element.getBoundingClientRect();
    return { x: box.left + scrollX, y: box.top + scrollY, width: box.width, height: box.height };
  };
  const beforeHover = await page.locator("#node-python-fundamentals").evaluate(documentBox);
  await page.locator("#node-python-fundamentals").hover();
  assert.deepEqual(await page.locator("#node-python-fundamentals").evaluate(documentBox), beforeHover, "hover does not move the node or its connector");
  const beforeTopic = page.url();
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: "Python Fundamentals", exact: true }).waitFor();
  await page.getByRole("link", { name: "Back to the learning tree" }).click();
  await page.waitForFunction(() => document.querySelector("#node-python-fundamentals")?.getAttribute("aria-current") === "location");
  assert.equal(await page.getByRole("navigation", { name: "Jump to learning area" }).getByRole("link", { name: /^Programming/ }).getAttribute("aria-current"), "location", "contextual navigation identifies the selected topic's area");
  await page.waitForFunction(() => {
    const box = document.querySelector("#node-python-fundamentals").getBoundingClientRect();
    return box.top >= 56 && box.bottom <= innerHeight;
  });
  assert.equal(await page.evaluate(() => document.activeElement.id), "node-python-fundamentals", "return navigation restores topic focus");
  assert.equal(await page.locator('#children-python [id="node-python-fundamentals"]').count(), 1);
  assert.equal(await page.locator("#node-python").getAttribute("aria-expanded"), "true");
  await page.goBack();
  await page.getByRole("heading", { name: "Python Fundamentals", exact: true }).waitFor();
  await page.goBack();
  await page.locator("#node-programming").waitFor();
  assert.equal(page.url(), beforeTopic, "browser back restores expansion state");
  await page.locator("#node-programming").click();
  await settle();
  assert.equal(await page.locator("#children-programming").getAttribute("inert"), "", "collapsed descendants must not be focusable");
  await page.locator("#node-python-fundamentals").evaluate((element) => element.focus());
  assert.notEqual(await page.evaluate(() => document.activeElement.id), "node-python-fundamentals");
  await page.getByRole("button", { name: /^Mathematics / }).click();
  assert.equal(await page.locator("#node-programming").count(), 0);
  await page.goBack();
  await page.locator("#node-programming").waitFor();
  await page.goForward();
  await page.locator("#node-math-foundations").waitFor();
  for (let click = 0; click < 4; click++) await page.locator("#node-math-foundations").click();
  await settle();
  assert.equal(await page.locator("#node-math-foundations").getAttribute("aria-expanded"), "false", "rapid toggles finish in the requested state");
  assert.equal(await page.locator("#children-math-foundations").getAttribute("inert"), "", "rapid collapse still excludes descendants");

  for (const theme of ["dark", "light"]) {
    await page.evaluate((value) => localStorage.setItem("theme", value), theme);
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [track, open, topic] of [
        ["coding-ai", "programming,python,cpp,machine-learning", "python-fundamentals"],
        ["mathematics", "math-foundations,linear-algebra,probability", "vectors"],
      ]) {
        await page.goto(mapUrl(track, open, topic));
        await page.locator(`#node-${topic}`).waitFor();
        await settle();
        assert.equal(await page.locator("html").getAttribute("class"), theme);
        await checkLayout();
        for (const href of await page.locator('#track-content a[href^="/learn/"]').evaluateAll((elements) => elements.map((element) => element.getAttribute("href")))) {
          routes.add(new URL(href, base).pathname);
        }
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.screenshot({ path: join(output, `${theme}-${width}-${track}.png`), fullPage: true });
      }
      await page.goto(`${base.origin}/learn/numpy`);
      await page.getByRole("heading", { name: "NumPy", exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "topic page horizontal overflow");
      const detailTargets = await page.locator('section[aria-labelledby="topic-title"] a').evaluateAll((elements) => elements.map((element) => {
        const box = element.getBoundingClientRect();
        return { label: element.textContent, width: box.width, height: box.height, left: box.left, right: box.right };
      }));
      for (const target of detailTargets) {
        assert.ok(target.width >= 44 && target.height >= 44, `small topic-page target: ${target.label}`);
        assert.ok(target.left >= 0 && target.right <= width, `topic-page target overflows: ${target.label}`);
      }
      await page.screenshot({ path: join(output, `${theme}-${width}-topic.png`), fullPage: true });
    }
  }
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(mapUrl("coding-ai", "deep-learning,ai-specializations,computer-vision,nlp-llms,other-ai,ai-competitions", "transformers"));
    await page.locator("#node-image-processing").waitFor();
    await settle();
    await checkLayout();
    const vision = await page.locator("#node-image-processing").boundingBox();
    const classification = await page.locator("#node-image-classification").boundingBox();
    assert.ok(width === 1440 ? Math.abs(vision.y - classification.y) <= 1 : classification.y > vision.y + vision.height,
      "specialization topics use available branch width without cramping phones");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: join(output, `expanded-${width}-specializations.png`), fullPage: true });
  }
  for (const route of routes) {
    const response = await context.request.get(`${base.origin}${route}`);
    assert.equal(response.status(), 200, route);
    assert.match(await response.text(), /Learning materials for this topic will be added soon/);
  }
  assert.equal(routes.size, expectedRoutes, "all canonical topic routes checked");
  const unknown = await context.request.get(`${base.origin}/learn/not-a-real-topic`);
  assert.equal(unknown.status(), 404);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(mapUrl("coding-ai", "programming,python", "numpy"));
  await page.locator("#node-python").waitFor();
  const motion = await page.locator("#node-python").evaluate((element) => {
    const style = getComputedStyle(element);
    return { transition: style.transitionDuration, animation: style.animationName };
  });
  assert.equal(motion.transition, "0s");
  assert.equal(motion.animation, "none");
  await page.setViewportSize({ width: 375, height: 1000 });
  await page.locator("#node-numpy").click();
  await page.getByRole("heading", { name: "NumPy", exact: true }).waitFor();
  await page.screenshot({ path: join(output, "topic-mobile-light.png"), fullPage: true });
  await page.getByRole("link", { name: "Vectors", exact: true }).click();
  await page.getByRole("heading", { name: "Vectors", exact: true }).waitFor();
  await page.getByRole("link", { name: "Back to the learning tree" }).click();
  await page.locator("#node-vectors").waitFor();
  assert.equal(await page.locator("#node-vectors").getAttribute("aria-current"), "location");
  assert.equal(await page.getByRole("button", { name: /^Mathematics / }).getAttribute("aria-pressed"), "true");
  await page.setViewportSize({ width: 375, height: 1000 });
  await page.locator("#node-vectors").evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const normalFont = await page.locator("#node-vectors").evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await page.waitForFunction(() => getComputedStyle(document.documentElement).fontSize === "32px");
  const largeFont = await page.locator("#node-vectors").evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  assert.equal(largeFont, normalFont * 2, "text enlargement actually doubles topic text");
  await checkLayout({ featureOnly: true });
  await page.screenshot({ path: join(output, "mobile-enlarged-text.png"), fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
    console.log("OUT-OF-SCOPE: existing shared site header overflows at 375px with 200% root text size; Learning bounds pass. Shared header is unchanged.");
  }
  assert.deepEqual(errors, [], "browser runtime errors");
  assert.deepEqual(unexpectedRequests, [], "non-local network requests attempted");
  console.log(`PASS: keyboard, disclosures/inert, focus, track selection, back/forward, contextual navigation, rapid toggles, connector anchors, active path, empty states, cross-track recommendations, reduced motion, 200% text size, ${routes.size} routes, 16 tree + 8 detail theme/viewport layouts. Screenshots: ${output}`);
} finally {
  await browser.close();
}
