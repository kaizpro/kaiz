// Opt-in real isolated Auth + localhost production-build callbacks. No emails sent.
// Admin generates one-time links for synthetic users; tokens/passwords stay in memory.
// This verifies token-hash callbacks, NOT delivered-email PKCE or Google consent.
import assert from 'node:assert/strict';
import {randomBytes, randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createClient} from '@supabase/supabase-js';
const api = new URL(process.env.KAIZ_QA_SUPABASE_URL ?? '');
const base = new URL(process.env.KAIZ_LEARNING_URL ?? '');
assert.equal(api.origin, 'https://venniccblkybvfbxyhug.supabase.co');
assert.equal(base.origin, 'http://localhost:3106');
assert.ok(process.env.KAIZ_QA_SERVICE_KEY && process.env.KAIZ_QA_ANON_KEY && process.env.KAIZ_PLAYWRIGHT_MODULE);
const options = {auth: {persistSession: false, autoRefreshToken: false}, global: {fetch(input, init) {
  assert.equal(new URL(input instanceof Request ? input.url : input).origin, api.origin);
  return fetch(input, init);
}}};
const service = createClient(api.href, process.env.KAIZ_QA_SERVICE_KEY, options);
const member = () => createClient(api.href, process.env.KAIZ_QA_ANON_KEY, options);
const accounts = [], errors = [];
let browser, step = 'setup';
function check(result) {
  if (result.error) throw Object.assign(new Error('Isolated Auth request failed'), {code: result.error.code});
  return result.data;
}
function callback(token, type, next = '/dashboard') {
  const url = new URL('/auth/callback', base);
  url.searchParams.set('token_hash', token); url.searchParams.set('type', type); url.searchParams.set('next', next);
  return url.href;
}
async function context() {
  const ctx = await browser.newContext();
  await ctx.route('**/*', route => [api.origin, base.origin].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort());
  const page = await ctx.newPage(); page.on('pageerror', error => errors.push(error.name));
  return {ctx, page};
}
async function login(page, email, password) {
  await page.goto(base.origin + '/auth/login?next=%2Fdashboard');
  await page.getByLabel('Email', {exact: true}).fill(email);
  await page.getByLabel('Password', {exact: true}).fill(password);
  await page.getByRole('button', {name: 'Sign in', exact: true}).click();
  await page.waitForURL(base.origin + '/dashboard');
  await page.getByRole('heading', {name: 'My learning', exact: true}).waitFor();
}
try {
  const {chromium} = await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
  browser = await chromium.launch({channel: 'chrome', headless: true});
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const email = `callback-${suffix}@example.test`, password = randomBytes(28).toString('base64url') + 'aA9!';
  step = 'isolated unconfirmed signup link';
  const signup = check(await service.auth.admin.generateLink({type: 'signup', email, password, options: {redirectTo: base.origin + '/auth/callback?next=%2Fonboarding'}}));
  accounts.push(signup.user.id);
  assert.equal(Boolean(signup.user.email_confirmed_at), false);
  check(await service.from('profiles').update({username: `qa_${suffix}`, display_name: 'Disposable callback QA'}).eq('id', signup.user.id));
  const a = await context();
  step = 'real signup token verification and safe next';
  await a.page.goto(callback(signup.properties.hashed_token, 'signup', '//evil.invalid'));
  await a.page.waitForURL(base.origin + '/');
  await a.page.getByRole('button', {name: 'Sign out', exact: true}).waitFor();
  assert.ok(check(await service.auth.admin.getUserById(signup.user.id)).user.email_confirmed_at);
  const cookies = await a.ctx.cookies();
  assert.ok(cookies.some(cookie => cookie.name.includes('auth-token')));
  assert.ok(cookies.filter(cookie => cookie.name.includes('auth-token')).every(cookie => cookie.domain === 'localhost'));
  step = 'consumed signup token denied'; const replay = await context();
  await replay.page.goto(callback(signup.properties.hashed_token, 'signup'));
  await replay.page.waitForURL(base.origin + '/auth/login?error=callback');
  step = 'password login refresh and new session';
  await a.page.getByRole('button', {name: 'Sign out', exact: true}).click(); await a.page.waitForURL(base.origin + '/');
  await login(a.page, email, password); await a.page.reload();
  await a.page.getByRole('heading', {name: 'My learning', exact: true}).waitFor();
  const b = await context(); await login(b.page, email, password);
  step = 'real recovery token and password update';
  const recovery = check(await service.auth.admin.generateLink({type: 'recovery', email, options: {redirectTo: base.origin + '/auth/callback?next=%2Fauth%2Fupdate-password'}}));
  const recovered = await context();
  await recovered.page.goto(callback(recovery.properties.hashed_token, 'recovery', '//evil.invalid'));
  await recovered.page.waitForURL(base.origin + '/auth/update-password');
  const newPassword = randomBytes(28).toString('base64url') + 'aA9!';
  await recovered.page.getByLabel('New password', {exact: true}).fill(newPassword);
  await recovered.page.getByRole('button', {name: 'Update password', exact: true}).click();
  await recovered.page.waitForURL(base.origin + '/u/qa_' + suffix);
  assert.ok((await member().auth.signInWithPassword({email, password})).error);
  const fresh = await context(); await login(fresh.page, email, newPassword);
  step = 'PKCE without verifier fails closed';
  const missing = await context();
  await missing.page.goto(base.origin + '/auth/callback?code=disposable-invalid-code&next=%2Fdashboard');
  await missing.page.waitForURL(base.origin + '/auth/login?error=callback');
  assert.equal((await missing.ctx.cookies()).some(cookie => cookie.name.includes('auth-token') && !cookie.name.includes('code-verifier')), false);
  step = 'OAuth initiation only, no provider contact';
  const oauth = await context(); let requested;
  await oauth.page.route(api.origin + '/auth/v1/authorize**', route => {requested = new URL(route.request().url());return route.abort();});
  await oauth.page.goto(base.origin + '/auth/login');
  await oauth.page.getByRole('button', {name: 'Continue with Google', exact: true}).click();
  await oauth.page.waitForFunction(() => document.readyState === 'complete');
  for (let tries = 0; tries < 50 && !requested; tries++) await oauth.page.waitForTimeout(100);
  assert.ok(requested);
  assert.equal(requested.searchParams.get('provider'), 'google');
  assert.equal(requested.searchParams.get('code_challenge_method'), 's256');
  assert.ok(requested.searchParams.get('code_challenge'));
  assert.equal(new URL(requested.searchParams.get('redirect_to')).origin, base.origin);
  assert.ok((await oauth.ctx.cookies()).some(cookie => cookie.name.includes('code-verifier') && cookie.domain === 'localhost'));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({status: 'PASS', environment: 'isolated Supabase + localhost production build', realSignupToken: true, confirmationReplayDenied: true, passwordLogin: true, refreshAndNewSession: true, realRecoveryTokenAndPasswordUpdate: true, missingPkceVerifierDenied: true, oauthInitiationOnly: true, deliveredEmailTested: false, googleConsentTested: false, productionAccess: false}));
} catch (error) {
  console.error(JSON.stringify({status: 'FAIL', step, type: error.name, code: error.code ?? null, location: error.stack?.split('\n').filter(line => line.includes('at ') && line.includes('auth-flows.supabase.mjs')).slice(0, 2)}));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  let removed = 0;
  for (const id of accounts) {
    const result = await service.auth.admin.deleteUser(id);
    if (result.error) { process.exitCode = 1; console.error('Isolated synthetic account cleanup failed'); }
    else removed++;
  }
  console.log(JSON.stringify({createdUsers: accounts.length, removedUsers: removed, productionAccess: false}));
}
