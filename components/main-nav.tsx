"use client";
import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [["Competitions", "/competitions"], ["Problems", "/problems"], ["Leaderboards", "/leaderboards"], ["Roadmaps", "/roadmaps"], ["Discussions", "/discussions"], ["Learn", "/learn"]] as const;
const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`) || (href === "/roadmaps" && path.startsWith("/start")) || (href === "/leaderboards" && path === "/leaderboard");

export function MainNav() {
  const pathname = usePathname();
  return <nav className="hidden min-h-14 flex-wrap items-center xl:flex" aria-label="Primary navigation">{links.map(([label, href]) => { const active = isActive(pathname, href); return <Link aria-current={active ? "page" : undefined} className={cn("flex min-h-14 items-center border-b-2 px-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary", active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground")} href={href} key={href}>{label}</Link>; })}</nav>;
}

export function MobileNav() {
  const pathname = usePathname();
  return <details key={pathname} className="group relative xl:hidden"><summary className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-[5px] hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary" aria-label="Open navigation"><Menu className="size-4" aria-hidden="true"/></summary><nav className="absolute right-0 top-full z-50 w-60 max-w-[calc(100vw-2rem)] border bg-card p-1 shadow-lg" aria-label="Mobile navigation">{links.map(([label, href]) => { const active = isActive(pathname, href); return <Link aria-current={active ? "page" : undefined} className={cn("block rounded-[3px] px-3 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")} href={href} key={href}>{label}</Link>; })}</nav></details>;
}
