// Opt-in real Auth/RLS/browser QA. Hard locked to the approved disposable project.
// Service credentials bootstrap/clean up synthetic accounts only, never app requests.
import assert from 'node:assert/strict';
import {randomBytes, randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createClient} from '@supabase/supabase-js';
const api = new URL(process.env.KAIZ_QA_SUPABASE_URL ?? '');
const base = new URL(process.env.KAIZ_LEARNING_URL ?? '');
assert.equal(api.origin, 'https://venniccblkybvfbxyhug.supabase.co');
assert.equal(base.origin, 'http://localhost:3106');
assert.ok(process.env.KAIZ_QA_ANON_KEY && process.env.KAIZ_QA_SERVICE_KEY && process.env.KAIZ_PLAYWRIGHT_MODULE);
const options = {auth: {persistSession: false, autoRefreshToken: false}, global: {fetch(input, init) {
  assert.equal(new URL(input instanceof Request ? input.url : input).origin, api.origin);
  return fetch(input, init);
}}};
const client = () => createClient(api.href, process.env.KAIZ_QA_ANON_KEY, options);
const service = createClient(api.href, process.env.KAIZ_QA_SERVICE_KEY, options);
const accounts = [], errors = [];
let browser, step = 'setup';
const lesson = 'python-algebra:python-fundamentals';
const lessonPath = '/roadmaps/beginner/lessons/' + encodeURIComponent(lesson);
function check(result) {
  if (result.error) throw Object.assign(new Error('Isolated request failed'), {code: result.error.code});
  return result.data;
}
async function account(label, admin = false) {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const email = `atlas-${label}-${suffix}@example.test`, password = randomBytes(28).toString('base64url') + 'aA9!';
  const created = check(await service.auth.admin.createUser({email, password, email_confirm: true}));
  const user = {id: created.user.id, email, password, client: client()};
  accounts.push(user);
  check(await service.from('profiles').update({username: `qa_${label}_${suffix}`, display_name: 'Disposable Atlas QA', ...(admin ? {role: 'admin'} : {})}).eq('id', user.id));
  const auth = check(await user.client.auth.signInWithPassword({email, password}));
  assert.equal(auth.user.id, user.id);
  assert.equal(check(await user.client.rpc('is_admin')), admin);
  return user;
}
async function context(width = 1440, theme = 'light') {
  const ctx = await browser.newContext({viewport: {width, height: 1000}, reducedMotion: 'reduce'});
  await ctx.addInitScript(value => localStorage.setItem('theme', value), theme);
  await ctx.route('**/*', route => [base.origin, api.origin].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort());
  const page = await ctx.newPage();
  page.on('pageerror', error => errors.push(error.name));
  return {ctx, page};
}
async function login(page, user) {
  await page.goto(base.origin + '/auth/login?next=%2Froadmaps%2Fbeginner');
  await page.getByLabel('Email', {exact: true}).fill(user.email);
  await page.getByLabel('Password', {exact: true}).fill(user.password);
  await page.getByRole('button', {name: 'Sign in', exact: true}).click();
  await page.waitForURL(base.origin + '/roadmaps/beginner');
  await page.locator('[data-classic-next]').waitFor();
}
async function progress(page, count) {
  const disclosure = page.locator('details').filter({has: page.locator('summary', {hasText: 'Your saved progress'})});
  if (await disclosure.count() && !await disclosure.evaluate(node => node.open)) await disclosure.locator('summary').click();
  const section = page.locator('section[aria-label="Beginner saved progress"],section[aria-label="Beginner roadmap progress"]');
  await section.getByText(new RegExp(`${count} / 15 lessons`)).waitFor();
  assert.match(await section.innerText(), new RegExp(`\\b${count * 10} Learning XP`));
  assert.equal(await page.getByRole('progressbar', {name: 'Beginner completion', exact: true}).getAttribute('value'), String(count));
}
const rows = async user => check(await user.client.from('learning_progress').select('roadmap_id,lesson_id,completed_at,updated_at').eq('user_id', user.id));
const complete = (user, completed) => user.client.rpc('set_learning_completion', {p_roadmap_id: 'beginner', p_lesson_id: lesson, p_completed: completed});
try {
  step = 'real ordinary and admin accounts';
  const owner = await account('owner'), other = await account('other'), admin = await account('admin', true), guest = client();
  // A pre-existing released key, saved before this user first opens the new UI.
  check(await other.client.rpc('set_learning_completion', {p_roadmap_id: 'beginner', p_lesson_id: 'python-algebra:algebra', p_completed: true}));
  const legacy = (await rows(other))[0];
  const {chromium} = await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
  browser = await chromium.launch({channel: 'chrome', headless: true});
  const a = await context();
  step = 'browser completion'; await login(a.page, owner); await progress(a.page, 0);
  await a.page.locator('[data-classic-next]').click();
  await a.page.waitForURL(base.origin + lessonPath);
  await a.page.locator('#practice').waitFor();
  await a.page.getByRole('button', {name: 'Mark completed: lesson 1.1', exact: true}).click();
  await a.page.getByRole('button', {name: 'Undo completion of lesson 1.1', exact: true}).waitFor();
  assert.equal((await rows(owner)).filter(row => row.completed_at).length, 1);
  await a.page.goto(base.origin + '/roadmaps/beginner'); await progress(a.page, 1);
  await a.page.getByRole('link', {name: 'Continue learning · Python Practice', exact: true}).waitFor();
  step = 'refresh and dashboard'; await a.page.reload(); await progress(a.page, 1);
  await a.page.goto(base.origin + '/dashboard'); await progress(a.page, 1);
  await a.page.getByRole('region', {name: 'Overall learning progress', exact: true}).getByText('1 / 40', {exact: true}).waitFor();
  step = 'retry idempotency'; const saved = await rows(owner);
  for (const result of await Promise.all(Array.from({length: 12}, () => complete(owner, true)))) check(result);
  assert.deepEqual(await rows(owner), saved);
  step = 'logout and new sessions';
  await a.page.getByRole('button', {name: 'Sign out', exact: true}).click(); await a.page.waitForURL(base.origin + '/');
  await login(a.page, owner); await progress(a.page, 1);
  const second = await context(375, 'dark'); await login(second.page, owner); await progress(second.page, 1);
  for (const path of ['/roadmaps/beginner', '/roadmaps/beginner?view=map&area=1', lessonPath, '/dashboard']) {
    await second.page.goto(base.origin + path);
    await second.page.getByRole('heading', {level: 1}).waitFor();
    await second.page.addStyleTag({content: 'html {font-size:200% !important}'});
    assert.ok(await second.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  step = 'ordinary and admin cross-user RLS';
  for (const user of [other, admin]) {
    assert.deepEqual(check(await user.client.from('learning_progress').select('lesson_id').eq('user_id', owner.id)), []);
    assert.deepEqual(check(await user.client.from('learning_progress').update({completed_at: null}).eq('user_id', owner.id).select('lesson_id')), []);
    assert.equal((await user.client.from('learning_progress').insert({user_id: owner.id, roadmap_id: 'beginner', lesson_id: lesson, completed_at: new Date().toISOString()})).error?.code, '42501');
    const b = await context(); await login(b.page, user); await progress(b.page, user === other ? 1 : 0); await b.ctx.close();
  }
  assert.equal((await rows(owner)).filter(row => row.completed_at).length, 1);
  check(await complete(other, true));
  step = 'guest';
  assert.equal((await guest.from('learning_progress').select('lesson_id')).error?.code, '42501');
  assert.equal((await complete({client: guest}, true)).error?.code, '42501');
  const anon = await context(); await anon.page.goto(base.origin + lessonPath);
  await anon.page.getByRole('link', {name: 'Sign in to save progress', exact: true}).waitFor();
  assert.equal(await anon.page.getByRole('button', {name: /Mark completed/}).count(), 0);
  assert.equal(await anon.page.getByRole('progressbar').count(), 0);
  step = 'undo across sessions'; await second.page.goto(base.origin + lessonPath);
  await second.page.getByRole('button', {name: 'Undo completion of lesson 1.1', exact: true}).click();
  await second.page.getByRole('button', {name: 'Mark completed: lesson 1.1', exact: true}).waitFor();
  await a.page.goto(base.origin + '/dashboard'); await progress(a.page, 0);
  assert.equal((await rows(owner)).filter(row => row.completed_at).length, 0);
  assert.equal((await rows(other)).filter(row => row.completed_at).length, 2);
  assert.deepEqual((await rows(other)).find(row => row.lesson_id === legacy.lesson_id), legacy, 'existing completion/timestamps unchanged');
  step = 'shared Analysis keeps Intermediate identity and XP';
  await a.page.goto(base.origin + '/roadmaps/beginner');
  const dataModule = a.page.locator('[data-course-module]').nth(1);
  if (await dataModule.getAttribute('open') === null) await dataModule.locator(':scope > summary').click();
  const shared = dataModule.locator('li').filter({has: a.page.locator('a[href="/roadmaps/intermediate/lessons/prepare-data%3Aexploratory-analysis"]')});
  await shared.getByRole('button', {name: /Mark completed:/}).click();
  await shared.getByRole('button', {name: /Undo completion/}).waitFor();
  const bridge = (await rows(owner)).find(row => row.lesson_id === 'prepare-data:exploratory-analysis');
  assert.equal(bridge.roadmap_id, 'intermediate'); assert.ok(bridge.completed_at);
  await progress(a.page, 0);
  await a.page.goto(base.origin + '/dashboard');
  await a.page.getByRole('region', {name: 'Overall learning progress', exact: true}).getByText('1 / 40', {exact: true}).waitFor();
  await a.page.getByRole('region', {name: 'Intermediate roadmap progress', exact: true}).getByText(/10 Learning XP/).waitFor();
  await a.page.goto(base.origin + '/roadmaps/beginner');
  if (await dataModule.getAttribute('open') === null) await dataModule.locator(':scope > summary').click();
  await shared.getByRole('button', {name: /Undo completion/}).click();
  await shared.getByRole('button', {name: /Mark completed:/}).waitFor();
  assert.equal((await rows(owner)).filter(row => row.completed_at).length, 0);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({status: 'PASS',realAuth: true,accounts: 'two ordinary, one admin',completion: true,refreshAndNewSession: true,xpAndUndo: true,concurrentRetry: 12,ownerOnlyRls: true,guestDenied: true,mobile200Percent: true,existingProgressPreserved: true,sharedAnalysisIdentityAndXp: true,productionAccess: false}));
} catch (error) {
  console.error(JSON.stringify({status: 'FAIL',step,type: error.name,code: error.code ?? null,location: error.stack?.split('\n').filter(line => line.includes('at ') && line.includes('skill-atlas.supabase.mjs')).slice(0,2)}));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  let removed = 0;
  for (const user of accounts) {
    const result = await service.auth.admin.deleteUser(user.id);
    if (result.error) { process.exitCode = 1; console.error('Isolated synthetic account cleanup failed'); }
    else removed++;
  }
  console.log(JSON.stringify({createdUsers: accounts.length,removedUsers: removed,productionAccess: false}));
}
