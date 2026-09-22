import Link from "next/link";
import { MessageSquare, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiscussionPost } from "@/lib/data/discussions";
import { formatDateTime } from "@/lib/utils";

export function CompetitionDiscussions({ competitionId, posts, signedIn }: { competitionId: string; posts: DiscussionPost[]; signedIn: boolean }) {
  const newHref = signedIn ? `/discussions/new?competition=${competitionId}` : `/auth/login?next=${encodeURIComponent(`/discussions/new?competition=${competitionId}`)}`;
  return <section className="border-t py-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="micro-label text-primary">Community</p><h2 className="mt-1 text-xl font-bold">Competition discussions</h2></div><Button asChild size="sm" variant="outline"><Link href={newHref}><MessageSquarePlus className="size-4"/>Start discussion</Link></Button></div>
    {posts.length ? <div className="mt-4 border bg-card">{posts.map((post) => <Link href={`/discussions/${post.id}`} key={post.id} className="grid gap-2 border-b px-4 py-4 transition-colors last:border-0 hover:bg-muted/50 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><p className="font-semibold hover:text-primary">{post.title}</p><p className="mt-1 text-xs text-muted-foreground">by {post.author?.username ? `@${post.author.username}` : "Deleted user"} · {post.reply_count} replies · {post.score} votes</p></div><time className="font-mono text-[11px] text-muted-foreground" dateTime={post.created_at}>{formatDateTime(post.created_at)}</time></Link>)}</div> : <div className="mt-4 border p-6 text-center"><MessageSquare className="mx-auto size-5 text-muted-foreground"/><p className="mt-2 font-semibold">No competition discussions yet</p><p className="mt-1 text-sm text-muted-foreground">Start a focused conversation about preparation, rules, or resources.</p></div>}
  </section>;
}
