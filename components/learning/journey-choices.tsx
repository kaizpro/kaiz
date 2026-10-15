import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { journeys } from "@/lib/learning/journeys";
import styles from "@/components/training/catalog.module.css";

export function JourneyChoices() {
  return <div className={styles.rows}>{journeys.map((path, index) => <Link key={path.level} href={`/roadmaps/${path.level}`} className={styles.path}>
    <div><p className={styles.meta}>Path 0{index + 1} · 4 stages</p><h3>{path.title}</h3></div>
    <div><p className="text-sm leading-6">{path.audience}</p><p className={styles.meta}>{path.summary}</p></div>
    <span className={styles.textAction}>Start<ArrowRight className="size-3 shrink-0" aria-hidden="true"/></span>
  </Link>)}</div>;
}
