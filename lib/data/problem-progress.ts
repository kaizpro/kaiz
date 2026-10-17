import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type PersonalProblem = { problem_id: string; title: string; slug: string; metric_name: string; metric_direction: string; status: "attempted" | "solved"; latest_score: number | null; latest_attempt_at: string | null; updated_at: string | null };
const fields = "problem_id,title,slug,metric_name,metric_direction,status,latest_score,latest_attempt_at,updated_at";
const failure = "Personal task progress is unavailable. No unattempted or zero-score state is assumed.";
export async function getOwnProblemProgress(problemIds?: readonly string[]) {
  const user = hasSupabaseEnv() ? await getCurrentUser() : null;
  if (!user) return { signedIn: false, items: [] as PersonalProblem[], attempted: null, solved: null, error: null };
  try {
    const client = await createClient();
    const own = () => client.from("own_problem_practice").select(fields).eq("user_id", user.id);
    const listing = problemIds ? problemIds.length ? own().in("problem_id", [...problemIds]) : Promise.resolve({ data: [], error: null }) : own().order("updated_at", { ascending: false, nullsFirst: false }).order("problem_id").limit(20);
    const [rows, attempted, solved] = await Promise.all([listing,
      client.from("own_problem_practice").select("problem_id", { count: "exact", head: true }).eq("user_id", user.id),
      client.from("own_problem_practice").select("problem_id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "solved"),
    ]);
    if (rows.error || attempted.error || solved.error || attempted.count === null || solved.count === null) throw new Error("unavailable");
    return { signedIn: true, items: (rows.data ?? []) as PersonalProblem[], attempted: attempted.count, solved: solved.count, error: null };
  } catch {
    return { signedIn: true, items: [] as PersonalProblem[], attempted: null, solved: null, error: failure };
  }
}
