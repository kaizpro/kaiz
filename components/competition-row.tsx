import Link from "next/link";
import { ArrowUpRight, CalendarClock, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { Competition } from "@/lib/data/competitions";
import { formatCompetitionFormat, formatCompetitionLocation, formatDate } from "@/lib/utils";
import styles from "@/components/training/catalog.module.css";

export function CompetitionRow({ competition, featured = false }: { competition: Competition; featured?: boolean }) {
  return <Link href={`/competitions/${competition.slug}`} className={styles.competitionRow}>
    <div><div className="flex flex-wrap items-center gap-2"><h3 className={styles.rowTitle}>{competition.title}</h3>{competition.verified && <span className="text-[10px] text-muted-foreground">Verified</span>}</div><p className={styles.meta}>{competition.organizer}</p></div>
    <div className="flex items-center gap-2 text-muted-foreground"><CalendarClock aria-hidden="true"/><span className="tabular"><span className="sr-only">Starts: </span>{formatDate(competition.start_date)}</span></div>
    <div><span className="sr-only">Format: </span><Badge>{formatCompetitionFormat(competition.format)}</Badge></div>
    <div className="flex min-w-0 items-center gap-2 text-muted-foreground"><MapPin aria-hidden="true"/><span>{formatCompetitionLocation(competition.city, competition.country)}</span></div>
    <div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge status={competition.status}/><ArrowUpRight className="text-muted-foreground" aria-hidden="true"/></div>
    {featured && <span className="sr-only">Featured competition</span>}
  </Link>;
}
