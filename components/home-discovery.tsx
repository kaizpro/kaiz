import Link from "next/link";
import { CompetitionRow } from "@/components/competition-row";
import { SectionHeading } from "@/components/section-heading";
import { EmptyState } from "@/components/empty-state";
import { listCompetitions } from "@/lib/data/competitions";
import { listDiscussionPosts } from "@/lib/data/discussions";
import { formatDateTime } from "@/lib/utils";

export async function HomeCompetitions() {
  let competitions;
  try { competitions = await listCompetitions(); }
  catch { return <section className="min-w-0"><SectionHeading eyebrow="Discover" title="Olympiad editions" href="/competitions"/><EmptyState title="Competition directory temporarily unavailable" description="Your learning paths remain available. Try the directory again shortly."/></section>; }
  const selected = [...competitions].sort((a, b) => Number(b.country === "Kazakhstan") - Number(a.country === "Kazakhstan") || b.start_date.localeCompare(a.start_date)).slice(0, 5);
  return <section className="min-w-0"><SectionHeading eyebrow="Discover / Kazakhstan first" title="Olympiad editions" href="/competitions"/><p className="mb-4 text-sm leading-6 text-muted-foreground">Explore formats, eligibility and official sources. Completed editions are useful preparation references, not open registrations.</p>{selected.length ? <div className="border bg-card">{selected.map(item => <CompetitionRow key={item.id} competition={item}/>)}</div> : <EmptyState title="No competition editions listed yet" description="Organizer-sourced listings will appear in the directory once reviewed."/>}</section>;
}

export async function HomeDiscussions() {
  let result;
  try { result = await listDiscussionPosts({ limit: 4 }); }
  catch { return <section className="min-w-0"><SectionHeading eyebrow="Community" title="Latest discussions" href="/discussions"/><EmptyState title="Discussions temporarily unavailable" description="Continue with your roadmap and try the community again shortly."/></section>; }
  return <section className="min-w-0"><SectionHeading eyebrow="Community" title="Latest discussions" href="/discussions"/>{result.posts.length ? <div className="border bg-card">{result.posts.map(post => <Link key={post.id} href={`/discussions/${post.id}`} className="block border-b px-4 py-4 last:border-0 hover:bg-muted/50"><p className="text-sm font-semibold leading-6">{post.title}</p><p className="mt-2 text-xs text-muted-foreground">{post.reply_count} replies · {formatDateTime(post.created_at)}</p></Link>)}</div> : <EmptyState title="No discussions yet" description="Bring a question or share a resource. Sign in when you are ready to post."/>}</section>;
}
