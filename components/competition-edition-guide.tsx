import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getEditionGuide, medalRates } from "@/lib/competitions/edition-guide";
import product from "./product/product.module.css";

export const taskAccessLabels = {
  public_materials: "Public materials · submission access may differ",
  account_required: "Publisher account required",
  invitation_required: "Invitation and account required",
  unavailable: "Official task source not verified",
};

export function CompetitionStatistics({ slug }: { slug: string }) {
  const guide = getEditionGuide(slug);
  if (!guide?.statistics.length) return null;
  return <section className="border-b py-6" aria-label="Verified competition statistics">
    <h2 className="text-lg font-semibold">At a glance</h2>
    {guide.statistics.map(stat => {
      const rates = medalRates(stat);
      const cells = [
        { label: stat.unit[0].toUpperCase() + stat.unit.slice(1), value: stat.participants, rate: undefined },
        { label: "Countries", value: stat.countries, rate: undefined },
        { label: "Gold", value: stat.gold, rate: rates.gold },
        { label: "Silver", value: stat.silver, rate: rates.silver },
        { label: "Bronze", value: stat.bronze, rate: rates.bronze },
        { label: "Honorable mentions", value: stat.honorableMentions, rate: undefined },
      ].filter(cell => cell.value !== undefined);
      return <div key={stat.stage} className="mt-5">
        <h3 className="text-sm font-semibold">{stat.stage}</h3>
        <dl className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3">{cells.map(cell => <div key={cell.label} className="min-w-0 rounded-md bg-muted/40 p-3"><dt className="text-xs text-muted-foreground">{cell.label}</dt><dd className="mt-1 font-mono text-xl font-semibold tabular-nums">{cell.value}{cell.rate !== undefined && <span className="ml-2 inline-block text-xs font-normal text-muted-foreground">{cell.rate}%</span>}</dd></div>)}</dl>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{stat.population}. {rates.total !== undefined && <>Medal rate: {rates.total}% of these {stat.participants} {stat.unit}; honorable mentions excluded. </>}<a href={stat.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Official source<span className="sr-only"> (opens in a new tab)</span></a> · Checked {stat.checkedAt}.</p>
      </div>;
    })}
  </section>;
}

export function CompetitionTaskSources({ slug }: { slug: string }) {
  const guide = getEditionGuide(slug);
  if (!guide) return null;
  return <section className="py-6" aria-label="Official task sources">
    <h2 className="text-xl font-semibold">Official tasks</h2>
    <ul className={`${product.list} mt-4`}>{guide.tasks.map(task => <li key={task.id} className="min-w-0 rounded-md border p-4">
      <p className="text-xs text-muted-foreground">{task.stage}{task.day !== null && ` · Day ${task.day}`} · {task.kind === "collection" ? "Task collection" : "Individual task"}</p>
      <h3 className="mt-2 font-semibold">{task.title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{taskAccessLabels[task.access]}</p>
      {task.url && (task.kind === "task" ? <Link className={`${product.action} mt-4`} href={`/competitions/${slug}/tasks/${task.id}`}>Open task →</Link> : <a className={`${product.action} mt-4`} href={task.url} target="_blank" rel="noopener noreferrer">Open Task Collection <ExternalLink className="size-4" aria-hidden="true"/><span className="sr-only"> (opens in a new tab)</span></a>)}
      <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Source &amp; access notes</summary><p className="mt-2 leading-5">Materials remain with the publisher. A public page does not guarantee dataset or submission access. KAIZ does not verify external solutions.</p><a href={task.provenance} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline underline-offset-4">Organizer attribution<span className="sr-only"> (opens in a new tab)</span></a></details>
    </li>)}</ul>
  </section>;
}
