"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./course.module.css";

export function ProgressUnavailable({ message }: { message: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className={styles.summary} role="alert"><p>{message}</p><button className={styles.smallAction} disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Checking saved progress…" : "Retry saved progress"}</button></div>;
}
