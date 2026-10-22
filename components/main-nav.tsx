"use client";
import NextLink from "next/link";
import { useEffect, useRef, type ComponentProps } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [["Competitions", "/competitions"], ["Problems", "/problems"], ["Leaderboards", "/leaderboards"], ["Roadmaps", "/roadmaps"], ["Discussions", "/discussions"], ["Learn", "/learn"], ["Personal AI Strategist", "/strategist"]] as const;
const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`) || (href === "/roadmaps" && path.startsWith("/start")) || (href === "/leaderboards" && path === "/leaderboard");

// Keep navigation markup/style independent of the public-page cache policy.
// Loading-boundary destinations otherwise prefetch server work from Learn.
function Link(props: ComponentProps<typeof NextLink>) {
  const pathname = usePathname();
  return <NextLink {...props} prefetch={isActive(pathname, "/learn") ? false : props.prefetch}/>;
}

export function MainNav() {
  const pathname = usePathname();
  return <nav className="hidden min-h-14 flex-wrap items-center gap-x-1 min-[1440px]:flex" aria-label="Primary navigation">{links.map(([label, href]) => { const active = isActive(pathname, href); return <Link aria-current={active ? "page" : undefined} className={cn("flex min-h-14 items-center border-b-2 px-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary", active ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-transparent font-medium text-muted-foreground hover:border-border hover:text-foreground")} href={href} key={href}>{label}</Link>; })}</nav>;
}

export function MobileNav() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const menu = menuRef.current;
    const summary = menu?.querySelector("summary");
    if (!menu || !summary) return;
    // Text zoom can make the header several lines tall. Reserve its actual
    // height rather than assuming a fixed header, including on mobile browsers.
    const updateHeight = () => {
      const viewport = window.visualViewport;
      const bottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      menu.style.setProperty("--menu-height", `${Math.max(0, Math.floor(bottom - summary.getBoundingClientRect().bottom - 8))}px`);
    };
    const observer = new ResizeObserver(updateHeight);
    observer.observe(summary);
    const header = menu.closest("header");
    if (header) observer.observe(header);
    menu.addEventListener("toggle", updateHeight);
    window.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("scroll", updateHeight);
    updateHeight();
    return () => {
      observer.disconnect();
      menu.removeEventListener("toggle", updateHeight);
      window.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("scroll", updateHeight);
    };
  }, [pathname]);
  return <details ref={menuRef} key={pathname} className="group relative min-[1440px]:hidden"><summary className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-[5px] hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary" aria-label="Open navigation"><Menu className="size-4" aria-hidden="true"/></summary><nav style={{maxHeight:"var(--menu-height, 50dvh)"}} className="absolute right-0 top-full z-50 w-64 max-w-[calc(100vw-2rem)] overflow-y-auto border bg-card p-1 shadow-lg" aria-label="Mobile navigation">{links.map(([label, href]) => { const active = isActive(pathname, href); return <Link aria-current={active ? "page" : undefined} className={cn("block rounded-[3px] px-3 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")} href={href} key={href}>{label}</Link>; })}</nav></details>;
}
