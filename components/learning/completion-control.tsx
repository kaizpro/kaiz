"use client";
import { useActionState } from "react";
import { Check, Circle } from "lucide-react";
import { setLessonCompletion, type CompletionState } from "@/app/roadmaps/actions";
import styles from "./course.module.css";

export function CompletionControl({ roadmap, lesson, number, completed }: { roadmap: string; lesson: string; number: string; completed: boolean }) {
  const [state, action, pending] = useActionState<CompletionState, FormData>(setLessonCompletion.bind(null, roadmap, lesson), {});
  return <form action={action} aria-busy={pending} className={styles.completion}>
    <input type="hidden" name="completed" value={completed ? "false" : "true"}/>
    <button disabled={pending} className={styles.smallAction} aria-label={`${completed ? "Undo completion of" : "Mark completed:"} lesson ${number}`}>
      {completed ? <Check size={14} aria-hidden="true"/> : <Circle size={14} aria-hidden="true"/>}{pending ? "Saving…" : completed ? "Completed · Undo" : "Mark as Completed"}
    </button>
    {state.error && <p role="alert" className="text-xs text-destructive">{state.error}</p>}
    {state.success && <p role="status" className="sr-only">{state.success}</p>}
  </form>;
}
