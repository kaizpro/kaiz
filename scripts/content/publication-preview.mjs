// Fixed repository review artifacts; no database/client/env access or apply mode.
import {readFileSync} from 'node:fs';
import {preparePublicationPlan} from './publication-plan.mjs';
if(process.argv.length!==2){console.error('Offline dry run only; no flags or apply mode supported.');process.exitCode=2;}
else{
 try{const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));const plan=preparePublicationPlan(read('../../content/competitions/2026-10-17/publication-manifest.json'),read('../../content/competitions/2026-10-12/ready-batch.json'),read('../../content/competitions/2026-10-15/admin-snapshot.json'));console.log(JSON.stringify({mode:plan.mode,writes:plan.writes,valid:plan.valid,approvalReady:plan.approvalReady,publicationBlocked:plan.publicationBlocked,stages:plan.manifestStages,rows:plan.manifestRows,errors:plan.errors,warnings:plan.warnings,actions:plan.actions.reduce((counts,a)=>(counts[a.action]=(counts[a.action]??0)+1,counts),{})},null,2));if(!plan.valid)process.exitCode=1;}catch{console.error('Manifest validation failed. Review source/stage/score/identity constraints; no data written.');process.exitCode=1;}
}
