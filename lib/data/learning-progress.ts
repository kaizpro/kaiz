import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { LessonProgress } from "@/lib/learning/course";

export async function getOwnLearningState() {
  const user = hasSupabaseEnv() ? await getCurrentUser() : null;
  if (!user) return { user: null, records: [] as LessonProgress[], error: null };
  const client = await createClient();
  const { data, error } = await client.from("learning_progress")
    .select("roadmap_id,lesson_id,completed_at,started_at,updated_at").eq("user_id", user.id);
  return { user: { id: user.id }, records: (data ?? []) as LessonProgress[], error: error ? "Saved learning progress is unavailable. No completion state is assumed. Try again later." : null };
}

export async function writeOwnCompletion(roadmapId: string, lessonId: string, completed: boolean) {
  const user = hasSupabaseEnv() ? await getCurrentUser() : null;
  if (!user) return { error: "Sign in to save your progress across devices." };
  const client = await createClient();
  // SQL derives the owner and timestamps; no client-supplied XP/counters.
  const { error } = await client.rpc("set_learning_completion", { p_roadmap_id: roadmapId, p_lesson_id: lessonId, p_completed: completed });
  return error ? { error: "Progress could not be confirmed. Reload to check your saved state before trying again." } : { success: completed ? "Lesson completed. Learning XP updated." : "Completion removed. Learning XP updated." };
}
