import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { StrategyPaths } from "@/components/strategist/strategy-paths";
import styles from "../strategist.module.css";

type Props = { params: Promise<{ focus: string }> };
const titles: Record<string, string | undefined> = { olympiads: "Strategy for Olympiads", preparation: "Preparation Strategy" };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { focus } = await params;
  return { title: Object.hasOwn(titles, focus) ? titles[focus] : "Page not found" };
}
export default async function StrategistFocusPage({ params }: Props) {
  const { focus } = await params;
  if (!Object.hasOwn(titles, focus)) notFound();
  return <div className={styles.page}>
    <Link className={styles.back} href="/strategist"><ArrowLeft size={16} aria-hidden="true"/> Personal AI Strategist</Link>
    <header className={`${styles.hero} ${styles.destination}`}>
      <div><p className={styles.soon}>Coming soon</p><h1>{titles[focus]}</h1><p>{focus === "olympiads" ? "Competition-specific planning is on the way." : "Personalized study and practice planning is on the way."}</p>
      <Link className={styles.primary} href="/roadmaps">Explore Roadmaps <ArrowRight size={18} aria-hidden="true"/></Link></div>
      <StrategyPaths className={styles.motif}/>
    </header>
  </div>;
}
