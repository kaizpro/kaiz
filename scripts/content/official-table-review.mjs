// Explicit organizer publications only. No account access, credentials or apply mode.
import {createHash} from 'node:crypto';
export const organizerTables={
 'ioai-2025':'https://ioai-official.org/china-2025/results-2025/',
 'ioai-2026':'https://ioai-official.org/republic-of-kazakhstan/results-2026/',
};
function text(html){return html.replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;|&#039;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();}
export async function readOfficialTables(edition){
 if(!Object.hasOwn(organizerTables,edition))throw Error('Only reviewed organizer URLs are allowed');
 const response=await fetch(organizerTables[edition],{signal:AbortSignal.timeout(45000)});
 if(!response.ok||!response.headers.get('content-type')?.includes('text/html')||response.url!==organizerTables[edition])throw Error('Organizer source unavailable or redirected; review manually');
 const html=await response.text();
 const tables=[...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map(match=>{
  const preceding=html.slice(0,match.index),heading=[...preceding.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)].at(-1);
  const rows=[...match[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(row=>[...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(cell=>text(cell[1]))).filter(row=>row.length);
  return {heading:heading?text(heading[1]):null,headers:rows[0],rows:rows.slice(1)};
 });
 return {url:response.url,checkedAt:'2026-10-17',sha256:createHash('sha256').update(html).digest('hex'),tables};
}
export function groupOfficialTables(tables){
 const groups=new Map();
 for(const table of tables){
  const continuation=/^\d+$/.test(table.headers?.[0]??'');
  if(continuation&&!groups.has(table.heading))throw Error('Continuation table has no original header');
  const group=groups.get(table.heading)??{heading:table.heading,headers:table.headers,rows:[]};
  if(continuation)group.rows.push(table.headers);
  else if(groups.has(table.heading)&&JSON.stringify(group.headers)!==JSON.stringify(table.headers))throw Error('Stage has conflicting headers');
  group.rows.push(...table.rows);groups.set(table.heading,group);
 }
 return [...groups.values()];
}
