import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeAuthRedirect } from "@/lib/auth/redirects";

const emailOtpTypes = new Set(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && emailOtpTypes.has(value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = type === "recovery" ? "/auth/update-password" : safeAuthRedirect(url.searchParams.get("next"));

  function finish(path: string) {
    const response = NextResponse.redirect(new URL(path, url.origin));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }

  if (url.searchParams.has("error") || (code && tokenHash)) return finish("/auth/login?error=callback");

  if (code || (tokenHash && isEmailOtpType(type))) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });
    if (!error) return finish(next);
  }

  return finish("/auth/login?error=callback");
}
