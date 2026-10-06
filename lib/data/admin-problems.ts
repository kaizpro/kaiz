import "server-only";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Problem } from "@/lib/data/problems";

export type AdminProblem = Omit<Problem, "competition" | "statistics"> & { updated_at: string };

export async function listAdminProblems(page = 1) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, count, error } = await supabase.from("problems")
    .select("id,title,slug,published,metric_name,metric_direction", { count: "exact" })
    .order("created_at", { ascending: false }).order("id", { ascending: true })
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error("Unable to load admin problems.");
  return { problems: data ?? [], count: count ?? 0 };
}

export async function getAdminProblem(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("problems").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load this problem.");
  return data as AdminProblem | null;
}

export async function listProblemCompetitions() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("competitions").select("id,title").order("title").order("id");
  if (error) throw new Error("Unable to load competitions.");
  return data ?? [];
}
