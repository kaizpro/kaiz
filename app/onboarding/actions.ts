"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validation/profile";
export type ProfileState = { error?: string };
export async function saveProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser(); const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your profile." };
  const p = parsed.data; const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ username:p.username, display_name:p.displayName, bio:p.bio||null, city:p.city||null, school:p.school||null, grade:p.grade||null, graduation_year:p.graduationYear||null, website:p.website||null }).eq("id", user.id);
  if (error) return { error: error.code === "23505" ? "That username is already taken." : error.message };
  const accounts = [{ provider:"kaggle", external_username:p.kaggleUsername }, { provider:"github", external_username:p.githubUsername }];
  for (const account of accounts) {
    const query = account.external_username
      ? supabase.from("external_accounts").upsert({ ...account, user_id:user.id }, { onConflict:"user_id,provider" })
      : supabase.from("external_accounts").delete().eq("user_id", user.id).eq("provider", account.provider);
    const { error: accountError } = await query;
    if (accountError) return { error: "Your profile was saved, but a linked account could not be updated." };
  }
  redirect(`/u/${p.username}`);
}
