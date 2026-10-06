"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { profileDestination } from "@/lib/auth";
import { safeAuthRedirect } from "@/lib/auth/redirects";
import { authCallbackUrl } from "@/lib/auth/urls";
import { loginSchema, registerSchema, emailSchema } from "@/lib/validation/auth";

export type AuthState = { error?: string; success?: string };
export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  const requestedNext = safeAuthRedirect(formData.get("next"));
  if (requestedNext !== "/") redirect(requestedNext);
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user.id).maybeSingle();
  redirect(profileDestination(profile));
}
export async function register(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const origin = getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { emailRedirectTo: authCallbackUrl(origin, "/onboarding"), data: { display_name: parsed.data.displayName } } });
  return error ? { error: error.message } : { success: "Check your email to verify your account." };
}
export async function resetPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const origin = getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: authCallbackUrl(origin, "/auth/update-password") });
  return error ? { error: error.message } : { success: "If an account exists, a reset link is on its way." };
}
export async function signInWithGoogle() {
  const origin = getSiteUrl();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: authCallbackUrl(origin, "/onboarding") } });
  if (error || !data.url) redirect("/auth/login?error=oauth");
  redirect(data.url);
}
export async function resendConfirmation(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data, options: { emailRedirectTo: authCallbackUrl(getSiteUrl(), "/onboarding") } });
  return error
    ? { error: "Unable to request a confirmation email. Wait a moment and try again." }
    : { success: "If your account needs confirmation, a new email is on its way." };
}
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Unable to sign out. Please try again.");
  redirect("/");
}
