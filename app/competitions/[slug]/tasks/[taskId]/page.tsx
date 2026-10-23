import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompetition } from "@/lib/data/competitions";
import { getEditionGuide } from "@/lib/competitions/edition-guide";
import { taskAccessLabels } from "@/components/competition-edition-guide";
import product from "@/components/product/product.module.css";

type Props = { params: Promise<{ slug: string; taskId: string }> };
function findTask(slug: string, taskId: string) {
  const task = getEditionGuide(slug)?.tasks.find(t => t.id === taskId);
  return task?.kind === "task" && task.url ? task : undefined;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, taskId } = await params;
  const task = findTask(slug, taskId);
  return { title: task ? `${task.title} · ${slug}` : "Task not found" };
}
export default async function CompetitionTaskPage({ params }: Props) {
  const { slug, taskId } = await params;
  const task = findTask(slug, taskId);
  if (!task) notFound();
  const competition = await getCompetition(slug);
  if (!competition) notFound();
  return <div className={product.page}>
    <Link className={product.action} href={`/competitions/${slug}`}>← {competition.title}</Link>
    <header className="py-8"><p className="text-sm text-muted-foreground">{competition.title} · {task.stage}{task.day !== null && ` · Day ${task.day}`}</p><h1 className="mt-3 text-3xl font-semibold">{task.title}</h1><p className="mt-4 text-sm leading-7 text-muted-foreground">An organizer-linked individual task. The original publisher hosts the statement, datasets, rules and submissions.</p></header>
    <section aria-label="Task access"><p className="mb-4 text-sm text-muted-foreground">{taskAccessLabels[task.access]}</p><a className={`${product.action} ${product.primary}`} href={task.url!} target="_blank" rel="noopener noreferrer">Solve on Source ↗<span className="sr-only"> (opens in a new tab)</span></a><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Access and submission availability are controlled by the publisher. KAIZ does not verify external solutions. Personal tracking is not available for this source in this release.</p><a className="mt-4 inline-block text-sm underline underline-offset-4" href={task.provenance} target="_blank" rel="noopener noreferrer">Organizer attribution<span className="sr-only"> (opens in a new tab)</span></a></section>
  </div>;
}
