// Loopback-only review fixture. Drafts are deliberately supplied to UI components;
// this is NOT a published page, database import, Auth session or RLS simulation.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CompetitionSections } from "@/components/competition-sections";
import { CompetitionLeaderboard } from "@/components/competition-leaderboard";
import { CompetitionProblems } from "@/components/competition-problems";
import type { CompetitionResultSet } from "@/lib/data/competition-results";
import catalog from "@/content/competitions/2026-10-19/release-catalog.json";
import metadata from "@/content/competitions/2026-10-19/metadata-batch.json";
import manifest from "@/content/competitions/2026-10-17/publication-manifest.json";

function Fixture() {
  const [edition, setEdition] = useState("ioai-2025");
  const review = catalog.editions.find(e => e.editionId === edition)!;
  const form = metadata.competitions.find(e => e.editionKey === edition)?.form;
  const sets = manifest.stages.filter(s => s.edition_id === edition).map(s => ({
    id: s.stage_id, name: s.stage_label, status: "official", source: "official_import",
    source_label: "Official organizer source — local draft preview", source_url: s.source_url, verified_at: null,
    published: false, presentation: { stageLabel: s.stage_label, columns: s.columns,
      coverage: s.completeness === "partial" ? "partial" : "complete",
      availability: s.completeness === "partial" ? "OFFICIAL_STAGE_RESULTS" : "FULL_OFFICIAL_STANDINGS", notes: s.scope },
    competition_results: s.rows.map(r => ({ id: r.participant_id, participant_name: r.display_name,
      participant_type: r.participant_type, rank: r.rank, score: r.score, score_display: r.score_display,
      country_code: null, award: r.award, result_status: r.result_status,
      presentation: { scores: r.score_columns, comments: r.country_or_region ? `Original source region/team: ${r.country_or_region}` : undefined } })),
  })) as unknown as CompetitionResultSet[];
  return <main className="mx-auto max-w-5xl px-4 py-8">
    <p className="mb-4 text-sm">LOCAL CONTENT REVIEW ONLY — unpublished drafts; no database or public publication.</p>
    <label>Review edition<select className="block max-w-full border bg-background p-2" value={edition} onChange={e => setEdition(e.target.value)}>
      {catalog.editions.map(e => <option key={e.editionId}>{e.editionId}</option>)}
    </select></label>
    <h1 className="my-5 text-2xl">{form?.title ?? "Restricted Kazakhstan source — no public record prepared"}</h1>
    <CompetitionSections key={edition} overview={<div><p>{form?.description ?? review.stageNotes}</p><p>{review.stageNotes}</p></div>}
      results={<CompetitionLeaderboard resultSets={sets}/>}
      tasks={<><CompetitionProblems problems={[]}/><ul>{review.tasks.map(t => <li key={t.label} className="my-3">{t.url ? <a className="underline" href={t.url} target="_blank" rel="noopener noreferrer">{t.label}</a> : <span>{t.label}</span>}<span> — {t.access.replaceAll("_", " ")}</span></li>)}</ul></>}/>
  </main>;
}
createRoot(document.getElementById("qa-root")!).render(<Fixture/>);
