import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CompetitionResultEntry = {
  id: string;
  participant_type: "individual" | "team";
  participant_name: string;
  rank: number | null;
  score: number | null;
  score_display: string | null;
  country_code: string | null;
  award: string | null;
  result_status: "ranked" | "unranked" | "disqualified";
  external_participant_id: string | null;
  user_id: string | null;
  profiles: { username: string | null; display_name: string } | null;
};

export type CompetitionResultSet = {
  id: string;
  name: string;
  status: "official" | "provisional";
  source: string;
  source_label: string | null;
  source_url: string | null;
  published: boolean;
  fetched_at: string | null;
  imported_at: string | null;
  verified_at: string | null;
  created_at: string;
  competition_results: CompetitionResultEntry[];
};

const resultSetSelect = `
  id,name,status,source,source_label,source_url,published,
  fetched_at,imported_at,verified_at,created_at,
  competition_results(
    id,participant_type,participant_name,rank,score,score_display,
    country_code,award,result_status,external_participant_id,user_id,
    profiles:profiles!competition_results_user_id_fkey(username,display_name)
  )
`;

export async function getPublishedCompetitionResults(competitionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competition_result_sets")
    .select(resultSetSelect)
    .eq("competition_id", competitionId)
    .eq("published", true)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .order("rank", { referencedTable: "competition_results", ascending: true, nullsFirst: false });
  if (error) throw new Error("Unable to load competition results.");
  return (data ?? []) as unknown as CompetitionResultSet[];
}
