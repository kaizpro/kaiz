"use client";

import { useActionState } from "react";
import type { DiscussionActionState } from "@/app/discussions/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function DiscussionReplyForm({
  action,
  defaultValue,
  compact = false,
  label = "Post reply",
}: {
  action: (state: DiscussionActionState, formData: FormData) => Promise<DiscussionActionState>;
  defaultValue?: string;
  compact?: boolean;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="space-y-3">
    <Textarea name="body" defaultValue={defaultValue} className={compact ? "min-h-24" : "min-h-32"} maxLength={6000} placeholder="Add a useful, respectful reply…" required/>
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    <Button size="sm" disabled={pending}>{pending ? "Saving…" : label}</Button>
  </form>;
}
