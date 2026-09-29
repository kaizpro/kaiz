import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const emailOtpTypes = new Set(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && emailOtpTypes.has(value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const requestedNext = url.searchParams.get("next") ?? "/";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";

  if (code || (tokenHash && isEmailOtpType(type))) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/auth/login?error=callback", url.origin));
}
