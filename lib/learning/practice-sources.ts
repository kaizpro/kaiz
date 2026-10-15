import type { JourneyLevel } from "./journeys";

// Original publisher/organizer links reviewed 2026-10-14; no copied tasks or fake archive rows.
export const practiceSources: Readonly<Record<JourneyLevel, { title: string; href: string; note: string }>> = {
  beginner: { title: "MIT: introductory algorithm practice", href: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/practice-problems/", note: "Optional university-level exercises; start with the roadmap’s Python self-checks if these are too difficult." },
  intermediate: { title: "scikit-learn: worked ML examples", href: "https://scikit-learn.org/stable/auto_examples/index.html", note: "Choose a simple example, reproduce its baseline, and explain its validation approach." },
  advanced: { title: "IOAI 2024: official tasks and solutions", href: "https://ioai-official.org/2024-tasks/", note: "The organizer separates at-home, on-site and practical tasks. Read the relevant rules and work from the original materials." },
};
