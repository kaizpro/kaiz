"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { competitionResultSchema, resultSetSchema } from "@/lib/validation/competition-result";

export type AdminResultState = { error?: string; success?: string };
const uuid = z.string().uuid();

async function refreshCompetition(competitionId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("competitions").select("slug").eq("id", competitionId).maybeSingle();
  revalidatePath(`/admin/competitions/${competitionId}/results`);
  if (data?.slug) revalidatePath(`/competitions/${data.slug}`);
}

async function linkedUserId(username: string | undefined) {
  if (!username) return { userId: null };
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (error || !data) return { error: `No KAIZ profile found for @${username}` };
  return { userId: data.id };
}

function resultSetRow(data: z.infer<typeof resultSetSchema>) {
  return {
    name: data.name,
    status: data.status,
    source: data.source,
    source_label: data.sourceLabel || null,
    source_url: data.sourceUrl || null,
    published: data.published,
    verified_at: data.status === "official" && data.published ? new Date().toISOString() : null,
  };
}

export async function createResultSet(competitionId: string, _: AdminResultState, formData: FormData): Promise<AdminResultState> {
  const user = await requireAdmin();
  const validCompetitionId = uuid.parse(competitionId);
  const parsed = resultSetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("competition_result_sets").insert({
    ...resultSetRow(parsed.data), competition_id: validCompetitionId, created_by: user.id, updated_by: user.id,
  });
  if (error) return { error: error.message };
  await refreshCompetition(validCompetitionId);
  return { success: "Result set created." };
}

export async function updateResultSet(competitionId: string, resultSetId: string, _: AdminResultState, formData: FormData): Promise<AdminResultState> {
  const user = await requireAdmin();
  const validCompetitionId = uuid.parse(competitionId);
  const validResultSetId = uuid.parse(resultSetId);
  const parsed = resultSetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const row = resultSetRow(parsed.data);
  const { data, error } = await supabase.from("competition_result_sets").update({ ...row, updated_by: user.id }).eq("id", validResultSetId).eq("competition_id", validCompetitionId).select("id").single();
  if (error || !data) return { error: error?.message || "Result set not found." };
  const { error: entryError } = await supabase.from("competition_results").update({ verified: row.status === "official" && row.published, updated_by: user.id }).eq("result_set_id", validResultSetId);
  if (entryError) return { error: entryError.message };
  await refreshCompetition(validCompetitionId);
  return { success: "Result set updated." };
}

export async function deleteResultSet(competitionId: string, formData: FormData) {
  await requireAdmin();
  const validCompetitionId = uuid.parse(competitionId);
  const resultSetId = uuid.parse(formData.get("resultSetId"));
  const supabase = await createClient();
  const { error } = await supabase.from("competition_result_sets").delete().eq("id", resultSetId).eq("competition_id", validCompetitionId);
  if (error) throw new Error("Unable to delete the result set.");
  await refreshCompetition(validCompetitionId);
}

async function resultEntryRow(data: z.infer<typeof competitionResultSchema>, competitionId: string, userId: string | null, actorId: string) {
  const supabase = await createClient();
  const { data: resultSet, error } = await supabase.from("competition_result_sets").select("id,status,published").eq("id", data.resultSetId).eq("competition_id", competitionId).maybeSingle();
  if (error || !resultSet) return { error: "The selected result set does not belong to this competition." };
  return { row: {
    competition_id: competitionId,
    result_set_id: resultSet.id,
    participant_type: data.participantType,
    participant_name: data.participantName,
    user_id: userId,
    rank: data.resultStatus === "ranked" ? data.rank : null,
    score: data.score ?? null,
    score_display: data.scoreDisplay || null,
    country_code: data.countryCode || null,
    award: data.award || null,
    result_status: data.resultStatus,
    external_participant_id: data.externalParticipantId || null,
    external_reference: data.externalParticipantId || null,
    verified: resultSet.status === "official" && resultSet.published,
    updated_by: actorId,
  } };
}

export async function createResult(competitionId: string, _: AdminResultState, formData: FormData): Promise<AdminResultState> {
  const user = await requireAdmin();
  const validCompetitionId = uuid.parse(competitionId);
  const parsed = competitionResultSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const linked = await linkedUserId(parsed.data.linkedUsername || undefined);
  if (linked.error) return { error: linked.error };
  const built = await resultEntryRow(parsed.data, validCompetitionId, linked.userId ?? null, user.id);
  if ("error" in built) return { error: built.error };
  const supabase = await createClient();
  const { error } = await supabase.from("competition_results").insert({ ...built.row, created_by: user.id });
  if (error) return { error: error.message };
  await refreshCompetition(validCompetitionId);
  return { success: "Result added." };
}

export async function updateResult(competitionId: string, resultId: string, _: AdminResultState, formData: FormData): Promise<AdminResultState> {
  const user = await requireAdmin();
  const validCompetitionId = uuid.parse(competitionId);
  const validResultId = uuid.parse(resultId);
  const parsed = competitionResultSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const linked = await linkedUserId(parsed.data.linkedUsername || undefined);
  if (linked.error) return { error: linked.error };
  const built = await resultEntryRow(parsed.data, validCompetitionId, linked.userId ?? null, user.id);
  if ("error" in built) return { error: built.error };
  const supabase = await createClient();
  const { data, error } = await supabase.from("competition_results").update(built.row).eq("id", validResultId).eq("competition_id", validCompetitionId).select("id").single();
  if (error || !data) return { error: error?.message || "Result not found." };
  await refreshCompetition(validCompetitionId);
  return { success: "Result updated." };
}

export async function deleteResult(competitionId: string, formData: FormData) {
  await requireAdmin();
  const validCompetitionId = uuid.parse(competitionId);
  const resultId = uuid.parse(formData.get("resultId"));
  const supabase = await createClient();
  const { error } = await supabase.from("competition_results").delete().eq("id", resultId).eq("competition_id", validCompetitionId);
  if (error) throw new Error("Unable to delete the result.");
  await refreshCompetition(validCompetitionId);
}

