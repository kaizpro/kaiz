// Disposable localhost PG17 only. This is a schema/RLS test, NOT an importer.
// No hosted URL, dotenv, production credentials or apply path is accepted.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadContentModule } from "../scripts/content/load.mjs";
import { preparePriorityEditionRelease } from "../scripts/content/priority-edition-plan.mjs";
assert.ok(process.env.KAIZ_EMBEDDED_POSTGRES_MODULE);
const { default: EmbeddedPostgres } = await import(pathToFileURL(process.env.KAIZ_EMBEDDED_POSTGRES_MODULE).href);
const folder = await mkdtemp(join(tmpdir(), "kaiz-metadata-qa-"));
const pg = new EmbeddedPostgres({ databaseDir: join(folder, "db"), user: "postgres", password: randomBytes(32).toString("hex"),
  port: 55445, persistent: true, initdbFlags: ["--encoding=UTF8", "--locale=C"], postgresFlags: ["-h", "127.0.0.1"], onLog: () => {}, onError: () => {} });
let db;
try {
  await mkdir(join(folder, "db")); await pg.initialise(); await pg.start(); db = pg.getPgClient(); await db.connect();
  assert.equal(db.host, "localhost");
  assert.match((await db.query("show server_version")).rows[0].server_version, /^17\./);
  await db.query(await readFile("tests/fixtures/disposable-supabase.sql", "utf8"));
  const read = async p => JSON.parse(await readFile(p, "utf8")), dir = "content/competitions/2026-10-19/";
  const state = await read(dir + "production-state.json"), snapshot = await read(dir + "production-snapshot.json");
  const files = await readdir("supabase/migrations");
  for (const version of state.appliedMigrations) {
    const file = files.find(f => f.startsWith(version + "_")); assert.ok(file);
    await db.query(await readFile("supabase/migrations/" + file, "utf8"));
  }
  const { competitionSchema } = loadContentModule("@/lib/validation/competition");
  const insert = async (input, id = null) => {
    const c = competitionSchema.parse(input);
    return db.query(`insert into public.competitions(id,title,slug,description,organizer,official_website,start_date,end_date,city,country,format,status,category,eligibility,tags,verified,presentation)
      values(coalesce($1,gen_random_uuid()),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      on conflict(slug) do nothing returning id`, [id, c.title, c.slug, c.description, c.organizer, c.officialWebsite || null, c.startDate, c.endDate,
      c.city || null, c.country, c.format, c.status, c.category, c.eligibility, c.tags, c.verified, c.presentation ?? {}]);
  };
  for (const c of snapshot.competitions) await insert(c.form, c.id);
  const fingerprints = async () => (await db.query("select id,md5(to_jsonb(c)::text) hash from public.competitions c where id=any($1::uuid[]) order by id", [snapshot.competitions.map(c => c.id)])).rows;
  const before = await fingerprints();
  await db.query("insert into auth.users(id,email) values('98000000-0000-4000-8000-000000000001','metadata-admin@example.test'),('98000000-0000-4000-8000-000000000002','metadata-member@example.test');update public.profiles set role='admin' where id='98000000-0000-4000-8000-000000000001';set role authenticated;select set_config('request.jwt.claim.sub','98000000-0000-4000-8000-000000000001',false)");
  const plan = preparePriorityEditionRelease(await read(dir + "release-catalog.json"), await read("content/competitions/2026-10-17/publication-manifest.json"), await read("content/competitions/2026-10-12/ready-batch.json"), snapshot);
  const additions = plan.batch.competitions.filter(c => !c.expectedId); assert.equal(additions.length, 8);
  assert.equal(additions.find(c => c.editionKey === "faio-2026").form.city, "Kaskelen");
  // A failed single transaction leaves no partially created edition.
  await db.query("begin"); await insert(additions[0].form);
  await assert.rejects(db.query("insert into public.competitions(title,slug,description,organizer,start_date,end_date,format,category) values('Invalid','invalid-metadata-qa','QA only','QA',now(),now(),'invalid-format','Machine Learning')"), e => e.code === "22P02");
  await db.query("rollback"); assert.equal(Number((await db.query("select count(*) n from public.competitions")).rows[0].n), 5);
  for (let pass = 0; pass < 2; pass++) {
    let inserted = 0;
    for (const c of additions) inserted += (await insert(c.form)).rowCount;
    assert.equal(inserted, pass === 0 ? 8 : 0);
  }
  assert.deepEqual(await fingerprints(), before);
  for (const c of additions) {
    const row = (await db.query("select presentation from public.competitions where slug=$1", [c.form.slug])).rows[0];
    assert.deepEqual(row.presentation, c.form.presentation);
  }
  await db.query("reset role;select set_config('request.jwt.claim.sub','',false);set role anon");
  assert.equal(Number((await db.query("select count(*) n from public.competitions")).rows[0].n), 13);
  assert.equal(Number((await db.query("select count(*) n from public.competition_result_sets")).rows[0].n), 0);
  await db.query("reset role;set role authenticated;select set_config('request.jwt.claim.sub','98000000-0000-4000-8000-000000000002',false)");
  assert.equal((await db.query("update public.competitions set title='FORGED' where slug=$1 returning id", [additions[0].form.slug])).rowCount, 0);
  await assert.rejects(insert({ ...additions[0].form, slug: "member-forged-metadata" }), e => e.code === "42501");
  await db.query("reset role"); assert.deepEqual(await fingerprints(), before);
  assert.equal(Number((await db.query("select count(*) n from public.competitions")).rows[0].n), 13);
  assert.equal(Number((await db.query("select count(*) n from auth.users")).rows[0].n), 2);
  console.log(JSON.stringify({ status: "PASS", engine: "disposable loopback PG17", migrations: 9, additions: 8, replayInserted: 0,
    rollback: true, existingFiveUnchanged: true, presentationRoundtrip: true, anonymousMetadataReads: true,
    memberCannotCreateOrModify: true, resultSetsCreated: 0, productionAccess: false }));
} finally { if (db) await db.end(); await pg.stop(); }
