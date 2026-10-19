import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {archiveAvailability,archiveSourceHref,buildPracticeArchive,getArchiveSource} from "@/lib/learning/unified-archive";
import {getOwnSourcePractice} from "@/lib/data/source-practice";
import {SourcePractice} from "@/components/learning/source-practice";
import styles from "@/components/training/catalog.module.css";
import practiceStyles from "@/components/learning/personal-practice.module.css";
type Props={params:Promise<{id:string}>;searchParams:Promise<{practicePage?:string;record?:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const entry=getArchiveSource((await params).id);return entry?{title:entry.title,description:entry.details.slice(0,155),alternates:{canonical:`https://kaizpro.com${entry.href}`}}:{title:"Archive source not found"};}
export default async function ArchiveSourcePage({params,searchParams}:Props){
 const entry=getArchiveSource((await params).id);if(!entry)notFound();const query=await searchParams;
 const page=/^\d{1,5}$/.test(query.practicePage??"")?Math.max(1,Math.min(10000,Number(query.practicePage))):1;
 const state=await getOwnSourcePractice(entry.id,page);
 const children=buildPracticeArchive([]).filter(item=>item.parentId===entry.id),parent=entry.parentId?getArchiveSource(entry.parentId):undefined;
 return <div className={`${styles.page} [overflow-wrap:anywhere]`}>
  <nav className={styles.actions} aria-label="Archive navigation"><Link className={styles.action} href="/problems">← Back to archive</Link>{parent&&<Link className={styles.action} href={archiveSourceHref(parent.id)}>Parent collection</Link>}</nav>
  <header className="py-6"><p className="text-xs text-muted-foreground">{entry.source} · {entry.tags.join(" · ")} · {entry.type}</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{entry.title}</h1><p className="mt-2 text-sm text-muted-foreground">{entry.competition} · {entry.difficultyLabel??entry.difficulty}</p>
   <div className="mt-5 flex flex-wrap items-center gap-3">{entry.originalHref?<a className={`${styles.action} ${styles.primary} ${practiceStyles.solve}`} href={entry.originalHref} target="_blank" rel="noopener noreferrer" aria-label={`Solve: ${entry.title} (new tab)`}>SOLVE ↗</a>:<a className={`${styles.action} ${styles.primary} ${practiceStyles.solve}`} href="?record=1#source-practice">Record practice</a>}<span className="text-xs text-muted-foreground">{entry.originalHref?archiveAvailability[entry.availability]:entry.availability==="held"?"Invitation link held; public destination unverified.":"Original source unavailable; private recording remains available."}</span></div>
  </header>
  <SourcePractice catalogId={entry.id} signedIn={state.signedIn} error={state.error} summary={state.items[0]} attempts={state.attempts} count={state.attemptCount} page={page} initiallyOpen={query.record==="1"}/>
  {!!children.length&&<section className="py-5"><h2 className="text-sm font-semibold">Related catalogued contests</h2><div className="mt-3 flex flex-wrap gap-2">{children.map(child=><Link key={child.id} className={styles.action} href={child.href!}>{child.title} →</Link>)}</div></section>}
  <details className="py-5 text-sm leading-7 text-muted-foreground"><summary className={`${styles.action} cursor-pointer`}>Source details</summary><div className="mt-4 space-y-3"><p>{entry.details}</p><p>{entry.account}</p><p>{entry.provenance}</p><p>Source type: {entry.type}. Private collection participation is not a single judge-verified solved problem. Optional individual task title/link records are private self-reports, not official public KAIZ statements.</p><p>The source controls registration, datasets, task statements and submissions. A reachable landing page does not guarantee access to its tasks. Only metadata and short notes are reproduced; statements remain with their publishers.</p>{!entry.originalHref&&<p>{entry.availability==="held"?"KAIZ does not publish invitation tokens or bypass access restrictions. No public canonical destination has been verified.":"The supplied URL returned no matching public competition page at the latest review. No replacement is invented."}</p>}</div></details>
 </div>;
}
