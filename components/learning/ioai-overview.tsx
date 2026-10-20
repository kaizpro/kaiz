import Link from "next/link";
import { ArrowRight, Braces, BrainCircuit, Check, ChevronDown, Compass, Flag, Layers, Minus, Network, Table2 } from "lucide-react";
import { courseProgress, type LessonProgress } from "@/lib/learning/course";
import { journeys, type JourneyLevel } from "@/lib/learning/journeys";
import { ioaiLevels, startingProfiles, syllabus } from "@/lib/learning/ioai-curriculum";
import { areaForTopic, areaHref, areaLessons, areaSupportingLessons, areaReferences, areaTitles, recommendedAreaLesson, recommendedAtlasLesson } from "@/lib/learning/ioai-navigation";
import { getLearningStep } from "@/lib/learning/learning-steps";
import { publishableMaterial } from "@/lib/learning/ioai-materials";
import { LessonMaterials } from "./lesson-materials";
import { BeginnerSourcePlan } from "./beginner-source-plan";
import { PracticeSources } from "./practice-sources";
import styles from "./ioai.module.css";
import atlas from "./skill-atlas.module.css";
import { SkillAtlasCanvas } from "./skill-atlas-canvas";

const profileHints = ["Start from zero", "I know Python", "I know ML"];
const profileIcons = [Compass, Braces, BrainCircuit];
const areaIcons = [Braces, Table2, Network, BrainCircuit, Layers, Flag];

export function StartingPoints({ records, ready }: { records: readonly LessonProgress[]; ready: boolean }) {
  return <nav className={styles.entryCards} aria-label="Choose your starting point">{journeys.map((path, index) => {
    const Icon = profileIcons[index];
    const progress = courseProgress(path, records);
    return <Link key={path.level} data-entry-profile={path.level} className={styles.entryCard} href={`/roadmaps/${path.level}`}>
      <span className={styles.entryIndex}>0{index + 1}<span>{path.title}</span></span>
      <span className={styles.entryIcon}><Icon size={28} aria-hidden="true" /></span>
      <h2>{profileHints[index]}</h2>
      {ready && progress.count > 0 && <span className={styles.savedHint}>{progress.count} lessons saved</span>}
      <span className={styles.entryArrow}>Explore your path<ArrowRight size={20} aria-hidden="true" /></span>
    </Link>;
  })}</nav>;
}

export function LearningOverview({ profile, records = [], canSave = false }: {
  profile: JourneyLevel; records?: readonly LessonProgress[]; canSave?: boolean;
}) {
  const next = recommendedAtlasLesson(profile, records, canSave);
  const courses = ioaiLevels.map(level => ({ ...level, lessons: areaLessons(level.number, profile) }));
  const continuing = canSave && courses.some(course => [...course.lessons, ...areaSupportingLessons(course.number, profile)].some(item => records.some(row =>
    row.roadmap_id === item.roadmap && row.lesson_id === item.id && row.completed_at !== null)));
  return <div className={styles.guidance}>
    <section className={styles.nextCard} aria-label="Recommended learning action">
      <div><p className={styles.eyebrow}>{next ? "YOUR NEXT LESSON" : "YOUR LEARNING PATH"}</p><h2>{next ? getLearningStep(next.topic.id)?.title ?? next.topic.title : "Review any course"}</h2>
      {next && <p className={styles.note}>{areaTitles[areaForTopic(next.topic.id, profile)! - 1]}</p>}</div>
      {next && <Link className={styles.primary} data-next-lesson href={next.href}>{continuing ? "Continue Learning" : "Start Learning"}<ArrowRight size={18} aria-hidden="true"/></Link>}
    </section>
    <section aria-labelledby="courses-heading"><div className={styles.courseHeading}><h2 id="courses-heading">Your courses</h2><Link className={styles.backLink} href={`/roadmaps/${profile}?view=map`}>Explore Skill Map<ArrowRight size={16} aria-hidden="true"/></Link></div>
      <ol className={styles.courseGrid}>{courses.map(course => { const Icon = areaIcons[course.number - 1]; return <li key={course.number}><Link data-course-area={course.number} href={areaHref(profile, course.number)}>
        <span className={styles.courseIcon}><Icon size={20} aria-hidden="true"/></span><span><strong>{areaTitles[course.number - 1]}</strong><small>{profile === "beginner" && course.number === 4 ? "Optional next-stage preparation" : course.lessons.length ? `${course.lessons.length} lessons` : "Topic references"}</small></span><ArrowRight size={16} aria-hidden="true"/>
      </Link></li>; })}</ol>
    </section>
  </div>;
}

