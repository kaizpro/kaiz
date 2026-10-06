// Opt-in LOCAL integration check: node tests/problem-workflows.local.mjs
// Starts no database, applies no migrations, and never reads hosted environment files.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

const nodeRequire = createRequire(import.meta.url);
let status;
try {
  status = JSON.parse(execFileSync("./node_modules/.bin/supabase", ["status", "--output", "json"], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 20000,
    env: { ...process.env, PATH: `/Applications/Docker.app/Contents/Resources/bin:${process.env.PATH}` },
  }));
} catch { throw new Error("Local Supabase is unavailable. Start the local stack before this opt-in check."); }
const api = new URL(status.API_URL);
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(api.hostname), "Only localhost Supabase is allowed");
const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
  assert.equal(new URL(input).origin, api.origin, "Hosted requests are forbidden");
  return fetch(input, init);
} } };
const service = createClient(api.href, status.SERVICE_ROLE_KEY, options);
const anonymous = createClient(api.href, status.ANON_KEY, options);
const users = [];
const problemIds = [];
const run = randomUUID();
let browser;

function load(file, overrides = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, Date, Object, Number, require: (name) => name in overrides ? overrides[name] : nodeRequire(name) });
  return exports;
}
const validation = load("lib/validation/problem.ts");
function actions(client) {
  const dependencies = {
    "server-only": {}, "@/lib/supabase/server": { createClient: async () => client },
    "next/navigation": { redirect: (url) => { throw new Error(`redirect:${url}`); } },
    "next/cache": { revalidatePath() {} }, "@/lib/validation/problem": validation,
  };
  dependencies["@/lib/auth"] = load("lib/auth.ts", dependencies);
  return { ...load("app/admin/problems/actions.ts", dependencies), ...load("app/problems/actions.ts", dependencies) };
}
function form(input) { const data = new FormData(); for (const [key, value] of Object.entries(input)) data.set(key, String(value)); return data; }
async function result(query) { const response = await query; assert.ifError(response.error); return response.data; }
async function account(label, role = "member") {
  const email = `archive-${run}-${label}@example.test`;
  const password = randomBytes(24).toString("base64url");
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error); users.push(created.data.user.id);
  await result(service.from("profiles").update({ role, username: `qa_${label}_${run.slice(0, 8)}`, display_name: `Local ${label}` }).eq("id", created.data.user.id));
  const client = createClient(api.href, status.ANON_KEY, options);
  const signed = await client.auth.signInWithPassword({ email, password }); assert.ifError(signed.error);
  return { client, email, password, id: created.data.user.id, actions: actions(client) };
}
const now = new Date(Date.now() - 60000).toISOString();

