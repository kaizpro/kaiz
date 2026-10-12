"use client";

import { useId, useState, type ReactNode } from "react";

/** A small navigation boundary: server-fetched panels stay on the server. */
export function CompetitionSections({ overview, results, tasks }: { overview: ReactNode; results: ReactNode; tasks: ReactNode }) {
  const [selected, setSelected] = useState("overview");
  const id = useId();
  const sections = [{ key: "overview", name: "Overview", content: overview }, { key: "results", name: "Results", content: results }, { key: "tasks", name: "Tasks", content: tasks }];
  return <div>
    <nav aria-label="Competition sections" className="flex gap-1 border-b py-3">
      {sections.map((section) => <button key={section.key} type="button" aria-pressed={selected === section.key} aria-controls={`${id}-${section.key}`} onClick={() => setSelected(section.key)} className={`px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${selected === section.key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{section.name}</button>)}
    </nav>
    {sections.map((section) => <div key={section.key} id={`${id}-${section.key}`} hidden={selected !== section.key}>{section.content}</div>)}
  </div>;
}
