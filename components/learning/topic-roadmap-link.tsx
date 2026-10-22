"use client";

import Link from "@/components/learning/learning-link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { topicReturnHref } from "@/lib/learning/navigation";
import styles from "./learning.module.css";

export function TopicRoadmapLink({ topicId }: { topicId: string }) {
  const query = useSearchParams();
  return <Link className={styles.returnLink} href={topicReturnHref(topicId, query.get("from"))}>
    <ArrowLeft size={15} aria-hidden="true" />Back to the learning tree
  </Link>;
}
