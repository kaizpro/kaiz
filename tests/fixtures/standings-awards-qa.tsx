// Local component fixture only: synthetic participants, no Auth or database.
import { createRoot } from "react-dom/client";
import { CompetitionStandings, type StandingsRow } from "@/components/competition-standings";

const awards = ["Honourable Mention", "GAITE Honorable Mention", "Gold + 1st Place 🏆", "First Level", "Level 3 Award", "1st Place Trophy", null];
const columns = Array.from({ length: 6 }, (_, i) => ({ key: `task_${i}`, label: `Original task ${i + 1}` }));
const rows: StandingsRow[] = Array.from({ length: 60 }, (_, i) => ({
  id: `fixture-${i}`, rank: i < 2 ? 1 : i + 1, name: `Fixture participant ${i + 1}`,
  team: false, country: "KZ", detail: "", status: "ranked",
  total: "123.4500", scores: Object.fromEntries(columns.map(c => [c.key, "20.5750"])),
  award: awards[i % awards.length],
}));

createRoot(document.getElementById("qa-root")!).render(
  <main className="mx-auto max-w-5xl p-4">
    <h1 className="mb-4 text-xl">Isolated standings layout QA — synthetic participants</h1>
    <CompetitionStandings name="Award layout fixture" columns={columns} rows={rows}/>
  </main>,
);
