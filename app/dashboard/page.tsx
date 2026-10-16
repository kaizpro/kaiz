import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import { learningSummary } from "@/lib/learning/course";
import { CourseProgress } from "@/components/learning/course-progress";
import { DashboardPractice } from "@/components/learning/dashboard-practice";
import styles from "@/components/training/catalog.module.css";
export const metadata:Metadata={title:"My learning",robots:{index:false,follow:false}};
export default async function DashboardPage() {
  const state=await getOwnLearningState(); if(!state.user)redirect("/auth/login?next=%2Fdashboard");
  const summary=learningSummary(state.error?[]:state.records);
  return <div className={styles.page}>
    <header className={styles.intro}><div><p>Private / your account only</p><h1>My learning</h1><p>{state.error ? "Saved progress unavailable" : `${summary.xp} Learning XP · explicit lesson self-completion, not a competition rating`}</p></div><Link className={styles.action} href="/roadmaps">Browse roadmaps</Link></header>
    {state.error ? <p role="alert">{state.error}</p> : <p className={styles.note}>{summary.active ? `Most recently saved roadmap: ${summary.active.path.title}` : "No saved learning yet. Choose a roadmap to begin."}</p>}
    {summary.paths.map(({path})=><section key={path.level}><h2 className={styles.sectionTitle}>{path.title}</h2><CourseProgress path={path} records={state.records} signedIn error={state.error}/></section>)}
    <DashboardPractice/>
    <nav className={styles.actions} aria-label="My next steps"><Link href="/competitions" className={styles.action}>Explore competitions</Link><Link href="/learn" className={styles.action}>Learning Tree</Link></nav>
  </div>;
}
