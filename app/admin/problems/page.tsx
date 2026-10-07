import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listAdminProblems } from "@/lib/data/admin-problems";

export default async function AdminProblems({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: requested } = await searchParams;
  const page = /^\d{1,5}$/.test(requested ?? "") ? Math.max(1, Math.min(10000, Number(requested))) : 1;
  const { problems, count } = await listAdminProblems(page);
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">← Competition operations</Link><h1 className="mt-3 text-3xl font-bold">Problem Archive operations</h1><p className="mt-2 text-sm text-muted-foreground">Manage drafts, metrics and publication. {count} problems.</p></div><Button asChild className="min-h-11"><Link href="/admin/problems/new">New problem</Link></Button></header>
    <div className="mt-8 border bg-card">{problems.length ? problems.map((problem) => <div key={problem.id} className="flex flex-wrap items-center justify-between gap-4 border-b p-4 last:border-0">
      <div className="min-w-0"><p className="break-words font-semibold">{problem.title}</p><p className="break-all text-sm text-muted-foreground">/{problem.slug}</p><p className="mt-1 text-sm">{problem.published ? "Published" : "Draft"} · {problem.metric_name} · {problem.metric_direction === "higher_is_better" ? "Higher is better" : "Lower is better"}</p></div>
      <div className="flex gap-2">{problem.published && <Button asChild variant="outline" className="min-h-11"><Link href={`/problems/${problem.slug}`}>View</Link></Button>}<Button asChild variant="outline" className="min-h-11"><Link href={`/admin/problems/${problem.id}/edit`}>Edit</Link></Button></div>
    </div>) : <p className="p-8 text-sm text-muted-foreground">No problems on this page. Create a draft to start populating the archive.</p>}</div>
    <nav aria-label="Problem management pages" className="mt-6 flex flex-wrap items-center gap-4">{page > 1 && <Link className="underline" href={`/admin/problems?page=${page - 1}`}>Previous</Link>}<span className="text-sm">Page {page}</span>{page * 20 < count && <Link className="underline" href={`/admin/problems?page=${page + 1}`}>Next</Link>}</nav>
  </main>;
}
