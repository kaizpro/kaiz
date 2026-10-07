"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { problemSchema, problemValidationError, type ProblemActionState } from "@/lib/validation/problem";

function databaseError(code?: string): ProblemActionState {
  if (code === "23505") return { error: "That slug or source identity already exists. Choose a unique slug and source ID." };
  if (code === "23503") return { error: "Competition context changed or is used by official evidence. Reload and keep its linked competition intact." };
  return { error: "Problem could not be saved. Reload and try again." };
}

async function saveProblem(id: string | null, formData: FormData): Promise<ProblemActionState> {
  const admin = await requireAdmin();
  if (id !== null && !z.uuid().safeParse(id).success) return { error: "Invalid problem ID." };
  const parsed = problemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return problemValidationError(parsed.error);
  const supabase = await createClient();
  if (parsed.data.competition_id) {
    const { data, error } = await supabase.from("competitions").select("id").eq("id", parsed.data.competition_id).maybeSingle();
    if (error || !data) return { error: "Selected competition no longer exists. Reload and choose an available competition.", fields: { competition_id: ["Competition unavailable"] } };
  }
  let oldSlug: string | undefined;
  if (id) {
    const { data, error } = await supabase.from("problems").select("slug").eq("id", id).maybeSingle();
    if (error || !data) return { error: "Problem no longer exists or is unavailable." };
    oldSlug = data.slug;
  }
  // Parsed allowlist only. Existing provenance is preserved, never overwritten by form fields.
  const request = id
    ? supabase.from("problems").update({ ...parsed.data, updated_by: admin.id }).eq("id", id)
    : supabase.from("problems").insert({ ...parsed.data, created_by: admin.id, updated_by: admin.id });
  const { data, error } = await request.select("id,slug").maybeSingle();
  if (error) return databaseError(error.code);
  if (!data) return { error: "Nothing was saved. Reload and try again." };
  revalidatePath("/admin/problems");
  revalidatePath("/problems");
  revalidatePath(`/problems/${parsed.data.slug}`);
  if (oldSlug && oldSlug !== parsed.data.slug) revalidatePath(`/problems/${oldSlug}`);
  revalidatePath("/competitions", "layout");
  redirect(`/admin/problems/${data.id}/edit?saved=1`);
}

export async function createProblem(_: ProblemActionState, formData: FormData) {
  return saveProblem(null, formData);
}

export async function updateProblem(id: string, _: ProblemActionState, formData: FormData) {
  return saveProblem(id, formData);
}
