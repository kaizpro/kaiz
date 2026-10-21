import type { ReactNode } from "react";
import type { PracticeExercise as PracticeContent } from "@/lib/learning/learning-steps";
import styles from "./ioai.module.css";

export function PracticeExercise({ practice, children }: { practice: PracticeContent; children?: ReactNode }) {
  return <div className={styles.practiceCard} data-practice-exercise>
    <h3>{practice.title}</h3>
    <p className={styles.note}>Original KAIZ instructions. KAIZ does not run or judge code. Compare your own output and reasoning; no automatic pass is claimed.</p>
    <p className={styles.note}><strong>Before you start:</strong> {practice.prerequisites.join("; ")}.</p>
    <ol className={styles.practiceList}>{practice.instructions.map(text => <li key={text}>{text}</li>)}</ol>
    <p><strong>Expected outcome:</strong> {practice.expected}</p>
    <details className={styles.disclosure}><summary>Optional hints</summary><ul className="list-disc pl-5">{practice.hints.map(text => <li key={text}>{text}</li>)}</ul></details>
    <details className={styles.disclosure}><summary>Worked example · try the challenge first</summary><p className={styles.note}>Run this in your own Python environment. Predict the output and explain each part rather than only copying it.</p><pre className={styles.code}><code>{practice.code}</code></pre></details>
    {children}
  </div>;
}
