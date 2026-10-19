"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./skill-atlas.module.css";

type Line = { d: string; active: boolean };

// The SVG is decorative; the server-rendered links remain the navigation.
export function SkillAtlasCanvas({ area, children }: { area?: number; children: ReactNode }) {
  const canvas = useRef<HTMLDivElement>(null);
  const previousArea = useRef(area);
  const branchHadFocus = useRef(false);
  const [geometry, setGeometry] = useState<{ area?: number; lines: Line[] }>({ area, lines: [] });
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    if (area === undefined && previousArea.current !== undefined && branchHadFocus.current) {
      element.querySelector<HTMLElement>(`[data-path-area="${previousArea.current}"] a`)?.focus();
    }
    previousArea.current = area;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const root = element.querySelector<HTMLElement>("[data-atlas-root]")!.getBoundingClientRect();
      const links = [...element.querySelectorAll<HTMLElement>("[data-path-area] a")];
      const nodes = links.map(link => ({ link: link.getBoundingClientRect(), orb: link.querySelector<HTMLElement>("[data-atlas-orb]")!.getBoundingClientRect() })).filter(node => node.orb.width > 0);
      const branch = element.querySelector<HTMLElement>("[data-atlas-branch]")?.getBoundingClientRect();
      const vertical = getComputedStyle(element).getPropertyValue("--atlas-vertical").trim() === "1";
      const x = root.left + root.width / 2 - bounds.left, y = root.bottom - bounds.top;
      const lines: Line[] = nodes.map(node => {
        const nx = (vertical ? node.orb.left : node.orb.left + node.orb.width / 2) - bounds.left;
        const ny = (vertical ? node.orb.top + node.orb.height / 2 : node.orb.top) - bounds.top;
        return { d: vertical ? `M ${x} ${y} V ${y + 16} H 12 V ${ny} H ${nx}` : `M ${x} ${y} V ${y + 32} H ${nx} V ${ny}`, active: false };
      });
      const selected = links.find(link => link.getAttribute("aria-current") === "step");
      if (branch && selected && !vertical) {
        const node = selected.getBoundingClientRect();
        const nx = node.left + node.width / 2 - bounds.left, ny = node.bottom - bounds.top;
        const bx = branch.left + branch.width / 2 - bounds.left, by = branch.top - bounds.top;
        lines.push({ d: `M ${nx} ${ny} V ${by - 16} H ${bx} V ${by}`, active: true });
      }
      setGeometry({ area, lines });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    element.querySelectorAll("[data-atlas-root], [data-path-area], [data-atlas-branch]").forEach(node => observer.observe(node));
    document.fonts.ready.then(() => { if (!disposed) schedule(); });
    schedule();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); };
  }, [area]);
  return <div className={styles.canvas} data-selected={area !== undefined} ref={canvas}
    onFocusCapture={event => { branchHadFocus.current = Boolean(event.target.closest("[data-atlas-branch]")); }}>
    <svg className={styles.connections} aria-hidden="true" data-atlas-connections>
      {geometry.area === area && geometry.lines.map((line, index) => <path key={index} d={line.d} data-active={line.active} pathLength="1"/>)}
    </svg>
    {children}
  </div>;
}