export function IoaiOverview({ profile = "beginner", area, records = [], canSave = false, course = false }: {
  profile?: JourneyLevel; area?: number; records?: readonly LessonProgress[]; canSave?: boolean; course?: boolean;
}) {
  const current = ioaiLevels.find(level => level.number === area);
  const suggested = startingProfiles.find(item => item.id === profile)!.startLevel;
  const next = current ? recommendedAreaLesson(current.number, profile, records, canSave) : recommendedAtlasLesson(profile, records, canSave);
  const lessons = current ? areaLessons(current.number, profile) : [];
  const supporting = current ? areaSupportingLessons(current.number, profile) : [];
  const references = current ? areaReferences(current.number, profile) : [];
  const mathematics = references.filter(topic => topic.track === "mathematics");
  const additional = references.filter(topic => topic.track !== "mathematics");
  const upcoming = current?.topics.filter(topic => topic.topicIds.length === 0) ?? [];
  const content = <>
    {!course && <><div className={atlas.root} data-atlas-root><Compass size={22} aria-hidden="true"/><strong>Your AI journey</strong></div>
    <ol className={atlas.areas}>{ioaiLevels.map(level => {
      const Icon = areaIcons[level.number - 1];
      const active = current?.number === level.number;
      return <li key={level.number} data-path-area={level.number} data-active={active}>
        <Link className={atlas.areaNode} data-recommended={level.number === suggested} href={active ? `/roadmaps/${profile}?view=map` : areaHref(profile, level.number, "map")} scroll={false}
          aria-current={active ? "step" : undefined} aria-expanded={active} aria-controls={active ? "area-lessons" : undefined}
          aria-label={`${active ? "Collapse" : "Explore"} ${areaTitles[level.number - 1]}${level.number === suggested ? " · Recommended start" : ""}`}>
          <span className={atlas.orb} data-atlas-orb><Icon size={26} aria-hidden="true" /></span>
          <span className={atlas.nodeLabel}>{areaTitles[level.number - 1]}<small>{String(level.number).padStart(2, "0")}{level.number === suggested ? " · Start here" : ""}</small></span>
        </Link>
      </li>;
    })}</ol></>}
    {current && <section key={current.number} id="area-lessons" tabIndex={-1} className={course ? styles.courseBody : atlas.branch} data-atlas-branch={!course || undefined} aria-labelledby="area-heading">
    <header className={atlas.branchHeader}><div><p className={styles.eyebrow}>0{current.number} / {current.title}</p><h2 id="area-heading">{course ? "Course contents" : areaTitles[current.number - 1]}</h2></div><Link className={atlas.collapse} href={`/roadmaps/${profile}${course ? "" : "?view=map"}`} scroll={course ? undefined : false} aria-label={course ? "All courses" : `Collapse ${areaTitles[current.number - 1]} lessons`}>{course ? "All courses" : "All areas"}<Minus size={16} aria-hidden="true"/></Link></header>
    {profile === "beginner" && current.number === 4 && <p className={styles.note}>Optional next-stage preparation. The Beginner core ends with training and evaluating a classical ML model; neural networks are not required.</p>}
    {lessons.length > 0 && <ol className={atlas.lessons} aria-label={`${areaTitles[current.number - 1]} lessons`}>{lessons.map((item, index) => {
      const completed = canSave && records.some(row => row.roadmap_id === item.roadmap && row.lesson_id === item.id && row.completed_at !== null);
      const recommended = next?.id === item.id && next.roadmap === item.roadmap;
      return <li key={item.id}><Link href={item.href} className={atlas.lessonLink} data-next-lesson={recommended || undefined}>
        <span className={atlas.lessonOrb}>{completed ? <Check size={16} aria-hidden="true" /> : String(index + 1).padStart(2, "0")}</span>
        <span><strong>{getLearningStep(item.topic.id)?.title ?? item.topic.title}</strong><small>{completed ? "Completed · self-reported" : recommended ? "Recommended next" : item.guided ? "Learn · Practice" : "Selected materials"}</small></span>
        <ArrowRight size={18} aria-hidden="true" />
      </Link></li>;
    })}</ol>}
    {(supporting.length > 0 || mathematics.length > 0) && <details className={atlas.supporting}><summary>Maths alongside <small>Optional review</small><ChevronDown size={15} aria-hidden="true"/></summary><div className={atlas.topicLinks}>{supporting.map(item => <Link key={item.id} href={item.href}>{item.topic.title}<ArrowRight size={13} aria-hidden="true"/></Link>)}{mathematics.map(topic => <Link key={topic.id} href={`/learn/${topic.slug}`}>{topic.title}<ArrowRight size={13} aria-hidden="true"/></Link>)}</div></details>}
    {additional.length > 0 && <details className={atlas.supporting}><summary>{lessons.length ? "Explore alongside" : "Topic references"}<ChevronDown size={15} aria-hidden="true"/></summary><div className={atlas.topicLinks}>{additional.map(topic => <Link key={topic.id} href={`/learn/${topic.slug}`}>{topic.title}<ArrowRight size={13} aria-hidden="true"/></Link>)}</div></details>}
    {upcoming.length > 0 && <details className={atlas.supporting}><summary>Upcoming coverage<ChevronDown size={15} aria-hidden="true"/></summary><p className={styles.note}>{upcoming.map(topic => topic.title).join(" · ")}</p></details>}
    </section>}
    </>;
  return <section className={atlas.board} aria-label={course ? "Course" : "Learning areas"}>
    {!course && <div className={atlas.boardBar}><span>{current ? `${String(current.number).padStart(2, "0")} / ${current.title}` : "YOUR SKILL ATLAS"}</span>{!current && next ? <Link className={atlas.nextLesson} data-next-lesson href={next.href}><span>Recommended next<strong>{getLearningStep(next.topic.id)?.title ?? next.topic.title}</strong></span><ArrowRight size={18} aria-hidden="true"/></Link> : <span>Explore any area</span>}</div>}
    {course ? content : <SkillAtlasCanvas area={current?.number}>{content}</SkillAtlasCanvas>}
    <footer className={atlas.footer}><span>Suggested order · no locked steps</span><Link href="/learn?track=mathematics">Mathematics<ArrowRight size={14} aria-hidden="true"/></Link></footer>
  </section>;
}

