import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Route, Trophy } from "lucide-react";
import { StrategyPaths } from "@/components/strategist/strategy-paths";
import styles from "./strategist.module.css";

export const metadata: Metadata = { title: "Personal AI Strategist", description: "Future planning tools for AI olympiads and preparation on KAIZ." };
export default function StrategistPage() {
  return <div className={styles.page}>
    <header className={styles.hero}>
      <div><h1>Personal AI <span>Strategist</span></h1><p>Plan your olympiad path and what to learn next.</p></div>
      <StrategyPaths className={styles.motif}/>
    </header>
    <nav className={styles.choices} aria-label="Strategy options">
      <Link href="/strategist/olympiads" className={styles.option}>
        <div className={styles.optionTop}><Trophy size={24} aria-hidden="true"/><span className={styles.availability}>Coming soon</span></div>
        <h2>Strategy for Olympiads</h2><p>A focused plan for your next competition.</p><ArrowRight className={styles.arrow} size={22} aria-hidden="true"/>
      </Link>
      <Link href="/strategist/preparation" className={styles.option}>
        <div className={styles.optionTop}><Route size={24} aria-hidden="true"/><span className={styles.availability}>Coming soon</span></div>
        <h2>Preparation Strategy</h2><p>A study and practice path shaped around your goals.</p><ArrowRight className={styles.arrow} size={22} aria-hidden="true"/>
      </Link>
    </nav>
    <Link className={styles.back} href="/roadmaps">Explore Roadmaps <ArrowRight size={16} aria-hidden="true"/></Link>
  </div>;
}
