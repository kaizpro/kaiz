import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
// Exercise real auth modules with isolated provider responses. No accounts,
// emails, environment files, credentials or external requests are used.
function load(relative, mocks = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, URL, process: { env: {} },
    require: (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === "./redirects" || name === "@/lib/auth/redirects") return redirects;
      if (name === "@/lib/auth/urls") return urls;
      if (name === "@/lib/validation/auth") return load("../lib/validation/auth.ts");
      if (name === "server-only") return {};
      return require(name);
    },
  });
  return exports;
}

const redirects = load("../lib/auth/redirects.ts");
const urls = load("../lib/auth/urls.ts");
const production = "https://kaiz-indol.vercel.app";

for (const value of [null, undefined, {}, "", "https://example.invalid", "//example.invalid", "/\\example.invalid",
  "\\\\example.invalid", "javascript:alert(1)", "data:text/html,test", "file:///tmp/test", "http://localhost:3000/",
  " /u/test", "/\t/example.invalid", "/\n/example.invalid", "/\u0000/example.invalid", "/%2fexample.invalid",
  "/%5cexample.invalid", "/%252fexample.invalid", "/%255cexample.invalid", "/%0d%0aLocation:test",
  "/%", "/%GG", "/.//example.invalid", "/x/..//example.invalid", "/%2e//example.invalid"]) {
  test(`unsafe redirect rejected: ${JSON.stringify(value)}`, () => {
    assert.equal(redirects.safeAuthRedirect(value), "/");
  });
}

for (const [value, expected] of [["/u/timatema", "/u/timatema"], ["/settings/profile", "/settings/profile"],
  ["/competitions?q=AI%20ML#dates", "/competitions?q=AI%20ML#dates"], ["/u/../competitions", "/competitions"],
  ["/discussions?q=https%3A%2F%2Fexample.invalid", "/discussions?q=https%3A%2F%2Fexample.invalid"]]) {
  test(`internal redirect retained: ${value}`, () => {
    const actual = redirects.safeAuthRedirect(value);
    assert.equal(actual, expected);
    assert.equal(new URL(actual, production).origin, production);
    assert.equal(redirects.safeAuthRedirect(actual), actual);
  });
}

test("development defaults locally; production without configuration fails closed", () => {
  assert.equal(urls.resolveSiteOrigin({ NODE_ENV: "development" }), "http://localhost:3000");
  assert.equal(urls.resolveSiteOrigin({ NODE_ENV: "development", VERCEL: "1", VERCEL_ENV: "development" }), "http://localhost:3000");
  assert.throws(() => urls.resolveSiteOrigin({ NODE_ENV: "production" }), /Configure NEXT_PUBLIC_SITE_URL/);
  assert.throws(() => urls.resolveSiteOrigin({ VERCEL: "1" }), /Configure NEXT_PUBLIC_SITE_URL/);
});
test("callback URLs retain the configured localhost or production origin", () => {
  for (const origin of ["http://localhost:3000", production]) {
    const callback = new URL(urls.authCallbackUrl(origin, "/auth/update-password"));
    assert.equal(callback.origin, origin);
    assert.equal(callback.searchParams.get("next"), "/auth/update-password");
    assert.equal(new URL(urls.authCallbackUrl(origin, "//example.invalid")).searchParams.get("next"), "/");
  }
});
test("explicit origins support localhost builds and canonical production domains", () => {
  assert.equal(urls.resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000", NODE_ENV: "production" }), "http://localhost:3000");
  assert.equal(urls.resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: production, VERCEL_ENV: "production" }), production);
  assert.equal(urls.resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: "https://chosen-domain.invalid", VERCEL_URL: "preview.vercel.app" }), "https://chosen-domain.invalid");
});
test("production uses Vercel domain fallback; preview does not default to production", () => {
  const env = { VERCEL_PROJECT_PRODUCTION_URL: "kaiz-indol.vercel.app", VERCEL_URL: "preview.vercel.app" };
  assert.equal(urls.resolveSiteOrigin({ ...env, VERCEL_ENV: "production" }), production);
  assert.equal(urls.resolveSiteOrigin({ ...env, VERCEL_ENV: "preview" }), "https://preview.vercel.app");
  assert.throws(() => urls.resolveSiteOrigin({ VERCEL_ENV: "preview", VERCEL_PROJECT_PRODUCTION_URL: "kaiz-indol.vercel.app" }));
  assert.equal(urls.resolveSiteOrigin({ VERCEL_URL: "deployment.vercel.app" }), "https://deployment.vercel.app");
  assert.equal(urls.resolveSiteOrigin({ NEXT_PUBLIC_VERCEL_URL: "legacy.vercel.app" }), "https://legacy.vercel.app");
});
for (const value of ["http://localhost:3000", "https://localhost", "https://127.0.0.1", "http://example.invalid",
  "javascript:alert(1)", "file:///tmp/test", "https://name:password@example.invalid", "https://example.invalid/path",
  "https://example.invalid?query=1", "https://example.invalid#fragment"]) {
  test(`hosted origin rejects unsafe configuration: ${value}`, () => {
    assert.throws(() => urls.resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: value, VERCEL_ENV: "production" }));
  });
}

