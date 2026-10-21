import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    <Link className={styles.back} href="/strategist">← Personal AI Strategist</Link>
    <header><h1>{titles[focus]}</h1><p>Coming soon</p></header>
    <p>For now, choose a Roadmap and track your learning.</p>
    <Link className={styles.back} href="/roadmaps">Explore Roadmaps →</Link>
  </div>;
}
