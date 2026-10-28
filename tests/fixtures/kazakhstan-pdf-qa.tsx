// Local component fixture only: synthetic URLs, no files, names, DB or Auth.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { OfficialResultSource } from "@/components/official-result-source";
import { CompetitionSections } from "@/components/competition-sections";
import { getKazakhstanResultsPdf } from "@/lib/results/kazakhstan-pdf";

function Fixture() {
  const [year, setYear] = useState("2025");
  const [mode, setMode] = useState("missing");
  const slug = `ai-olymp-kazakhstan-${year}`;
  const url = mode === "ready" ? "https://drive.google.com/file/d/SYNTHETIC_QA_PDF_FILE_NOT_PUBLISHED/view" : mode === "unsafe" ? "https://docs.google.com/spreadsheets/d/SYNTHETIC_PRIVATE/edit" : undefined;
  return <main className="mx-auto max-w-3xl p-5">
    <h1 className="text-2xl font-bold">Local Kazakhstan PDF link QA</h1>
    <p className="my-3 text-sm">Synthetic links only. No PDF is hosted or published.</p>
    <div className="flex flex-wrap gap-3"><label className="min-w-0 max-w-full">Edition<select className="block max-w-full" aria-label="Edition" value={year} onChange={event => setYear(event.target.value)}><option>2025</option><option>2026</option></select></label>
    <label className="min-w-0 max-w-full">Configuration<select className="block max-w-full" aria-label="Configuration" value={mode} onChange={event => setMode(event.target.value)}><option value="missing">Not configured</option><option value="ready">Synthetic valid URL shape</option><option value="unsafe">Restricted workbook rejected</option></select></label></div>
    <CompetitionSections overview={<p>Overview remains available.</p>} tasks={<p>Task links remain separate.</p>} results={<><OfficialResultSource slug={slug} resultsPdf={getKazakhstanResultsPdf(slug, url)}/><p>No published KAIZ standings yet. Use the official source when available.</p></>}/>
  </main>;
}
createRoot(document.getElementById("qa-root")!).render(<Fixture/>);