function callback(error = null) {
  const calls = [];
  const callbackRoute = load("../app/auth/callback/route.ts", {
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      exchangeCodeForSession: async (code) => { calls.push(["pkce", code]); return { error }; },
      verifyOtp: async (args) => { calls.push(["otp", args]); return { error }; },
    } }) },
  });
  return { calls, get: (query) => callbackRoute.GET(new Request(`${production}/auth/callback?${query}`)) };
}
test("PKCE callback exchanges code and never redirects outside request origin", async () => {
  const flow = callback();
  const response = await flow.get(`code=test-code&next=${encodeURIComponent("/\\example.invalid")}`);
  assert.equal(response.headers.get("location"), `${production}/`);
  assert.equal(flow.calls[0][0], "pkce");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
});
for (const type of ["signup", "recovery", "email_change", "email", "invite", "magiclink"]) {
  test(`token hash ${type} is verified by Supabase`, async () => {
    const flow = callback();
    const response = await flow.get(`token_hash=test-token&type=${type}&next=/onboarding`);
    assert.equal(response.headers.get("location"), `${production}${type === "recovery" ? "/auth/update-password" : "/onboarding"}`);
    assert.equal(flow.calls[0][1].type, type);
    assert.equal(flow.calls[0][1].token_hash, "test-token");
  });
}
for (const query of ["", "token_hash=test-token&type=sms", "token_hash=test-token", "code=test-code&token_hash=test-token&type=signup", "error=access_denied&error_description=private-details"]) {
  test(`invalid callback rejected without provider call: ${query}`, async () => {
    const flow = callback();
    const response = await flow.get(query);
    assert.equal(response.headers.get("location"), `${production}/auth/login?error=callback`);
    assert.equal(flow.calls.length, 0);
  });
}
test("failed code and expired OTP do not establish a successful redirect", async () => {
  for (const query of ["code=test-code", "token_hash=test-token&type=recovery"]) {
    assert.equal((await callback({ message: "private-details" }).get(query)).headers.get("location"), `${production}/auth/login?error=callback`);
  }
});

