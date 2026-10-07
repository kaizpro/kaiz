"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePassword, type UpdatePasswordState } from "@/app/auth/update-password/actions";
import { Button } from "@/components/ui/button";
import { AuthPanel } from "@/components/auth-panel";
import { Input } from "@/components/ui/input";

const initialState: UpdatePasswordState = {};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <AuthPanel>
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use at least 8 characters for your new password.</p>
        <form action={formAction} aria-busy={pending} className="mt-6 space-y-4" onSubmit={(event) => { if (pending) event.preventDefault(); }}>
          <label className="block text-sm font-medium">
            New password
            <Input
              className="mt-2"
              name="password"
              type="password"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              aria-describedby={state.error ? "password-update-error" : undefined}
              required
            />
          </label>
          {state.error ? (
            <p id="password-update-error" role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Updating password…" : "Update password"}
          </Button>
        </form>
        <Link href="/auth/reset-password" className="mt-5 block text-sm text-muted-foreground hover:text-foreground focus-visible:underline">Request a new recovery link</Link>
    </AuthPanel>
  );
}
