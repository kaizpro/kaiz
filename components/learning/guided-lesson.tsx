import Link from "next/link";
import type { ReactNode } from "react";
import { getTopicBySlug } from "@/lib/learning/curriculum";
import { publishableMaterial } from "@/lib/learning/ioai-materials";
import { nextLearningStep, learningStepHref, type LearningStep } from "@/lib/learning/learning-steps";
import { LessonMaterials } from "./lesson-materials";
import { PracticeExercise } from "./practice-exercise";
import styles from "./ioai.module.css";

export function GuidedLesson({ step, recommendation, completion }: { step: LearningStep; recommendation?: { title: string; href: string }; completion?: ReactNode }) {
  const primary = publishableMaterial(step.primary);
  const next = nextLearningStep(step.topicId);
  const nextAction = recommendation ?? (next ? { title: next.title, href: learningStepHref(next) } : step.after);
  const extras = step.extraMaterials.flatMap(id => { const resource = publishableMaterial(id); return resource ? [resource] : []; });
  return <div className={styles.lesson}>
    <nav className={styles.sectionNav} aria-label="Learning step sections"><a href="#learn"><span>01</span>Learn</a><a href="#practice"><span>02</span>Practice</a><a href="#next"><span>03</span>Next</a></nav>
    <section id="learn" className={styles.lessonSection}><h2>Learn</h2>
      <div className={styles.primaryMaterial} data-primary-material>{primary && <LessonMaterials resources={[primary]} compact/>}</div>
      <details className={styles.disclosure}><summary>Study guidance</summary><p className={styles.lessonIntro}>{step.learnInstruction}</p></details>
      <details className={styles.disclosure}><summary>Why this lesson</summary><h3 className="font-semibold">What you’ll learn</h3><p>{step.objective}</p><p className="mt-2 text-muted-foreground"><strong>Why it matters:</strong> {step.why}</p><h3 className="mt-3 font-semibold">Recommended learning sequence</h3><p>Read the focused material, try the original challenge, then use the readiness checks. You may revisit any step; navigation never records completion.</p></details>
      {(extras.length > 0 || step.mathTopics.length > 0) && <details className={styles.disclosure}><summary>Supporting maths &amp; additional materials</summary>
        <p className={styles.note}>Review these ideas as needed; not an all-maths-first requirement.</p><div className={styles.parallelTopics}>{step.mathTopics.map(id => <Link className={styles.topicLink} key={id} href={`/learn/${id}`}>{getTopicBySlug(id)!.title}</Link>)}</div>
        {extras.length > 0 && <LessonMaterials resources={extras}/>}
      </details>}
    </section>
    <section id="practice" className={styles.lessonSection}><h2>Practice</h2><PracticeExercise practice={step.practice} objective={step.objective} actions={{ topicId: step.topicId, studyHref: primary?.href ?? "#learn", completion }}>
      <details className={`${styles.disclosure} ${styles.setup}`}><summary>Local Python setup</summary>
        <p>Install Python 3 from its official site if needed. The first two steps use only Python’s standard library.</p><a className={styles.topicLink} href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer">Official Python downloads ↗</a>
        <p>For NumPy onward, use a virtual environment in a folder of your own. On macOS/Linux:</p><pre className={styles.code}><code>{"python3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install numpy pandas matplotlib scikit-learn\npython practice.py"}</code></pre>
        <p>On Windows, create it with <code>py -m venv .venv</code>, activate <code>.venv\\Scripts\\Activate.ps1</code> in PowerShell, then use the same pip and run commands. Follow your school/device policy if activation is restricted.</p>
        <p>No GPU, uploads, KAIZ account or API key is needed. A trusted notebook environment with these packages also works; that provider may require an account. For reproducibility, record your Python and package versions with <code>python --version</code> and <code>python -m pip freeze</code>.</p>
      </details></PracticeExercise>
      {step.extension && <details className={styles.disclosure}><summary>Optional extension · functions, collections and randomness</summary><p className={styles.note}>After the core exercise, read the hints introducing Random and seeds. This experiment is not required to continue to NumPy.</p><PracticeExercise practice={step.extension}/></details>}
    </section>
    <details id="check" className={`${styles.disclosure} ${styles.readiness}`}><summary>Ready to move on?</summary><ul className="list-disc pl-5">{step.readiness.map(text => <li key={text}>{text}</li>)}</ul><p className={styles.note}>If not yet, revisit the example or supporting maths. No score or proficiency is inferred.</p></details>
    {nextAction && <section id="next" className={styles.next}><div><h2>Next</h2><p>Keep your code and observations. You can return to this step at any time.</p></div><Link className={styles.primary} href={nextAction.href}>Next: {nextAction.title} →</Link></section>}
  </div>;
}
