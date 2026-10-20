// Offline adapter to existing result forms. No network, client, credentials or
// apply mode. Callers retain restricted originals/derived participant rows outside Git.
import assert from "node:assert/strict";

export function prepareKazakhstanStandings(screenshot, workbookValues, permission) {
  assert.equal(permission.confirmedBy, "Zhunussov");
  assert.equal(permission.scope, "public_kaiz_names_and_results_2025_2026");
  assert.equal(permission.productionExecutionAuthorized, false);
  assert.equal(screenshot.rows.length, 38);
  assert.equal(workbookValues.length, 41);
  assert.equal(workbookValues[0][1], "Final Scores AI Olymp Final 2026");
  const headers = workbookValues[1];
  assert.deepEqual(headers.slice(0, 5), ["Rank", "Username", "First Name", "Last Name", "Total Score"]);
  const urls = {
    2025: "https://www.gov.kz/org/maidd/press/news/details/989919",
    2026: "https://www.gov.kz/org/astana/press/news/details/1199320",
  };
  const make = (year, columns, entries) => ({
    key: `ai-olymp-kazakhstan-${year}-final`, competitionSlug: `ai-olymp-kazakhstan-${year}`,
    sourceIds: [`kz-${year}-owner-confirmed`], division: year === 2025 ? "Final standings (includes remote stage)" : "Final standings", coverage: "partial",
    publicationDate: null,
    notes: "All supplied rows retained. Full event roster and exact final dates require confirmation. Original private source retained outside Git; linked official report corroborates the event, not every score.",
    form: {
      name: year === 2025 ? "Final standings (includes remote stage) — partial supplied table" : "Final standings — partial supplied table",
      status: "official", source: "organizer_provided", sourceLabel: "Organizer-provided standings; owner-confirmed permission",
      sourceUrl: urls[year], published: false,
      presentation: { availability: "OFFICIAL_STAGE_RESULTS", coverage: "partial",
        stageLabel: year === 2025 ? "Final standings (includes remote stage)" : "Final standings",
        columns, notes: "Owner confirms official standings and permission. All supplied rows shown; full-roster completeness and exact event dates remain unconfirmed. No awards inferred." },
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
      ...(i === 36 ? { comments: "City spelling retained from transcription; image legibility requires confirmation." } : {}),
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
  return {
    mode: "review_only", productionWrites: 0, approvalReady: false, permission,
    holds: ["Organizer-original identity/final-version confirmation for both datasets", "Owner-reported dates require original-source verification", "Missing Kazakhstan competition parents in production", "One 2025 city spelling requires review; full-roster completeness is not claimed"],
    sources: [2025, 2026].map(year => ({ id: `kz-${year}-owner-confirmed`, url: urls[year], checkedAt: "2026-10-19", status: "verified", fields: ["event identity", "owner-attested official participant results"], notes: "Owner attestation covers public names/results. No independent organizer permission document reviewed. Report URL is event corroboration; private score original is separately hashed." })),
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