export function AreaStudyNotes({ topicId, profile }: { topicId: string; profile: JourneyLevel }) {
  const levels = ioaiLevels.filter(level => level.topics.some(topic => topic.topicIds.includes(topicId)));
  const materialIds = [...new Set(levels.flatMap(level => level.materialIds))];
  const step = getLearningStep(topicId);
  const existing = new Set([step?.primary, ...(step?.extraMaterials ?? [])]);
  const resources = materialIds.filter(id => !existing.has(id)).flatMap(id => { const resource = publishableMaterial(id); return resource ? [resource] : []; });
  return <details className={styles.disclosure}><summary>More resources &amp; syllabus context</summary>
    <p className={styles.note}>These are optional references, not a requirement to finish entire courses. Higher-level guided content is still being developed.</p>
    {resources.length > 0 && <LessonMaterials resources={resources}/>}
    <PracticeSources level={profile}/>
    {levels.map(level => <section key={level.number} className={styles.contextSection}><h3>Level {level.number} · {level.title}</h3><p>{level.coverage}. {level.readiness}</p>
      <ul>{level.topics.map(topic => <li key={topic.id}>{topic.title} · {topic.mode}{topic.scope === "preparation" ? " (KAIZ preparation)" : ""}{topic.topicIds.length === 0 ? " · Upcoming" : ""}</li>)}</ul></section>)}
    <p className={styles.note}>{syllabus.note} Maths develops in parallel; C++ and competitive programming are optional, not AI prerequisites.</p>
    <a className={styles.topicLink} href={syllabus.href} target="_blank" rel="noopener noreferrer">{syllabus.title} ↗</a>
    <Link className={styles.topicLink} href="/learn?track=coding-ai&open=programming,cpp">Optional C++ pathway</Link>
    {topicId === "python-fundamentals" && <details className={styles.disclosure}><summary>Original mentor plan &amp; provenance</summary><BeginnerSourcePlan/></details>}
  </details>;
}
