import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, ChevronRight, Compass } from "lucide-react";
import { getChildren, getNode, getPath, getTopics, getTopicBySlug, topicHref } from "@/lib/learning/curriculum";
import { roadmapForNode } from "@/lib/learning/navigation";
import { journeysForTopic } from "@/lib/learning/journeys";
import { TopicRoadmapLink } from "@/components/learning/topic-roadmap-link";
import styles from "@/components/learning/learning.module.css";
import { ResourceCard } from "@/components/learning/resource-card";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return getTopics().map((node) => ({ slug: node.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const node = getTopicBySlug((await params).slug);
  return node?.kind === "topic" ? { title: `${node.title} — Learn`, description: node.description } : { title: "Topic not found" };
}

export default async function TopicPage({ params }: Props) {
  const topic = getTopicBySlug((await params).slug);
  if (!topic || topic.kind !== "topic") notFound();
  const path = getPath(topic.id);
  const siblings = getChildren(topic.parentId!).filter((node) => node.kind === "topic");
  const index = siblings.findIndex((node) => node.id === topic.id);
  const previous = siblings[index - 1];
  const next = siblings[index + 1];
  const recommendedIds = [...new Set(path.flatMap((node) => node.prerequisites))];
  const recommendations = recommendedIds.map((id) => getNode(id)!).filter((node) => node.id !== topic.id);
  const journeys = journeysForTopic(topic.id);

  return (
    <section className={`${styles.page} ${styles.detail}`} aria-labelledby="topic-title">
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        {path.map((node, position) => <span key={node.id} className={styles.crumb}>
          {position > 0 && <ChevronRight size={11} aria-hidden="true" />}
          {node.id === topic.id ? <span aria-current="page">{node.title}</span> : <Link href={roadmapForNode(node.id)}>{node.title}</Link>}
        </span>)}
      </nav>
      <header className={styles.detailHeader}>
        <p className={styles.eyebrow}>{getNode(topic.track!)?.title} / {getNode(topic.parentId!)?.title}</p>
        <h1 id="topic-title">{topic.title}</h1>
        <p>{topic.description}</p>
      </header>
      <div className={styles.detailGrid}>
        {topic.resources.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}><BookOpen size={26} aria-hidden="true" /></span>
            <span className={styles.emptyLabel}>LEARNING MATERIALS / COMING SOON</span>
            <h2>A place for what comes next.</h2>
            <p>Learning materials for this topic will be added soon. For now, explore where it fits and what connects to it.</p>
            <Suspense fallback={<Link className={styles.returnLink} href={roadmapForNode(topic.id)}><ArrowLeft size={15} aria-hidden="true" />Back to the learning tree</Link>}>
              <TopicRoadmapLink topicId={topic.id} />
            </Suspense>
          </div>
        ) : (
          <section aria-label="Learning materials">
            <p className="mb-2 text-xs leading-6 text-muted-foreground">{topic.resources.length} external materials · not a full KAIZ lesson</p>
            <div>{topic.resources.map(resource => <ResourceCard key={resource.id} resource={resource} topic={topic.title}/>)}</div>
            <Suspense><TopicRoadmapLink topicId={topic.id} /></Suspense>
          </section>
        )}
        <aside className={styles.recommendations}>
          <Compass size={20} aria-hidden="true" className={styles.recommendationIcon} />
          <h2>{recommendations.length ? "Helpful foundations" : "Start with curiosity"}</h2>
          <p>{recommendations.length ? "Useful ideas to explore alongside this topic. Suggestions, never requirements." : "No specific foundations are recommended here. You’re free to begin exploring."}</p>
          {recommendations.length > 0 && <ul>{recommendations.map((node) => <li key={node.id}>
            <Link href={node.kind === "topic" ? topicHref(node) : roadmapForNode(node.id)}>{node.title}<ArrowUpRight size={12} aria-hidden="true" /></Link>
          </li>)}</ul>}
        </aside>
      </div>
      <section className="mt-7 border-t pt-5" aria-label="Continue your journey">
        <h2 className="text-base font-bold">Connect this topic to your preparation</h2>
        <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center" aria-label="Roadmaps and community">
          {journeys.length ? journeys.map(path => <Link key={path.level} href={`/roadmaps/${path.level}`} className="text-primary underline underline-offset-4">{path.title} roadmap</Link>) : <Link href="/roadmaps" className="text-primary underline underline-offset-4">Choose a roadmap</Link>}
          <Link href="/learn/topics" className="text-primary underline underline-offset-4">AI Topics inventory</Link>
          <Link href="/problems" className="text-primary underline underline-offset-4">Browse published problems</Link>
          <Link href="/discussions?category=help" className="text-primary underline underline-offset-4">Ask a question</Link>
        </nav>
      </section>
      <nav className={styles.siblingNav} aria-label="Adjacent topics">
        {previous && <Link data-direction="previous" href={topicHref(previous)}><ArrowLeft size={16} aria-hidden="true" /><span><small className={styles.eyebrow}>Previous topic</small>{previous.title}</span></Link>}
        {next && <Link href={topicHref(next)}><span><small className={styles.eyebrow}>Next topic</small>{next.title}</span><ArrowRight size={16} aria-hidden="true" /></Link>}
      </nav>
    </section>
  );
}
