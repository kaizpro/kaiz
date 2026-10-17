import Link from "next/link";
import { listCompetitions, type Competition } from "@/lib/data/competitions";

export async function JourneyCompetitions({ slugs }: { slugs: readonly string[] }) {
  let competitions: Competition[];
  try { competitions = (await listCompetitions()).filter(item => slugs.includes(item.slug)); }
  catch { return <p className="mt-3 text-sm leading-6 text-muted-foreground" role="status">Competition suggestions are temporarily unavailable. Your roadmap and official learning resources remain available.</p>; }
  return competitions.length ? <ul className="mt-3 divide-y border bg-card">{competitions.map(item => <li key={item.id}><Link href={`/competitions/${item.slug}`} className="block px-3 py-3 text-sm font-semibold hover:text-primary">{item.title}<span className="mt-1 block text-xs font-normal capitalize text-muted-foreground">{item.status}</span></Link></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No suggested editions are listed yet.</p>;
}
