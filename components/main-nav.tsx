"use client";
import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [["Compete", "/competitions"], ["Leaderboard", "/leaderboard"], ["Discuss", "/discussions"], ["Learn", "/learn"]] as const;

export function MainNav() {
  const pathname = usePathname();
  return <nav className="hidden h-full items-center md:flex" aria-label="Primary navigation">{links.map(([label, href]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link className={cn("flex h-full items-center border-b-2 px-4 text-sm font-medium transition-colors", active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground")} href={href} key={href}>{label}</Link>; })}</nav>;
}

export function MobileNav() {
  const pathname = usePathname();
  return <details className="group relative md:hidden"><summary className="grid size-9 cursor-pointer list-none place-items-center rounded-[5px] hover:bg-muted" aria-label="Open navigation"><Menu className="size-4"/></summary><nav className="absolute right-0 top-11 z-50 w-52 border bg-card p-1 shadow-lg" aria-label="Mobile navigation">{links.map(([label, href]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link className={cn("block rounded-[3px] px-3 py-2.5 text-sm font-medium", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")} href={href} key={href}>{label}</Link>; })}</nav></details>;
}
