import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import test from 'node:test';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=JSON.parse(read('content/competitions/edition-guides.json'));
const require=createRequire(import.meta.url),exports={};
vm.runInNewContext(ts.transpileModule(read('lib/competitions/edition-guide.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,require:p=>p==='zod'?require('zod'):{default:data}});
const {editionGuideSchema,editionStatisticsSchema,medalRates,getEditionGuide}=exports;
test('15 public guides reuse approved identities without any standings or restricted original links',()=>{
 const original=JSON.parse(read('content/competitions/2026-10-19/release-catalog.json'));
 assert.deepEqual(data.map(e=>e.slug).sort(),original.editions.map(e=>e.editionId).sort());
 assert.equal(new Set(data.map(e=>e.slug)).size,15);
 assert.equal(data.flatMap(e=>e.tasks).filter(t=>t.url&&t.id.startsWith('source-')).length,27,'All 27 existing links preserved');
 assert.equal(data.flatMap(e=>e.tasks).filter(t=>t.url).length,45,'18 verified individual sources added');
 assert.ok(!JSON.stringify(data).includes('docs.google.com'));
 for(const entry of data){assert.equal(editionGuideSchema.safeParse(entry).success,true);assert.ok(!Object.hasOwn(entry,'rows'));}
 assert.equal(getEditionGuide('__proto__'),undefined);
});
test('medal rates keep the same scoped population, omit unknowns and exclude honorable mentions',()=>{
 const ioai=getEditionGuide('ioai-2025').statistics[0];
 assert.equal(ioai.participants,284);assert.equal(medalRates(ioai).total,50);
 const apoai=getEditionGuide('apoai-2026').statistics[0];
 assert.equal(medalRates(apoai).total,50.8);assert.equal(medalRates(apoai).gold,7.8);
 assert.equal(medalRates(getEditionGuide('neoai-2025').statistics[0]).total,undefined);
 assert.equal(getEditionGuide('ioai-2024').statistics[0].unit,'teams');
 assert.equal(getEditionGuide('euroai-2026').statistics.length,3);
 assert.equal(editionStatisticsSchema.safeParse({...ioai,gold:284,silver:1,bronze:0}).success,false);
 assert.equal(editionStatisticsSchema.safeParse({...ioai,participants:0}).success,false);
});
test('unsafe sources, private sheet URLs, duplicate task identities and inconsistent availability fail closed',()=>{
 const base=getEditionGuide('ioai-2025');
 for(const url of ['javascript:alert(1)','https://user:password@example.org','https://example.org/?token=hidden','https://docs.google.com/spreadsheets/d/restricted']){
  assert.equal(editionGuideSchema.safeParse({...base,sources:[url]}).success,false);
 }
 assert.equal(editionGuideSchema.safeParse({...base,tasks:[base.tasks[0],base.tasks[0]]}).success,false);
 assert.equal(editionGuideSchema.safeParse({...base,tasks:[{...base.tasks[0],url:null}]}).success,false);
});
test('Kazakhstan metadata does not imply final-version approval and no named IOAI rows are imported',()=>{
 for(const year of [2025,2026]){
  const entry=getEditionGuide('ai-olymp-kazakhstan-'+year);
  assert.equal(entry.results.length,0);assert.match(entry.summary,/confirmation/);
  assert.equal(entry.statistics[0].participants,40);assert.equal(entry.statistics[0].gold,undefined);
 }
 for(const year of [2025,2026])assert.equal(getEditionGuide('ioai-'+year).results.length,1);
});
