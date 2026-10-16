import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courseLessonFromSegment, courseProgress, lessonHref } from "@/lib/learning/course";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import { ResourceCard } from "@/components/learning/resource-card";
import { CompletionControl } from "@/components/learning/completion-control";
import styles from "@/components/training/catalog.module.css";
type Props = { params: Promise<{level:string;lesson:string}> };
export async function generateMetadata({params}:Props):Promise<Metadata> {
  const value = courseLessonFromSegment((await params).level,(await params).lesson);
  return { title:value ? `${value.lesson.number} ${value.lesson.topic.title} · ${value.path.title}` : "Lesson not found", robots:{index:false,follow:true} };
}
export default async function CourseLessonPage({params}:Props) {
  const {level,lesson:segment}=await params; const value=courseLessonFromSegment(level,segment); if(!value)notFound();
  const state=await getOwnLearningState(); const {path,module,lesson}=value; const id=lesson.id;
  const completed=!state.error&&courseProgress(path,state.records).completed.has(lesson.id);
  return <div className={styles.page}>
    <nav className={styles.actions} aria-label="Lesson context"><Link href={`/roadmaps/${level}`} className={styles.textAction}>{path.title} roadmap</Link><Link href={`/learn/${lesson.topic.slug}`} className={styles.textAction}>Learning Tree topic</Link></nav>
    <header className={styles.intro}><div><p>Module {module.number} / {module.title}</p><h1>{lesson.number} {lesson.topic.title}</h1><p>{lesson.topic.description}</p></div></header>
    <section><h2 className={styles.sectionTitle}>Learning objective</h2><p className="max-w-3xl text-sm leading-7">{module.goal}</p></section>
    <section><h2 className={styles.sectionTitle}>Materials</h2><p className={styles.note}>Curated external resources, not a newly authored KAIZ course. Opening links does not complete this lesson.</p>{lesson.topic.resources.map(resource=><ResourceCard key={resource.id} resource={resource}/>)}</section>
    <section><h2 className={styles.sectionTitle}>Module self-check</h2><p className="max-w-3xl text-sm leading-7">{module.milestone}</p><Link className={styles.textAction} href={`/problems?${new URLSearchParams({q:path.practiceQuery})}`}>Find practice tasks / collections</Link></section>
    <section className="mt-5 border-t pt-4" aria-label="Lesson completion"><h2 className="mb-3 text-sm font-semibold">Explicit self-completion</h2>{state.error ? <p role="alert" className={styles.note}>{state.error}</p> : state.user ? <CompletionControl roadmap={level} lesson={id} number={lesson.number} completed={completed}/> : <><p className={styles.note}>Sign in to save completion across devices. No account progress is stored while browsing anonymously.</p><Link className={styles.action} href={`/auth/login?next=${encodeURIComponent(lessonHref(level,id))}`}>Sign in to save progress</Link></>}</section>
  </div>;
}
