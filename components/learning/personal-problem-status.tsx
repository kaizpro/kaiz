"use client";
import { useActionState } from "react";
import { setPersonalProblemStatus } from "@/app/problems/actions";
import type { ProblemActionState } from "@/lib/validation/problem";
import type { PersonalProblem } from "@/lib/data/problem-progress";
import styles from "./personal-practice.module.css";

export function PersonalProblemStatus({ problemId, item }: { problemId: string; item?: PersonalProblem }) {
  const [state, action, pending] = useActionState<ProblemActionState, FormData>(setPersonalProblemStatus.bind(null, problemId), {});
  return <section className="border-y py-4" aria-label="My task status">
    <h2 className="text-base font-semibold">My Progress</h2><p className={`${styles.status} mt-2`} data-status={item?.status ?? "unattempted"}>{item?.status === "solved" ? "✓ Solved — Self-reported" : item ? "Attempted — Self-reported" : <><span>Not started</span> · <span>Unattempted</span></>}</p>
    <p className="my-2 text-xs leading-6 text-muted-foreground">Private to your account, not judge-verified. A score does not automatically mean solved. Clearing status does not delete recorded attempts.</p>
    {item?.latest_score != null && <p className="mb-3 text-sm">Latest: {item.latest_score} {item.metric_name} · Self-reported · {item.metric_direction === "lower_is_better" ? "Lower" : "Higher"} is better</p>}
    <form action={action} aria-busy={pending} className="flex flex-wrap gap-2">
      <button className={styles.action} name="status" value="attempted" disabled={pending || item?.status === "attempted"}>Mark Attempted</button>
      <button className={styles.action} name="status" value="solved" disabled={pending || item?.status === "solved"}>Mark Solved</button>
      {item && <button className={styles.action} name="status" value="clear" disabled={pending}>Clear manual status</button>}
    </form>
    {pending && <p role="status" className="text-xs">Saving task status…</p>}{state.error && <p role="alert" className="mt-2 text-sm text-destructive">{state.error}</p>}{state.success && <p role="status" className="mt-2 text-xs text-muted-foreground">{state.success}</p>}
  </section>;
}
