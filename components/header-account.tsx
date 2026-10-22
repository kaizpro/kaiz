"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { readHeaderAccount, type HeaderAccount } from "@/lib/auth/header-account";

export function HeaderAccountControls() {
  const pathname = usePathname();
  const [account, setAccount] = useState<HeaderAccount>({ status: "pending" });

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    const client = createClient();
    let active = true;
    let revision = 0;
    let scheduled: ReturnType<typeof setTimeout>;
    async function refresh() {
      const current = ++revision;
      const next = await readHeaderAccount(client);
      if (active && current === revision) setAccount(next);
    }
    function schedule() {
      // Leave the Supabase Auth callback/lock before making async Auth calls.
      // Coalesce INITIAL_SESSION and the initial read; no polling or /api/me.
      revision++;
      clearTimeout(scheduled);
      scheduled = setTimeout(() => { void refresh(); }, 0);
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        revision++;
        clearTimeout(scheduled);
        if (active) setAccount({ status: "guest" });
      } else schedule();
    });
    schedule();
    return () => { active = false; revision++; clearTimeout(scheduled); subscription.unsubscribe(); };
  }, [pathname]);

  if (account.status === "member") return <>
    <Link href="/dashboard" prefetch={false} className="min-h-9 px-2 py-2 text-xs font-semibold text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">My learning</Link>
    <Button asChild size="sm" variant="outline"><Link prefetch={false} href={account.username ? `/u/${encodeURIComponent(account.username)}` : "/onboarding"}>{account.username ? "Profile" : "Finish profile"}</Link></Button>
    <form action={logout} className="hidden sm:block"><Button size="sm" variant="ghost">Sign out</Button></form>
    <form action={logout} className="sm:hidden"><Button size="sm" className="w-8 px-0" variant="ghost" aria-label="Sign out"><LogOut className="size-4"/></Button></form>
  </>;
  // Neutral, useful without JS and during network failures. Never render one
  // visitor's account into the shared HTML, including for signed-in requests.
  return <Button asChild size="sm"><Link prefetch={false} href={account.status === "guest" ? "/auth/login" : "/dashboard"}>{account.status === "guest" ? "Sign in" : "Account"}</Link></Button>;
}
