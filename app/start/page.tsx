import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StartingPoints } from "@/components/learning/ioai-overview";
import { ProgressUnavailable } from "@/components/learning/progress-unavailable";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import styles from "@/components/learning/ioai.module.css";

export const metadata: Metadata = { title: "Your AI Journey", description: "Choose your starting point on the KAIZ AI Olympiad learning path.", alternates: { canonical: "https://kaizpro.com/roadmaps" } };

export default async function StartPage() {
  const state = await getOwnLearningState();
  return <section className={styles.landing} aria-labelledby="journey-title">
    <header className={styles.landingHeader}><p className={styles.eyebrow}>KAIZ / THE ROAD TO AI OLYMPIADS</p><h1 id="journey-title">Small steps.<br/><span>Extraordinary possibilities.</span></h1><p>Choose your starting point. Make the path your own.</p></header>
    <StartingPoints records={state.records} ready={Boolean(state.user) && !state.error}/>
    {state.error && <ProgressUnavailable message={state.error}/>}
    <Link className={styles.treeLink} href="/learn">Just exploring? Open the Learning Tree<ArrowUpRight size={16} aria-hidden="true" /></Link>
  </section>;
}
