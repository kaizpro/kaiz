import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { LessonProgress } from "@/lib/learning/course";

const unavailable = "Learning progress is temporarily unavailable. Saved completions and XP are not shown; no empty state is assumed.";
// Never log provider messages, request URLs, session details or account identifiers.
function reportFailure(operation: "read" | "complete", error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "transport";
  console.error("[learning-progress]", { operation, code: ["PGRST205", "PGRST202", "42P01", "42501", "57014"].includes(code) ? code : "unknown" });
}

export async function getOwnLearningState() {
  const user = hasSupabaseEnv() ? await getCurrentUser() : null;
  if (!user) return { user: null, records: [] as LessonProgress[], error: null };
  try {
    const client = await createClient();
    const { data, error } = await client.from("learning_progress")
      .select("roadmap_id,lesson_id,completed_at,started_at,updated_at").eq("user_id", user.id);
    if (error) { reportFailure("read", error); return { user: { id: user.id }, records: [] as LessonProgress[], error: unavailable }; }
    return { user: { id: user.id }, records: (data ?? []) as LessonProgress[], error: null };
  } catch (error) {
    reportFailure("read", error);
    return { user: { id: user.id }, records: [] as LessonProgress[], error: unavailable };
  }
}

export async function writeOwnCompletion(roadmapId: string, lessonId: string, completed: boolean) {
  const user = hasSupabaseEnv() ? await getCurrentUser() : null;
  if (!user) return { error: "Sign in to save your progress across devices." };
  try {
    const client = await createClient();
    // SQL derives the owner and timestamps; no client-supplied XP/counters.
    const { error } = await client.rpc("set_learning_completion", { p_roadmap_id: roadmapId, p_lesson_id: lessonId, p_completed: completed });
    if (error) throw error;
    return { success: completed ? "Lesson completed. Learning XP updated." : "Completion removed. Learning XP updated." };
  } catch (error) {
    reportFailure("complete", error);
    return { error: "Progress could not be confirmed. Reload to check your saved state before trying again." };
  }
}
