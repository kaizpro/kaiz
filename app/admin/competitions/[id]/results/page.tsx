import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Plus, Trophy } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResultForm, ResultSetForm, type ResultFormValue, type ResultSetFormValue } from "@/components/admin/result-forms";
import { createResult, createResultSet, deleteResult, deleteResultSet, updateResult, updateResultSet } from "./actions";

type AdminEntry = ResultFormValue & { id: string };
type AdminResultSet = ResultSetFormValue & { id: string; competition_results: AdminEntry[] };

export default async function CompetitionResultsAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string; editSet?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: competition }, { data, error }] = await Promise.all([
    supabase.from("competitions").select("id,title,slug").eq("id", id).maybeSingle(),
    supabase.from("competition_result_sets").select("id,name,status,source,source_label,source_url,published,competition_results(id,result_set_id,participant_type,participant_name,rank,score,score_display,country_code,award,result_status,external_participant_id,profiles:profiles!competition_results_user_id_fkey(username))").eq("competition_id", id).order("created_at", { ascending: false }).order("rank", { referencedTable: "competition_results", ascending: true, nullsFirst: false }),
  ]);
  if (!competition) notFound();
  if (error) throw new Error("Unable to load result management.");
  const resultSets = (data ?? []) as unknown as AdminResultSet[];
  const entries = resultSets.flatMap((set) => set.competition_results);
  const editingSet = resultSets.find((set) => set.id === query.editSet);
  const editingEntry = entries.find((entry) => entry.id === query.edit);
  const setAction = editingSet ? updateResultSet.bind(null, id, editingSet.id) : createResultSet.bind(null, id);
  const resultAction = editingEntry ? updateResult.bind(null, id, editingEntry.id) : createResult.bind(null, id);
  const deleteSetAction = deleteResultSet.bind(null, id);
  const deleteEntryAction = deleteResult.bind(null, id);

  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <Button asChild variant="ghost" size="sm"><Link href="/admin"><ArrowLeft className="size-4"/>Admin competitions</Link></Button>
    <header className="mt-5 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="micro-label text-primary">Restricted · Results</p><h1 className="mt-2 text-3xl font-bold">{competition.title}</h1><p className="mt-2 text-sm text-muted-foreground">Publish official or provisional standings without changing the competition record.</p></div><Button asChild variant="outline"><Link href={`/competitions/${competition.slug}`}>Public page<ExternalLink className="size-4"/></Link></Button></header>

    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <main className="space-y-6"><div className="flex items-center justify-between"><div><p className="micro-label text-muted-foreground">Standings</p><h2 className="mt-1 text-xl font-bold">Current result rows</h2></div>{editingEntry && <Button asChild variant="outline" size="sm"><Link href={`/admin/competitions/${id}/results`}><Plus className="size-4"/>Add instead</Link></Button>}</div>
        {resultSets.length ? resultSets.map((set) => <Card key={set.id} className="overflow-hidden"><div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{set.name}</h3><span className="font-mono text-xs uppercase text-muted-foreground">{set.status} · {set.published ? "published" : "draft"}</span></div><p className="mt-1 text-xs text-muted-foreground">Provider: {set.source_label || set.source}</p></div><div className="flex gap-2"><Button asChild variant="outline" size="sm"><Link href={`?editSet=${set.id}`}>Edit set</Link></Button><form action={deleteSetAction}><input type="hidden" name="resultSetId" value={set.id}/><Button size="sm" variant="danger">Delete set</Button></form></div></div>{set.competition_results.length ? <div className="overflow-x-auto"><table className="w-full min-w-[38rem] text-sm"><thead><tr className="border-b text-left"><th className="px-4 py-2">Rank</th><th className="px-4 py-2">Participant</th><th className="px-4 py-2">Score</th><th className="px-4 py-2">Award</th><th className="px-4 py-2 text-right">Actions</th></tr></thead><tbody>{set.competition_results.map((entry) => <tr key={entry.id} className="border-b last:border-0"><td className="tabular px-4 py-3 font-mono font-bold">{entry.rank ?? "—"}</td><td className="px-4 py-3"><span className="font-semibold">{entry.participant_name}</span><span className="ml-2 text-xs capitalize text-muted-foreground">{entry.participant_type}</span></td><td className="tabular px-4 py-3 font-mono">{entry.score_display ?? entry.score ?? "—"}</td><td className="px-4 py-3">{entry.award || "—"}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Button asChild size="sm" variant="outline"><Link href={`?edit=${entry.id}`}>Edit</Link></Button><form action={deleteEntryAction}><input type="hidden" name="resultId" value={entry.id}/><Button size="sm" variant="danger">Delete</Button></form></div></td></tr>)}</tbody></table></div> : <p className="px-4 py-8 text-center text-sm text-muted-foreground">No result rows in this set.</p>}</Card>) : <Card className="px-5 py-10 text-center"><Trophy className="mx-auto size-5 text-muted-foreground"/><p className="mt-3 font-semibold">No result sets yet</p><p className="mt-1 text-sm text-muted-foreground">Create a draft set before adding standings.</p></Card>}
      </main>

      <aside className="space-y-6"><Card className="p-5"><p className="micro-label text-primary">{editingSet ? "Edit result set" : "New result set"}</p><h2 className="mt-1 text-lg font-bold">Publication and source</h2><div className="mt-5"><ResultSetForm action={setAction} value={editingSet}/></div>{editingSet && <Button asChild variant="ghost" size="sm" className="mt-3"><Link href={`/admin/competitions/${id}/results`}>Cancel editing</Link></Button>}</Card>
        <Card className="p-5"><p className="micro-label text-primary">{editingEntry ? "Edit result" : "Add result"}</p><h2 className="mt-1 text-lg font-bold">Participant standing</h2>{resultSets.length ? <div className="mt-5"><ResultForm action={resultAction} resultSets={resultSets.map(({ id: setId, name }) => ({ id: setId, name }))} value={editingEntry}/></div> : <p className="mt-4 text-sm text-muted-foreground">Create a result set first.</p>}{editingEntry && <Button asChild variant="ghost" size="sm" className="mt-3"><Link href={`/admin/competitions/${id}/results`}>Cancel editing</Link></Button>}</Card></aside>
    </div>
  </div>;
}
