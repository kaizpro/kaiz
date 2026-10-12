"use client";

import { useId, useState, type ReactNode } from "react";

export function CompetitionResultSwitcher({ panels }: { panels: { key: string; label: string; content: ReactNode }[] }) {
  const [selection, setSelected] = useState(panels[0]?.key);
  const selected = panels.some((panel) => panel.key === selection) ? selection : panels[0]?.key;
  const id = useId();
  return <div>
    <nav aria-label="Result stages" className="mb-4 flex flex-wrap gap-2">
      {panels.map((panel) => <button key={panel.key} type="button" aria-pressed={selected === panel.key} aria-controls={`${id}-${panel.key}`} onClick={() => setSelected(panel.key)} className={`border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${selected === panel.key ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{panel.label}</button>)}
    </nav>
    {panels.map((panel) => <div key={panel.key} id={`${id}-${panel.key}`} hidden={selected !== panel.key}>{panel.content}</div>)}
  </div>;
}
