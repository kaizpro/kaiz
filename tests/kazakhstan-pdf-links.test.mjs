import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTypescript} from './helpers/load-typescript.mjs';

// Synthetic shape-only URLs; these identify no real hosted files.
const url='https://drive.google.com/file/d/SYNTHETIC_QA_PDF_FILE_NOT_PUBLISHED/view';
const load=loadTypescript(),{getKazakhstanResultsPdf,getKazakhstanPdfDefinition}=load('lib/results/kazakhstan-pdf.ts');
const {OfficialResultSource}=load('components/official-result-source.tsx');

test('PDF slots are edition-scoped, optional and fail closed without invented links',()=>{
 for(const slug of ['ai-olymp-kazakhstan-2025','ai-olymp-kazakhstan-2026']){
  for(const empty of [undefined,'','   '])assert.equal(getKazakhstanResultsPdf(slug,empty),null);
 }
 for(const slug of ['__proto__','constructor','ioai-2025','ai-olymp-kazakhstan-2027']){
  assert.equal(getKazakhstanPdfDefinition(slug),undefined);assert.equal(getKazakhstanResultsPdf(slug,url),null);
 }
});

test('only canonical Drive PDF-view configuration is accepted, with tracking removed',()=>{
 const pdf=getKazakhstanResultsPdf('ai-olymp-kazakhstan-2025',url+'?usp=sharing');
 assert.equal(pdf.url,url);assert.match(pdf.coverage,/38 recorded \/ 40 announced finalists/);
 assert.equal(getKazakhstanResultsPdf('ai-olymp-kazakhstan-2026',url+'?usp=drive_link').url,url);
 assert.match(getKazakhstanResultsPdf('ai-olymp-kazakhstan-2026',url).coverage,/3 Gold, 5 Silver, 15 Bronze/);
});

test('private workbooks, secrets, active URLs and arbitrary destinations never render',()=>{
 for(const unsafe of [
  'https://docs.google.com/spreadsheets/d/SYNTHETIC_PRIVATE/edit',
  url.replace('https:','http:'),url.replace('drive.google.com','drive.google.com.evil.test'),
  url.replace('drive.google.com','name:password@drive.google.com'),url.replace('/view','/edit'),
  url.replace('/file/d/','/drive/folders/'),url+'?resourcekey=not-a-real-key',url+'?token=not-a-real-token',
  url+'?usp=sharing&usp=sharing',url+'#fragment',url+'?download=1',url+'?usp=sharing&secret=x',
  'javascript:alert(1)','//drive.google.com/file/d/SYNTHETIC_QA_PDF_FILE_NOT_PUBLISHED/view',
  url.replace('/view','/%76iew'),url.replace('/view','/view/other'),'https://127.0.0.1/file.pdf',
 ])assert.equal(getKazakhstanResultsPdf('ai-olymp-kazakhstan-2025',unsafe),null);
});

test('premium Results UI is honest while slots are empty and labels PDF exports accurately',()=>{
 for(const [year,count] of [['2025','38'],['2026','39']]){
  const slug='ai-olymp-kazakhstan-'+year;
  const empty=renderToStaticMarkup(React.createElement(OfficialResultSource,{slug}));
  assert.match(empty,/Results PDF awaiting publication/);assert.match(empty,new RegExp(count+' recorded'));
  assert.doesNotMatch(empty,/href=|docs\.google\.com|created_by|updated_by/);
  const html=renderToStaticMarkup(React.createElement(OfficialResultSource,{slug,resultsPdf:getKazakhstanResultsPdf(slug,url)}));
  assert.match(html,/Organizer-provided results — KAIZ PDF copy/);assert.match(html,/noopener noreferrer/);assert.match(html,/opens in a new tab/);
  assert.match(html,/hosted separately on Google Drive/);assert.doesNotMatch(html,/awaiting publication|Official results at the source/);
 }
 const other=renderToStaticMarkup(React.createElement(OfficialResultSource,{slug:'ioai-2025'}));
 assert.match(other,/View Official Results/);assert.match(other,/Official results at the source/);assert.doesNotMatch(other,/KAIZ PDF copy/);
});

test('configuration is server-only; result reads still require publication and no PDF data is committed',()=>{
 const server=readFileSync(new URL('../lib/data/kazakhstan-results-pdf.ts',import.meta.url),'utf8');
 assert.match(server,/import "server-only"/);assert.match(server,/KAIZ_KAZAKHSTAN_2025_RESULTS_PDF_URL/);assert.match(server,/KAIZ_KAZAKHSTAN_2026_RESULTS_PDF_URL/);
 assert.doesNotMatch(server,/NEXT_PUBLIC_|fetch\(|cookies\(|headers\(/);
 const dal=readFileSync(new URL('../lib/data/competition-results.ts',import.meta.url),'utf8');
 assert.match(dal,/\.eq\("published", true\)/);
 const example=readFileSync(new URL('../.env.example',import.meta.url),'utf8');
 assert.match(example,/^KAIZ_KAZAKHSTAN_2025_RESULTS_PDF_URL=$/m);assert.match(example,/^KAIZ_KAZAKHSTAN_2026_RESULTS_PDF_URL=$/m);
});
