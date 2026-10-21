import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveAvailability, archiveSourceHref, buildPracticeArchive, getArchiveSource } from "@/lib/learning/unified-archive";
import styles from "@/components/training/catalog.module.css";
import product from "@/components/product/product.module.css";
import practice from "@/components/product/practice.module.css";

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = getArchiveSource((await params).id);
  return entry ? { title: entry.title, description: entry.details.slice(0,155), alternates: { canonical: `https://kaizpro.com${entry.href}` } } : { title: "Archive source not found" };
}
export default async function ArchiveSourcePage({ params }: Props) {
  const entry = getArchiveSource((await params).id); if (!entry) notFound();
  const children = buildPracticeArchive([]).filter(item => item.parentId === entry.id);
  const parent = entry.parentId ? getArchiveSource(entry.parentId) : undefined;
  return <div className={product.page}>
    <nav className={product.actions} aria-label="Archive navigation"><Link className={product.action} href="/problems">← Back to archive</Link>{parent && <Link className={product.action} href={archiveSourceHref(parent.id)}>Parent collection</Link>}</nav>
    <header className={practice.detailHero}><div className={product.meta}><span>{entry.source}</span><span className={product.pill}>{entry.type}</span></div><h1 className="mt-4">{entry.title}</h1><p className="mt-4 text-sm text-muted-foreground">{entry.competition} · {entry.difficultyLabel ?? entry.difficulty}</p>
      <section className="mt-5" aria-label="Original source access">{entry.originalHref ? <><a className={`${product.action} ${product.primary}`} href={entry.originalHref} target="_blank" rel="noopener noreferrer">Solve on Source ↗</a><p className={styles.note}>External collection · {archiveAvailability[entry.availability]}. Publisher account or registration requirements may apply.</p></> : <p className={practice.collectionNote}>{entry.availability === "held" ? "Invitation link held. No public canonical destination has been verified." : "Original source unavailable. No replacement has been verified."} This KAIZ detail page remains available.</p>}</section>
    </header>
    <dl className={practice.sourceMeta} aria-label="Collection details"><div><dt>Source</dt><dd>{entry.source}</dd></div><div><dt>Access</dt><dd>{archiveAvailability[entry.availability]}</dd></div><div><dt>Topics</dt><dd>{entry.tags.join(" · ")}</dd></div></dl>
    {children.length > 0 && <section className="py-5"><h2 className="mb-4 text-lg font-semibold">Catalogued source entries</h2><ul className={product.list}>{children.map(child=><li key={child.id}><Link className={product.card} href={child.href!}><span className={product.cardTitle}>{child.title}</span><span className={product.direction}>View details →</span></Link></li>)}</ul></section>}
    <section className={practice.collectionNote} aria-label="Collection practice limitation"><h2 className="font-semibold">Collection, not an individual problem</h2><p className="mt-2">Collections cannot be marked solved as a single task. Private status and scores are available on published individual KAIZ tasks.</p><Link className={`${product.action} mt-4`} href="/problems?type=KAIZ+task">Browse individual KAIZ tasks</Link></section>
    <details className={product.details}><summary>View source details</summary><p>{entry.details}</p><p>{entry.account}</p><p>{entry.provenance}</p><p>This is an external {entry.type}, not an individual scored KAIZ problem. No statement, metric or difficulty is inferred from its title. Only metadata and short access notes are reproduced; statements remain with their publishers.</p><p>The source controls registration, datasets, statements and submissions. A public landing page does not guarantee task access.</p>{!entry.originalHref && <p>KAIZ does not publish invitation tokens or bypass access restrictions. No replacement destination is invented.</p>}</details>
  </div>;
}
