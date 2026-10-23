"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import styles from "./product/competitions.module.css";

/** A small navigation boundary: server-fetched panels stay on the server. */
export function CompetitionSections({ overview, results, tasks }: { overview: ReactNode; results: ReactNode; tasks: ReactNode }) {
  const [selected, setSelected] = useState("overview");
  const id = useId();
  const navigation = useRef<HTMLElement>(null);
  const selectSection = (key: string) => {
    setSelected(key);
    navigation.current?.querySelector<HTMLButtonElement>(`[data-section="${key}"]`)?.focus();
  };
  const sections = [{ key: "overview", name: "Overview", content: overview }, { key: "results", name: "Results", content: results }, { key: "tasks", name: "Tasks", content: tasks }];
  return <div>
    <nav ref={navigation} aria-label="Competition sections" className={styles.sections}>
      {sections.map((section) => <button key={section.key} data-section={section.key} type="button" aria-pressed={selected === section.key} aria-controls={`${id}-${section.key}`} onClick={() => setSelected(section.key)}>{section.name}</button>)}
    </nav>
    {sections.map((section) => <div key={section.key} id={`${id}-${section.key}`} hidden={selected !== section.key}>
      {section.key === "overview" && <div className="flex flex-wrap gap-3 py-5"><button type="button" className="min-h-11 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground" aria-controls={`${id}-results`} onClick={() => selectSection("results")}>View Results</button><button type="button" className="min-h-11 rounded-sm border px-5 text-sm font-semibold" aria-controls={`${id}-tasks`} onClick={() => selectSection("tasks")}>Explore Tasks</button></div>}
      {section.content}
    </div>)}
  </div>;
}
