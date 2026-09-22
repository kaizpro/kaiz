"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminResultState } from "@/app/admin/competitions/[id]/results/actions";

type FormAction = (state: AdminResultState, formData: FormData) => Promise<AdminResultState>;

export type ResultSetFormValue = {
  name: string; status: string; source: string; source_label: string | null; source_url: string | null; published: boolean;
};

export type ResultFormValue = {
  result_set_id: string; participant_type: string; participant_name: string; rank: number | null; score: number | null;
  score_display: string | null; country_code: string | null; award: string | null; result_status: string;
  external_participant_id: string | null; profiles: { username: string | null } | null;
};

const field = "mt-2";

export function ResultSetForm({ action, value }: { action: FormAction; value?: ResultSetFormValue }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm font-medium">Name<Input className={field} name="name" defaultValue={value?.name ?? "Official results"} required/></label>
    <label className="text-sm font-medium">Status<select className={`${field} h-10 w-full rounded-md border bg-background px-3 text-sm`} name="status" defaultValue={value?.status ?? "official"}><option value="official">Official / final</option><option value="provisional">Live / provisional</option></select></label>
    <label className="text-sm font-medium">Source provider<Input className={field} name="source" defaultValue={value?.source ?? "manual"} pattern="[a-z][a-z0-9_]{1,39}" required/></label>
    <label className="text-sm font-medium">Source label<Input className={field} name="sourceLabel" defaultValue={value?.source_label ?? ""} placeholder="e.g. Official organizer"/></label>
    <label className="text-sm font-medium sm:col-span-2">Source URL<Input className={field} name="sourceUrl" type="url" defaultValue={value?.source_url ?? ""} placeholder="https://…"/></label>
    <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" name="published" value="true" defaultChecked={value?.published ?? false}/> Publish this result set publicly</label>
    {state.error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
    {state.success && <p role="status" className="text-sm text-success sm:col-span-2">{state.success}</p>}
    <div className="sm:col-span-2"><Button disabled={pending}>{pending ? "Saving…" : value ? "Update result set" : "Create result set"}</Button></div>
  </form>;
}

export function ResultForm({ action, resultSets, value }: { action: FormAction; resultSets: { id: string; name: string }[]; value?: ResultFormValue }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm font-medium sm:col-span-2">Result set<select className={`${field} h-10 w-full rounded-md border bg-background px-3 text-sm`} name="resultSetId" defaultValue={value?.result_set_id} required>{resultSets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label className="text-sm font-medium">Participant type<select className={`${field} h-10 w-full rounded-md border bg-background px-3 text-sm`} name="participantType" defaultValue={value?.participant_type ?? "individual"}><option value="individual">Individual</option><option value="team">Team</option></select></label>
    <label className="text-sm font-medium">Status<select className={`${field} h-10 w-full rounded-md border bg-background px-3 text-sm`} name="resultStatus" defaultValue={value?.result_status ?? "ranked"}><option value="ranked">Ranked</option><option value="unranked">Unranked</option><option value="disqualified">Disqualified</option></select></label>
    <label className="text-sm font-medium sm:col-span-2">Participant or team name<Input className={field} name="participantName" defaultValue={value?.participant_name ?? ""} required/></label>
    <label className="text-sm font-medium">Linked KAIZ username <span className="font-normal text-muted-foreground">(optional)</span><Input className={field} name="linkedUsername" defaultValue={value?.profiles?.username ?? ""} placeholder="username"/></label>
    <label className="text-sm font-medium">External participant ID <span className="font-normal text-muted-foreground">(optional)</span><Input className={field} name="externalParticipantId" defaultValue={value?.external_participant_id ?? ""}/></label>
    <label className="text-sm font-medium">Rank<Input className={field} name="rank" type="number" min="1" defaultValue={value?.rank ?? ""}/></label>
    <label className="text-sm font-medium">Numeric score<Input className={field} name="score" type="number" step="any" defaultValue={value?.score ?? ""}/></label>
    <label className="text-sm font-medium">Score display<Input className={field} name="scoreDisplay" defaultValue={value?.score_display ?? ""} placeholder="e.g. 97.42 pts"/></label>
    <label className="text-sm font-medium">Country code<Input className={field} name="countryCode" defaultValue={value?.country_code ?? ""} pattern="[A-Za-z]{2,3}" placeholder="KAZ"/></label>
    <label className="text-sm font-medium sm:col-span-2">Award<Input className={field} name="award" defaultValue={value?.award ?? ""} placeholder="e.g. Gold"/></label>
    {state.error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
    {state.success && <p role="status" className="text-sm text-success sm:col-span-2">{state.success}</p>}
    <div className="sm:col-span-2"><Button disabled={pending}>{pending ? "Saving…" : value ? "Update result" : "Add result"}</Button></div>
  </form>;
}

