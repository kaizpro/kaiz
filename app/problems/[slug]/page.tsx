import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, BarChart3, ExternalLink, Gauge, Medal, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getCurrentUser } from "@/lib/auth";
import { ProblemPractice } from "@/components/problem-practice";
import { PreparationLinks } from "@/components/learning/preparation-links";
import { listOwnPracticeAttempts } from "@/lib/data/practice";
import { getBestPracticePerformance, getProblem, listOfficialProblemPerformances, type Problem } from "@/lib/data/problems";
import { getOwnProblemProgress } from "@/lib/data/problem-progress";
import { PersonalProblemStatus } from "@/components/learning/personal-problem-status";
import { practiceScoreBounds } from "@/lib/validation/problem";
import { publicExternalUrl } from "@/lib/learning/unified-archive";
import { hasStatementPermission } from "@/lib/learning/problem-detail";
import catalog from "@/components/training/catalog.module.css";
import product from "@/components/product/product.module.css";
import practice from "@/components/product/practice.module.css";

function formatNumber(value: number | null) {
  return value === null ? "—" : new Intl.NumberFormat("en", { maximumFractionDigits: 6 }).format(value);
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function difficultyLabel(problem: Problem) {
  if (problem.difficulty_status === "rated" && problem.difficulty_rating !== null) return `${Math.round(problem.difficulty_rating)} rated`;
  if (problem.difficulty_status === "provisional" && problem.difficulty_rating !== null) return `${Math.round(problem.difficulty_rating)} provisional`;
  return problem.difficulty_status;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) return { title: "Problem not found" };
  const description = problem.summary ?? `${problem.title} in the KAIZ problem archive.`;
  return { title: problem.title, description: description.slice(0, 155) };
}

