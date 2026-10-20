"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, List } from "lucide-react";
import styles from "./ioai.module.css";

// One navigation tree at every width; only the mobile disclosure needs client state.
export function CourseContents({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <aside className={styles.courseContents}>
    <button className={styles.contentsToggle} type="button" aria-expanded={open} aria-controls="course-contents" onClick={() => setOpen(value => !value)}>
      <List size={18} aria-hidden="true"/>Course Contents<ChevronDown size={16} aria-hidden="true"/>
    </button>
    <nav id="course-contents" className={styles.contentsNav} data-open={open} aria-label="Course contents">{children}</nav>
  </aside>;
}
