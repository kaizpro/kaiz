import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isEditablePractice } from "@/lib/validation/problem";

export type OwnPracticeAttempt = {
  id: string; raw_score: number; normalized_performance: number | null;
  attempted_at: string; status: "valid" | "invalidated" | "disqualified"; editable: boolean;
};

export async function listOwnPracticeAttempts(problemId: string, page = 1) {
  const user = await getCurrentUser();
  if (!user) return { attempts: [] as OwnPracticeAttempt[], count: 0 };
  const supabase = await createClient();
  const { data, count, error } = await supabase.from("problem_performances")
    .select("id,raw_score,normalized_performance,attempted_at,status,source_provider,source_external_id,source_provenance", { count: "exact" })
    .eq("problem_id", problemId).eq("user_id", user.id).eq("attempt_type", "practice")
    .order("attempted_at", { ascending: false }).order("id", { ascending: true })
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error("Unable to load your practice attempts.");
  return { count: count ?? 0, attempts: (data ?? []).map((row) => ({
    id: row.id, raw_score: row.raw_score, normalized_performance: row.normalized_performance,
    attempted_at: row.attempted_at, status: row.status, editable: isEditablePractice(row),
  })) as OwnPracticeAttempt[] };
}