function DataPoint({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="border-b py-4 last:border-b-0"><dt className="micro-label text-muted-foreground">{label}</dt><dd className="mt-1.5 text-sm font-semibold">{value}</dd></div>;
}

export default async function ProblemDetailPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ practicePage?: string }>;
}) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();
  const user = await getCurrentUser();
  const { practicePage: requested } = await searchParams;
  const practicePage = /^\d{1,5}$/.test(requested ?? "") ? Math.max(1, Math.min(10000, Number(requested))) : 1;
  const [officialPerformances, bestPractice, history, personal] = await Promise.all([
    listOfficialProblemPerformances(problem.id),
    user ? getBestPracticePerformance(problem.id, user.id, problem.metric_direction) : Promise.resolve(null),
    user ? listOwnPracticeAttempts(problem.id, practicePage) : Promise.resolve({ attempts: [], count: 0 }),
    user ? getOwnProblemProgress([problem.id]) : Promise.resolve(null),
  ]);
  const DirectionIcon = problem.metric_direction === "higher_is_better" ? ArrowUp : ArrowDown;
  const original = publicExternalUrl(problem.statement_url) || publicExternalUrl(problem.source_url);
  return <div className={product.page}>
    <nav className="mb-5" aria-label="Archive navigation"><Link className={catalog.action} href="/problems">← Back to archive</Link></nav>
    <header className={practice.detailHero}><div className="flex flex-wrap items-center gap-2"><Badge>{problem.category}</Badge><Badge>{difficultyLabel(problem)}</Badge><Badge>Individual task</Badge>{problem.competition && <Badge className="border-primary/30 text-primary">Competition problem</Badge>}</div><div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div>{problem.problem_code && <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary">Problem {problem.problem_code}</p>}<h1>{problem.title}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{problem.summary ?? "Consult the original source for task requirements."}</p></div><div className={product.actions}>{original && <a className={`${product.action} ${product.primary}`} href={original} target="_blank" rel="noopener noreferrer">Solve on Source <ExternalLink className="size-4" aria-hidden="true"/></a>}<a className={product.action} href="#practice">Record practice ↓</a></div></div><p className="mt-3 text-xs leading-6 text-muted-foreground">Source access: {original ? "Publisher account or registration requirements may apply. Current task access is not guaranteed." : "No usable original task URL is catalogued. Private tracking remains available."}</p></header>

    <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0 space-y-8">
        {personal && (personal.error ? <p role="alert" className="py-4 text-sm text-muted-foreground">{personal.error}</p> : <PersonalProblemStatus problemId={problem.id} item={personal.items[0]}/>)}
        <section className="grid border-y sm:grid-cols-3"><div className="border-b py-4 sm:border-b-0 sm:border-r sm:pr-4"><p className="micro-label text-muted-foreground">Metric</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold"><DirectionIcon className="size-4 text-primary"/>{problem.metric_name}</p><p className="mt-1 text-xs text-muted-foreground">{problem.metric_direction === "higher_is_better" ? "Higher is better" : "Lower is better"}</p></div><div className="border-b py-4 sm:border-b-0 sm:border-r sm:px-4"><p className="micro-label text-muted-foreground">Reference score</p><p className="tabular mt-2 font-mono text-sm font-bold">{formatNumber(problem.reference_score)}</p><p className="mt-1 text-xs text-muted-foreground">Source-defined, not a rating</p></div><div className="py-4 sm:pl-4"><p className="micro-label text-muted-foreground">Difficulty state</p><p className="mt-2 text-sm font-semibold capitalize">{difficultyLabel(problem)}</p><p className="mt-1 text-xs text-muted-foreground">No competitive rating formula applied</p></div></section>

        {problem.statement_markdown && hasStatementPermission(problem.source_provenance) ? <section><h2 className="text-lg font-semibold">Problem brief</h2><div className="mt-3 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{problem.statement_markdown}</div></section> : <details className={product.details}><summary>Original statement &amp; access</summary><UnavailablePanel title="Original statement" description={original ? "Use Solve on Source for the authoritative statement. Full reproduction permission is not recorded here." : "The original statement is not currently linked. No task text or scoring rules are invented here."}/></details>}

        <section className="border-t pt-8"><div className="flex items-center gap-2"><BarChart3 className="size-5 text-primary"/><h2 className="text-lg font-bold">Performance statistics</h2></div>{problem.statistics ? <><div className="mt-4 grid border sm:grid-cols-4"><div className="border-b p-4 sm:border-b-0 sm:border-r"><p className="micro-label text-muted-foreground">Attempts</p><p className="tabular mt-2 font-mono text-xl font-bold">{problem.statistics.sample_size}</p></div><div className="border-b p-4 sm:border-b-0 sm:border-r"><p className="micro-label text-muted-foreground">Median</p><p className="tabular mt-2 font-mono text-xl font-bold">{formatPercent(problem.statistics.median_normalized_performance)}</p></div><div className="border-b p-4 sm:border-b-0 sm:border-r"><p className="micro-label text-muted-foreground">75th percentile</p><p className="tabular mt-2 font-mono text-xl font-bold">{formatPercent(problem.statistics.percentile_75)}</p></div><div className="p-4"><p className="micro-label text-muted-foreground">90th percentile</p><p className="tabular mt-2 font-mono text-xl font-bold">{formatPercent(problem.statistics.percentile_90)}</p></div></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Normalized performance is direction-adjusted so higher always means better. Snapshot {problem.statistics.calculation_version}; {problem.statistics.status}.</p></> : <UnavailablePanel className="mt-4" title="Statistics not rated yet" description="A population snapshot will appear after enough validated performances are available."/>}</section>

        <section className="border-t pt-8"><div className="flex items-center gap-2"><Medal className="size-5 text-primary"/><h2 className="text-lg font-bold">Official performances</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Official contest evidence is shown separately from practice and upsolving.</p>{officialPerformances.length ? <div className="mt-4 border bg-card">{officialPerformances.map((performance) => <div key={performance.id} className="grid grid-cols-[minmax(0,1fr)_7rem_7rem] items-center border-b px-4 py-3 text-sm last:border-b-0"><div className="min-w-0"><p className="truncate font-semibold">{performance.user?.display_name ?? "KAIZ participant"}</p>{performance.user?.username && <Link className="text-xs text-muted-foreground hover:text-primary" href={`/u/${performance.user.username}`}>@{performance.user.username}</Link>}</div><span className="tabular text-right font-mono">{formatNumber(performance.raw_score)}</span><span className="tabular text-right font-mono text-primary">{formatPercent(performance.normalized_performance)}</span></div>)}</div> : <UnavailablePanel className="mt-4" title="No official performances published" description="Official per-problem records will appear independently of practice attempts."/>}</section>

        {user ? <ProblemPractice problemId={problem.id} slug={problem.slug} metric={problem.metric_name} direction={problem.metric_direction} limits={practiceScoreBounds(problem.metric_name,problem.source_provenance)} best={bestPractice} attempts={history.attempts} count={history.count} page={practicePage}/> : <section id="practice" className="border-t pt-8"><h2 className="text-lg font-bold">Practice / upsolving</h2><UnavailablePanel className="mt-4" title="Sign in to record practice" description="Self-reported practice records are private and separate from official evidence."/><Button asChild className="mt-4"><Link href={`/auth/login?next=${encodeURIComponent(`/problems/${problem.slug}`)}`}>Sign in</Link></Button></section>}
        <PreparationLinks category={problem.category}/>
      </div>

      <aside><div className="border bg-card px-5 lg:sticky lg:top-20"><div className="flex items-center gap-2 border-b py-4"><Gauge className="size-4 text-primary"/><h2 className="font-bold">Problem data</h2></div><dl><DataPoint label="Competition" value={problem.competition ? <Link className="hover:text-primary" href={`/competitions/${problem.competition.slug}`}>{problem.competition.title}</Link> : "Independent archive"}/><DataPoint label="Category" value={problem.category}/><DataPoint label="Metric direction" value={problem.metric_direction === "higher_is_better" ? "Higher is better" : "Lower is better"}/><DataPoint label="Source" value={problem.source_label ?? problem.source_provider}/><DataPoint label="Source ID" value={problem.source_external_id ?? "Not supplied"}/></dl>{problem.tags.length > 0 && <div className="border-t py-4"><p className="micro-label text-muted-foreground">Tags</p><div className="mt-3 flex flex-wrap gap-2">{problem.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></div>}<div className="flex items-start gap-2 border-t py-4 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success"/>Official and practice records remain separate.</div></div></aside>
    </div>
  </div>;
}
