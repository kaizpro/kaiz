import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, ExternalLink, Flag, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { CompetitionSections } from "@/components/competition-sections";
import { CompetitionMedia } from "@/components/competition-media";
import { editionPresentationSchema } from "@/lib/validation/competition-presentation";
import { CompetitionLeaderboard } from "@/components/competition-leaderboard";
import { OfficialResultSource } from "@/components/official-result-source";
import { CompetitionDiscussions } from "@/components/competition-discussions";
import { CompetitionProblems } from "@/components/competition-problems";
import { PreparationLinks } from "@/components/learning/preparation-links";
import { getCurrentUser } from "@/lib/auth";
import { getCompetition, listCompetitionEditions } from "@/lib/data/competitions";
import { getPublishedCompetitionResults } from "@/lib/data/competition-results";
import { listDiscussionPosts } from "@/lib/data/discussions";
import { listCompetitionProblems } from "@/lib/data/problems";
import { formatCompetitionFormat, formatCompetitionLocation, formatDate, formatDateRange, isSameDate } from "@/lib/utils";
import product from "@/components/product/product.module.css";
import styles from "@/components/product/competitions.module.css";

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
  const presentation = editionPresentationSchema.safeParse(competition.presentation ?? {}).data ?? {};
  const singleDay = isSameDate(competition.start_date, competition.end_date);
  const [resultSets, discussionResult, user, problems, editions] = await Promise.all([
    getPublishedCompetitionResults(competition.id),
    listDiscussionPosts({ competitionId: competition.id, limit: 4 }),
    getCurrentUser(),
    listCompetitionProblems(competition.id),
    listCompetitionEditions(presentation.seriesSlug),
  ]);
  return <div className={product.page}>
    <header className={styles.detailHero}><CompetitionMedia logoUrl={presentation.logoUrl} heroUrl={presentation.heroUrl}/><div className="flex flex-wrap items-center gap-2">{presentation.year && <Badge>{presentation.year} edition</Badge>}<StatusBadge status={competition.status}/><Badge>{competition.category}</Badge><Badge>{formatCompetitionFormat(competition.format)}</Badge>{competition.verified && <Badge className="border-primary/30 text-primary"><CheckCircle2 className="mr-1 size-3"/>Verified</Badge>}</div><div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div><h1>{competition.title}</h1><p className="mt-3 text-base text-muted-foreground">{competition.organizer}</p></div><div className={product.actions}>{competition.registration_url && <a className={`${product.action} ${product.primary}`} href={competition.registration_url} target="_blank" rel="noreferrer">Register <ExternalLink className="size-4" aria-hidden="true"/></a>}{competition.official_website && <a className={product.action} href={competition.official_website} target="_blank" rel="noreferrer">Official site ↗</a>}</div></div></header>

    {editions.length > 1 && <nav aria-label="Competition editions" className="mt-5 flex flex-wrap gap-2">{editions.map((edition) => <Link key={edition.id} href={`/competitions/${edition.slug}`} aria-current={edition.id === competition.id ? "page" : undefined} className={`border px-3 py-2 text-sm ${edition.id === competition.id ? "border-primary/40 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{edition.presentation?.year ?? edition.title}</Link>)}</nav>}
    <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0">
        <CompetitionSections overview={<>
        <div className="grid border-y sm:grid-cols-2 xl:grid-cols-4"><div className="border-b py-4 sm:border-r sm:px-4 sm:first:pl-0 xl:border-b-0"><p className="micro-label text-muted-foreground">{singleDay ? "Competition date" : "Competition window"}</p><p className="tabular mt-2 font-mono text-sm font-bold">{formatDateRange(competition.start_date, competition.end_date)}</p></div><div className="border-b py-4 sm:px-4 xl:border-b-0 xl:border-r"><p className="micro-label text-muted-foreground">Format</p><p className="mt-2 text-sm font-semibold">{formatCompetitionFormat(competition.format)}</p></div><div className="border-b py-4 sm:border-b-0 sm:border-r sm:px-4"><p className="micro-label text-muted-foreground">Location</p><p className="mt-2 text-sm font-semibold">{formatCompetitionLocation(competition.city, competition.country)}</p></div><div className="py-4 sm:pl-4"><p className="micro-label text-muted-foreground">Participants</p><p className="tabular mt-2 font-mono text-sm font-bold">{competition.participant_count ?? 0} registered</p></div></div>
        <section className="py-6"><h2 className="text-xl font-semibold">About the competition</h2><p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-muted-foreground">{competition.description}</p></section>
        {competition.eligibility && <section className="border-t py-8"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary"/><h2 className="text-lg font-bold">Eligibility</h2></div><p className="mt-3 max-w-4xl leading-7 text-muted-foreground">{competition.eligibility}</p></section>}
        {!!competition.tags.length && <section className="border-t py-6"><p className="micro-label text-muted-foreground">Tags</p><div className="mt-3 flex flex-wrap gap-2">{competition.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></section>}
        {presentation.sourceNotes && <p className="border-t py-6 text-sm leading-6 text-muted-foreground">{presentation.sourceNotes}</p>}
        </>} results={<><CompetitionLeaderboard resultSets={resultSets} expectedStages={presentation.expectedStages}/><OfficialResultSource slug={competition.slug}/></>} tasks={<CompetitionProblems problems={problems} tasksUrl={presentation.tasksUrl}/>}/>
        <PreparationLinks category={competition.category}/>
        <CompetitionDiscussions competitionId={competition.id} posts={discussionResult.posts} signedIn={Boolean(user)}/>
        <details className={product.details}><summary>Participant directory</summary><UnavailablePanel title="Participant directory unavailable" description="Registration data will appear here."/></details>
      </div>

      <aside><div className={`${styles.panel} border bg-card px-5 lg:sticky lg:top-20`}><div className="flex items-center gap-2 border-b py-4"><Flag className="size-4 text-primary"/><h2 className="font-semibold">Dates &amp; details</h2></div><dl><DataPoint label="Registration deadline" value={competition.registration_deadline ? formatDate(competition.registration_deadline) : "See official site"}/><DataPoint label={singleDay ? "Date" : "Starts"} value={formatDate(competition.start_date)}/>{!singleDay && <DataPoint label="Ends" value={formatDate(competition.end_date)}/>}<DataPoint label="Format" value={formatCompetitionFormat(competition.format)}/><DataPoint label="Location" value={formatCompetitionLocation(competition.city, competition.country)}/><DataPoint label="Organizer" value={competition.organizer}/></dl><div className="flex items-center gap-2 border-t py-4 text-xs text-muted-foreground">{competition.verified ? <><CheckCircle2 className="size-4 text-success"/>Listing verified by KAIZ</> : <><CalendarDays className="size-4"/>Listing awaiting verification</>}</div></div></aside>
    </div>
  </div>;
}
