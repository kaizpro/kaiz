import Link from "next/link";
import { ArrowBigUp, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DISCUSSION_CATEGORY_LABELS } from "@/lib/constants";
import type { DiscussionPost } from "@/lib/data/discussions";
import { formatDateTime } from "@/lib/utils";

export function DiscussionRow({ post }: { post: DiscussionPost }) {
  const category = DISCUSSION_CATEGORY_LABELS[post.category as keyof typeof DISCUSSION_CATEGORY_LABELS] ?? post.category;
  return <article className="grid gap-4 border-b px-4 py-5 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:px-5">
    <div className="hidden border-r sm:block"><p className="tabular flex items-center gap-1 font-mono text-sm font-bold"><ArrowBigUp className="size-4 text-primary"/>{post.score}</p><p className="tabular mt-2 flex items-center gap-1 font-mono text-xs text-muted-foreground"><MessageSquare className="size-3.5"/>{post.reply_count}</p></div>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2"><Badge>{category}</Badge>{post.competition && <Link href={`/competitions/${post.competition.slug}`} className="truncate font-mono text-[11px] text-primary hover:underline">{post.competition.title}</Link>}</div>
      <h2 className="mt-2 text-base font-bold leading-6 sm:text-lg"><Link href={`/discussions/${post.id}`} className="hover:text-primary">{post.title}</Link></h2>
      <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{post.body_markdown}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground"><span className="sm:hidden">↑ {post.score}</span><span className="sm:hidden">{post.reply_count} replies</span><span>by {post.author?.username ? <Link href={`/u/${post.author.username}`} className="font-medium text-foreground hover:text-primary">@{post.author.username}</Link> : "Deleted user"}</span></div>
    </div>
    <time className="tabular whitespace-nowrap font-mono text-[11px] text-muted-foreground" dateTime={post.created_at}>{formatDateTime(post.created_at)}</time>
  </article>;
}
