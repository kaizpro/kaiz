"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "./product/competitions.module.css";

/** A small navigation boundary: server-fetched panels stay on the server. */
export function CompetitionSections({ overview, results, tasks }: { overview: ReactNode; results: ReactNode; tasks: ReactNode }) {
  const [selected, setSelected] = useState("overview");
  const id = useId();
  const sections = [{ key: "overview", name: "Overview", content: overview }, { key: "results", name: "Results", content: results }, { key: "tasks", name: "Tasks", content: tasks }];
  return <div>
    <nav aria-label="Competition sections" className={styles.sections}>
      {sections.map((section) => <button key={section.key} type="button" aria-pressed={selected === section.key} aria-controls={`${id}-${section.key}`} onClick={() => setSelected(section.key)}>{section.name}</button>)}
    </nav>
    {sections.map((section) => <div key={section.key} id={`${id}-${section.key}`} hidden={selected !== section.key}>{section.content}</div>)}
  </div>;
}
