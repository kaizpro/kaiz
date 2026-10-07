"use client";

import { useEffect, useRef } from "react";
import type { ProblemActionState } from "@/lib/validation/problem";

export function ProblemFormFeedback({ state, prefix }: { state: ProblemActionState; prefix: string }) {
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state.error, state.fields]);
  return <>
    {state.error && <div ref={errorRef} role="alert" tabIndex={-1} className="border border-destructive/40 p-3 text-sm text-destructive">
      <p>{state.error}</p>
      {state.fields && <ul className="mt-2 space-y-1">{Object.entries(state.fields).map(([name, messages]) =>
        messages?.length ? <li key={name}><a className="underline" href={`#${prefix}-${name}`}>{messages.join(" ")}</a></li> : null)}</ul>}
    </div>}
    {state.success && <p role="status" className="text-sm text-success">{state.success}</p>}
  </>;
}
