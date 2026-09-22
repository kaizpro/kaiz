import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  active: "border-success/35 bg-success/10 text-success",
  upcoming: "border-primary/35 bg-primary/10 text-primary",
  completed: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <Badge className={cn(styles[status] ?? "", className)}><span className={cn("mr-1.5 size-1.5 rounded-full bg-current", status === "active" && "animate-pulse")}/>{status}</Badge>;
}
