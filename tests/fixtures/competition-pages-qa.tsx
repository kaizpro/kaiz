// Browser-only component fixture: no Auth, database client or write endpoint.
// Uses existing source-backed draft rows; never mounted in the KAIZ application.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CompetitionSections } from "@/components/competition-sections";
import { CompetitionMedia } from "@/components/competition-media";
import { CompetitionLeaderboard } from "@/components/competition-leaderboard";
import { CompetitionProblems } from "@/components/competition-problems";
import type { CompetitionResultSet } from "@/lib/data/competition-results";
import batch from "@/content/competitions/2026-10-12/ready-batch.json";

function Fixture() {
  const [edition, setEdition] = useState("ioai-2025");
  const [brokenMedia, setBrokenMedia] = useState(false);
  const sets = batch.resultSets.filter((set) => set.competitionSlug === edition).map((set) => ({
    id: set.key, name: set.form.name, status: set.form.status, source: set.form.source,
    source_label: set.form.sourceLabel, source_url: set.form.sourceUrl, verified_at: null,
    presentation: set.form.presentation,
    competition_results: set.entries.map((row, index) => ({
      id: `${set.key}-${index}`, participant_name: row.participantName, participant_type: row.participantType,
      rank: row.rank, score: row.score, score_display: row.scoreDisplay, country_code: row.countryCode,
      award: row.award, result_status: row.resultStatus, presentation: "presentation" in row ? row.presentation : {},
    })),
  })) as unknown as CompetitionResultSet[];
  return <main className="mx-auto max-w-5xl px-4 py-8">
    <p className="mb-4 text-sm text-muted-foreground">LOCAL QA ONLY — source-backed unpublished drafts. Not the production application or an import.</p>
    <button className="border px-4 py-2" onClick={() => document.documentElement.classList.toggle("dark")}>QA theme</button>
    <label className="ml-4">QA edition<select className="border bg-background p-2" value={edition} onChange={(event) => setEdition(event.target.value)}>
      <option value="ioai-2025">IOAI 2025</option><option value="faio-2025">FAIO 2025</option>
      <option value="iaio-2026">Winter IAIO 2026</option><option value="empty-qa">Empty results (QA)</option>
    </select></label>
    <button className="mt-4 block border px-4 py-2" onClick={() => setBrokenMedia(!brokenMedia)}>QA broken media</button>
    <div className="mt-6"><CompetitionMedia logoUrl={brokenMedia ? "/missing-logo" : undefined} heroUrl={brokenMedia ? "/missing-hero" : undefined}/></div>
    <h1 className="mb-6 text-3xl font-bold">Competition Pages 2.0 component QA</h1>
    <CompetitionSections overview={<p>Overview fixture. Existing public routes are checked separately.</p>}
      results={<CompetitionLeaderboard resultSets={sets}/>}
      tasks={<CompetitionProblems problems={[]}/>}/>
  </main>;
}
createRoot(document.getElementById("qa-root")!).render(<Fixture/>);
