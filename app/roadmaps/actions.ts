"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCourseLesson, lessonHref } from "@/lib/learning/course";
import { writeOwnCompletion } from "@/lib/data/learning-progress";
export type CompletionState = { error?: string; success?: string };
const input = z.object({ roadmap: z.enum(["beginner", "intermediate", "advanced"]), lesson: z.string().min(1).max(160), completed: z.enum(["true", "false"]) });
export async function setLessonCompletion(roadmap: string, lesson: string, _: CompletionState, form: FormData): Promise<CompletionState> {
  const parsed = input.safeParse({ roadmap, lesson, completed: form.get("completed") });
  if (!parsed.success || !getCourseLesson(roadmap, lesson)) return { error: "This lesson is not part of the current roadmap." };
  const result = await writeOwnCompletion(roadmap, lesson, parsed.data.completed === "true");
  if (result.success) {
    revalidatePath(`/roadmaps/${roadmap}`); revalidatePath(`/start/${roadmap}`);
    revalidatePath(lessonHref(roadmap, lesson)); revalidatePath("/dashboard");
  }
  return result;
}
