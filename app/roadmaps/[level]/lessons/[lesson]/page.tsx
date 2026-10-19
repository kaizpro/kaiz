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
import { areaForTopic, areaHref, areaTitles } from "@/lib/learning/ioai-navigation";
import { AreaStudyNotes } from "@/components/learning/ioai-overview";
import ioai from "@/components/learning/ioai.module.css";
import { LessonCourseNavigation } from "@/components/learning/lesson-course-navigation";
import { beginnerPractice } from "@/lib/learning/beginner-practice";
import { PracticeExercise } from "@/components/learning/practice-exercise";
import { beginnerStep, beginnerNeighbors } from "@/lib/learning/beginner-learning";
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
  const area = areaForTopic(lesson.topic.id, path.level);
  const progress=courseProgress(path,state.records);const ready=!!state.user&&!state.error;const completed=ready&&progress.completed.has(lesson.id);
  const lessons=courseFor(path).flatMap(unit=>unit.lessons);const index=lessons.findIndex(item=>item.id===lesson.id);const previous=lessons[index-1],next=lessons[index+1];
  const guidedIndex = learningSteps.findIndex(step => step.topicId === lesson.topic.id);
  const guidedPrevious = guidedIndex > 0 ? learningSteps[guidedIndex - 1] : undefined;
  const guidedNext = nextLearningStep(lesson.topic.id);
  const recommendation = beginnerContent ? beginnerNeighbors(lesson.topic.id) : undefined;
  const before = recommendation ? recommendation.before : guided ? guidedPrevious && { title: guidedPrevious.title, href: learningStepHref(guidedPrevious) } : previous && { title: previous.topic.title, href: lessonHref(level, previous.id) };
  const after = recommendation ? recommendation.after : guided ? guidedNext ? { title: guidedNext.title, href: learningStepHref(guidedNext) } : guided.after : next && { title: next.topic.title, href: lessonHref(level, next.id) };
  return <div className={`${ioai.page} ${ioai.lessonLayout}`}>
    {area && <LessonCourseNavigation profile={path.level} area={area} lessonId={lesson.id} records={state.records} ready={ready}/>}
    <article className={`${styles.page} ${ioai.lessonPage}`}>
    <nav className={styles.actions} aria-label="Lesson context"><Link href={area ? areaHref(path.level, area) : `/roadmaps/${level}`} className={styles.button}>{area ? `Back to ${areaTitles[area - 1]}` : `${path.title} roadmap`}</Link><Link href={`/learn/${lesson.topic.slug}`} className={styles.button}>Learning Tree topic</Link></nav>
    <header className={guided ? ioai.lessonHeader : styles.header}><p className={styles.eyebrow}>{guided ? `${areaTitles[guided.level - 1]} / LESSON ${lesson.number}` : `${path.title} · Module ${module.number} / ${module.title}`}</p><h1>{guided ? guided.title : `${lesson.number} ${lesson.topic.title}`}</h1>{!guided && <p className="mt-2 text-muted-foreground">{lesson.topic.description}</p>}
      {ready&&<div className={styles.progress} aria-label="Lesson roadmap progress"><p>{progress.count}/{progress.total} lessons · {progress.percent}% · {progress.xp} Learning XP{completed?" · ✓ This lesson completed":""}</p><progress aria-label={`${path.title} completion`} value={progress.count} max={progress.total}/></div>}
    </header>
    <nav className={ioai.lessonPager} aria-label="Lesson sequence">
      {before ? <Link href={before.href}>← {before.title}</Link> : <Link href={`/roadmaps/${level}`}>← All courses</Link>}
      {after && <Link href={after.href}>{after.title} →</Link>}
    </nav>
    {guided ? <GuidedLesson step={guided} recommendation={recommendation?.after}/> : <>
    <div className={`${styles.section} ${styles.columns}`}><section><h2>What you’ll learn</h2><ul className="list-disc pl-5">{presentation.objectives.map(text=><li key={text}>{text}</li>)}</ul></section><section><h2>Recommended learning sequence</h2><ol className={styles.ordered}>{presentation.sequence.map(text=><li key={text}>{text}</li>)}</ol></section></div>
    <section className={styles.section}><h2>Materials &amp; exercises</h2><p className="mb-4 text-muted-foreground">Selected original materials, in order. Opening a resource never marks this lesson complete.</p><LessonMaterials resources={lesson.topic.resources}/><details className={styles.details}><summary className={styles.button}>About these resources</summary><p>{presentation.provenance}</p><p>The original mentor plan and access notes are provenance, not requirements to complete an entire external course.</p></details></section>
    <section className={styles.section}>{practice ? <><h2>Practice check</h2><PracticeExercise practice={practice}/><details className={ioai.disclosure}><summary>Module self-check</summary><p>{presentation.practice}</p></details><Link className={styles.button} href={`/problems?${new URLSearchParams({q:path.practiceQuery})}`}>Explore relevant problems →</Link></> : <div className={styles.check}><h2>Practice check</h2><p className="mb-3"><strong>Module self-check:</strong> {presentation.practice}</p><p className="mb-3 text-muted-foreground">Review your own work. KAIZ does not run or judge code for this check.</p><Link className={styles.button} href={`/problems?${new URLSearchParams({q:path.practiceQuery})}`}>Explore relevant problems →</Link></div>}</section>
    </>}
    {guided && <details className={ioai.disclosure}><summary>Topic context</summary><p>{lesson.topic.description}</p><p>{path.title} · Module {module.number} / {module.title}</p><h3>Original module objectives</h3><ul>{presentation.objectives.map(text => <li key={text}>{text}</li>)}</ul><p>{presentation.practice}</p><LessonMaterials resources={lesson.topic.resources}/></details>}
    <AreaStudyNotes topicId={lesson.topic.id} profile={path.level}/>
    <section className={styles.completion} aria-label="Lesson completion"><h2>Lesson completion</h2><p>Finished studying and practising? Completion is a private self-report, not a verified assessment.</p>
      {state.error?<ProgressUnavailable message={state.error}/>:state.user?<><CompletionControl roadmap={level} lesson={lesson.id} number={lesson.number} completed={completed}/><p className="mb-3 text-muted-foreground">{completed?"✓ Completed · 10 Learning XP saved for this lesson.":"Explicitly mark completed when ready. Repeated completion earns no extra XP."}</p>{!guided&&completed&&(next?<Link className={styles.button} href={lessonHref(level,next.id)}>Next lesson · {next.number} {next.topic.title} →</Link>:<Link className={styles.button} href={`/roadmaps/${level}`}>Review roadmap →</Link>)}</>:<><p className="my-3 text-muted-foreground">Sign in to save progress across devices. Guest browsing does not create saved progress.</p><Link className={styles.button} href={`/auth/login?next=${encodeURIComponent(lessonHref(level,lesson.id))}`}>Sign in to save progress</Link></>}
    </section>
    {guided ? <details className={styles.details}><summary className={styles.button}>Other lessons in the existing {path.title} roadmap</summary><nav className={styles.actions} aria-label="Existing module navigation">{previous&&<Link className={styles.button} href={lessonHref(level,previous.id)}>← Previous in module · {previous.topic.title}</Link>}<Link className={styles.button} href={`/roadmaps/${level}`}>All {path.title} lessons</Link>{next&&<Link className={styles.button} href={lessonHref(level,next.id)}>Next in module · {next.topic.title} →</Link>}</nav></details> : <nav className={styles.actions} aria-label="Lesson navigation">{previous&&<Link className={styles.button} href={lessonHref(level,previous.id)}>← Previous · {previous.number} {previous.topic.title}</Link>}<Link className={styles.button} href={`/roadmaps/${level}`}>Back to roadmap</Link>{next&&<Link className={styles.button} href={lessonHref(level,next.id)}>Next · {next.number} {next.topic.title} →</Link>}</nav>}
  </article></div>;
}
