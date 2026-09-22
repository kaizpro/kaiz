"use client";

import { useActionState } from "react";
import { updatePassword, type UpdatePasswordState } from "@/app/auth/update-password/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: UpdatePasswordState = {};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <Card className="w-full p-7">
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <form action={formAction} className="mt-6 space-y-4">
          <label className="text-sm font-medium">
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
          <Button className="w-full" disabled={pending}>
            {pending ? "Updating password…" : "Update password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
