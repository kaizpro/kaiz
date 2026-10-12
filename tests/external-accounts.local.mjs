// Opt-in: node tests/external-accounts.local.mjs. Local Supabase only; no dotenv.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
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
} catch { throw new Error("Start local Supabase before running this check."); }
const api = new URL(status.API_URL);
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(api.hostname), "Local Supabase only");
const options = {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, init) => {
    assert.equal(new URL(input).origin, api.origin, "Hosted requests are forbidden");
    return fetch(input, init);
  } },
};
const service = createClient(api.href, status.SERVICE_ROLE_KEY, options);
const owner = createClient(api.href, status.ANON_KEY, options);
const users = [];
const run = randomUUID();

function load(file, overrides = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, Object, Date, Number,
    require: (name) => name in overrides ? overrides[name] : nodeRequire(name),
  });
  return exports;
}
async function result(query) {
  const response = await query;
  assert.ifError(response.error);
  return response.data;
}
async function links(id) {
  return result(service.from("external_accounts").select("*").eq("user_id", id).order("provider"));
}

try {
  const email = `external-${run}@example.test`;
  const password = randomBytes(24).toString("base64url");
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  const id = created.data.user.id;
  users.push(id);
  assert.ifError((await owner.auth.signInWithPassword({ email, password })).error);
  const dependencies = {
    "server-only": {}, "@/lib/supabase/server": { createClient: async () => owner },
    "next/navigation": { redirect: (url) => { throw new Error(`redirect:${url}`); } },
    "@/lib/validation/profile": load("lib/validation/profile.ts"),
  };
  dependencies["@/lib/auth"] = load("lib/auth.ts", dependencies);
  const { saveProfile } = load("app/onboarding/actions.ts", dependencies);
  const input = { username: `ea_${run.slice(0, 8)}`, displayName: "Local external owner",
    kaggleUsername: "original-kaggle", githubUsername: "original-github" };
  async function save(fields) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    await assert.rejects(saveProfile({}, form), /redirect:\/u\//);
  }

  await save({ ...input, verified_at: new Date().toISOString(), metadata: '{"trusted":true}',
    external_user_id: "forged-provider-id", provider: "forged-provider" });
  const original = await links(id);
  assert.equal(original.length, 2, "Both existing profile link paths work");
  for (const row of original) {
    assert.equal(row.verified_at, null);
    assert.equal(row.external_user_id, null);
    assert.deepEqual(row.metadata, {});
  }
  await result(service.from("external_accounts").update({ verified_at: new Date().toISOString(),
    external_user_id: "trusted-provider-id", metadata: { trusted: true } }).eq("user_id", id));
  await save(input);
  const unchanged = await links(id);
  for (let index = 0; index < unchanged.length; index++) {
    assert.equal(unchanged[index].id, original[index].id, "Upsert keeps row identity");
    assert.equal(unchanged[index].created_at, original[index].created_at);
    assert.ok(unchanged[index].verified_at, "Unchanged link retains trust");
    assert.equal(unchanged[index].external_user_id, "trusted-provider-id");
    assert.deepEqual(unchanged[index].metadata, { trusted: true });
  }
  const forgery = await owner.from("external_accounts").upsert({ user_id: id, provider: "github",
    external_username: "mixed-forgery", verified_at: new Date().toISOString() }, { onConflict: "user_id,provider" });
  assert.equal(forgery.error?.code, "42501", "Direct mixed-field upsert is rejected");
  assert.equal((await links(id)).find((row) => row.provider === "github").external_username, "original-github");
  await save({ ...input, githubUsername: "different-github" });
  const changed = await links(id);
  const github = changed.find((row) => row.provider === "github");
  assert.equal(github.id, original.find((row) => row.provider === "github").id);
  assert.equal(github.external_username, "different-github");
  assert.equal(github.verified_at, null);
  assert.equal(github.external_user_id, null);
  assert.deepEqual(github.metadata, {});
  assert.ok(changed.find((row) => row.provider === "kaggle").verified_at, "Changing GitHub does not invalidate Kaggle");
  await save({ ...input, githubUsername: "", kaggleUsername: "" });
  assert.deepEqual(await links(id), [], "Existing profile unlink deletes both links");
  await save(input);
  for (const row of await links(id)) assert.equal(row.verified_at, null, "Relinks start unverified");
  console.log("Local profile save/link/upsert/trust invalidation/unlink/relink: PASS");
} finally {
  for (const id of users) assert.ifError((await service.auth.admin.deleteUser(id)).error);
  console.log("Only temporary local fixtures removed; hosted Supabase untouched.");
}
