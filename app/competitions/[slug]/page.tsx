import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, ExternalLink, Flag, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { CompetitionLeaderboard } from "@/components/competition-leaderboard";
import { CompetitionDiscussions } from "@/components/competition-discussions";
import { CompetitionProblems } from "@/components/competition-problems";
import { getCurrentUser } from "@/lib/auth";
import { getCompetition } from "@/lib/data/competitions";
import { getPublishedCompetitionResults } from "@/lib/data/competition-results";
import { listDiscussionPosts } from "@/lib/data/discussions";
import { listCompetitionProblems } from "@/lib/data/problems";
import { formatCompetitionFormat, formatCompetitionLocation, formatDate, formatDateRange, isSameDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const competition = await getCompetition(slug);
  if (!competition) return { title: "Competition not found" };
  const description = competition.description.slice(0, 155);
  return { title: competition.title, description, openGraph: { title: `${competition.title} · KAIZ`, description, type: "website", images: [] }, twitter: { title: `${competition.title} · KAIZ`, description, images: [] } };
}

function DataPoint({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="border-b py-4 last:border-b-0"><dt className="micro-label text-muted-foreground">{label}</dt><dd className="tabular mt-1.5 text-sm font-semibold">{value}</dd></div>;
}

export default async function CompetitionDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const competition = await getCompetition(slug); if (!competition) notFound();
  const singleDay = isSameDate(competition.start_date, competition.end_date);
  const [resultSets, discussionResult, user, problems] = await Promise.all([
    getPublishedCompetitionResults(competition.id),
    listDiscussionPosts({ competitionId: competition.id, limit: 4 }),
    getCurrentUser(),
    listCompetitionProblems(competition.id),
  ]);
  return <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
    <header className="border-b pb-7"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={competition.status}/><Badge>{competition.category}</Badge><Badge>{competition.format}</Badge>{competition.verified && <Badge className="border-primary/30 text-primary"><CheckCircle2 className="mr-1 size-3"/>Verified</Badge>}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><h1 className="max-w-5xl text-3xl font-black leading-tight tracking-[-.035em] sm:text-5xl">{competition.title}</h1><p className="mt-3 text-base text-muted-foreground">{competition.organizer}</p></div><div className="flex flex-wrap gap-2">{competition.registration_url && <Button asChild size="lg"><a href={competition.registration_url} target="_blank" rel="noreferrer">Register <ExternalLink className="size-4"/></a></Button>}{competition.official_website && <Button asChild size="lg" variant="outline"><a href={competition.official_website} target="_blank" rel="noreferrer">Official site</a></Button>}</div></div></header>

    <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <main className="min-w-0">
        <div className="grid border-y sm:grid-cols-2 xl:grid-cols-4"><div className="border-b py-4 sm:border-r sm:px-4 sm:first:pl-0 xl:border-b-0"><p className="micro-label text-muted-foreground">{singleDay ? "Competition date" : "Competition window"}</p><p className="tabular mt-2 font-mono text-sm font-bold">{formatDateRange(competition.start_date, competition.end_date)}</p></div><div className="border-b py-4 sm:px-4 xl:border-b-0 xl:border-r"><p className="micro-label text-muted-foreground">Format</p><p className="mt-2 text-sm font-semibold">{formatCompetitionFormat(competition.format)}</p></div><div className="border-b py-4 sm:border-b-0 sm:border-r sm:px-4"><p className="micro-label text-muted-foreground">Location</p><p className="mt-2 text-sm font-semibold">{formatCompetitionLocation(competition.city, competition.country)}</p></div><div className="py-4 sm:pl-4"><p className="micro-label text-muted-foreground">Participants</p><p className="tabular mt-2 font-mono text-sm font-bold">{competition.participant_count ?? 0} registered</p></div></div>
        <section className="py-8"><p className="micro-label text-primary">Brief</p><h2 className="mt-2 text-xl font-bold">About this competition</h2><p className="mt-4 max-w-4xl whitespace-pre-line text-base leading-8 text-muted-foreground">{competition.description}</p></section>
        {competition.eligibility && <section className="border-t py-8"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary"/><h2 className="text-lg font-bold">Eligibility</h2></div><p className="mt-3 max-w-4xl leading-7 text-muted-foreground">{competition.eligibility}</p></section>}
        {!!competition.tags.length && <section className="border-t py-6"><p className="micro-label text-muted-foreground">Tags</p><div className="mt-3 flex flex-wrap gap-2">{competition.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></section>}
        <CompetitionProblems problems={problems}/>
        <CompetitionLeaderboard resultSets={resultSets}/>
        <CompetitionDiscussions competitionId={competition.id} posts={discussionResult.posts} signedIn={Boolean(user)}/>
        <section className="border-t pt-8"><UnavailablePanel title="Participant directory unavailable" description="Registration data will appear here."/></section>
      </main>

      <aside><div className="border bg-card px-5 lg:sticky lg:top-20"><div className="flex items-center gap-2 border-b py-4"><Flag className="size-4 text-primary"/><h2 className="font-bold">Control panel</h2></div><dl><DataPoint label="Registration deadline" value={competition.registration_deadline ? formatDate(competition.registration_deadline) : "See official site"}/><DataPoint label={singleDay ? "Date" : "Starts"} value={formatDate(competition.start_date)}/>{!singleDay && <DataPoint label="Ends" value={formatDate(competition.end_date)}/>}<DataPoint label="Format" value={formatCompetitionFormat(competition.format)}/><DataPoint label="Location" value={formatCompetitionLocation(competition.city, competition.country)}/><DataPoint label="Organizer" value={competition.organizer}/></dl><div className="flex items-center gap-2 border-t py-4 text-xs text-muted-foreground">{competition.verified ? <><CheckCircle2 className="size-4 text-success"/>Listing verified by KAIZ</> : <><CalendarDays className="size-4"/>Listing awaiting verification</>}</div></div></aside>
    </div>
  </div>;
}
