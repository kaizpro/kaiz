// Anonymous reachability check, not proof of redistribution permission or accuracy.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const batch=JSON.parse(await readFile('content/competitions/2026-10-12/ready-batch.json','utf8'));
const m=JSON.parse(await readFile('content/competitions/2026-10-17/publication-manifest.json','utf8'));
const ids=new Set(m.editions.flatMap(e=>e.metadata?.sourceIds??[]));
const urls=[...new Set([...batch.sources.filter(s=>ids.has(s.id)).map(s=>s.url),...m.stages.map(s=>s.source_url)])];
const records=[];let index=0;
await Promise.all(Array.from({length:4},async()=>{while(index<urls.length){const url=urls[index++];try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});const data=await r.text();records.push({url,status:r.status,final_url:r.url,bytes:Buffer.byteLength(data),sha256:createHash('sha256').update(data).digest('hex'),reachable:r.ok,accuracy:'Not independently established by HTTP status',permission:'Not established by reachability'});}catch{records.push({url,reachable:false,status:null,accuracy:'Manual source review required',permission:'Not established'});}}}));
records.sort((a,b)=>a.url.localeCompare(b.url));
await writeFile('content/competitions/2026-10-17/source-reachability.json',JSON.stringify({checked_at:new Date().toISOString(),anonymous:true,production_writes:0,records},null,2)+'\n');
console.log(JSON.stringify({checked:records.length,reachable:records.filter(r=>r.reachable).length,needsReview:records.filter(r=>!r.reachable).map(r=>({url:r.url,status:r.status})),permissionInferred:false,productionAccess:false}));
