import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, ChevronRight, Compass } from "lucide-react";
import { getChildren, getNode, getPath, getTopics, getTopicBySlug, topicHref } from "@/lib/learning/curriculum";
import { roadmapForNode } from "@/lib/learning/navigation";
import { TopicRoadmapLink } from "@/components/learning/topic-roadmap-link";
import styles from "@/components/learning/learning.module.css";

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
            <ul className={styles.resourceList}>{topic.resources.filter((resource) => /^https?:\/\//.test(resource.href)).map((resource) => (
              <li key={resource.id}><a href={resource.href} target="_blank" rel="noopener noreferrer">
                <span><span className={styles.eyebrow}>{resource.kind}</span><br />{resource.title}</span><ArrowUpRight size={16} aria-hidden="true" />
                <span className={styles.srOnly}>opens in a new tab</span>
              </a></li>
            ))}</ul>
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
      <nav className={styles.siblingNav} aria-label="Adjacent topics">
        {previous && <Link data-direction="previous" href={topicHref(previous)}><ArrowLeft size={16} aria-hidden="true" /><span><small className={styles.eyebrow}>Previous topic</small>{previous.title}</span></Link>}
        {next && <Link href={topicHref(next)}><span><small className={styles.eyebrow}>Next topic</small>{next.title}</span><ArrowRight size={16} aria-hidden="true" /></Link>}
      </nav>
    </section>
  );
}
