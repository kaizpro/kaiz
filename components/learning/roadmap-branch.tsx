"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, Braces, Binary, ChartNoAxesCombined, BrainCircuit, Layers, ScanEye, Trophy, Variable, Grid2X2, Infinity, Dices, ChartLine, Network, TrendingDown, type LucideIcon } from "lucide-react";
import { getPath, getTopics, topicHref, type CurriculumNode } from "@/lib/learning/curriculum";
import { roadmapHref, type RoadmapState } from "@/lib/learning/navigation";
import styles from "./learning.module.css";

const areaIcons: Record<string, LucideIcon> = {
  programming: Braces, algorithms: Binary, "data-science": ChartNoAxesCombined,
  "machine-learning": BrainCircuit, "deep-learning": Layers, "ai-specializations": ScanEye,
  "ai-competitions": Trophy, "math-foundations": Variable, "linear-algebra": Grid2X2,
  calculus: Infinity, probability: Dices, statistics: ChartLine, "discrete-math": Network, optimization: TrendingDown,
};
interface Props {
  node: CurriculumNode;
  state: RoadmapState;
  path: readonly string[];
  ready: boolean;
  onToggle: (id: string) => void;
}

export function RoadmapBranch({ node, state, path, ready, onToggle }: Props) {
  const open = state.open.includes(node.id);
  const active = path.includes(node.id);
  const Icon = areaIcons[node.id];
  if (node.kind === "topic") {
    const returnTo = `${roadmapHref({ ...state, topic: node.id })}#node-${node.id}`;
    return (
      <Link id={`node-${node.id}`} className={styles.topic} data-active={active}
        href={`${topicHref(node)}?from=${encodeURIComponent(returnTo)}`} prefetch={false}
        aria-current={active ? "location" : undefined}>
        <span className={styles.topicDot} aria-hidden="true" />
        <span>{node.title}</span><ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    );
  }
  const parentDepth = getPath(node.id).length;
  const levelLabel = parentDepth === 3 ? "Learning area" : node.parentId === "programming" ? "Path" : "Subcategory";
  const topicCount = getTopics(node.track!).filter((topic) => getPath(topic.id).some((parent) => parent.id === node.id)).length;
  return (
    <div className={styles.branch} data-open={open} data-active={active} data-major={parentDepth === 3}>
      <button id={`node-${node.id}`} type="button" className={styles.branchButton}
        aria-expanded={open} aria-controls={`children-${node.id}`} disabled={!ready} onClick={() => onToggle(node.id)}>
        {Icon && <span className={styles.areaIcon}><Icon size={20} aria-hidden="true" /></span>}
        <span className={styles.branchText}>
          <small className={styles.nodeMeta}>{levelLabel} · {topicCount} topics</small>
          <strong>{node.title}</strong><span>{node.description}</span>
        </span>
        <ChevronDown className={styles.chevron} size={17} aria-hidden="true" />
      </button>
      <div id={`children-${node.id}`} className={styles.disclosure} data-open={open} aria-hidden={!open} inert={!open}>
        <div className={styles.disclosureInner}>
          <ul className={styles.children} data-topics={node.children.every((child) => child.kind === "topic")}
            data-groups={node.children.length === 2 && node.children.every((child) => child.kind === "group")} aria-label={`${node.title} topics`}>
            {node.children.map((child, index) => (
              <li key={child.id} className={styles.child} data-active={path.includes(child.id)} style={{ "--node-order": Math.min(index, 5) } as React.CSSProperties}>
                <RoadmapBranch node={child} state={state} path={path} ready={ready} onToggle={onToggle} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
