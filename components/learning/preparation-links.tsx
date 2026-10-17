import Link from "next/link";
import { getTopicBySlug } from "@/lib/learning/curriculum";
import { preparationTopics } from "@/lib/learning/journeys";

export function PreparationLinks({ category }: { category: string }) {
  const topics = preparationTopics(category).map(id => getTopicBySlug(id)).filter(topic => topic !== undefined);
  return <section className="border-t py-7" aria-label="Preparation suggestions">
    <p className="micro-label text-primary">Learn / Practice / Discuss</p>
    <h2 className="mt-2 text-lg font-bold">Prepare for your next attempt</h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">Editorial suggestions, not required prerequisites or an official syllabus.</p>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-sm">{topics.map(topic => <Link key={topic.id} href={`/learn/${topic.slug}`} className="text-primary underline underline-offset-4">{topic.title}</Link>)}</div>
    <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm" aria-label="Continue preparing">
      <Link href="/roadmaps" className="font-semibold hover:text-primary">Choose a roadmap</Link>
      <Link href="/problems" className="font-semibold hover:text-primary">Browse published problems</Link>
      <Link href="/discussions?category=help" className="font-semibold hover:text-primary">Ask the community</Link>
    </nav>
  </section>;
}
