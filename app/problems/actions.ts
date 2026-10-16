"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isEditablePractice, practiceSchema, problemValidationError, validatePracticeScore, type ProblemActionState } from "@/lib/validation/problem";

async function saveAttempt(operation: "create" | "update" | "delete", problemId: string, attemptId: string | null, formData: FormData): Promise<ProblemActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to record or manage your practice." };
  if (!z.uuid().safeParse(problemId).success || (attemptId !== null && !z.uuid().safeParse(attemptId).success))
    return { error: "Invalid problem or attempt ID." };
  const parsed = operation === "delete" ? null : practiceSchema.safeParse({ raw_score: formData.get("raw_score"), attempted_at: formData.get("attempted_at") });
  if (parsed && !parsed.success) return problemValidationError(parsed.error);
  if (operation === "delete" && formData.get("confirm") !== "true") return { error: "Confirm deletion before removing your attempt." };
  const supabase = await createClient();
  const { data: problem, error: problemError } = await supabase.from("problems").select("id,slug,metric_name,source_provenance")
    .eq("id", problemId).eq("published", true).maybeSingle();
  if (problemError || !problem) return { error: "This problem is no longer published or available." };
  if (parsed?.success) {
    const error = validatePracticeScore(parsed.data.raw_score, problem.metric_name, problem.source_provenance);
    if (error) return { error, fields: { raw_score: [error] } };
  }
  if (attemptId) {
    const { data: attempt, error } = await supabase.from("problem_performances")
      .select("status,normalized_performance,source_provider,source_external_id,source_provenance")
      .eq("id", attemptId).eq("problem_id", problemId).eq("user_id", user.id).eq("attempt_type", "practice").maybeSingle();
    if (error || !attempt) return { error: "Attempt not found or not owned by you." };
    if (!isEditablePractice(attempt)) return { error: "Reviewed attempts are read-only. Record a new self-report instead." };
  }
  const query = operation === "create"
    ? supabase.from("problem_performances").insert({
      problem_id: problemId, user_id: user.id, attempt_type: "practice", ...(parsed?.success ? parsed.data : {}),
    })
    : operation === "update"
      ? supabase.from("problem_performances").update(parsed?.success ? parsed.data : {})
      : supabase.from("problem_performances").delete();
  const scoped = operation === "create" ? query : query.eq("id", attemptId).eq("problem_id", problemId).eq("user_id", user.id).eq("attempt_type", "practice");
  const { data, error } = await scoped.select("id").maybeSingle();
  // Database triggers still enforce eligibility if review changes after the preceding read.
  if (error || !data) return { error: "Attempt could not be changed. It may have been reviewed or removed; reload and try again." };
  revalidatePath(`/problems/${problem.slug}`);
  revalidatePath("/problems"); revalidatePath("/dashboard");
  return { success: operation === "delete" ? "Practice attempt deleted." : operation === "create" ? "Self-reported practice saved." : "Practice attempt updated." };
}

export async function createPracticeAttempt(problemId: string, _: ProblemActionState, formData: FormData) {
  return saveAttempt("create", problemId, null, formData);
}
export async function updatePracticeAttempt(problemId: string, attemptId: string, _: ProblemActionState, formData: FormData) {
  return saveAttempt("update", problemId, attemptId, formData);
}
export async function deletePracticeAttempt(problemId: string, attemptId: string, _: ProblemActionState, formData: FormData) {
  return saveAttempt("delete", problemId, attemptId, formData);
}

export async function setPersonalProblemStatus(problemId: string, _: ProblemActionState, form: FormData): Promise<ProblemActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to save your personal task status." };
  const parsed = z.object({ problemId: z.uuid(), status: z.enum(["attempted", "solved", "clear"]) }).safeParse({ problemId, status: form.get("status") });
  if (!parsed.success) return { error: "Choose a valid task and status." };
  try {
    const client = await createClient();
    const { data: problem, error: lookupError } = await client.from("problems").select("id,slug").eq("id", problemId).eq("published", true).maybeSingle();
    if (lookupError || !problem) return { error: "This individual task is no longer published." };
    const { error } = await client.rpc("set_problem_status", { p_problem_id: problemId, p_status: parsed.data.status === "clear" ? null : parsed.data.status });
    if (error) return { error: "Task status could not be confirmed. Refresh before trying again." };
    revalidatePath(`/problems/${problem.slug}`); revalidatePath("/problems"); revalidatePath("/dashboard");
    return { success: parsed.data.status === "clear" ? "Manual status cleared. Recorded attempts still count as attempted." : "Self-reported task status saved." };
  } catch { return { error: "Task status could not be confirmed. Refresh before trying again." }; }
}
