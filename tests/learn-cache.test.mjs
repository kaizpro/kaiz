import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AsyncLocalStorage} from 'node:async_hooks';
import {loadTypescript} from './helpers/load-typescript.mjs';

const load = loadTypescript();
// Next's server bootstrap normally installs this before loading server utils.
globalThis.AsyncLocalStorage = AsyncLocalStorage;
const {default: testing} = await import('next/experimental/testing/server.js');
// This installed Next release still exports the legacy name for the matcher
// test utility, even though the production entry point is named proxy.ts.
const {unstable_doesMiddlewareMatch: unstable_doesProxyMatch} = testing;
const {config} = load('proxy.ts');
for (const path of ['/learn', '/learn/', '/learn?track=coding-ai', '/learn/topics?q=python', '/learn/python-fundamentals?from=test', '/learn/not-a-topic', '/robots.txt', '/sitemap.xml']) {
  test(`no auth proxy invocation for public ${path}`, () => {
    for (const headers of [{}, {'rsc': '1', 'next-router-prefetch': '1'}, {'next-action': 'test-action'}]) {
      assert.equal(unstable_doesProxyMatch({config, nextConfig: {}, url: path, headers}), false);
    }
  });
}
for (const path of ['/dashboard', '/admin', '/settings/profile', '/onboarding', '/auth/callback?code=example', '/auth/update-password', '/roadmaps/beginner', '/roadmaps/beginner/lessons/example', '/learning', '/learn-private', '/competitions', '/problems', '/discussions']) {
  test(`auth refresh remains on ${path}`, () => assert.equal(unstable_doesProxyMatch({config, nextConfig: {}, url: path}), true));
}

test('account presentation verifies the user, selects only their username and never returns tokens or roles', async () => {
  const calls = [];
  const {readHeaderAccount} = load('lib/auth/header-account.ts');
  const value = await readHeaderAccount({auth: {getUser: async () => ({data: {user: {id: 'owner'}}, error: null})}, from(table) {
    calls.push(table); return {select(fields) {calls.push(fields); return {eq(key, id) {calls.push(key, id); return {maybeSingle: async () => ({data: {username: 'student', role: 'admin', private_field: 'not-for-html'}, error: null})};}};}};
  }});
  assert.deepEqual(JSON.parse(JSON.stringify(value)), {status: 'member', username: 'student'});
  assert.deepEqual(calls, ['profiles', 'username', 'id', 'owner']);
});
test('account errors are neutral; unauthenticated users never query profiles', async () => {
  const {readHeaderAccount} = load('lib/auth/header-account.ts');
  for (const [error, expected] of [[null, 'guest'], [{name: 'AuthSessionMissingError'}, 'guest'], [{name: 'AuthRetryableFetchError'}, 'unavailable']]) {
    const result = await readHeaderAccount({auth: {getUser: async () => ({data: {user: null}, error})}, from() {assert.fail('No guest profile query');}});
    assert.equal(result.status, expected);
  }
  assert.equal((await readHeaderAccount({auth: {getUser: async () => {throw Error('private detail');}}})).status, 'unavailable');
});
test('shared header SSR contains only neutral account navigation, never private account markup', () => {
  const {HeaderAccountControls} = loadTypescript({
    'next/navigation': {usePathname: () => '/learn'},
    '@/lib/supabase/env': {hasSupabaseEnv: () => true},
    '@/lib/supabase/client': {createClient: () => {assert.fail('No Auth client during SSR');}},
    '@/app/auth/actions': {logout: async () => {}},
    '@/components/ui/button': {Button: ({children}) => React.createElement('span', null, children)},
    'next/link': {default: ({children, prefetch, ...props}) => {void prefetch; return React.createElement('a', props, children);}},
  })('components/header-account.tsx');
  const html = renderToStaticMarkup(React.createElement(HeaderAccountControls));
  assert.match(html, />Account</);
  assert.match(html, /href="\/dashboard"/);
  assert.doesNotMatch(html, /Sign out|Finish profile|My learning|\/u\//);
});
test('dense learning links explicitly disable Next prefetch', () => {
  const {default: Link} = load('components/learning/learning-link.tsx');
  assert.equal(Link({href: '/roadmaps', prefetch: true}).props.prefetch, false);
  assert.equal(Link({href: '/learn/python-fundamentals'}).props.prefetch, false);
});
test('crawler inventory is public, canonical, finite and contains every real topic without query variants', () => {
  const {default: sitemap} = load('app/sitemap.ts');
  const {default: robots} = load('app/robots.ts');
  const {getTopics, topicHref} = load('lib/learning/curriculum.ts');
  const urls = sitemap().map(entry => entry.url);
  assert.equal(new Set(urls).size, urls.length);
  for (const topic of getTopics()) assert.ok(urls.includes('https://kaizpro.com' + topicHref(topic)));
  for (const raw of urls) {
    const url = new URL(raw);
    assert.equal(url.origin, 'https://kaizpro.com'); assert.equal(url.search, '');
    assert.doesNotMatch(url.pathname, /auth|dashboard|admin|settings|\/u\//);
  }
  assert.equal(robots().sitemap, 'https://kaizpro.com/sitemap.xml');
  assert.ok(robots().rules.disallow.includes('/learn?*'));
  assert.ok(!robots().rules.disallow.includes('/learn'));
});
