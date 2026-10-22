import type { SupabaseClient } from "@supabase/supabase-js";

export type HeaderAccount =
  | { status: "pending" | "unavailable" | "guest" }
  | { status: "member"; username: string | null };

// Presentation only. Protected pages/actions must still authenticate on the
// server; neither this state nor a cached public page grants authorization.
export async function readHeaderAccount(client: SupabaseClient): Promise<HeaderAccount> {
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (!user) return { status: error && error.name !== "AuthSessionMissingError" ? "unavailable" : "guest" };
    if (error) return { status: "unavailable" };
    const profile = await client.from("profiles").select("username").eq("id", user.id).maybeSingle();
    if (profile.error) return { status: "unavailable" };
    return { status: "member", username: profile.data?.username ?? null };
  } catch {
    return { status: "unavailable" };
  }
}
