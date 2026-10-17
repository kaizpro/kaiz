import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import { learningSummary } from "@/lib/learning/course";
import { RoadmapProgressList } from "@/components/learning/roadmap-progress-list";
import courseStyles from "@/components/learning/course.module.css";
import { DashboardPractice } from "@/components/learning/dashboard-practice";
import styles from "@/components/training/catalog.module.css";
export const metadata:Metadata={title:"My learning",robots:{index:false,follow:false}};
export default async function DashboardPage() {
  const state=await getOwnLearningState(); if(!state.user)redirect("/auth/login?next=%2Fdashboard");
  const summary=learningSummary(state.error?[]:state.records);
  return <div className={styles.page}>
    <header className={styles.intro}><div><p>Private / your account only</p><h1>My learning</h1><p>Your curriculum, saved completions and personal practice.</p></div><Link className={styles.action} href="/roadmaps">Browse roadmaps</Link></header>
    {!state.error && <section className={courseStyles.summary} aria-label="Overall learning progress"><dl className={courseStyles.totals}><div><dt>Lessons completed</dt><dd>{summary.count} / {summary.total}</dd></div><div><dt>Overall completion</dt><dd>{summary.percent}%</dd></div><div><dt>Learning XP</dt><dd>{summary.xp} Learning XP</dd></div><div><dt>Active roadmaps</dt><dd>{summary.activeCount}</dd></div></dl><progress className={courseStyles.bar} max={summary.total} value={summary.count} aria-label="Overall learning completion"/><p className="text-muted-foreground">10 XP per completed roadmap lesson. A topic in two modules is two curriculum lessons, not two unique topics. Repeated completion earns no additional XP.</p><p>{summary.count ? "Choose Continue below for the next incomplete lesson." : "No saved completions yet. Choose Start to open your first lesson."}</p></section>}
    <h2 className={styles.sectionTitle}>Your roadmaps</h2><RoadmapProgressList records={state.records} signedIn error={state.error}/>
    <DashboardPractice/>
    <nav className={styles.actions} aria-label="My next steps"><Link href="/competitions" className={styles.action}>Explore competitions</Link><Link href="/learn" className={styles.action}>Learning Tree</Link></nav>
  </div>;
}
