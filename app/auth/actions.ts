"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { profileDestination } from "@/lib/auth";
import { loginSchema, registerSchema, emailSchema } from "@/lib/validation/auth";

export type AuthState = { error?: string; success?: string };
function safeNext(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "/";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}
export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  const requestedNext = safeNext(formData.get("next"));
  if (requestedNext !== "/") redirect(requestedNext);
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user.id).maybeSingle();
  redirect(profileDestination(profile));
}
export async function register(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const origin = getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { emailRedirectTo: `${origin}/auth/callback?next=/onboarding`, data: { display_name: parsed.data.displayName } } });
  return error ? { error: error.message } : { success: "Check your email to verify your account." };
}
export async function resetPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const origin = getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${origin}/auth/callback?next=/auth/update-password` });
  return error ? { error: error.message } : { success: "If an account exists, a reset link is on its way." };
}
export async function signInWithGoogle() {
  const origin = getSiteUrl();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback?next=/onboarding` } });
  if (error) redirect("/auth/login?error=oauth");
  redirect(data.url);
}
export async function logout() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/"); }
