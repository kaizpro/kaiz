import { getNode, getPath, type TrackId } from "./curriculum";

export interface RoadmapState {
  track: TrackId | null;
  open: readonly string[];
  topic: string | null;
}
function isTrack(value: string | null): value is TrackId { return value === "coding-ai" || value === "mathematics"; }

export function readRoadmapState(query: Pick<URLSearchParams, "get">): RoadmapState {
  const value = query.get("track");
  const track = isTrack(value) ? value : null;
  const candidate = getNode(query.get("topic") ?? "");
  const topic = candidate?.kind === "topic" && candidate.track === track ? candidate.id : null;
  const open = new Set<string>();
  for (const id of (query.get("open") ?? "").split(",")) {
    const node = getNode(id);
    if (node?.kind !== "group" || node.track !== track) continue;
    for (const parent of getPath(id).filter((entry) => entry.kind === "group")) open.add(parent.id);
  }
  return { track, topic, open: [...open] };
}

export function roadmapHref(state: RoadmapState): string {
  if (!state.track) return "/learn";
  const query = new URLSearchParams({ track: state.track });
  if (state.open.length) query.set("open", state.open.join(","));
  if (state.topic) query.set("topic", state.topic);
  return `/learn?${query}`;
}

export function roadmapForNode(id: string): string {
  const node = getNode(id);
  if (!node?.track) return "/learn";
  const open = getPath(id).filter((entry) => entry.kind === "group").map((entry) => entry.id);
  return `${roadmapHref({ track: node.track, open, topic: node.kind === "topic" ? node.id : null })}#node-${node.id}`;
}

export function toggleBranch(state: RoadmapState, id: string): RoadmapState {
  const node = getNode(id);
  if (node?.kind !== "group" || node.track !== state.track) return state;
  if (state.open.includes(id)) {
    return { ...state, open: state.open.filter((entry) => !getPath(entry).some((parent) => parent.id === id)) };
  }
  return { ...state, open: [...new Set([...state.open, ...getPath(id).filter((entry) => entry.kind === "group").map((entry) => entry.id)])] };
}

// Preserve other open branches, but never accept an external return destination.
export function topicReturnHref(id: string, from: string | null): string {
  const node = getNode(id);
  if (!node || node.kind !== "topic" || !from?.startsWith("/learn?") || from.length > 4000) return roadmapForNode(id);
  const url = new URL(from, "https://kaiz.invalid");
  if (url.origin !== "https://kaiz.invalid" || url.pathname !== "/learn") return roadmapForNode(id);
  const state = readRoadmapState(url.searchParams);
  if (state.track !== node.track) return roadmapForNode(id);
  const ancestors = getPath(id).filter((entry) => entry.kind === "group").map((entry) => entry.id);
  return `${roadmapHref({ ...state, open: [...new Set([...state.open, ...ancestors])], topic: id })}#node-${id}`;
}
