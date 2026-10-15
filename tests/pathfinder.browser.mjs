// Opt-in, read-only localhost smoke test. No login, writes or new dependencies.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const base = new URL(process.env.KAIZ_LEARNING_URL ?? "http://localhost:3100");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Local application only");
assert.ok(process.env.KAIZ_PLAYWRIGHT_MODULE, "Provide an existing Playwright module; nothing is installed");
const { chromium } = await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
const output = process.env.KAIZ_SCREENSHOTS ?? "/tmp/kaiz-pathfinder-browser";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
try {
  for (const width of [375, 768, 1024, 1440]) for (const theme of ["dark", "light"]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
    await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await context.route("**/*", (route) => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    const open = async path => {
      const response = await page.goto(`${base.origin}${path}`);
      assert.equal(response.status(), 200, `HTTP: ${path}`);
      await page.locator("main").first().waitFor();
    };
    const layout = async label => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label} overflow at ${width}/${theme}`);
      assert.equal(await page.locator("footer").count(), 1, "one shared footer");
    };
    await open("/");
    await page.getByRole("heading", { level: 1, name: "Start Your AI Olympiad Journey" }).waitFor();
    await page.waitForFunction(value => document.documentElement.classList.contains(value), theme);
    await page.locator('a[href="/competitions/ioai-2026"]').first().waitFor();
    await layout("home");
    await page.screenshot({ path: join(output, `home-${width}-${theme}.png`), fullPage: true });
    await open("/start");
    for (const level of ["Beginner", "Intermediate", "Advanced"]) {
      await page.getByRole("link", { name: new RegExp(level) }).first().click();
      await page.getByRole("heading", { level: 1, name: `${level} AI Olympiad Roadmap` }).waitFor();
      await page.locator('a[href="/competitions/ioai-2026"]').waitFor();
      assert.equal(await page.getByRole("list", { name: "Ordered roadmap stages" }).locator(":scope > li").count(), 4);
      assert.equal(await page.getByRole("heading", { name: "Milestone / self-check", exact: true }).count(), 4);
      await layout(level);
      await page.screenshot({ path: join(output, `${level.toLowerCase()}-${width}-${theme}.png`), fullPage: true });
      await page.getByRole("link", { name: "Choose another level" }).click();
      await page.getByRole("heading", { level: 1 }).waitFor();
    }
    await open("/start/beginner");
    await page.locator('a[href="/learn/python-fundamentals"]').first().click();
    await page.getByRole("heading", { level: 1, name: "Python Fundamentals" }).waitFor();
    assert.ok(await page.locator('a[href^="https://docs.python.org/"]').count() > 0);
    await layout("topic");
    await open("/problems");
    await page.getByRole("heading", { name: "Practice at the original source", exact: true }).waitFor();
    assert.ok(await page.locator('a[href="https://ioai-official.org/2024-tasks/"]').count() > 0);
    await layout("empty archive");
    await open("/competitions");
    await page.locator('a[href="/competitions/ioai-2026"]').first().click();
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.locator('a[href="https://ioai-official.org/republic-of-kazakhstan/results-2026/"]').waitFor();
    await layout("competition");
    await open("/discussions?category=help");
    await layout("discussions");
    await open("/u/timatema");
    await layout("public profile");
    for (const path of ["/auth/login", "/auth/register", "/auth/reset-password"]) {
      await open(path);
      await layout(path);
    }
    await page.goto(`${base.origin}/admin`);
    assert.equal(new URL(page.url()).pathname, "/auth/login", "anonymous admin access redirects to login");
    const missing = await page.goto(`${base.origin}/start/not-a-level`);
    assert.equal(missing.status(), 404);
    await context.close();
    console.log(`PASS pathfinder ${width}px ${theme}; anonymous GET only`);
  }
  assert.deepEqual(errors, [], "browser runtime errors");
} finally { await browser.close(); }
