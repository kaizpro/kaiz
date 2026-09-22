import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type Competition = {
  id: string; title: string; slug: string; description: string; organizer: string; category: string;
  status: "upcoming" | "active" | "completed"; format: "online" | "offline" | "hybrid";
  start_date: string; end_date: string; registration_deadline: string | null; city: string | null;
  country: string; tags: string[]; verified: boolean; official_website: string | null; registration_url: string | null;
  eligibility: string | null; participant_count?: number;
};

export async function listCompetitions(status?: string, category?: string, format?: string): Promise<Competition[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  let query = supabase.from("competitions").select("*").order("start_date", { ascending: true });
  if (status && status !== "all") query = query.eq("status", status);
  if (category && category !== "all") query = query.eq("category", category);
  if (format && format !== "all") query = query.eq("format", format);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load competitions.");
  return data as Competition[];
}

export async function getCompetition(slug: string): Promise<Competition | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("competitions").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error("Unable to load this competition.");
  return data as Competition | null;
}
