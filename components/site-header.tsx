import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentProfile, profileDestination } from "@/lib/auth";
import { logout } from "@/app/auth/actions";
import { MainNav, MobileNav } from "@/components/main-nav";

export async function SiteHeader() {
  const profile = hasSupabaseEnv() ? await getCurrentProfile() : null;
  return <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-lg">
    <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-8 px-4 sm:px-6 lg:px-8">
      <Link href="/" className="group flex items-center gap-2.5" aria-label="KAIZ home"><span className="relative grid size-7 place-items-center overflow-hidden border border-primary/60 bg-primary text-[11px] font-black text-primary-foreground"><span>K</span><span className="absolute -right-1 top-0 h-full w-px rotate-[24deg] bg-background/70"/></span><span className="text-base font-black tracking-[.16em]">KAIZ</span></Link>
      <MainNav/>
      <div className="ml-auto flex items-center gap-2"><ThemeToggle />{profile ? <><Button asChild size="sm" variant="outline"><Link href={profileDestination(profile)}>{profile.username ? "Profile" : "Finish profile"}</Link></Button><form action={logout} className="hidden sm:block"><Button size="sm" variant="ghost">Sign out</Button></form><form action={logout} className="sm:hidden"><Button size="sm" className="w-8 px-0" variant="ghost" aria-label="Sign out"><LogOut className="size-4"/></Button></form></> : <Button asChild size="sm"><Link href="/auth/login">Sign in</Link></Button>}<MobileNav/></div>
    </div>
  </header>;
}
