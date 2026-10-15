import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, BookOpen, FileCode2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JourneyChoices } from "@/components/learning/journey-choices";
import { HomeCompetitions, HomeDiscussions } from "@/components/home-discovery";

export const metadata: Metadata = {
  title: "AI Olympiad Pathfinder",
  description: "AI olympiad preparation and discovery for school students in Kazakhstan. Choose a roadmap, learn, explore official competitions and ask the community.",
};

export default function HomePage() {
  return <div className="mx-auto max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-8">
    <header className="grid gap-7 border-x border-b px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:px-10">
      <div><p className="micro-label text-primary">KAIZ / AI Olympiad Pathfinder</p><h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-[-.035em] sm:text-5xl">Start Your AI Olympiad Journey</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">A preparation and discovery platform for school students in Kazakhstan. Find your starting point, build the foundations, and explore real olympiads.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/start">Start Your Journey <ArrowRight className="size-4" aria-hidden="true"/></Link></Button><Button asChild variant="outline" size="lg"><Link href="/competitions">Explore competitions</Link></Button></div><p className="mt-3 text-xs text-muted-foreground">Roadmaps, learning resources and discovery are open without an account.</p></div>
      <ol className="space-y-3 border-t pt-5 text-sm lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" aria-label="Your preparation journey">{["Choose a starting point", "Learn Python, maths and ML", "Practice and study olympiads", "Ask questions and share ideas"].map((text, index) => <li key={text} className="flex gap-3 py-1"><span className="font-mono text-xs text-primary">0{index + 1}</span><span className="text-muted-foreground">{text}</span></li>)}</ol>
    </header>
    <section id="start-your-journey" className="py-9" aria-labelledby="choose-level"><p className="micro-label text-primary">Choose your level</p><h2 id="choose-level" className="mt-2 mb-5 text-xl font-bold">A clear next step, wherever you start.</h2><JourneyChoices/></section>
    <nav className="grid gap-4 border-y py-6 sm:grid-cols-3" aria-label="Continue your preparation">{[
      { href: "/learn", title: "Explore the Learning Tree", text: "Connect the foundations and open selected official resources.", icon: BookOpen },
      { href: "/problems", title: "Browse the problem archive", text: "Published tasks retain their original sources and metrics.", icon: FileCode2 },
      { href: "/discussions", title: "Learn with the community", text: "Read questions; sign in when you are ready to post or reply.", icon: MessageSquare },
    ].map(({ href, title, text, icon: Icon }) => <Link key={href} href={href} className="group flex min-w-0 items-start gap-3 p-2"><Icon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true"/><div><h2 className="text-sm font-bold group-hover:text-primary">{title}</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">{text}</p></div></Link>)}</nav>
    <div className="grid gap-9 py-9 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Loading olympiad editions…</p>}><HomeCompetitions/></Suspense>
      <div className="min-w-0 space-y-7"><Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Loading discussions…</p>}><HomeDiscussions/></Suspense><section className="border-t pt-5"><h2 className="text-base font-bold">Ideas for your first question</h2><p className="mt-1 text-xs text-muted-foreground">Suggestions, not existing community posts.</p><ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{["How do I start preparing for IOAI?", "Which free ML resources helped you?", "Beginner Python questions", "Finding study partners for AI competitions"].map(title => <li key={title}>{title}</li>)}</ul><Link href="/discussions/new" className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4">Ask a question</Link></section></div>
    </div>
  </div>;
}
