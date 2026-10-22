import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderAccountControls } from "@/components/header-account";
import { MainNav, MobileNav } from "@/components/main-nav";

export function SiteHeader() {
  return <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-lg">
    <div className="mx-auto flex min-h-14 max-w-[1440px] flex-wrap items-center gap-x-2 gap-y-1 px-4 py-1 sm:px-6 lg:gap-x-5 lg:px-8">
      <Link href="/" prefetch={false} className="group flex items-center gap-2.5" aria-label="KAIZ home"><span className="relative grid size-7 place-items-center overflow-hidden border border-primary/60 bg-primary text-[11px] font-black text-primary-foreground"><span>K</span><span className="absolute -right-1 top-0 h-full w-px rotate-[24deg] bg-background/70"/></span><span className="text-base font-black tracking-[.16em]">KAIZ</span></Link>
      <MainNav/>
      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2"><ThemeToggle /><HeaderAccountControls/><MobileNav/></div>
    </div>
  </header>;
}
