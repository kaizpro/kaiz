import Link from "next/link";
import { ArrowUpRight, CalendarClock, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { Competition } from "@/lib/data/competitions";
import { formatCompetitionFormat, formatCompetitionLocation, formatDate } from "@/lib/utils";

export function CompetitionRow({ competition, featured = false }: { competition: Competition; featured?: boolean }) {
  return <Link href={`/competitions/${competition.slug}`} className="group grid gap-4 border-b px-4 py-4 transition-colors last:border-b-0 hover:bg-muted/50 sm:grid-cols-[minmax(0,1fr)_9rem_7rem_10rem_7rem] sm:items-center sm:px-5">
    <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-semibold tracking-tight group-hover:text-primary">{competition.title}</h3>{competition.verified && <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">Verified</span>}</div><p className="mt-1 truncate text-sm text-muted-foreground">{competition.organizer} · {competition.category}</p></div>
    <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="size-4 shrink-0"/><span className="tabular">{formatDate(competition.start_date)}</span></div>
    <div><span className="sr-only">Format: </span><Badge>{formatCompetitionFormat(competition.format)}</Badge></div>
    <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4 shrink-0"/><span className="truncate">{formatCompetitionLocation(competition.city, competition.country)}</span></div>
    <div className="flex items-center justify-between gap-3 sm:justify-end"><StatusBadge status={competition.status}/><ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary"/></div>
    {featured && <span className="sr-only">Featured competition</span>}
  </Link>;
}
