"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProblemFormFeedback } from "@/components/problem-form-feedback";
import type { AdminProblem } from "@/lib/data/admin-problems";
import type { ProblemActionState } from "@/lib/validation/problem";

type Action = (state: ProblemActionState, form: FormData) => Promise<ProblemActionState>;
export function ProblemForm({ action, problem, competitions }: {
  action: Action; problem?: AdminProblem; competitions: { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const prefix = useId();
  const [values, setValues] = useState<Record<string, string>>(() => ({
    metric_direction: "higher_is_better", difficulty_status: "unrated", source_provider: "manual", sort_order: "0",
    ...Object.fromEntries(Object.entries(problem ?? {}).map(([name, value]) => [name, value == null ? "" : String(value)])),
    tags: problem?.tags.join(", ") ?? "",
  }));
  const field = (name: string) => ({ id: `${prefix}-${name}`, name, value: values[name] ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? String(event.target.checked) : event.target.value;
      setValues((previous) => ({ ...previous, [name]: value }));
    }, "aria-invalid": Boolean(state.fields?.[name]), "aria-describedby": state.fields?.[name] ? `${prefix}-${name}-error` : undefined });
  const error = (name: string) => state.fields?.[name] && <p id={`${prefix}-${name}-error`} className="mt-1 text-sm text-destructive">{state.fields[name]?.join(" ")}</p>;
  const selectClass = "mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";
  return <form action={formAction} className="space-y-6" aria-busy={pending}>
    <ProblemFormFeedback state={state} prefix={prefix}/>
    <fieldset disabled={pending} className="grid min-w-0 gap-5 sm:grid-cols-2">
      <legend className="mb-4 text-lg font-semibold">Problem content</legend>
      <label className="text-sm font-medium">Title (required)<Input {...field("title")} className="mt-2 h-11" minLength={2} maxLength={180} required/>{error("title")}</label>
      <label className="text-sm font-medium">Slug (required)<Input {...field("slug")} className="mt-2 h-11" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} required/>{error("slug")}</label>
      <label className="text-sm font-medium">Competition<select {...field("competition_id")} className={selectClass}><option value="">Independent archive problem</option>
        {problem?.competition_id && !competitions.some((item) => item.id === problem.competition_id) && <option value={problem.competition_id}>Current competition unavailable — choose explicitly</option>}
        {competitions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>{error("competition_id")}</label>
      <label className="text-sm font-medium">Problem code<Input {...field("problem_code")} className="mt-2 h-11" maxLength={40}/>{error("problem_code")}</label>
      <label className="text-sm font-medium">Category (required)<Input {...field("category")} className="mt-2 h-11" minLength={2} maxLength={80} required/>{error("category")}</label>
      <label className="text-sm font-medium">Tags (comma-separated)<Input {...field("tags")} className="mt-2 h-11" maxLength={700}/>{error("tags")}</label>
      <label className="text-sm font-medium sm:col-span-2">Summary<Textarea {...field("summary")} className="mt-2" maxLength={600}/>{error("summary")}</label>
      <label className="text-sm font-medium sm:col-span-2">Statement (displayed as plain text)<Textarea {...field("statement_markdown")} className="mt-2 min-h-40" maxLength={50000}/>{error("statement_markdown")}</label>
      <label className="text-sm font-medium sm:col-span-2">Statement URL<Input {...field("statement_url")} type="url" className="mt-2 h-11"/>{error("statement_url")}</label>
    </fieldset>
    <fieldset disabled={pending} className="grid min-w-0 gap-5 border-t pt-5 sm:grid-cols-2">
      <legend className="text-lg font-semibold">Metric and existing difficulty</legend>
      <label className="text-sm font-medium">Metric name (required)<Input {...field("metric_name")} className="mt-2 h-11" maxLength={80} required/>{error("metric_name")}</label>
      <label className="text-sm font-medium">Metric direction<select {...field("metric_direction")} className={selectClass}><option value="higher_is_better">Higher is better</option><option value="lower_is_better">Lower is better</option></select>{error("metric_direction")}</label>
      <label className="text-sm font-medium">Reference score<Input {...field("reference_score")} type="number" step="any" className="mt-2 h-11"/>{error("reference_score")}</label>
      <label className="text-sm font-medium">Difficulty state<select {...field("difficulty_status")} className={selectClass}><option value="unrated">Unrated</option><option value="provisional">Provisional</option><option value="rated">Rated</option></select>{error("difficulty_status")}</label>
      <label className="text-sm font-medium">Existing difficulty value<Input {...field("difficulty_rating")} type="number" step="any" min="0" className="mt-2 h-11"/>{error("difficulty_rating")}</label>
      <label className="text-sm font-medium">Competition display order<Input {...field("sort_order")} type="number" step="1" className="mt-2 h-11"/>{error("sort_order")}</label>
      <p className="text-sm text-muted-foreground sm:col-span-2">No rating is calculated here. Leave difficulty empty for unrated problems; use only an existing approved value for rated problems.</p>
    </fieldset>
    <fieldset disabled={pending} className="grid min-w-0 gap-5 border-t pt-5 sm:grid-cols-2">
      <legend className="text-lg font-semibold">Source and publication</legend>
      <label className="text-sm font-medium">Provider ID (required)<Input {...field("source_provider")} className="mt-2 h-11" pattern="[a-z][a-z0-9_]{1,39}" required/>{error("source_provider")}</label>
      <label className="text-sm font-medium">Source label<Input {...field("source_label")} className="mt-2 h-11" maxLength={120}/>{error("source_label")}</label>
      <label className="text-sm font-medium">Source URL<Input {...field("source_url")} type="url" className="mt-2 h-11"/>{error("source_url")}</label>
      <label className="text-sm font-medium">Source external ID<Input {...field("source_external_id")} className="mt-2 h-11" maxLength={200}/>{error("source_external_id")}</label>
      <label className="flex min-h-11 items-center gap-3 text-sm font-medium sm:col-span-2"><input {...field("published")} type="checkbox" value="true" checked={values.published === "true"} className="size-4"/>Published — visible in the public archive</label>
      <p className="text-sm text-muted-foreground sm:col-span-2">Publishing also exposes this problem&apos;s existing statistic snapshots and approved official evidence under RLS. Unpublishing hides it from the public archive; it does not delete attempts. Existing provenance is preserved.</p>
    </fieldset>
    <div className="flex flex-wrap gap-3"><Button className="min-h-11" disabled={pending}>{pending ? "Saving…" : "Save problem"}</Button><Button asChild variant="outline" className="min-h-11"><Link href="/admin/problems">Back to problems</Link></Button></div>
  </form>;
}
