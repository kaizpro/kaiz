import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function getProfile(username: string) {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*, external_accounts(provider,external_username,verified_at), competition_results:competition_results!competition_results_user_id_fkey(rank,score,verified,competitions(title,slug,end_date)), rating_history(*), user_achievements(earned_at, achievements(*)), activities(*)").eq("username", username).order("created_at", { referencedTable: "activities", ascending: false }).limit(8, { referencedTable: "activities" }).maybeSingle();
  if (error) throw new Error("Unable to load profile.");
  return data;
}
