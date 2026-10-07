import { CreatorCredit } from "@/components/creator-credit";

export function SiteFooter() {
  return <footer className="border-t pt-7 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p><span className="font-bold tracking-[.12em] text-foreground">KAIZ</span> <span className="mx-2 text-border">/</span> Kazakhstan AI Competition Platform</p>
        <p className="font-mono text-xs uppercase tracking-wider">Compete · Learn · Advance</p>
      </div>
      <div className="mt-3"><CreatorCredit /></div>
    </div>
  </footer>;
}
