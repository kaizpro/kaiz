import type { Metadata } from "next";
import Link from "next/link";
import { CompetitionRow } from "@/components/competition-row";
import { COMPETITION_CATEGORIES, COMPETITION_FORMATS, COMPETITION_STATUSES } from "@/lib/constants";
import { listCompetitions } from "@/lib/data/competitions";
import styles from "@/components/training/catalog.module.css";
import { PageHero, ProductEmptyState } from "@/components/product/page-hero";
import product from "@/components/product/product.module.css";

export const metadata: Metadata = { title: "Competitions", description: "Source-backed AI olympiad editions, official results and preparation tasks." };
function normalizeFilter(value: string | string[] | undefined, allowed: readonly string[]) {
  return typeof value === "string" && allowed.includes(value) ? value : "all";
}
export default async function CompetitionsPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; format?: string }> }) {
  const query = await searchParams;
  const status = normalizeFilter(query.status, COMPETITION_STATUSES), category = normalizeFilter(query.category, COMPETITION_CATEGORIES), format = normalizeFilter(query.format, COMPETITION_FORMATS);
  const competitions = await listCompetitions(status, category, format);
  const fields = [["status", "Status", status, COMPETITION_STATUSES], ["category", "Category", category, COMPETITION_CATEGORIES], ["format", "Format", format, COMPETITION_FORMATS]] as const;
  return <div className={product.page}>
    <PageHero title="Competitions" description="Find your next olympiad. Explore past editions, tasks and official results." motif="competition"><Link href="/leaderboards" className={`${product.action} ${product.primary}`}>Official standings →</Link></PageHero>
    <form className={product.filters} method="get" aria-label="Competition filters">{fields.map(([name, label, value, options]) => <label key={name}>{label}<select name={name} aria-label={label} defaultValue={value} className={product.control}><option value="all">All</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>)}<button className={`${product.action} ${product.primary}`}>Apply filters</button></form>
    <p className={styles.count}>{competitions.length} listed editions{(status !== "all" || category !== "all" || format !== "all") && <> · <Link href="/competitions" className="text-primary underline">Clear filters</Link></>}</p>
    <div className={product.list}>{competitions.length ? competitions.map(competition => <CompetitionRow key={competition.id} competition={competition}/>) : <ProductEmptyState title="No matching competitions"><p>Try another format, category or status.</p><Link href="/competitions" className={product.action}>Clear filters</Link></ProductEmptyState>}</div>
  </div>;
}