try {
  const admin = await account("admin", "admin");
  const owner = await account("owner");
  const other = await account("other");
  const input = { title: "Local activation verification", slug: `local-activation-${run}`, category: "AI",
    metric_name: "F1", metric_direction: "higher_is_better", difficulty_status: "unrated", source_provider: "manual", published: "true" };

  await assert.rejects(owner.actions.createProblem({}, form(input)), /redirect:/);
  assert.ok((await owner.client.from("problems").insert(input)).error, "Member database create is denied");
  await assert.rejects(admin.actions.createProblem({}, form(input)), /redirect:/);
  const [problem] = await result(service.from("problems").select("*").eq("slug", input.slug)); problemIds.push(problem.id);
  assert.equal(problem.created_by, admin.id);
  assert.ok((await admin.actions.createProblem({}, form(input))).error, "Duplicate slug is handled");
  assert.ok((await admin.actions.createProblem({}, form({ ...input, slug: "bad slug" }))).fields?.slug);
  await assert.rejects(owner.actions.updateProblem(problem.id, {}, form(input)), /redirect:/);
  const unauthorizedEdit = await owner.client.from("problems").update({ published: false }).eq("id", problem.id).select("id");
  assert.equal(unauthorizedEdit.data?.length ?? 0, 0, "Member cannot unpublish through Data API");
  assert.ok((await actions(anonymous).createPracticeAttempt(problem.id, {}, form({ raw_score: "1", attempted_at: now }))).error);
  assert.ok((await anonymous.from("problem_performances").insert({ problem_id: problem.id, user_id: owner.id, attempt_type: "practice", raw_score: 1, attempted_at: now })).error);

  const forged = { raw_score: "0.842", attempted_at: now, user_id: other.id, normalized_performance: "1", status: "disqualified",
    source_provider: "trusted", source_provenance: '{"trusted":true}', competition_result_id: randomUUID(), attempt_type: "official", created_by: admin.id };
  assert.ok((await owner.actions.createPracticeAttempt(problem.id, {}, form(forged))).success);
  let [attempt] = await result(service.from("problem_performances").select("*").eq("problem_id", problem.id));
  assert.equal(attempt.user_id, owner.id); assert.equal(attempt.created_by, owner.id);
  assert.equal(attempt.attempt_type, "practice"); assert.equal(attempt.status, "valid");
  assert.equal(attempt.normalized_performance, null); assert.equal(attempt.source_provider, null);
  assert.deepEqual(attempt.source_provenance, {}); assert.equal(attempt.competition_result_id, null);
  assert.equal((await result(other.client.from("problem_performances").select("id").eq("id", attempt.id))).length, 0);
  assert.ok((await other.actions.updatePracticeAttempt(problem.id, attempt.id, {}, form({ raw_score: "9", attempted_at: now }))).error);
  assert.ok((await other.actions.deletePracticeAttempt(problem.id, attempt.id, {}, form({ confirm: "true" }))).error);
  assert.ok((await owner.client.from("problem_performances").update({ normalized_performance: 1 }).eq("id", attempt.id)).error, "RLS/trigger rejects direct spoofing");
  assert.ok((await owner.actions.updatePracticeAttempt(problem.id, attempt.id, {}, form({ raw_score: "0.9", attempted_at: now, normalized_performance: "1" }))).success);
  [attempt] = await result(service.from("problem_performances").select("*").eq("id", attempt.id));
  assert.equal(attempt.raw_score, 0.9); assert.equal(attempt.normalized_performance, null);
  await result(admin.client.from("problem_performances").update({ status: "invalidated" }).eq("id", attempt.id));
  assert.ok((await owner.actions.updatePracticeAttempt(problem.id, attempt.id, {}, form({ raw_score: "1", attempted_at: now }))).error);
  assert.ok((await owner.actions.deletePracticeAttempt(problem.id, attempt.id, {}, form({ confirm: "true" }))).error);
  await result(admin.client.from("problem_performances").update({ status: "valid" }).eq("id", attempt.id));
  assert.ok((await owner.actions.deletePracticeAttempt(problem.id, attempt.id, {}, form({ confirm: "true" }))).success);
  assert.equal((await result(service.from("problem_performances").select("id").eq("id", attempt.id))).length, 0);
  await assert.rejects(admin.actions.updateProblem(problem.id, {}, form({ ...input, title: "Edited local problem", published: "false" })), /redirect:/);
  assert.equal((await result(anonymous.from("problems").select("id").eq("id", problem.id))).length, 0);
  assert.ok((await owner.actions.createPracticeAttempt(problem.id, {}, form({ raw_score: "1", attempted_at: now }))).error);
  await assert.rejects(admin.actions.updateProblem(problem.id, {}, form(input)), /redirect:/);
  console.log("Local application actions and database boundaries: PASS");

  // Optional browser runtime verification; use an existing Playwright installation, not a new repo dependency.
  if (process.env.KAIZ_PLAYWRIGHT_MODULE) {
    const { chromium } = nodeRequire(process.env.KAIZ_PLAYWRIGHT_MODULE);
    browser = await chromium.launch({ headless: true, ...(process.env.KAIZ_BROWSER_CHANNEL ? { channel: process.env.KAIZ_BROWSER_CHANNEL } : {}) });
    const site = new URL(process.env.KAIZ_LOCAL_APP_URL ?? "http://127.0.0.1:3100");
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(site.hostname));
    const context = await browser.newContext();
    context.setDefaultTimeout(15000); context.setDefaultNavigationTimeout(15000);
    await context.route("**/*", (route) => {
      const requestUrl = new URL(route.request().url());
      return [site.origin, api.origin].includes(requestUrl.origin) ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    const pageErrors = []; page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") pageErrors.push(message.text().split("\n")[0]); });
    await page.goto(`${site.origin}/problems/${input.slug}`);
    await page.getByRole("heading", { name: "Practice / upsolving" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Add practice result" }).count(), 0);
    await page.goto(`${site.origin}/auth/login`);
    await page.getByLabel("Email").fill(owner.email);
    await page.getByLabel("Password", { exact: true }).fill(owner.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"));
    await page.goto(`${site.origin}/problems/${input.slug}`);
    const createForm = page.getByRole("heading", { name: "Add self-reported practice", exact: true }).locator("..");
    await createForm.getByLabel("Raw score (F1)", { exact: true }).fill("0.842");
    await createForm.getByLabel("Attempt time (UTC)", { exact: true }).fill("2050-01-01T00:00");
    await page.getByRole("button", { name: "Add practice result" }).click();
    await page.getByRole("alert").filter({ hasText: "Attempt time cannot be in the future" }).waitFor();
    const scoreInput = createForm.getByLabel("Raw score (F1)", { exact: true });
    await scoreInput.focus(); await scoreInput.press("End"); await scoreInput.press("1");
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("name")), "raw_score", "Typing must not move focus back to an error summary");
    await scoreInput.fill("0.842");
    await createForm.getByLabel("Attempt time (UTC)", { exact: true }).fill(now.slice(0, 16));
    await page.getByRole("button", { name: "Add practice result" }).click();
    await page.getByRole("status").filter({ hasText: "Self-reported practice saved." }).waitFor();
    await page.getByText("Your attempts (1)", { exact: true }).waitFor();
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => ({ fits: document.documentElement.scrollWidth <= innerWidth,
        overflow: [...document.querySelectorAll("body *")].filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 12).map((element) => ({ tag: element.tagName, class: element.getAttribute("class"), width: element.getBoundingClientRect().width })),
      }));
      if (!layout.fits && process.env.KAIZ_QA_ARTIFACTS) await page.screenshot({ path: `${process.env.KAIZ_QA_ARTIFACTS}/overflow-${width}.png`, fullPage: true });
      assert.ok(layout.fits, `No horizontal overflow at ${width}px: ${JSON.stringify(layout.overflow)}`);
    }
    if (process.env.KAIZ_QA_ARTIFACTS) {
      await page.screenshot({ path: `${process.env.KAIZ_QA_ARTIFACTS}/practice-desktop.png`, fullPage: true });
      await page.setViewportSize({ width: 320, height: 900 });
      await page.screenshot({ path: `${process.env.KAIZ_QA_ARTIFACTS}/practice-mobile.png`, fullPage: true });
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    await page.getByText("Edit or delete this attempt", { exact: true }).click();
    await page.getByRole("spinbutton", { name: "Raw score (F1)", exact: true }).nth(1).fill("0.9");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByRole("status").filter({ hasText: "Practice attempt updated." }).waitFor();
    await page.getByLabel("Permanently delete this self-reported attempt").check();
    await page.getByRole("button", { name: "Delete attempt", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Practice attempt deleted." }).waitFor();
    await page.getByText("Your attempts (0)", { exact: true }).waitFor();
    await page.goto(`${site.origin}/admin/problems`);
    await page.waitForURL((url) => url.pathname === "/");
    await context.close();
    console.log("Local browser practice, owner permissions and responsive layout: PASS");

    const adminContext = await browser.newContext();
    adminContext.setDefaultTimeout(15000); adminContext.setDefaultNavigationTimeout(15000);
    await adminContext.route("**/*", (route) => [site.origin, api.origin].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort());
    const adminPage = await adminContext.newPage(); adminPage.on("pageerror", (error) => pageErrors.push(error.message));
    adminPage.on("console", (message) => { if (message.type() === "error") pageErrors.push(message.text().split("\n")[0]); });
    await adminPage.goto(`${site.origin}/auth/login`);
    await adminPage.getByLabel("Email").fill(admin.email);
    await adminPage.getByLabel("Password", { exact: true }).fill(admin.password);
    await adminPage.getByRole("button", { name: "Sign in", exact: true }).click();
    await adminPage.waitForURL((url) => !url.pathname.startsWith("/auth/login"));
    await adminPage.goto(`${site.origin}/admin/problems/new`);
    await adminPage.getByLabel("Title (required)", { exact: true }).fill("Browser created problem");
    await adminPage.getByLabel("Slug (required)", { exact: true }).fill(`${input.slug}-browser`);
    await adminPage.getByLabel("Category (required)", { exact: true }).fill("AI");
    await adminPage.getByLabel("Metric name (required)", { exact: true }).fill("F1");
    await adminPage.getByRole("button", { name: "Save problem", exact: true }).click();
    await adminPage.waitForURL((url) => /\/admin\/problems\/[^/]+\/edit/.test(url.pathname));
    await adminPage.getByRole("status").filter({ hasText: "Problem saved." }).waitFor();
    const browserProblemId = new URL(adminPage.url()).pathname.split("/")[3];
    problemIds.push(browserProblemId);
    assert.equal(await adminPage.getByRole("heading", { name: "Edit archive problem", exact: true }).count(), 1);
    for (const width of [320, 768, 1024, 1440]) {
      await adminPage.setViewportSize({ width, height: 900 });
      assert.ok(await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Admin form fits ${width}px`);
    }
    if (process.env.KAIZ_QA_ARTIFACTS) {
      await adminPage.screenshot({ path: `${process.env.KAIZ_QA_ARTIFACTS}/admin-problem.png`, timeout: 15000 });
      await adminPage.setViewportSize({ width: 320, height: 900 });
      await adminPage.screenshot({ path: `${process.env.KAIZ_QA_ARTIFACTS}/admin-mobile.png`, timeout: 15000 });
      await adminPage.setViewportSize({ width: 1440, height: 900 });
    }
    await adminPage.goto(`${site.origin}/admin/problems/new`);
    await adminPage.getByLabel("Title (required)", { exact: true }).fill("Duplicate must retain entered values");
    await adminPage.getByLabel("Slug (required)", { exact: true }).fill(input.slug);
    await adminPage.getByLabel("Category (required)", { exact: true }).fill("AI");
    await adminPage.getByLabel("Metric name (required)", { exact: true }).fill("F1");
    await adminPage.getByRole("button", { name: "Save problem", exact: true }).click();
    await adminPage.getByRole("alert").filter({ hasText: "already exists" }).waitFor();
    assert.equal(await adminPage.getByLabel("Title (required)", { exact: true }).inputValue(), "Duplicate must retain entered values");
    await adminPage.goto(`${site.origin}/admin/problems/${problem.id}/edit`);
    await adminPage.getByLabel("Title (required)", { exact: true }).fill("Browser edited problem");
    const updated = adminPage.waitForResponse((response) => response.request().method() === "POST"
      && new URL(response.url()).pathname === `/admin/problems/${problem.id}/edit`);
    await adminPage.getByRole("button", { name: "Save problem", exact: true }).click();
    // Wait for the action response, not for a long-lived streamed RSC body to close.
    await updated;
    await adminPage.getByRole("status").filter({ hasText: "Problem saved." }).waitFor();
    assert.equal((await result(service.from("problems").select("title").eq("id", problem.id)))[0].title, "Browser edited problem");
    await adminContext.close();
    assert.deepEqual(pageErrors, []);
    console.log("Local browser admin/practice/permission flows and responsive layout: PASS");
  }
} finally {
  if (browser) await browser.close();
  // Exact IDs created by this check only; preserve all pre-existing local data.
  // Also recover a browser-created row if navigation failed after the insert committed.
  const owned = users.length ? await result(service.from("problems").select("id").eq("created_by", users[0]).like("slug", `local-activation-${run}%`)) : [];
  for (const id of new Set([...problemIds, ...owned.map((row) => row.id)])) await result(service.from("problems").delete().eq("id", id));
  for (const id of users) { const response = await service.auth.admin.deleteUser(id); assert.ifError(response.error); }
  console.log("Temporary local fixtures cleaned up; hosted Supabase untouched.");
}
