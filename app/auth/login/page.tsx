import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/components/auth-form";
import { login, signInWithGoogle } from "@/app/auth/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const ready = hasSupabaseEnv();
  const message = error === "oauth"
    ? "Google sign-in is unavailable. Use email sign-in or try again after the provider is configured."
    : error === "callback" ? "This sign-in link could not be verified. Try signing in again or request a new email link." : null;

  return <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12"><Card className="w-full p-6 sm:p-8">
    <p className="font-mono text-xs uppercase tracking-[.16em] text-primary">Member access</p>
    <h1 className="mt-2 text-2xl font-bold">Sign in to compete</h1>
    <p className="mt-2 text-sm text-muted-foreground">Track competitions, build your profile, and earn a verified rating.</p>
    {message && <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}
    {!ready ? <p className="mt-6 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">Supabase environment variables are required before authentication is enabled.</p> : <>
      <div className="mt-6"><AuthForm mode="login" action={login} next={next}/></div>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>or<span className="h-px flex-1 bg-border"/></div>
      <form action={signInWithGoogle}><Button className="w-full" variant="outline">Continue with Google</Button></form>
    </>}
  </Card></div>;
}
