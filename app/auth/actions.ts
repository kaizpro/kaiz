"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { profileDestination } from "@/lib/auth";
import { safeAuthRedirect } from "@/lib/auth/redirects";
import { authCallbackUrl } from "@/lib/auth/urls";
import { loginSchema, registerSchema, emailSchema } from "@/lib/validation/auth";
import { SIGNUP_MESSAGE, RESEND_MESSAGE, RECOVERY_MESSAGE } from "@/lib/auth/messages";

export type AuthState = { error?: string; success?: string; email?: string };
export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Unable to sign in. Check your email and password, or request a password reset." };
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
  try {
    await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { emailRedirectTo: authCallbackUrl(origin, "/onboarding"), data: { display_name: parsed.data.displayName } } });
  } catch {
    // Transport failures and provider account responses share the same public state.
  }
  return { success: SIGNUP_MESSAGE, email: parsed.data.email };
}
export async function resetPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const origin = getSiteUrl();
  const supabase = await createClient();
  try {
    await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: authCallbackUrl(origin, "/auth/update-password") });
  } catch {
    // Do not expose provider account details or transport responses.
  }
  return { success: RECOVERY_MESSAGE, email: parsed.data };
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
  const emailRedirectTo = authCallbackUrl(getSiteUrl(), "/onboarding");
  try {
    await supabase.auth.resend({ type: "signup", email: parsed.data, options: { emailRedirectTo } });
  } catch {
    // Missing accounts and existing accounts share the same public state.
  }
  return { success: RESEND_MESSAGE, email: parsed.data };
}
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Unable to sign out. Please try again.");
  redirect("/");
}
