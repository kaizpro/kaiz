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
import { GuidedLesson } from "@/components/learning/guided-lesson";
import { getLearningStep, learningSteps, learningStepHref, nextLearningStep } from "@/lib/learning/learning-steps";
import { AreaStudyNotes } from "@/components/learning/ioai-overview";
import ioai from "@/components/learning/ioai.module.css";
import { ClassicLessonContents } from "@/components/learning/classic-lesson-contents";
import classic from "@/components/learning/classic.module.css";
import { beginnerPractice } from "@/lib/learning/beginner-practice";
import { PracticeExercise } from "@/components/learning/practice-exercise";
import { beginnerStep, beginnerNeighbors } from "@/lib/learning/beginner-learning";
import { LessonPracticeActions } from "@/components/learning/lesson-practice-actions";
type Props = { params: Promise<{level:string;lesson:string}> };
export async function generateMetadata({params}:Props):Promise<Metadata> {
  const {level,lesson}=await params;const value=courseLessonFromSegment(level,lesson);
  return {title:value?`${value.lesson.number} ${value.lesson.topic.title} · ${value.path.title}`:"Lesson not found",robots:{index:false,follow:true}};
}
export default async function CourseLessonPage({params}:Props) {
  const {level,lesson:segment}=await params;const value=courseLessonFromSegment(level,segment);if(!value)notFound();
  const state=await getOwnLearningState();const {path,module,lesson}=value;const presentation=lessonPresentation(value);
  const beginnerContent = path.level === "beginner" || (path.level === "intermediate" && lesson.topic.id === "exploratory-analysis");
  const guided = beginnerContent ? beginnerStep(lesson.topic.id) : getLearningStep(lesson.topic.id);
  const practice = path.level === "beginner" ? beginnerPractice[lesson.topic.id] : undefined;
  const progress=courseProgress(path,state.records);const ready=!!state.user&&!state.error;const completed=ready&&progress.completed.has(lesson.id);
  const lessons=courseFor(path).flatMap(unit=>unit.lessons);const index=lessons.findIndex(item=>item.id===lesson.id);const previous=lessons[index-1],next=lessons[index+1];
  const guidedIndex = learningSteps.findIndex(step => step.topicId === lesson.topic.id);
  const guidedPrevious = guidedIndex > 0 ? learningSteps[guidedIndex - 1] : undefined;
  const guidedNext = nextLearningStep(lesson.topic.id);
  const recommendation = beginnerContent ? beginnerNeighbors(lesson.topic.id) : undefined;
  const before = recommendation ? recommendation.before : guided ? guidedPrevious && { title: guidedPrevious.title, href: learningStepHref(guidedPrevious) } : previous && { title: previous.topic.title, href: lessonHref(level, previous.id) };
  const after = recommendation ? recommendation.after : guided ? guidedNext ? { title: guidedNext.title, href: learningStepHref(guidedNext) } : guided.after : next && { title: next.topic.title, href: lessonHref(level, next.id) };
  const completion = <section className={styles.completion} aria-label="Lesson completion"><h2>Lesson completion</h2>
    {state.error ? <ProgressUnavailable message={state.error}/> : state.user ? <><CompletionControl roadmap={level} lesson={lesson.id} number={lesson.number} completed={completed}/><p className="mt-2 text-xs text-muted-foreground">{completed ? "✓ Completed · 10 Learning XP saved for this lesson." : "Mark completed when ready · 10 Learning XP. Repeated completion earns no extra XP."}</p></> : <Link className={styles.button} href={`/auth/login?next=${encodeURIComponent(lessonHref(level,lesson.id))}`}>Sign in to save progress</Link>}
  </section>;
  const practiceActions = { topicId: lesson.topic.id, studyHref: `/learn/${lesson.topic.slug}`, completion };
  return <article className={`${styles.page} ${classic.lesson}`}>
    <nav className={styles.actions} aria-label="Lesson context"><Link href={`/roadmaps/${level}`} className={styles.button}>{path.title} roadmap</Link><Link href={`/learn/${lesson.topic.slug}`} className={styles.button}>Learning Tree topic</Link></nav>
    <header className={styles.header}><p className={styles.eyebrow}>{path.title} · Module {module.number} / {module.title}</p><h1>{lesson.number} {guided?.title ?? lesson.topic.title}</h1>{!guided && <p className="mt-2 text-muted-foreground">{lesson.topic.description}</p>}
      {ready&&<div className={styles.progress} aria-label="Lesson roadmap progress"><p>{progress.count}/{progress.total} lessons · {progress.percent}% · {progress.xp} Learning XP{completed?" · ✓ This lesson completed":""}</p><progress aria-label={`${path.title} completion`} value={progress.count} max={progress.total}/></div>}
    </header>
    <ClassicLessonContents path={path} lessonId={lesson.id} records={state.records} ready={ready}/>
    {guided ? <GuidedLesson step={guided} recommendation={recommendation?.after} completion={completion}/> : <>
    <div className={`${styles.section} ${styles.columns}`}><section><h2>What you’ll learn</h2><ul className="list-disc pl-5">{presentation.objectives.map(text=><li key={text}>{text}</li>)}</ul></section><section><h2>Recommended learning sequence</h2><ol className={styles.ordered}>{presentation.sequence.map(text=><li key={text}>{text}</li>)}</ol></section></div>
    <section className={styles.section}><h2>Materials &amp; exercises</h2><p className="mb-4 text-muted-foreground">Selected original materials, in order. Opening a resource never marks this lesson complete.</p><LessonMaterials resources={lesson.topic.resources}/><details className={styles.details}><summary className={styles.button}>About these resources</summary><p>{presentation.provenance}</p><p>The original mentor plan and access notes are provenance, not requirements to complete an entire external course.</p></details></section>
    <section className={styles.section}>{practice ? <><h2>Practice check</h2><PracticeExercise practice={practice} objective={lesson.topic.description} actions={practiceActions}/><details className={ioai.disclosure}><summary>Module self-check</summary><p>{presentation.practice}</p></details></> : <div className={styles.check} data-practice-exercise><h2>Apply {lesson.topic.title}</h2><p>{lesson.topic.description}</p><LessonPracticeActions {...practiceActions}/><details className={ioai.disclosure} data-practice-instructions><summary>Task instructions</summary><p><strong>Module self-check:</strong> {presentation.practice}</p><p>Review your own work. KAIZ does not run or judge code for this check.</p><Link className={styles.button} href={`/problems?${new URLSearchParams({q:path.practiceQuery})}`}>Explore relevant problems →</Link></details></div>}</section>
    </>}
    {guided && <details className={ioai.disclosure}><summary>Topic context</summary><p>{lesson.topic.description}</p><p>{path.title} · Module {module.number} / {module.title}</p><h3>Original module objectives</h3><ul>{presentation.objectives.map(text => <li key={text}>{text}</li>)}</ul><p>{presentation.practice}</p><LessonMaterials resources={lesson.topic.resources}/></details>}
    <AreaStudyNotes topicId={lesson.topic.id} profile={path.level}/>
    {guided ? <details className={styles.details}><summary className={styles.button}>Other lessons in the existing {path.title} roadmap</summary><nav className={styles.actions} aria-label="Existing module navigation">{previous&&<Link className={styles.button} href={lessonHref(level,previous.id)}>← Previous in module · {previous.topic.title}</Link>}<Link className={styles.button} href={`/roadmaps/${level}`}>All {path.title} lessons</Link>{next&&<Link className={styles.button} href={lessonHref(level,next.id)}>Next in module · {next.topic.title} →</Link>}</nav></details> : <nav className={styles.actions} aria-label="Lesson navigation">{previous&&<Link className={styles.button} href={lessonHref(level,previous.id)}>← Previous · {previous.number} {previous.topic.title}</Link>}<Link className={styles.button} href={`/roadmaps/${level}`}>Back to roadmap</Link>{next&&<Link className={styles.button} href={lessonHref(level,next.id)}>Next · {next.number} {next.topic.title} →</Link>}</nav>}
    <nav className={styles.actions} aria-label="Lesson sequence">{before && <Link className={styles.button} href={before.href}>← {before.title}</Link>}<Link className={styles.button} href={`/roadmaps/${level}`}>Back to roadmap</Link>{after && <Link className={styles.button} href={after.href}>{after.title} →</Link>}</nav>
  </article>;
}
