import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type ProblemDifficultyStatus = "unrated" | "provisional" | "rated";
export type ProblemMetricDirection = "higher_is_better" | "lower_is_better";

export type ProblemCompetition = {
  id: string;
  title: string;
  slug: string;
};

export type ProblemStatisticSnapshot = {
  id: string;
  problem_id: string;
  population_scope: string;
  status: ProblemDifficultyStatus;
  sample_size: number;
  median_normalized_performance: number | null;
  percentile_10: number | null;
  percentile_25: number | null;
  percentile_75: number | null;
  percentile_90: number | null;
  calculation_version: string;
  calculated_at: string;
};

export type Problem = {
  id: string;
  competition_id: string | null;
  title: string;
  slug: string;
  problem_code: string | null;
  summary: string | null;
  statement_markdown: string | null;
  statement_url: string | null;
  category: string;
  tags: string[];
  metric_name: string;
  metric_direction: ProblemMetricDirection;
  reference_score: number | null;
  difficulty_status: ProblemDifficultyStatus;
  difficulty_rating: number | null;
  source_provider: string;
  source_label: string | null;
  source_url: string | null;
  source_external_id: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  competition: ProblemCompetition | null;
  statistics: ProblemStatisticSnapshot | null;
};

export type ProblemPerformance = {
  id: string;
  raw_score: number;
  normalized_performance: number | null;
  attempted_at: string;
  status: "valid" | "invalidated" | "disqualified";
  user: { username: string | null; display_name: string } | null;
};

const problemSelect = `
  id,competition_id,title,slug,problem_code,summary,statement_markdown,statement_url,
  category,tags,metric_name,metric_direction,reference_score,difficulty_status,
  difficulty_rating,source_provider,source_label,source_url,source_external_id,
  published,sort_order,created_at,
  competition:competitions(id,title,slug)
`;

function cleanSearch(value?: string) {
  return value?.trim().replace(/[^\p{L}\p{N}\s-]/gu, "").slice(0, 80) ?? "";
}

async function attachCurrentStatistics(problems: Omit<Problem, "statistics">[]) {
  if (!problems.length) return [] as Problem[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problem_statistic_snapshots")
    .select("id,problem_id,population_scope,status,sample_size,median_normalized_performance,percentile_10,percentile_25,percentile_75,percentile_90,calculation_version,calculated_at")
    .in("problem_id", problems.map((problem) => problem.id))
    .eq("is_current", true)
    .eq("population_scope", "all_valid");
  if (error) throw new Error("Unable to load problem statistics.");
  const byProblem = new Map((data ?? []).map((item) => [item.problem_id, item as ProblemStatisticSnapshot]));
  return problems.map((problem) => ({ ...problem, statistics: byProblem.get(problem.id) ?? null }));
}

export async function listProblems(options: {
  query?: string;
  difficulty?: string;
  direction?: string;
} = {}) {
  if (!hasSupabaseEnv()) return [] as Problem[];
  const supabase = await createClient();
  let request = supabase
    .from("problems")
    .select(problemSelect)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .order("title", { ascending: true });
  const query = cleanSearch(options.query);
  if (query) request = request.or(`title.ilike.%${query}%,category.ilike.%${query}%`);
  if (["unrated", "provisional", "rated"].includes(options.difficulty ?? "")) {
    request = request.eq("difficulty_status", options.difficulty);
  }
  if (["higher_is_better", "lower_is_better"].includes(options.direction ?? "")) {
    request = request.eq("metric_direction", options.direction);
  }
  const { data, error } = await request;
  if (error) throw new Error("Unable to load the problem archive.");
  return attachCurrentStatistics((data ?? []) as unknown as Omit<Problem, "statistics">[]);
}

export async function getProblem(slug: string) {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problems")
    .select(problemSelect)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error("Unable to load this problem.");
  if (!data) return null;
  const [problem] = await attachCurrentStatistics([data as unknown as Omit<Problem, "statistics">]);
  return problem;
}

export async function listCompetitionProblems(competitionId: string) {
  if (!hasSupabaseEnv()) return [] as Problem[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problems")
    .select(problemSelect)
    .eq("competition_id", competitionId)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw new Error("Unable to load competition problems.");
  return attachCurrentStatistics((data ?? []) as unknown as Omit<Problem, "statistics">[]);
}

export async function listOfficialProblemPerformances(problemId: string, limit = 10) {
  if (!hasSupabaseEnv()) return [] as ProblemPerformance[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problem_performances")
    .select("id,raw_score,normalized_performance,attempted_at,status,user:profiles!problem_performances_user_id_fkey(username,display_name)")
    .eq("problem_id", problemId)
    .eq("attempt_type", "official")
    .eq("status", "valid")
    .order("normalized_performance", { ascending: false, nullsFirst: false })
    .order("attempted_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error("Unable to load official problem performances.");
  return (data ?? []) as unknown as ProblemPerformance[];
}

export async function getBestPracticePerformance(problemId: string, userId: string) {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problem_performances")
    .select("id,raw_score,normalized_performance,attempted_at,status")
    .eq("problem_id", problemId)
    .eq("user_id", userId)
    .eq("attempt_type", "practice")
    .eq("status", "valid")
    .order("normalized_performance", { ascending: false, nullsFirst: false })
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Unable to load your practice performance.");
  return data as Omit<ProblemPerformance, "user"> | null;
}
