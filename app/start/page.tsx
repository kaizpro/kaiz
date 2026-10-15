import type { Metadata } from "next";
import Link from "next/link";
import { JourneyChoices } from "@/components/learning/journey-choices";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Start Your AI Olympiad Journey", description: "Choose a beginner, intermediate or advanced preparation roadmap with official learning resources, practice and olympiad discovery.", alternates: { canonical: "https://kaizpro.com/roadmaps" } };

export default function StartPage() {
  return <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
    <header className="mb-7 max-w-3xl"><p className="micro-label text-primary">AI Olympiad Pathfinder</p><h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Start Your AI Olympiad Journey</h1><p className="mt-3 text-base leading-7 text-muted-foreground">Choose the starting point that fits what you know today. These are curated guides, not placement tests; you can switch paths at any time.</p></header>
    <h2 className="sr-only">Choose your starting point</h2><JourneyChoices/>
    <p className="mt-6 text-sm leading-6 text-muted-foreground">No account needed to explore. Milestones are self-checks, not tracked completion or ratings.</p>
    <nav className="mt-5 flex flex-wrap gap-3" aria-label="Explore learning"><Button asChild variant="outline"><Link href="/learn/topics">Explore AI topics</Link></Button><Button asChild variant="outline"><Link href="/learn">Open the Learning Tree</Link></Button></nav>
  </div>;
}
