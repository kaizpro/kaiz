import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getJourney, journeys } from "@/lib/learning/journeys";
import { readArea, areaTitles } from "@/lib/learning/ioai-navigation";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import { CourseProgress } from "@/components/learning/course-progress";
import { IoaiOverview, LearningOverview } from "@/components/learning/ioai-overview";
import { ProgressUnavailable } from "@/components/learning/progress-unavailable";
import styles from "@/components/learning/ioai.module.css";

type Props = { params: Promise<{ level: string }>; searchParams?: Promise<{ area?: string | string[]; view?: string | string[] }> };
export function generateStaticParams() { return journeys.map(path => ({ level: path.level })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = getJourney((await params).level);
  return path ? { title: `${path.title} AI Olympiad Roadmap`, description: path.summary, alternates: { canonical: `https://kaizpro.com/roadmaps/${path.level}` } } : { title: "Roadmap not found" };
}
export default async function JourneyPage({ params, searchParams }: Props) {
  const path = getJourney((await params).level);
  if (!path) notFound();
  const query = await searchParams;
  const area = readArea(query?.area);
  const map = query?.view === "map";
  const learning = await getOwnLearningState();
  return <section className={styles.page} aria-labelledby="path-title">
    <div className={styles.pathToolbar}><Link className={styles.backLink} href="/roadmaps"><ArrowLeft size={16} aria-hidden="true" />Starting points</Link><Link className={styles.backLink} href="/learn">Learning Tree<ArrowUpRight size={14} aria-hidden="true" /></Link></div>
    <header className={`${styles.pathHeader} ${styles.guidanceHeader}`}><div><p className={styles.eyebrow}>YOUR AI JOURNEY / {path.title}</p><h1 id="path-title">{map ? "Skill Atlas" : area ? areaTitles[area - 1] : "Let’s learn."}</h1></div>
      <nav className={styles.profileSwitch} aria-label="Starting profile">{journeys.map(profile => <Link key={profile.level} href={`/roadmaps/${profile.level}`} aria-current={profile.level === path.level ? "page" : undefined}>{profile.title}</Link>)}</nav>
    </header>
    {map || area ? <>{map && <Link className={styles.backLink} href={`/roadmaps/${path.level}`}><ArrowLeft size={16} aria-hidden="true"/>Back to courses</Link>}<IoaiOverview profile={path.level} area={area} course={!map} records={learning.records} canSave={Boolean(learning.user) && !learning.error}/></> : <LearningOverview profile={path.level} records={learning.records} canSave={Boolean(learning.user) && !learning.error}/>}
    {learning.error ? <ProgressUnavailable message={learning.error}/> : learning.user && <details className={styles.disclosure}><summary>Your saved progress</summary><CourseProgress path={path} records={learning.records} signedIn={true} error={null}/></details>}
  </section>;
}
