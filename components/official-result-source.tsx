import { getOfficialResultLink } from "@/lib/results/official-links";
import { getEditionGuide } from "@/lib/competitions/edition-guide";
import product from "./product/product.module.css";

export function OfficialResultSource({ slug }: { slug: string }) {
  const source = getOfficialResultLink(slug);
  const guide = getEditionGuide(slug);
  const links = guide ? guide.results : source ? [{ url: source.href, label: source.label, coverage: source.coverage }] : [];
  return <aside className="py-6" aria-label="Official results source">
    <h2 className="text-base font-bold">Official results at the source</h2>
    {links.length ? <ul className="mt-3 space-y-4">{links.map(link => <li key={link.url}><p className="text-sm leading-6 text-muted-foreground">{source?.href === link.url ? source.coverage : link.coverage}</p><a href={link.url} target="_blank" rel="noopener noreferrer" className={`${product.action} ${product.primary} mt-3`}>View Official Results ↗<span className="sr-only"> · {link.label} (opens in a new tab)</span></a></li>)}</ul> : <p className="mt-2 text-sm leading-6 text-muted-foreground">Official results link not verified yet; this does not mean results are unavailable. Task or practice leaderboards are not substitutes for final standings.</p>}
    <p className="mt-4 text-xs leading-5 text-muted-foreground">These external links do not mean a complete leaderboard has been imported into KAIZ. Only authorized, published result sets appear below.</p>
  </aside>;
}
