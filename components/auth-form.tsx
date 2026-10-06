"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthState } from "@/app/auth/actions";

type Action = (state: AuthState, data: FormData) => Promise<AuthState>;
export function AuthForm({ mode, action, next }: { mode: "login" | "register" | "reset" | "resend"; action: Action; next?: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="space-y-4">
    {next && <input type="hidden" name="next" value={next}/>}
    {mode === "register" && <label className="block text-sm font-medium">Display name<Input className="mt-2" name="displayName" autoComplete="name" required/></label>}
    <label className="block text-sm font-medium">Email<Input className="mt-2" name="email" type="email" autoComplete="email" required/></label>
    {(mode === "login" || mode === "register") && <label className="block text-sm font-medium">Password<Input className="mt-2" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} required/></label>}
    {state.error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    {state.success && <p role="status" className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>}
    <Button className="w-full" disabled={pending}>{pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : mode === "resend" ? "Resend confirmation" : "Send reset link"}</Button>
    {mode === "login" && <div className="flex justify-between text-sm text-muted-foreground"><Link href="/auth/register" className="hover:text-foreground">Create account</Link><Link href="/auth/reset-password" className="hover:text-foreground">Forgot password?</Link></div>}
    {(mode === "login" || mode === "register") && <Link href="/auth/resend-confirmation" className="block text-sm text-muted-foreground hover:text-foreground">Need a new confirmation email?</Link>}
  </form>;
}
