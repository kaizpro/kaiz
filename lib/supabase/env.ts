import { resolveSiteOrigin } from "@/lib/auth/urls";

function getBrowserKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getBrowserKey());
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getBrowserKey();
  if (!url || !key) throw new Error("Supabase environment variables are not configured.");
  return { url, key };
}

export function getSiteUrl() {
  return resolveSiteOrigin(process.env);
}
