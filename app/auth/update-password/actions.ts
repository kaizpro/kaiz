"use server";

import { redirect } from "next/navigation";
import { profileDestination } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema } from "@/lib/validation/auth";

export type UpdatePasswordState = {
  error?: string;
};

function passwordErrorMessage(code?: string) {
  switch (code) {
    case "same_password":
      return "Choose a password that is different from your current password.";
    case "weak_password":
      return "Choose a stronger password and try again.";
    case "session_not_found":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
      return "This recovery session has expired. Request a new password reset link.";
    default:
      return "Unable to update the password. Request a new reset link if the problem continues.";
  }
}

export async function updatePassword(
  _previousState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));

  if (!parsed.success) {
    return { error: "Password must be between 8 and 72 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "This recovery session has expired. Request a new password reset link." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data });

  if (error) {
    return { error: passwordErrorMessage(error.code) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  redirect(profileDestination(profile));
}
