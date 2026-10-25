// Offline adapter to existing result forms. No network, client, credentials or
// apply mode. Callers retain restricted originals/derived participant rows outside Git.
import assert from "node:assert/strict";

export function prepareKazakhstanStandings(screenshot, workbookValues, permission, awards = null) {
  assert.equal(permission.confirmedBy, "Zhunussov");
  assert.equal(permission.scope, "public_kaiz_names_and_results_2025_2026");
  assert.equal(permission.productionExecutionAuthorized, false);
  assert.equal(screenshot.rows.length, 38);
  assert.equal(workbookValues.length, 41);
  assert.equal(workbookValues[0][1], "Final Scores AI Olymp Final 2026");
  const headers = workbookValues[1];
  assert.deepEqual(headers.slice(0, 5), ["Rank", "Username", "First Name", "Last Name", "Total Score"]);
  const urls = {
    2025: "https://dsml.kz/ru/news/d6e58068-8ad0-4f7e-b536-51fa8389b0d9",
    2026: "https://dsml.kz/ru/news/87047a67-d53a-409e-9ed5-eb32341485d7",
  };
  const originalsConfirmed = permission.organizerOriginalsConfirmed === true;
  const coverage = year => `${year === 2025 ? 38 : 39} entries in the organizer-supplied ${year} final standings; the organizer reports 40 ${year === 2025 ? "finalists" : "qualified students"}. Missing entries are not reconstructed. This is the authoritative provided version, not a complete 40-person roster.`;
  const make = (year, columns, entries) => ({
    key: `ai-olymp-kazakhstan-${year}-final`, competitionSlug: `ai-olymp-kazakhstan-${year}`,
    sourceIds: [`kz-${year}-owner-confirmed`], division: year === 2025 ? "Final standings (includes remote stage)" : "Final standings", coverage: "partial",
    publicationDate: null,
    notes: coverage(year) + " Original private source retained outside Git; public organizer recap is attribution, not a public copy of the score file.",
    form: {
      name: year === 2025 ? "Final standings (includes remote stage) — partial supplied table" : "Final standings — partial supplied table",
      status: "official", source: "organizer_provided", sourceLabel: "Organizer-provided standings; owner-confirmed permission",
      sourceUrl: urls[year], published: false,
      presentation: { availability: "OFFICIAL_STAGE_RESULTS", coverage: "partial",
        stageLabel: year === 2025 ? "Final standings (includes remote stage)" : "Final standings",
        columns, notes: coverage(year) + (year === 2025 ? " Original remote-stage and two contest-day scores retained. No medals inferred from highlighting." : " Original task scores and ties retained. Medals, when present, are matched by name to the public organizer award announcement, not inferred from rank.") },
    }, entries,
  });
  const entry = (name, rank, score, id, source, presentation) => {
    assert.ok(typeof name === "string" && name.trim());
    assert.ok(Number.isInteger(rank) && rank > 0);
    assert.ok(Number.isFinite(score));
    return { participantType: "individual", participantName: name, countryCode: null, rank, score,
      scoreDisplay: String(score), award: null, resultStatus: "ranked", externalParticipantId: id,
      sourceIds: [source], presentation };
  };
  const a = screenshot.rows.map((r, i) => {
    assert.equal(r.total, r.remote + r.day_1 + r.day_2);
    assert.equal(r.award, null, "Never infer awards from image colours");
    return entry(`${r.last_name} ${r.first_name}`, r.rank, r.total, `kz-2025-image-row-${i + 1}`, "kz-2025-owner-confirmed", {
      city: r.city, scores: { remote_stage: r.remote, day_1: r.day_1, day_2: r.day_2 },
    });
  });
  const b = workbookValues.slice(2).map((r, i) => {
    assert.equal(r[4], r[5] + r[6] + r[7]);
    return entry(`${r[2]} ${r[3]}`, r[0], r[4], `kz-2026-final-row-${i + 1}`, "kz-2026-owner-confirmed", {
      scores: { source_username: r[1], task_1: r[5], task_2: r[6], task_3: r[7] },
    });
  });
  assert.equal(a.filter(r => r.rank === 36).length, 2);
  assert.equal(b.length, 39);
  // Explicit, reviewed name aliases only: no fuzzy matching, rank thresholds or
  // colour-derived awards. Callers keep the source-name join outside Git.
  if (awards !== null) {
    assert.equal(originalsConfirmed, true);
    assert.equal(awards.verified, true);
    assert.equal(awards.sourceUrl, urls[2026]);
    assert.equal(awards.mappings.length, 23);
    const sourceNames = new Set(), officialNames = new Set(), counts = { Gold: 0, Silver: 0, Bronze: 0 };
    for (const mapping of awards.mappings) {
      assert.ok(Object.hasOwn(counts, mapping.award));
      assert.ok(typeof mapping.officialName === "string" && mapping.officialName.trim());
      assert.ok(!sourceNames.has(mapping.sourceName) && !officialNames.has(mapping.officialName), "Ambiguous award alias");
      const matches = b.filter(row => row.participantName === mapping.sourceName);
      assert.equal(matches.length, 1, "Award source name must match exactly one original row");
      matches[0].award = mapping.award;
      sourceNames.add(mapping.sourceName); officialNames.add(mapping.officialName); counts[mapping.award]++;
    }
    assert.deepEqual(counts, { Gold: 3, Silver: 5, Bronze: 15 });
  }
  return {
    mode: "review_only", productionWrites: 0, approvalReady: false, permission,
    holds: [...(originalsConfirmed ? [] : ["Organizer-original identity/final-version confirmation for both datasets"]), "Batch B parent creation, Batch C draft import and Batch D publication each require separate owner authorization"],
    internalReviewNotes: ["2025 image row 37 city: preserve original transcription; the organizer qualification article identifies the school as Кішішыған ОМ, but does not independently establish a canonical city spelling. Do not expose this internal note as a public row comment.", "2025 May 3–5 is an owner-reported programme window, not independently verified contest dates. 2026 competition rounds are April 11–12; no additional precise dates inferred."],
    sources: [2025, 2026].map(year => ({ id: `kz-${year}-owner-confirmed`, url: urls[year], checkedAt: "2026-10-25", status: "verified", fields: ["event identity", "owner-attested official participant results"], notes: "Owner confirms direct organizer provenance, use for camp selection/medals, and permission for KAIZ public names, scores and ranks. Private originals are separately hashed and must not be linked. Public recap is attribution, not the private score file." })),
    resultSets: [make(2025, [
      { key: "remote_stage", label: "Баллы за remote stage" },
      { key: "day_1", label: "Баллы за первый день" },
      { key: "day_2", label: "Баллы за второй день" },
    ], a), make(2026, [
      { key: "source_username", label: headers[1] },
      ...headers.slice(5, 8).map((label, i) => ({ key: `task_${i + 1}`, label })),
    ], b)],
  };
}
