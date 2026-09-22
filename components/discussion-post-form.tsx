"use client";

import { useActionState } from "react";
import type { DiscussionActionState } from "@/app/discussions/actions";
import { DISCUSSION_CATEGORIES, DISCUSSION_CATEGORY_LABELS } from "@/lib/constants";
import type { DiscussionCompetition } from "@/lib/data/discussions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Values = { title?: string; body?: string; category?: string; competitionId?: string | null };

export function DiscussionPostForm({
  action,
  competitions,
  values = {},
  submitLabel,
}: {
  action: (state: DiscussionActionState, formData: FormData) => Promise<DiscussionActionState>;
  competitions: DiscussionCompetition[];
  values?: Values;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="space-y-5">
    <label className="block text-sm font-semibold">Title<Input className="mt-2" name="title" defaultValue={values.title} minLength={4} maxLength={140} required/></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold">Category<select name="category" defaultValue={values.category ?? "general"} className="mt-2 h-10 w-full rounded-[4px] border bg-background px-3 text-sm" required>{DISCUSSION_CATEGORIES.map((category) => <option key={category} value={category}>{DISCUSSION_CATEGORY_LABELS[category]}</option>)}</select></label>
      <label className="block text-sm font-semibold">Competition <span className="font-normal text-muted-foreground">(optional)</span><select name="competitionId" defaultValue={values.competitionId ?? ""} className="mt-2 h-10 w-full rounded-[4px] border bg-background px-3 text-sm"><option value="">Global discussion</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.title}</option>)}</select></label>
    </div>
    <label className="block text-sm font-semibold">Post body<Textarea className="mt-2 min-h-56 resize-y" name="body" defaultValue={values.body} maxLength={12000} required/></label>
    <p className="text-xs leading-5 text-muted-foreground">Plain text is rendered safely. HTML is never executed.</p>
    {state.error && <p role="alert" className="border-l-2 border-destructive pl-3 text-sm text-destructive">{state.error}</p>}
    <Button disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
  </form>;
}
