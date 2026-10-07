import { AuthPanel } from "@/components/auth-panel";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { AuthForm } from "@/components/auth-form";
import { login, signInWithGoogle } from "@/app/auth/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const ready = hasSupabaseEnv();
  const message = error === "oauth"
    ? "Google sign-in could not be completed. Try again or use email sign-in."
    : error === "callback" ? "This sign-in link could not be verified. Try signing in again or request a new email link." : null;

  return <AuthPanel>
    <p className="font-mono text-xs uppercase tracking-[.16em] text-primary">Member access</p>
    <h1 className="mt-2 text-2xl font-bold">Sign in to compete</h1>
    <p className="mt-2 text-sm text-muted-foreground">Track competitions, build your profile, and earn a verified rating.</p>
    {message && <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}
    {!ready ? <p className="mt-6 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">Supabase environment variables are required before authentication is enabled.</p> : <>
      <div className="mt-6"><AuthForm mode="login" action={login} next={next}/></div>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>or<span className="h-px flex-1 bg-border"/></div>
      <form action={signInWithGoogle}><GoogleAuthButton /></form>
    </>}
  </AuthPanel>;
}
