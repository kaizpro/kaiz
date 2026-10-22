"use client";

import { useSyncExternalStore, type FormEvent } from "react";
import Link from "@/components/learning/learning-link";
import { SourceTopicRow } from "@/components/learning/source-topic-row";
import { filterSourceTopics, topicGroups } from "@/lib/learning/source-inventory";
import styles from "@/components/training/catalog.module.css";

const changeEvent = "kaiz-topic-filters";
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(changeEvent, listener);
  return () => { window.removeEventListener("popstate", listener); window.removeEventListener(changeEvent, listener); };
}
const browserQuery = () => window.location.search;
const serverQuery = () => "";

export function TopicCatalog() {
  // Every query variant shares the same public HTML. Filtering and back/forward
  // work locally; no query-dependent RSC request or account data is necessary.
  const query = new URLSearchParams(useSyncExternalStore(subscribe, browserQuery, serverQuery));
  const q = (query.get("q") ?? "").slice(0, 80);
  const rawGroup = query.get("group") ?? "";
  const group = topicGroups.includes(rawGroup) ? rawGroup : "";
  const topics = filterSourceTopics(q, group);
  function navigate(search: string) {
    window.history.pushState(null, "", `/learn/topics${search}`);
    window.dispatchEvent(new Event(changeEvent));
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    const term = String(values.get("q") ?? "").slice(0, 80);
    const selected = String(values.get("group") ?? "");
    if (term) next.set("q", term);
    if (topicGroups.includes(selected)) next.set("group", selected);
    navigate(next.size ? `?${next}` : "");
  }
  return <>
    <form key={`${q}:${group}`} method="get" onSubmit={apply} className={styles.toolbar} aria-label="Topic filters"><label>Search topics<input name="q" aria-label="Search topics" defaultValue={q} maxLength={80} placeholder="Topic or technique" className={styles.control}/></label><label>Topic group<select name="group" aria-label="Topic group" defaultValue={group} className={styles.control}><option value="">All groups</option>{topicGroups.map(name => <option key={name}>{name}</option>)}</select></label><button className={`${styles.action} ${styles.primary}`}>Apply filters</button></form>
    <p className={styles.count} role="status">{topics.length} source entries{(q || group) && <> · <Link href="/learn/topics" className="text-primary underline" onClick={event => { event.preventDefault(); navigate(""); }}>Clear filters</Link></>}</p>
    {!topics.length && <p className={styles.note}>No topics match. Try another group or broader search.</p>}
    {topicGroups.map(name => {
      const entries = topics.filter(topic => topic.group === name);
      return entries.length ? <section key={name} aria-label={name}><h2 className={styles.sectionTitle}>{name} <span className="text-xs font-normal text-muted-foreground">{entries.length}</span></h2><div className={styles.rows}><div className={styles.topicHeader} aria-hidden="true"><span>Topic / expand</span><span>Level</span><span>Materials</span><span>Coverage</span></div>{entries.map(entry => <SourceTopicRow key={entry.id} entry={entry}/>)}</div></section> : null;
    })}
    <noscript><p className={styles.note}>All topics are shown. Enable JavaScript to filter, or use your browser’s Find command.</p></noscript>
  </>;
}
