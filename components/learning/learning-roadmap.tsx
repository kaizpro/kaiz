"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { ArrowRight, Braces, Compass, GitBranch, Sigma } from "lucide-react";
import { getChildren, getNode, getPath, getTopics, stages, type TrackId } from "@/lib/learning/curriculum";
import { readRoadmapState, roadmapHref, toggleBranch, type RoadmapState } from "@/lib/learning/navigation";
import { RoadmapBranch } from "./roadmap-branch";
import styles from "./learning.module.css";

// Server-rendered controls must not accept clicks before React attaches handlers.
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function LearningRoadmap() {
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const query = useSearchParams();
  const state = readRoadmapState(query);
  const track = state.track ? getNode(state.track) : null;
  const path = state.topic ? getPath(state.topic).map((node) => node.id) : [];

  // The static shell can handle a hash before the client-rendered nodes exist.
  useEffect(() => {
    const id = window.location.hash.match(/^#node-([a-z0-9-]+)$/)?.[1];
    if (!id || getNode(id)?.track !== state.track) return;
    const element = document.getElementById(`node-${id}`);
    if (element && !element.closest("[inert]")) {
      element.scrollIntoView({ block: "center", behavior: "instant" });
      element.focus({ preventScroll: true });
    }
  }, [query, state.track]);

  // Native history integrates with Next's search params without a server round trip.
  function update(next: RoadmapState) {
    window.history.pushState(null, "", roadmapHref(next));
  }
  function selectTrack(id: TrackId) {
    update({ track: id, open: [], topic: null });
  }

  return (
    <div className={styles.layout} data-exploring={Boolean(track)}>
      {track && state.track && <aside className={styles.guide} aria-label="Roadmap guide">
        <p className={styles.eyebrow}><Compass size={14} aria-hidden="true" /> YOUR EXPLORATION</p>
        <h2>{track.title}</h2>
        <p>{getTopics(state.track).length} topics · {track.children.length} learning areas</p>
        <div className={styles.guideRule} />
          <nav aria-label="Jump to learning area" className={styles.areaNav}>
            {getChildren(state.track).map((area) => (
              <a key={area.id} href={`#node-${area.id}`} data-open={state.open.includes(area.id)}
                aria-current={path.includes(area.id) ? "location" : undefined} onClick={() => {
                if (!state.open.includes(area.id)) update(toggleBranch(state, area.id));
              }}><span className={styles.navDot} aria-hidden="true" /><span>{area.title}</span>
                {state.open.includes(area.id) && <span className={styles.srOnly}>Expanded</span>}
              </a>
            ))}
          </nav>
        {state.topic && <div className={styles.guideContext}><p className={styles.eyebrow}>LAST EXPLORED</p><p>{getNode(state.topic)?.title}</p></div>}
        <p className={styles.guideNote}>Every topic is open to explore. Recommendations are guidance, not requirements.</p>
      </aside>}

      <div id="roadmap" tabIndex={-1} className={styles.board} data-track={state.track ?? "none"} aria-busy={!ready}>
        <div className={styles.boardCaption}><span className={styles.eyebrow}>KAIZ / LEARNING TREE</span><span className={styles.mapLegend}><i aria-hidden="true" /> Open exploration</span></div>
        <div className={styles.root}>
          <span className={styles.rootIcon}><GitBranch size={25} aria-hidden="true" /></span>
          <div><p className={styles.eyebrow}>START WITH CURIOSITY</p><h2>KAIZ Learning</h2></div>
        </div>
        <div className={styles.tracks} data-selected={state.track ?? "none"}>
          {getChildren("kaiz-learning").map((entry) => {
            const selected = entry.id === state.track;
            const Icon = entry.id === "coding-ai" ? Braces : Sigma;
            return (
              <div key={entry.id} className={styles.trackLimb} data-selected={selected}>
                <button type="button" className={styles.trackButton} aria-pressed={selected}
                  aria-controls="track-content" disabled={!ready} onClick={() => selectTrack(entry.id as TrackId)}>
                  <span className={styles.trackIcon}><Icon size={24} aria-hidden="true" /></span>
                  <strong>{entry.title}</strong>
                  <span className={styles.trackDescription}>{entry.description}</span>
                  <span className={styles.trackMeta}>{getTopics(entry.id as TrackId).length} topics <span>{selected ? "Exploring" : "Explore"}<ArrowRight size={13} aria-hidden="true" /></span></span>
                  {selected && <span className={styles.srOnly}>Selected track</span>}
                </button>
              </div>
            );
          })}
        </div>
        <div id="track-content">
          {state.track ? (
            <div className={styles.path} key={state.track}>
              <div className={styles.pathHeader}>
                <p role="status">Exploring <strong>{track?.title}</strong></p>
                <button type="button" className={styles.quietButton} disabled={!ready} onClick={() => update({ ...state, open: [] })}>Collapse branches</button>
              </div>
              <p className={styles.pathHint}>A suggested journey, not a checklist. Open any area independently.</p>
              <div className={styles.journey}>
              {stages[state.track].map((stage, index) => (
                <section className={styles.stage} key={stage.label} aria-label={stage.label}>
                  <h3 className={styles.stageLabel}><span>{String(index + 1).padStart(2, "0")}</span> {stage.label}</h3>
                  <div className={styles.fork} data-single={stage.areas.length === 1}>
                    {stage.areas.map((id) => {
                      const node = getNode(id)!;
                      return <div className={styles.limb} data-active={path.includes(id)} key={id}>
                        <RoadmapBranch node={node} state={state} path={path} ready={ready} onToggle={(branchId) => update(toggleBranch(state, branchId))} />
                      </div>;
                    })}
                  </div>
                </section>
              ))}
              </div>
              <p className={styles.endNote}>The map is a starting point. Your path is your own.</p>
            </div>
          ) : (
            <div className={styles.chooseTrack}>
              <h3>Where will you begin?</h3>
              <p>Choose a track above to unfold its learning tree.<br />You can switch paths at any time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
