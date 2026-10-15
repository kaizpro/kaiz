import { getOfficialResultLink } from "@/lib/results/official-links";

export function OfficialResultSource({ slug }: { slug: string }) {
  const source = getOfficialResultLink(slug);
  return <aside className="mt-4 border bg-card p-4" aria-label="Official results source">
    <h2 className="text-base font-bold">Official results at the source</h2>
    {source ? <><p className="mt-2 text-sm leading-6 text-muted-foreground">{source.coverage} These external links do not mean a complete leaderboard has been imported into KAIZ.</p><a href={source.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-4">{source.label}<span className="sr-only"> (opens in a new tab)</span></a></> : <p className="mt-2 text-sm leading-6 text-muted-foreground">{slug === "neoai-2026" ? "An aggregate official final standings source has not been verified for this edition. Task, practice or late-submission leaderboards are not substitutes for final results." : "KAIZ has not curated an official results link for this edition yet. Check the organizer’s website; this does not mean results are unavailable."}</p>}
  </aside>;
}
