import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  const supabase = await createClient();
  const [{ data: profile }, { data: accounts }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("external_accounts").select("provider,external_username").eq("user_id", user.id),
  ]);
  if (profile?.username) redirect(`/u/${profile.username}`);
  const accountMap = Object.fromEntries((accounts ?? []).map((account) => [account.provider, account.external_username]));
  const formProfile = { ...profile, kaggle_username: accountMap.kaggle, github_username: accountMap.github };

  return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><p className="font-mono text-xs uppercase tracking-[.16em] text-primary">Competitor profile</p><h1 className="mt-2 text-3xl font-bold">Set up your identity</h1><p className="mt-2 text-muted-foreground">This information powers rankings, team search, and public results.</p><Card className="mt-8 p-6"><ProfileForm profile={formProfile}/></Card></div>;
}
