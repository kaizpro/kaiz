// Opt-in disposable native PostgreSQL harness. No dotenv/hosted credentials.
// See docs/competition-release-checkpoint.md for runtime and pgTAP setup.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync, readdirSync, mkdtempSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve("work/release-postgres");
const { default: EmbeddedPostgres } = await import(pathToFileURL(resolve(root, "node_modules/embedded-postgres/dist/index.js")));
const pg = new EmbeddedPostgres({ databaseDir: mkdtempSync(resolve(root, "cluster-")), user: "postgres",
  password: randomBytes(32).toString("base64url"), port: 55439, persistent: true,
  postgresFlags: ["-c", "listen_addresses=127.0.0.1"], onLog: () => {}, onError: () => {} });
let client;
try {
  await pg.initialise(); await pg.start();
  client = pg.getPgClient("postgres", "127.0.0.1");
  assert.equal(client.host, "127.0.0.1");
  await client.connect();
  console.log("Engine:", (await client.query("show server_version")).rows[0].server_version);
  await client.query(readFileSync(resolve("tests/fixtures/supabase-postgres-bootstrap.sql"), "utf8"));
  const migrations = readdirSync("supabase/migrations").filter((file) => file.endsWith(".sql")).sort();
  for (const file of migrations) {
    const presentationMigration = file === "202610120001_competition_presentation.sql";
    await client.query("begin");
    let legacy, legacyResults, boundaries, grants;
    if (presentationMigration) {
      // Old application insert shape before extension: no presentation column.
      await client.query(`insert into public.competitions(id,title,slug,description,organizer,start_date,end_date,format,category)
        values ('90000000-0000-0000-0000-000000000001','Legacy fixture','legacy-fixture','Local only','QA',now(),now(),'online','AI')`);
      legacy = (await client.query("select to_jsonb(c) as row from public.competitions c")).rows;
      await client.query(`insert into public.competition_result_sets(competition_id,name,published)
        values ('90000000-0000-0000-0000-000000000001','Legacy public',true),('90000000-0000-0000-0000-000000000001','Legacy draft',false)`);
      await client.query(`insert into public.competition_results(competition_id,result_set_id,participant_name,rank,score,score_display)
        select competition_id,id,'Local legacy',1,0,'0.000' from public.competition_result_sets`);
      legacyResults = (await client.query("select to_jsonb(r) as row from public.competition_results r order by id")).rows;
      boundaries = (await client.query("select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname")).rows;
      grants = (await client.query("select relname,relacl::text from pg_class where oid in ('public.competitions'::regclass,'public.competition_result_sets'::regclass,'public.competition_results'::regclass) order by relname")).rows;
    }
    await client.query(readFileSync(resolve("supabase/migrations", file), "utf8"));
    if (presentationMigration) {
      assert.deepEqual((await client.query("select to_jsonb(c)-'presentation' as row from public.competitions c")).rows, legacy, "legacy data unchanged");
      assert.deepEqual((await client.query("select to_jsonb(r)-'presentation' as row from public.competition_results r order by id")).rows, legacyResults, "legacy result rows unchanged");
      assert.deepEqual((await client.query("select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname")).rows, boundaries, "RLS policies unchanged");
      assert.deepEqual((await client.query("select relname,relacl::text from pg_class where oid in ('public.competitions'::regclass,'public.competition_result_sets'::regclass,'public.competition_results'::regclass) order by relname")).rows, grants, "table grants unchanged");
      assert.deepEqual((await client.query("select presentation from public.competitions")).rows[0].presentation, {});
      // Old application continues inserting without any new field.
      await client.query(`insert into public.competitions(title,slug,description,organizer,start_date,end_date,format,category)
        values ('Legacy after','legacy-after','Local only','QA',now(),now(),'online','AI')`);
      await client.query("delete from public.competitions where slug in ('legacy-fixture','legacy-after')");
      console.log("Legacy insert/read/data and RLS preservation: PASS");
    }
    await client.query("commit");
    console.log("Executed:", file);
  }
  for (const file of readdirSync("supabase/tests").filter((file) => file.endsWith(".sql")).sort()) {
    const results = await client.query(readFileSync(resolve("supabase/tests", file), "utf8"));
    const output = (Array.isArray(results) ? results : [results]).flatMap((result) => result.rows.flatMap(Object.values)).filter((value) => typeof value === "string");
    const failed = output.filter((line) => /^not ok|^# Looks like/.test(line));
    assert.deepEqual(failed, [], `${file}: ${failed.join("; ")}`);
    console.log("SQL security PASS:", file, output.filter((line) => /^ok \d/.test(line)).length, "assertions");
  }
} finally {
  if (client) await client.end();
  await pg.stop(); // Retain ignored disposable files; never delete arbitrary paths.
}