class Redirect extends Error { constructor(path) { super("Redirect"); this.path = path; } }
function actions(overrides = {}) {
  const calls = [];
  const auth = Object.fromEntries(["signUp", "resend", "resetPasswordForEmail", "signInWithOAuth", "signInWithPassword", "signOut"].map((method) => [method, async (...args) => {
    calls.push({ method, args });
    return overrides[method] ?? { error: null, data: { user: { id: "test-user" }, url: "https://provider.invalid/authorize" } };
  }]));
  const authActions = load("../app/auth/actions.ts", {
    "next/navigation": { redirect: (path) => { throw new Redirect(path); } },
    "@/lib/supabase/env": { getSiteUrl: () => production },
    "@/lib/auth": { profileDestination: (profile) => profile?.username ? `/u/${profile.username}` : "/onboarding" },
    "@/lib/supabase/server": { createClient: async () => ({ auth, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { username: "test-user" } }) }) }) }) }) },
  });
  return { calls, module: authActions };
}
function form(values = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ email: "test@example.invalid", password: "test-password-not-a-credential", displayName: "Test", ...values })) data.set(key, value);
  return data;
}
test("signup, resend and recovery use a production callback with their proper next path", async () => {
  const flow = actions();
  await flow.module.register({}, form());
  await flow.module.resendConfirmation({}, form());
  await flow.module.resetPassword({}, form());
  for (const { method, args } of flow.calls) {
    const raw = method === "resetPasswordForEmail" ? args[1].redirectTo : args[0].options.emailRedirectTo;
    const url = new URL(raw);
    assert.equal(url.origin, production);
    assert.equal(url.pathname, "/auth/callback");
    assert.equal(url.searchParams.get("next"), method === "resetPasswordForEmail" ? "/auth/update-password" : "/onboarding");
  }
});
test("Google uses the supported provider and production PKCE callback", async () => {
  const flow = actions();
  await assert.rejects(flow.module.signInWithGoogle(), (error) => error instanceof Redirect && error.path === "https://provider.invalid/authorize");
  assert.equal(flow.calls[0].args[0].provider, "google");
  assert.equal(new URL(flow.calls[0].args[0].options.redirectTo).origin, production);
});
test("login unsafe targets fall back to saved public profile; internal targets are retained", async () => {
  for (const [next, expected] of [["/\\example.invalid", "/u/test-user"], ["//example.invalid", "/u/test-user"], ["/settings/profile", "/settings/profile"]]) {
    await assert.rejects(actions().module.login({}, form({ next })), (error) => error instanceof Redirect && error.path === expected);
  }
});
test("validation does not invoke providers; logout failures are not treated as success", async () => {
  const flow = actions();
  assert.ok((await flow.module.resendConfirmation({}, form({ email: "invalid" }))).error);
  assert.equal(flow.calls.length, 0);
  await assert.rejects(actions({ signOut: { error: { message: "private-details" } } }).module.logout(), /Unable to sign out/);
  await assert.rejects(actions().module.logout(), (error) => error instanceof Redirect && error.path === "/");
});

function passwordActions({ user = { id: "test-user" }, error = null } = {}) {
  const calls = [];
  const updateActions = load("../app/auth/update-password/actions.ts", {
    "next/navigation": { redirect: (path) => { throw new Redirect(path); } },
    "@/lib/auth": { profileDestination: (profile) => profile?.username ? `/u/${profile.username}` : "/onboarding" },
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user } }),
          updateUser: async (args) => { calls.push(args); return { error }; },
        },
        from: () => ({ select: () => ({ eq: () => ({
          maybeSingle: async () => ({ data: { username: "test-user" } }),
        }) }) }),
      }),
    },
  });
  return { calls, module: updateActions };
}
test("password update requires a real authenticated session and valid input", async () => {
  const flow = passwordActions({ user: null });
  assert.match((await flow.module.updatePassword({}, form())).error, /expired/);
  assert.equal(flow.calls.length, 0);
  const validSession = passwordActions();
  assert.ok((await validSession.module.updatePassword({}, form({ password: "short" }))).error);
  assert.equal(validSession.calls.length, 0);
});
test("password update handles expired/same-password errors without leaking provider details", async () => {
  for (const [code, message] of [["same_password", /different/], ["session_not_found", /expired/], ["unexpected", /Unable/]]) {
    const result = await passwordActions({ error: { code, message: "private-provider-details" } }).module.updatePassword({}, form());
    assert.match(result.error, message);
    assert.ok(!result.error.includes("private-provider-details"));
  }
});
test("successful password update redirects to the persisted public profile", async () => {
  const flow = passwordActions();
  await assert.rejects(flow.module.updatePassword({}, form()), (error) => error instanceof Redirect && error.path === "/u/test-user");
  assert.equal(flow.calls.length, 1);
});
