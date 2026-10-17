import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courseFor, courseLessonFromSegment, courseProgress, lessonHref } from "@/lib/learning/course";
import { getOwnLearningState } from "@/lib/data/learning-progress";
import { lessonPresentation } from "@/lib/learning/lesson-presentation";
import { LessonMaterials } from "@/components/learning/lesson-materials";
import { CompletionControl } from "@/components/learning/completion-control";
import { ProgressUnavailable } from "@/components/learning/progress-unavailable";
import styles from "@/components/learning/lesson.module.css";
type Props = { params: Promise<{level:string;lesson:string}> };
export async function generateMetadata({params}:Props):Promise<Metadata> {
  const {level,lesson}=await params;const value=courseLessonFromSegment(level,lesson);
  return {title:value?`${value.lesson.number} ${value.lesson.topic.title} · ${value.path.title}`:"Lesson not found",robots:{index:false,follow:true}};
}
export default async function CourseLessonPage({params}:Props) {
  const {level,lesson:segment}=await params;const value=courseLessonFromSegment(level,segment);if(!value)notFound();
  const state=await getOwnLearningState();const {path,module,lesson}=value;const presentation=lessonPresentation(value);
  const progress=courseProgress(path,state.records);const ready=!!state.user&&!state.error;const completed=ready&&progress.completed.has(lesson.id);
  const lessons=courseFor(path).flatMap(unit=>unit.lessons);const index=lessons.findIndex(item=>item.id===lesson.id);const previous=lessons[index-1],next=lessons[index+1];
  return <article className={styles.page}>
    <nav className={styles.actions} aria-label="Lesson context"><Link href={`/roadmaps/${level}`} className={styles.button}>{path.title} roadmap</Link><Link href={`/learn/${lesson.topic.slug}`} className={styles.button}>Learning Tree topic</Link></nav>
    <header className={styles.header}><p className={styles.eyebrow}>{path.title} · Module {module.number} / {module.title}</p><h1>{lesson.number} {lesson.topic.title}</h1><p className="mt-2 text-muted-foreground">{lesson.topic.description}</p>
      {ready&&<div className={styles.progress} aria-label="Lesson roadmap progress"><p>{progress.count}/{progress.total} lessons · {progress.percent}% · {progress.xp} Learning XP{completed?" · ✓ This lesson completed":""}</p><progress aria-label={`${path.title} completion`} value={progress.count} max={progress.total}/></div>}
    </header>
    <div className={`${styles.section} ${styles.columns}`}><section><h2>What you’ll learn</h2><ul className="list-disc pl-5">{presentation.objectives.map(text=><li key={text}>{text}</li>)}</ul></section><section><h2>Recommended learning sequence</h2><ol className={styles.ordered}>{presentation.sequence.map(text=><li key={text}>{text}</li>)}</ol></section></div>
    <section className={styles.section}><h2>Materials &amp; exercises</h2><p className="mb-4 text-muted-foreground">Selected original materials, in order. Opening a resource never marks this lesson complete.</p><LessonMaterials resources={lesson.topic.resources}/><details className={styles.details}><summary className={styles.button}>About these resources</summary><p>{presentation.provenance}</p><p>The original mentor plan and access notes are provenance, not requirements to complete an entire external course.</p></details></section>
    <section className={styles.section}><div className={styles.check}><h2>Practice check</h2><p className="mb-3"><strong>Module self-check:</strong> {presentation.practice}</p><p className="mb-3 text-muted-foreground">Review your own work. KAIZ does not run or judge code for this check.</p><Link className={styles.button} href={`/problems?${new URLSearchParams({q:path.practiceQuery})}`}>Explore relevant problems →</Link></div></section>
    <section className={styles.completion} aria-label="Lesson completion"><h2>Lesson completion</h2><p>Finished studying and practising? Completion is a private self-report, not a verified assessment.</p>
      {state.error?<ProgressUnavailable message={state.error}/>:state.user?<><CompletionControl roadmap={level} lesson={lesson.id} number={lesson.number} completed={completed}/><p className="mb-3 text-muted-foreground">{completed?"✓ Completed · 10 Learning XP saved for this lesson.":"Explicitly mark completed when ready. Repeated completion earns no extra XP."}</p>{completed&&(next?<Link className={styles.button} href={lessonHref(level,next.id)}>Next lesson · {next.number} {next.topic.title} →</Link>:<Link className={styles.button} href={`/roadmaps/${level}`}>Review roadmap →</Link>)}</>:<><p className="my-3 text-muted-foreground">Sign in to save progress across devices. Guest browsing does not create saved progress.</p><Link className={styles.button} href={`/auth/login?next=${encodeURIComponent(lessonHref(level,lesson.id))}`}>Sign in to save progress</Link></>}
    </section>
    <nav className={styles.actions} aria-label="Lesson navigation">{previous&&<Link className={styles.button} href={lessonHref(level,previous.id)}>← Previous · {previous.number} {previous.topic.title}</Link>}<Link className={styles.button} href={`/roadmaps/${level}`}>Back to roadmap</Link>{next&&<Link className={styles.button} href={lessonHref(level,next.id)}>Next · {next.number} {next.topic.title} →</Link>}</nav>
  </article>;
}
