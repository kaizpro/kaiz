// Opt-in production-build browser QA against localhost. No accounts or writes.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const base = new URL(process.env.KAIZ_LEARNING_URL ?? 'http://localhost:3106');
assert.equal(base.origin, 'http://localhost:3106');
assert.ok(process.env.KAIZ_PLAYWRIGHT_MODULE);
const {chromium} = await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({channel: 'chrome', headless: true});
const errors = [];
await mkdir('work/learn-cache', {recursive: true});
try {
  for (const [width, theme, motion] of [[1440, 'light', 'reduce'], [390, 'dark', 'reduce'], [1440, 'dark', 'no-preference']]) {
    const context = await browser.newContext({viewport: {width, height: 1000}, reducedMotion: motion});
    await context.addInitScript(value => localStorage.setItem('theme', value), theme);
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.origin === base.origin || url.origin === 'https://venniccblkybvfbxyhug.supabase.co' ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    const serverRequests = [], authRequests = [];
    page.on('pageerror', error => errors.push(error.name));
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.origin === base.origin && (request.resourceType() === 'document' || request.headers().rsc)) serverRequests.push(url.pathname);
      if (url.hostname === 'venniccblkybvfbxyhug.supabase.co') authRequests.push(url.pathname);
    });
    await page.goto(base.origin + '/learn?track=coding-ai&open=programming,python');
    await page.getByRole('link', {name: 'Sign in', exact: true}).waitFor();
    await page.locator('#node-python-fundamentals').waitFor();
    await page.waitForLoadState('networkidle');
    assert.deepEqual(serverRequests, ['/learn'], 'no automatic prefetch of dynamic navigation or topic routes');
    assert.deepEqual(authRequests, [], 'anonymous public browsing does not call Supabase');
    const branch = page.locator('#node-python');
    await branch.click(); await branch.click();
    assert.equal(await branch.getAttribute('aria-expanded'), 'true');
    assert.deepEqual(serverRequests, ['/learn'], 'native tree history does not request RSC');
    await page.screenshot({path: `work/learn-cache/tree-${width}-${theme}.png`, fullPage: true});
    await page.locator('#node-python-fundamentals').press('Enter');
    await page.waitForURL(/\/learn\/python-fundamentals\?/);
    await page.getByRole('heading', {name: 'Python Fundamentals', exact: true}).waitFor();
    await page.getByRole('link', {name: 'Back to the learning tree', exact: true}).click();
    await page.locator('#node-python-fundamentals').waitFor();
    await page.goto(base.origin + '/learn/topics?q=pandas');
    await page.getByRole('link', {name: 'Clear filters', exact: true}).waitFor();
    await page.getByRole('link', {name: 'Clear filters', exact: true}).click();
    await page.getByRole('status').getByText('64 source entries', {exact: true}).waitFor();
    const beforeFilter = serverRequests.length;
    await page.getByLabel('Search topics', {exact: true}).fill('definitely-no-such-topic');
    await page.getByRole('button', {name: 'Apply filters', exact: true}).click();
    await page.getByText('No topics match. Try another group or broader search.').waitFor();
    await page.goBack();
    await page.getByRole('status').getByText('64 source entries', {exact: true}).waitFor();
    assert.equal(serverRequests.length, beforeFilter, 'filter/apply/back do not invoke a server');
    await page.addStyleTag({content: 'html {font-size:200% !important}'});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no page overflow at 200% text');
    await page.screenshot({path: `work/learn-cache/topics-${width}-${theme}-200.png`, fullPage: true});
    await context.close();
  }
  const noJs = await browser.newContext({javaScriptEnabled: false});
  const page = await noJs.newPage();
  await page.goto(base.origin + '/learn/topics?q=pandas');
  assert.equal(await page.locator('main details > summary > h3').count(), 64, 'all public source entries available without JS');
  // Playwright's text engine skips noscript nodes even with JS disabled. Check
  // the actual rendered notice and its layout box, not that selector shortcut.
  assert.match(await page.locator('noscript').innerText(), /All topics are shown/);
  assert.ok((await page.locator('noscript').boundingBox()).height > 0);
  await noJs.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({status: 'PASS',desktopMobileLightDark: true,reducedMotion: true,keyboardNavigation: true,textZoom200: true,treeAndFiltersNoServerRequests: true,noGuestAuthRequests: true,noJavascriptCatalog: true,productionAccess: false}));
} finally {await browser.close();}
