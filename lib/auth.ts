import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id,username,display_name,role").eq("id", user.id).maybeSingle();
  return data;
}

export function profileDestination(profile: { username?: string | null } | null) {
  return profile?.username ? `/u/${profile.username}` : "/onboarding";
}

export async function requireUser(next = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") redirect("/");
  return user;
}
