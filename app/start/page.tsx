import type { Metadata } from "next";
import Link from "next/link";
import { RoadmapProgressList } from "@/components/learning/roadmap-progress-list";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import { PageHero } from "@/components/product/page-hero";
import product from "@/components/product/product.module.css";

export const metadata: Metadata = { title: "AI Olympiad Roadmaps", description: "Beginner, Intermediate and Advanced AI olympiad preparation, with courses, practice and saved progress.", alternates: { canonical: "https://kaizpro.com/roadmaps" } };

export default async function StartPage() {
  const state = await getOwnLearningState();
  return <div className={product.page}>
    <PageHero title="AI Olympiad Roadmaps" description="Choose your path. Build skills through courses and real practice." motif="learning"/>
    <h2 className="sr-only">Choose your starting point</h2>
    <RoadmapProgressList records={state.records} signedIn={Boolean(state.user)} error={state.error}/>
    <nav className={product.actions} aria-label="Explore learning"><Link href="/learn/topics" className={product.action}>AI Topics</Link><Link href="/learn" className={product.action}>Learning Tree</Link><Link href="/strategist" className={product.action}>Personal AI Strategist</Link></nav>
  </div>;
}
