"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resendConfirmation, type AuthState } from "@/app/auth/actions";

type Action = (state: AuthState, data: FormData) => Promise<AuthState>;
type AuthFormProps = { mode: "login" | "register" | "reset" | "resend"; action: Action; next?: string; initialEmail?: string };

export function AuthForm(props: AuthFormProps) {
  const [revision, setRevision] = useState(0);
  return <AuthFormContent key={revision} {...props} onDifferentEmail={() => setRevision((value) => value + 1)} />;
}

function AuthFormContent({ mode, action, next, initialEmail = "", onDifferentEmail }: AuthFormProps & { onDifferentEmail: () => void }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [email, setEmail] = useState(initialEmail);
  const statusHeading = useRef<HTMLHeadingElement>(null);
  const showConfirmation = mode === "register" && !!state.success;
  useEffect(() => {
    if (showConfirmation) statusHeading.current?.focus();
  }, [showConfirmation]);

  if (showConfirmation) return <section className="space-y-4" aria-labelledby="confirmation-title">
    <h2 id="confirmation-title" ref={statusHeading} tabIndex={-1} className="text-xl font-semibold outline-none">Check your email</h2>
    <p className="break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium">{state.email}</p>
    <p role="status" className="text-sm leading-6 text-muted-foreground">{state.success}</p>
    <p className="text-xs leading-5 text-muted-foreground">Check your spam folder too. Delivery may take a few minutes; wait before requesting another link.</p>
    <AuthForm mode="resend" action={resendConfirmation} initialEmail={state.email} />
    <Button type="button" variant="ghost" className="w-full" onClick={onDifferentEmail}>Use a different email</Button>
  </section>;

  const messageId = `${mode}-message`;
  return <form action={formAction} aria-busy={pending} className="space-y-4" onSubmit={(event) => { if (pending) event.preventDefault(); }}>
    {next && <input type="hidden" name="next" value={next}/>}
    {mode === "register" && <label className="block text-sm font-medium">Display name<Input className="mt-2" name="displayName" autoComplete="name" minLength={2} maxLength={60} required/></label>}
    <label className="block text-sm font-medium">Email<Input className="mt-2" name="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} aria-describedby={state.error || state.success ? messageId : undefined} required/></label>
    {(mode === "login" || mode === "register") && <label className="block text-sm font-medium">Password<Input className="mt-2" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} maxLength={mode === "register" ? 72 : undefined} required/></label>}
    {state.error && <p id={messageId} role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    {state.success && <p id={messageId} role="status" className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>}
    <Button type="submit" className="w-full" disabled={pending}>{pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : mode === "resend" ? "Resend confirmation" : "Send reset link"}</Button>
    <nav aria-label="Authentication options" className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
      {mode !== "login" && <Link href="/auth/login" className="hover:text-foreground focus-visible:underline">Sign in</Link>}
      {mode !== "register" && <Link href="/auth/register" className="hover:text-foreground focus-visible:underline">Create account</Link>}
      {mode !== "reset" && <Link href="/auth/reset-password" className="hover:text-foreground focus-visible:underline">Forgot password?</Link>}
      {mode !== "resend" && <Link href="/auth/resend-confirmation" className="hover:text-foreground focus-visible:underline">Resend confirmation</Link>}
    </nav>
  </form>;
}
