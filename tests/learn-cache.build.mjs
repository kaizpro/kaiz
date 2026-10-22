// Run after a production build WITH browser-public Supabase env configured.
// Localhost only: no load testing, production requests or credentials required.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(await readFile(new URL('../.next/prerender-manifest.json', import.meta.url), 'utf8'));
const learn = Object.keys(manifest.routes).filter(path => path === '/learn' || path.startsWith('/learn/'));
assert.equal(learn.length, 87, 'directory, catalog and all 85 real topics prerendered');
for (const path of [...learn, '/robots.txt', '/sitemap.xml']) {
  assert.equal(manifest.routes[path]?.compute, 'static', path);
  assert.equal(manifest.routes[path]?.initialRevalidateSeconds, false, path);
}
assert.equal(manifest.dynamicRoutes['/learn/[slug]'].fallback, false, 'unknown slugs cannot generate on demand');
for (const path of ['/dashboard', '/onboarding', '/settings/profile', '/admin']) assert.ok(!manifest.routes[path], `${path} must never be shared cached`);

const socket = createServer();
await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {cwd: root, stdio: ['ignore', 'pipe', 'pipe']});
let ready = false;
const readiness = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(Error('Local server startup timed out')), 30_000);
  server.stdout.on('data', chunk => {if (String(chunk).includes('Ready')) {ready = true; clearTimeout(timeout); resolve();}});
  server.once('exit', () => {clearTimeout(timeout); if (!ready) reject(Error('Local server exited before readiness'));});
});
try {
  await readiness;
  for (const path of learn) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('cache-control') ?? '', /s-maxage=/, path);
    assert.doesNotMatch(response.headers.get('cache-control') ?? '', /private|no-store/, path);
    assert.equal(response.headers.get('x-nextjs-cache'), 'HIT', path);
    assert.equal(response.headers.get('set-cookie'), null, path);
    const html = await response.text();
    assert.ok(html.includes('<h1'), path);
    assert.doesNotMatch(html, /Sign out|Finish profile|\/u\/qa_|qa-private-marker/, path);
  }
  for (const path of ['/learn', '/learn/topics', '/learn/python-fundamentals']) {
    const ordinary = await (await fetch(base + path)).text();
    const withCookie = await fetch(base + path + '?q=unique-visitor&from=arbitrary-tree-state', {headers: {cookie: 'qa-private-marker=never-cache-this-visitor'}});
    assert.equal(await withCookie.text(), ordinary, 'query/cookie variants contain identical public HTML');
    assert.equal(withCookie.headers.get('set-cookie'), null);
    const head = await fetch(base + path, {method: 'HEAD'});
    assert.equal(head.headers.get('x-nextjs-cache'), 'HIT');
    const rsc = await fetch(base + path + '?_rsc=cache-regression', {headers: {RSC: '1', 'Next-Router-Prefetch': '1'}});
    assert.equal(rsc.status, 200); assert.equal(rsc.headers.get('x-nextjs-cache'), 'HIT');
    assert.match(rsc.headers.get('content-type'), /text\/x-component/);
    assert.doesNotMatch(await rsc.text(), /Sign out|qa-private-marker/);
  }
  assert.equal((await fetch(base + '/learn/not-a-real-topic')).status, 404);
  const robots = await fetch(base + '/robots.txt');
  assert.equal(robots.status, 200); assert.match(await robots.text(), /Sitemap: https:\/\/kaizpro.com\/sitemap.xml/);
  const sitemap = await fetch(base + '/sitemap.xml');
  assert.equal(sitemap.status, 200); assert.equal(((await sitemap.text()).match(/<loc>/g) ?? []).length, 91);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const privatePage = await fetch(base + '/dashboard', {redirect: 'manual'});
    // A redirect after streaming starts is encoded in the document, not a 307.
    assert.ok([200, 307].includes(privatePage.status));
    if (privatePage.status === 307) assert.match(privatePage.headers.get('location'), /^\/auth\/login/);
    else {
      const body = await privatePage.text();
      assert.match(body, /NEXT_REDIRECT[\s\S]*\/auth\/login/);
      assert.doesNotMatch(body, /Overall learning progress|Learning XP/);
    }
    assert.match(privatePage.headers.get('cache-control'), /private/);
    assert.doesNotMatch(privatePage.headers.get('cache-control'), /s-maxage/);
  }
  console.log(JSON.stringify({status: 'PASS',staticLearnPages: learn.length,cacheHit: true,queryCookieAndRsc: true,unknownTopic404: true,publicMetadata: true,privateDashboardUncached: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),productionAccess: false}));
} finally {
  server.kill();
  if (server.exitCode === null) await new Promise(resolve => server.once('exit', resolve));
}
