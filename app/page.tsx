import Link from "next/link";
import { ArrowRight, CalendarClock, ChevronRight, Radio, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import { CompetitionRow } from "@/components/competition-row";
import { EmptyState } from "@/components/empty-state";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth";
import { listCompetitions } from "@/lib/data/competitions";
import { listDiscussionPosts } from "@/lib/data/discussions";
import { formatCompetitionFormat, formatCompetitionLocation, formatDate, formatDateTime } from "@/lib/utils";

export default async function HomePage() {
  const configured = hasSupabaseEnv();
  const [user, competitions, discussionResult] = configured
    ? await Promise.all([getCurrentUser(), listCompetitions(), listDiscussionPosts({ limit: 4 })])
    : [null, [], { posts: [], count: 0 }];
  const active = competitions.filter((item) => item.status === "active");
  const upcoming = competitions.filter((item) => item.status === "upcoming");
  const next = active[0] ?? upcoming[0];

  return <div className="mx-auto max-w-[1440px] px-4 pb-14 sm:px-6 lg:px-8">
    {!user && <section className="signal-grid grid min-h-[20rem] items-center border-x border-b px-5 py-10 sm:min-h-[23rem] sm:px-8 lg:grid-cols-[1fr_22rem] lg:px-10">
      <div><p className="micro-label text-primary">Kazakhstan AI Competition Platform</p><p className="mt-5 text-5xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl">BUILD YOUR RANK.</p><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Kazakhstan&apos;s competitive AI community.</p><div className="mt-7 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/competitions">Explore competitions <ArrowRight className="size-4"/></Link></Button><Button asChild size="lg" variant="outline"><Link href="/auth/register">Create account</Link></Button></div></div>
      <div className="mt-10 hidden border-l pl-8 lg:block"><p className="micro-label text-muted-foreground">Platform status</p><div className="mt-5 space-y-4"><div className="flex items-center justify-between border-b pb-3 text-sm"><span className="text-muted-foreground">Competition directory</span><span className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-success"><span className="size-1.5 rounded-full bg-success"/>Ready</span></div><div className="flex items-center justify-between border-b pb-3 text-sm"><span className="text-muted-foreground">Verified rankings</span><span className="font-mono text-xs uppercase text-muted-foreground">Awaiting results</span></div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Community</span><span className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-success"><span className="size-1.5 rounded-full bg-success"/>Open</span></div></div></div>
    </section>}

    {user && <section className="flex flex-col justify-between gap-4 border-x border-b px-5 py-7 sm:flex-row sm:items-end sm:px-8"><div><p className="micro-label text-primary">Competition desk</p><h1 className="mt-2 text-2xl font-black tracking-tight">Welcome back.</h1><p className="mt-1 text-sm text-muted-foreground">Your next deadline and current standing, at a glance.</p></div><Button asChild><Link href="/competitions">Open directory <ArrowRight className="size-4"/></Link></Button></section>}

    <div className="grid gap-x-8 gap-y-12 py-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,.75fr)]">
      <div className="space-y-12">
        <section><SectionHeading eyebrow="Next competition" title={next ? "Your next opportunity" : "Competition desk"}/>{next ? <Link href={`/competitions/${next.slug}`} className="group grid gap-5 border border-border bg-card p-5 transition-colors hover:border-primary/50 sm:grid-cols-[1fr_auto] sm:p-6"><div><div className="flex items-center gap-2"><span className="micro-label text-primary">{next.status}</span>{next.verified && <span className="micro-label text-muted-foreground">· Verified</span>}</div><h2 className="mt-3 text-2xl font-black tracking-tight group-hover:text-primary">{next.title}</h2><p className="mt-2 text-sm text-muted-foreground">{next.organizer} · {next.category}</p><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"><span><span className="text-muted-foreground">Format:</span> {formatCompetitionFormat(next.format)}</span><span><span className="text-muted-foreground">Location:</span> {formatCompetitionLocation(next.city, next.country)}</span></div></div><div className="flex min-w-44 items-center justify-between border-t pt-4 sm:block sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"><div><p className="micro-label text-muted-foreground">Starts</p><p className="tabular mt-2 font-mono font-bold">{formatDate(next.start_date)}</p></div><ChevronRight className="size-5 text-muted-foreground sm:mt-8"/></div></Link> : <EmptyState title="No active or upcoming competitions" description="Completed competition records remain available in the directory."/>}</section>
        <section><SectionHeading eyebrow="Upcoming" title="Competition calendar" href="/competitions"/>{upcoming.length ? <div className="border border-border bg-card">{upcoming.slice(0,5).map((competition) => <CompetitionRow key={competition.id} competition={competition}/>)}</div> : <UnavailablePanel title="No upcoming competitions published" description="Verified listings will appear here as soon as an administrator publishes them."/>}</section>
        <section><SectionHeading eyebrow="Rankings" title="Kazakhstan standings" href="/leaderboard"/><div className="overflow-hidden border bg-card"><div className="grid grid-cols-[3.25rem_1fr_5.5rem] border-b bg-muted/45 px-4 py-2.5 sm:grid-cols-[3.25rem_1fr_8rem_6rem]"><span className="micro-label text-muted-foreground">Rank</span><span className="micro-label text-muted-foreground">Competitor</span><span className="micro-label hidden text-muted-foreground sm:block">Division</span><span className="micro-label text-right text-muted-foreground">Rating</span></div><div className="flex min-h-40 items-center justify-center px-6 py-10 text-center"><div><Trophy className="mx-auto size-5 text-gold"/><p className="mt-3 text-sm font-semibold">Standings open after the first rated event</p><p className="mt-1 text-sm text-muted-foreground">Only verified competition results will affect rank.</p></div></div></div></section>
      </div>
      <aside className="space-y-10">
        <section><SectionHeading eyebrow="Live" title="Active challenges"/><UnavailablePanel title="Challenge arena is not active" description="External challenge integrations arrive in Milestone 3."/></section>
        <section><SectionHeading eyebrow="Discuss" title="Latest threads" href="/discussions"/>{discussionResult.posts.length ? <div className="border bg-card">{discussionResult.posts.map((post) => <Link href={`/discussions/${post.id}`} key={post.id} className="block border-b px-4 py-4 last:border-0 hover:bg-muted/50"><p className="text-sm font-semibold leading-5">{post.title}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{post.reply_count} replies · {formatDateTime(post.created_at)}</p></Link>)}</div> : <UnavailablePanel title="No discussions yet" description="Sign in to start the first community thread."/>}</section>
        <section><SectionHeading eyebrow="Activity" title="Community signal"/><div className="border bg-card"><div className="flex items-center gap-3 border-b px-4 py-4"><Radio className="size-4 text-primary"/><div><p className="text-sm font-medium">Competition updates</p><p className="mt-0.5 text-xs text-muted-foreground">Live when the directory is connected</p></div></div><div className="flex items-center gap-3 px-4 py-4"><CalendarClock className="size-4 text-muted-foreground"/><div><p className="text-sm font-medium">Deadline tracking</p><p className="mt-0.5 text-xs text-muted-foreground">Based on verified listings</p></div></div></div></section>
      </aside>
    </div>
  </div>;
}
