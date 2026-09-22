import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiscussionRow } from "@/components/discussion-row";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { DISCUSSION_CATEGORIES, DISCUSSION_CATEGORY_LABELS } from "@/lib/constants";
import { DISCUSSIONS_PER_PAGE, listDiscussionPosts } from "@/lib/data/discussions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Discussions", description: "AI olympiad and machine learning discussions from the KAIZ community." };

function href(category: string, sort: string, page = 1) {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (sort !== "latest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/discussions${query ? `?${query}` : ""}`;
}

export default async function DiscussionsPage({ searchParams }: { searchParams: Promise<{ category?: string | string[]; sort?: string | string[]; page?: string | string[] }> }) {
  const query = await searchParams;
  const category = typeof query.category === "string" && DISCUSSION_CATEGORIES.includes(query.category as (typeof DISCUSSION_CATEGORIES)[number]) ? query.category : "all";
  const sort = query.sort === "top" ? "top" : "latest";
  const rawPage = typeof query.page === "string" ? Number.parseInt(query.page, 10) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const [{ posts, count }, user] = await Promise.all([listDiscussionPosts({ category, sort, page }), getCurrentUser()]);
  const pages = Math.max(1, Math.ceil(count / DISCUSSIONS_PER_PAGE));
  return <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
    <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="micro-label text-primary">Community signal</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Discussions</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Questions, resources and competition intelligence from Kazakhstan&apos;s AI olympiad community.</p></div>{user ? <Button asChild><Link href="/discussions/new"><MessageSquarePlus className="size-4"/>Start discussion</Link></Button> : <Button asChild><Link href="/auth/login?next=/discussions/new">Sign in to post</Link></Button>}</header>
    <div className="flex flex-col gap-4 border-b py-4 lg:flex-row lg:items-center lg:justify-between"><nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Discussion categories"><Link href={href("all", sort)} className={cn("whitespace-nowrap border px-3 py-1.5 text-xs font-semibold", category === "all" ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground")}>All</Link>{DISCUSSION_CATEGORIES.map((item) => <Link key={item} href={href(item, sort)} className={cn("whitespace-nowrap border px-3 py-1.5 text-xs font-semibold", category === item ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground")}>{DISCUSSION_CATEGORY_LABELS[item]}</Link>)}</nav><nav className="flex gap-1" aria-label="Discussion sorting"><Link href={href(category, "latest")} className={cn("px-3 py-1.5 font-mono text-xs uppercase tracking-wider", sort === "latest" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>Latest</Link><Link href={href(category, "top")} className={cn("px-3 py-1.5 font-mono text-xs uppercase tracking-wider", sort === "top" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>Top</Link></nav></div>
    {posts.length ? <div className="border-x border-b bg-card">{posts.map((post) => <DiscussionRow key={post.id} post={post}/>)}</div> : <EmptyState title="No discussions here yet" description={user ? "Start the first focused conversation in this category." : "Sign in to start the first focused conversation."}/>} 
    {pages > 1 && <nav className="mt-5 flex items-center justify-between" aria-label="Discussion pages"><Button asChild variant="outline" size="sm" className={page <= 1 ? "pointer-events-none opacity-40" : ""}><Link href={href(category, sort, page - 1)} aria-disabled={page <= 1}><ChevronLeft className="size-4"/>Previous</Link></Button><span className="tabular font-mono text-xs text-muted-foreground">Page {Math.min(page, pages)} / {pages}</span><Button asChild variant="outline" size="sm" className={page >= pages ? "pointer-events-none opacity-40" : ""}><Link href={href(category, sort, page + 1)} aria-disabled={page >= pages}>Next<ChevronRight className="size-4"/></Link></Button></nav>}
  </div>;
}
