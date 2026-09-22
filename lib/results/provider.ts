export type ResultSource = "manual" | "official_import" | "kaiz" | "kaggle" | (string & {});

export type ProviderResultEntry = {
  externalParticipantId: string;
  participantName: string;
  participantType: "individual" | "team";
  rank: number | null;
  score: number | null;
  scoreDisplay?: string | null;
  countryCode?: string | null;
  award?: string | null;
  status: "ranked" | "unranked" | "disqualified";
  metadata?: Record<string, unknown>;
};

export type ProviderResultSnapshot = {
  status: "official" | "provisional";
  source: ResultSource;
  sourceLabel?: string | null;
  sourceUrl?: string | null;
  fetchedAt: string;
  entries: ProviderResultEntry[];
};

export interface CompetitionResultProvider {
  readonly id: ResultSource;
  readonly supportsSync: boolean;
  getResults(externalCompetitionId: string): Promise<ProviderResultSnapshot>;
}

// Manual result management uses authenticated KAIZ server actions and does not
// require a remote provider implementation. Kaggle and other adapters can later
// implement CompetitionResultProvider without changing the core tables or UI.
export const RESULT_SOURCE_LABELS: Record<string, string> = {
  manual: "Manual entry",
  official_import: "Official import",
  kaiz: "KAIZ",
  kaggle: "Kaggle",
};

