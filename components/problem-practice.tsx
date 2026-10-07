"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProblemFormFeedback } from "@/components/problem-form-feedback";
import { createPracticeAttempt, updatePracticeAttempt, deletePracticeAttempt } from "@/app/problems/actions";
import type { OwnPracticeAttempt } from "@/lib/data/practice";
import type { ProblemActionState } from "@/lib/validation/problem";

type Action = (state: ProblemActionState, data: FormData) => Promise<ProblemActionState>;
function PracticeEntryForm({ action, metric, attempt, onSuccess }: {
  action: Action; metric: string; attempt?: OwnPracticeAttempt; onSuccess: (message: string) => void;
}) {
  const prefix = useId();
  const [score, setScore] = useState(attempt ? String(attempt.raw_score) : "");
  const [time, setTime] = useState(attempt?.attempted_at ? new Date(attempt.attempted_at).toISOString().slice(0, -1) : "");
  const [state, formAction, pending] = useActionState(async (previous: ProblemActionState, data: FormData) => {
    const result = await action(previous, data);
    if (result.success) { onSuccess(result.success); if (!attempt) { setScore(""); setTime(""); } }
    return result;
  }, {});
  return <form action={formAction} className="space-y-4" aria-busy={pending}>
    <ProblemFormFeedback state={{ error: state.error, fields: state.fields }} prefix={prefix}/>
    <fieldset disabled={pending} className="grid min-w-0 gap-4 sm:grid-cols-2">
      <legend className="sr-only">{attempt ? "Edit self-reported attempt" : "Add self-reported practice"}</legend>
      <div><label htmlFor={`${prefix}-raw_score`} className="text-sm font-medium">Raw score ({metric})</label><Input id={`${prefix}-raw_score`} name="raw_score" type="number" step="any" value={score} onChange={(event) => setScore(event.target.value)} className="mt-2 h-11" required aria-invalid={Boolean(state.fields?.raw_score)} aria-describedby={`${prefix}-raw_score-error`}/><span id={`${prefix}-raw_score-error`} className="mt-1 block text-sm text-destructive">{state.fields?.raw_score?.join(" ")}</span></div>
      <div><label htmlFor={`${prefix}-attempted_at`} className="text-sm font-medium">Attempt time (UTC)</label><Input id={`${prefix}-attempted_at`} name="attempted_at" type="datetime-local" step="0.001" value={time} onChange={(event) => setTime(event.target.value)} className="mt-2 h-11" required aria-invalid={Boolean(state.fields?.attempted_at)} aria-describedby={`${prefix}-attempted_at-error`}/><span id={`${prefix}-attempted_at-error`} className="mt-1 block text-sm text-destructive">{state.fields?.attempted_at?.join(" ")}</span></div>
    </fieldset>
    <Button disabled={pending} className="min-h-11">{pending ? "Saving…" : attempt ? "Save changes" : "Add practice result"}</Button>
  </form>;
}

function DeletePracticeForm({ action, onSuccess }: { action: Action; onSuccess: (message: string) => void }) {
  const prefix = useId();
  const [state, formAction, pending] = useActionState(async (previous: ProblemActionState, data: FormData) => {
    const result = await action(previous, data);
    if (result.success) onSuccess(result.success);
    return result;
  }, {});
  return <form action={formAction} className="mt-4 space-y-3 border-t pt-4" aria-busy={pending}>
    <ProblemFormFeedback state={{ error: state.error }} prefix={prefix}/>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="confirm" value="true" required disabled={pending} className="size-4"/>Permanently delete this self-reported attempt</label>
    <Button variant="danger" disabled={pending} className="min-h-11">{pending ? "Deleting…" : "Delete attempt"}</Button>
  </form>;
}

export function ProblemPractice({ problemId, slug, metric, direction, best, attempts, count, page }: {
  problemId: string; slug: string; metric: string; direction: string;
  best: { raw_score: number; normalized_performance: number | null; attempted_at: string } | null;
  attempts: OwnPracticeAttempt[]; count: number; page: number;
}) {
  const [notice, setNotice] = useState("");
  const score = (value: number) => new Intl.NumberFormat("en", { maximumFractionDigits: 12 }).format(value);
  return <section id="practice" className="border-t pt-8">
    <h2 className="text-lg font-bold">Practice / upsolving</h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">Your private, self-reported results are not verified official evidence and do not change ratings. {direction === "lower_is_better" ? "Lower" : "Higher"} raw scores are better. Attempt times are entered and shown in UTC.</p>
    {notice && <p role="status" className="mt-4 text-sm text-success">{notice}</p>}
    {best ? <div className="mt-4 border bg-card p-4"><p className="micro-label text-muted-foreground">{best.normalized_performance === null ? "Best raw score" : "Raw score of best normalized attempt"}</p><p className="tabular mt-2 break-words font-mono text-xl font-bold">{score(best.raw_score)} <span className="text-sm font-normal">{metric}</span></p><p className="mt-2 text-sm text-muted-foreground">{new Date(best.attempted_at).toISOString().replace("T", " ").replace(".000Z", " UTC")}{best.normalized_performance !== null && ` · Normalized: ${Math.round(best.normalized_performance * 100)}% (administrator-managed)`}</p></div>
      : <p className="mt-4 border p-4 text-sm text-muted-foreground">No valid practice attempt yet. Record your first result below.</p>}
    <div className="mt-6 border bg-card p-4"><h3 className="mb-4 font-semibold">Add self-reported practice</h3><PracticeEntryForm action={createPracticeAttempt.bind(null, problemId)} metric={metric} onSuccess={setNotice}/></div>
    <h3 className="mt-8 font-semibold">Your attempts ({count})</h3>
    <div className="mt-3 border bg-card">{attempts.length ? attempts.map((attempt) => <article key={attempt.id} className="border-b p-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3"><p className="tabular break-words font-mono font-semibold">{score(attempt.raw_score)} {metric}</p><time className="text-sm text-muted-foreground" dateTime={attempt.attempted_at}>{new Date(attempt.attempted_at).toISOString().replace("T", " ").replace(".000Z", " UTC")}</time></div>
      <p className="mt-2 text-sm text-muted-foreground">{attempt.status} · {attempt.editable ? "Self-reported" : "Reviewed / administrator-managed — read-only"}</p>
      {attempt.editable && <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-primary">Edit or delete this attempt</summary><PracticeEntryForm action={updatePracticeAttempt.bind(null, problemId, attempt.id)} metric={metric} attempt={attempt} onSuccess={setNotice}/><DeletePracticeForm action={deletePracticeAttempt.bind(null, problemId, attempt.id)} onSuccess={setNotice}/></details>}
    </article>) : <p className="p-4 text-sm text-muted-foreground">No attempts on this page.</p>}</div>
    <nav aria-label="Practice history pages" className="mt-4 flex flex-wrap items-center gap-4">{page > 1 && <Link className="underline" href={`/problems/${slug}?practicePage=${page - 1}#practice`}>Previous</Link>}<span className="text-sm">Page {page}</span>{page * 20 < count && <Link className="underline" href={`/problems/${slug}?practicePage=${page + 1}#practice`}>Next</Link>}</nav>
  </section>;
}
