"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type StandingsRow = {
 id:string; rank:number|null; name:string; username?:string|null; team:boolean;
 country:string|null; detail:string; status:string; comments?:string;
 scores:Record<string,number|string|null>; total:number|string|null; award:string|null;
};
export function filterStandings(rows:readonly StandingsRow[],search:string,award:string){
 const q=search.trim().toLocaleLowerCase();
 return rows.filter(row=>(!q||`${row.name} ${row.country??""} ${row.detail}`.toLocaleLowerCase().includes(q))&&(!award||row.award===award));
}
export function CompetitionStandings({rows,columns,name}:{rows:StandingsRow[];columns:{key:string;label:string}[];name:string}){
 const id=useId();const [search,setSearch]=useState("");const [award,setAward]=useState("");const [page,setPage]=useState(1);
 const awards=[...new Set(rows.flatMap(row=>row.award?[row.award]:[]))].sort();
 const filtered=filterStandings(rows,search,award);const pages=Math.max(1,Math.ceil(filtered.length/50));const current=Math.min(page,pages);const visible=filtered.slice((current-1)*50,current*50);
 return <><div className="flex flex-wrap items-end gap-3 border-b p-4"><div className="text-xs"><label htmlFor={id+"-search"}>Search participant</label><input id={id+"-search"} type="search" maxLength={120} value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="mt-1 block min-h-11 max-w-full rounded-sm border bg-background px-3 text-sm"/></div>{!!awards.length&&<div className="text-xs"><label htmlFor={id+"-award"}>Award</label><select id={id+"-award"} value={award} onChange={e=>{setAward(e.target.value);setPage(1);}} className="mt-1 block min-h-11 rounded-sm border bg-background px-3 text-sm"><option value="">All awards</option>{awards.map(value=><option key={value}>{value}</option>)}</select></div>}<p role="status" className="pb-2 text-xs text-muted-foreground">{filtered.length} of {rows.length} entries · original ranks retained</p></div>
 <div role="region" aria-label={`${name} standings; scroll horizontally for score breakdown`} tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring"><table className="w-full min-w-[38rem] border-collapse text-sm"><caption className="sr-only">{name}. Filtered view; official ranks and ties are not recalculated.</caption><thead><tr className="border-b bg-muted/40 text-left">{["Rank","Participant","Total / score","Award","Country",...columns.map(column=>column.label)].map((label,index)=><th key={index} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-medium text-muted-foreground">{label}</th>)}</tr></thead><tbody>{visible.map(row=><tr key={row.id} className="border-b last:border-b-0"><td className="tabular px-4 py-3 font-mono font-bold">{row.rank??"—"}</td><td className="min-w-44 px-4 py-3"><div className="flex items-center gap-2"><span className="font-semibold">{row.username?<Link href={`/u/${row.username}`} className="hover:text-primary">{row.name}</Link>:row.name}</span>{row.team&&<Badge>Team</Badge>}</div>{row.detail&&<p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>}{row.status!=="ranked"&&<p className="mt-1 text-xs capitalize text-muted-foreground">{row.status}</p>}{row.comments&&<p className="mt-1 text-xs text-muted-foreground">{row.comments}</p>}</td><td className="tabular whitespace-nowrap px-4 py-3 font-mono font-semibold">{row.total??"—"}</td><td className="px-4 py-3">{row.award?<Badge>{row.award}</Badge>:"—"}</td><td className="px-4 py-3 font-mono text-muted-foreground">{row.country||"—"}</td>{columns.map(column=><td key={column.key} className="tabular whitespace-nowrap px-4 py-3 font-mono">{row.scores[column.key]??"—"}</td>)}</tr>)}{!visible.length&&<tr><td colSpan={5+columns.length} className="px-4 py-8 text-center text-muted-foreground">No matching participants. Clear the search or award filter.</td></tr>}</tbody></table></div>
 <nav className="flex flex-wrap items-center justify-between gap-3 border-t p-4" aria-label={`${name} result pages`}><p className="text-xs text-muted-foreground">Page {current} of {pages} · up to 50 entries per page</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={current<=1} onClick={()=>setPage(current-1)}>Previous</Button><Button variant="outline" size="sm" disabled={current>=pages} onClick={()=>setPage(current+1)}>Next</Button></div></nav></>;
}
