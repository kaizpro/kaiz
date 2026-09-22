import { LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";

export function UnavailablePanel({ title, description, className }: { title: string; description: string; className?: string }) {
  return <div className={cn("flex min-h-32 items-center justify-center border border-dashed bg-muted/15 px-5 py-8 text-center", className)}><div><LockKeyhole className="mx-auto size-5 text-muted-foreground"/><p className="mt-3 text-sm font-semibold">{title}</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p></div></div>;
}
