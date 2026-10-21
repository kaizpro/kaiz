import type { Metadata } from "next";
import Link from "next/link";
import styles from "./strategist.module.css";

export const metadata: Metadata = { title: "Personal AI Strategist", description: "Future planning tools for AI olympiads and preparation on KAIZ." };
export default function StrategistPage() {
  return <div className={styles.page}>
    <header><h1>Personal AI Strategist</h1><p>Choose your focus.</p></header>
    <div className={styles.choices}>
      <Link href="/strategist/olympiads"><h2>Strategy for Olympiads</h2><p>Plan your competition path.</p><span>Coming soon →</span></Link>
      <Link href="/strategist/preparation"><h2>Preparation Strategy</h2><p>Plan what to study and practise next.</p><span>Coming soon →</span></Link>
    </div>
    <Link className={styles.back} href="/roadmaps">Explore Roadmaps →</Link>
  </div>;
}
