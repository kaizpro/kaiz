import { cn } from "@/lib/utils";
export function Badge({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <span className={cn("inline-flex items-center rounded-[4px] border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-muted-foreground", className)}>{children}</span>;
}
