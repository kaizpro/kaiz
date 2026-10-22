import Link from "next/link";
import { ArrowUpRight, CalendarClock, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { Competition } from "@/lib/data/competitions";
import { formatCompetitionFormat, formatCompetitionLocation, formatDate } from "@/lib/utils";
import styles from "@/components/product/product.module.css";
import competitionStyles from "./product/competitions.module.css";

export function CompetitionRow({ competition, featured = false }: { competition: Competition; featured?: boolean }) {
  return <Link href={`/competitions/${competition.slug}`} className={`${styles.card} ${competitionStyles.edition}`}>
    <div><div className="flex flex-wrap items-center gap-2"><h3 className={styles.cardTitle}>{competition.title}</h3>{competition.verified && <span className={styles.pill}>Verified</span>}</div><p className={styles.meta}>{competition.organizer}</p></div>
    <div className="flex items-center gap-2 text-muted-foreground"><CalendarClock aria-hidden="true"/><span className="tabular"><span className="sr-only">Starts: </span>{formatDate(competition.start_date)}</span></div>
    <div><span className="sr-only">Format: </span><Badge>{formatCompetitionFormat(competition.format)}</Badge></div>
    <div className="flex min-w-0 items-center gap-2 text-muted-foreground"><MapPin aria-hidden="true"/><span>{formatCompetitionLocation(competition.city, competition.country)}</span></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><StatusBadge status={competition.status}/><ArrowUpRight className="size-5 text-primary" aria-hidden="true"/></div>
    {featured && <span className="sr-only">Featured competition</span>}
  </Link>;
}
