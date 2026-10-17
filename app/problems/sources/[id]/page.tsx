import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveAvailability, archiveSourceHref, buildPracticeArchive, getArchiveSource } from "@/lib/learning/unified-archive";
import styles from "@/components/training/catalog.module.css";

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = getArchiveSource((await params).id);
  return entry ? { title: entry.title, description: entry.details.slice(0,155), alternates: { canonical: `https://kaizpro.com${entry.href}` } } : { title: "Archive source not found" };
}
export default async function ArchiveSourcePage({ params }: Props) {
  const entry = getArchiveSource((await params).id); if (!entry) notFound();
  const children = buildPracticeArchive([]).filter(item => item.parentId === entry.id);
  const parent = entry.parentId ? getArchiveSource(entry.parentId) : undefined;
  return <div className={styles.page}>
    <nav className={styles.actions} aria-label="Archive navigation"><Link className={styles.action} href="/problems">← Back to archive</Link>{parent && <Link className={styles.action} href={archiveSourceHref(parent.id)}>Parent collection</Link>}</nav>
    <header className={`${styles.intro} mt-5`}><div><p>{entry.source} / {entry.type}</p><h1>{entry.title}</h1><p>{entry.competition} · {entry.difficultyLabel ?? entry.difficulty}</p></div></header>
    <section className="grid gap-6 border-y py-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" aria-label="Collection details">
      <div className="min-w-0"><h2 className="text-base font-semibold">About this source</h2><p className={styles.note}>{entry.details}</p><p className="text-sm leading-7">This is an external {entry.type}, not an individual scored KAIZ problem. No full task statement, scoring metric or difficulty is inferred from its title.</p><p className={styles.note}>{entry.tags.join(" · ")}</p></div>
      <dl className="min-w-0 space-y-3 text-sm"><div><dt className="text-xs text-muted-foreground">Source / organizer label</dt><dd>{entry.source}</dd></div><div><dt className="text-xs text-muted-foreground">Access status</dt><dd>{archiveAvailability[entry.availability]}</dd></div><div><dt className="text-xs text-muted-foreground">Account requirements</dt><dd>{entry.account}</dd></div></dl>
    </section>
    <section className="py-5" aria-label="Original source access"><h2 className="text-base font-semibold">Original materials</h2>{entry.originalHref ? <><p className={styles.note}>The source controls registration, datasets, statements and submissions. A public landing page does not guarantee access to its tasks.</p><a className={styles.action} href={entry.originalHref} target="_blank" rel="noopener noreferrer">Browse collection ↗</a></> : <p className={styles.note}>{entry.availability === "held" ? "Link held: the supplied destination is invitation-only and no public canonical URL has been verified. KAIZ does not publish invitation tokens or bypass access restrictions." : "Unavailable: the supplied competition URL returned no matching public competition page at the latest review. Its generic Kaggle error-page title is not the task name. No replacement has been verified."} This KAIZ detail page remains available.</p>}</section>
    {children.length > 0 && <section className="border-t py-5"><h2 className="text-base font-semibold">Catalogued source entries</h2><p className={styles.note}>These are source-specific competition pages, not imported individual KAIZ problems.</p><ul className="space-y-2">{children.map(child=><li key={child.id}><Link className={styles.action} href={child.href!}>{child.title} →</Link></li>)}</ul></section>}
    <section className="border-t py-5" aria-label="Collection practice limitation"><h2 className="text-base font-semibold">Individual practice tracking</h2><p className={styles.note}>Collections cannot be marked solved as a single task. Individual tasks from this source have not been catalogued here with verified scoring metadata. Use a published individual KAIZ problem to save private self-reported status and scores.</p><Link className={styles.action} href="/problems?type=KAIZ+task">Browse individual KAIZ tasks</Link></section>
    <details className="border-t py-4 text-xs leading-7 text-muted-foreground"><summary className={`${styles.action} cursor-pointer`}>View source details</summary><p className="mt-3">{entry.provenance}</p><p>Only metadata and short access notes are reproduced. Statements remain with their original publishers.</p></details>
  </div>;
}
