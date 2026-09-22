import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare, Pencil, ShieldX, Trash2 } from "lucide-react";
import { z } from "zod";
import { createDiscussionReply, deleteDiscussionPost, deleteDiscussionReply, moderateDiscussionPost, moderateDiscussionReply, updateDiscussionReply } from "@/app/discussions/actions";
import { DiscussionReplyForm } from "@/components/discussion-reply-form";
import { DiscussionVoteButton } from "@/components/discussion-vote-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { DISCUSSION_CATEGORY_LABELS } from "@/lib/constants";
import { getDiscussionPost } from "@/lib/data/discussions";
import { formatDateTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return { title: "Discussion not found" };
  const { post } = await getDiscussionPost(id);
  return post ? { title: post.title, description: post.is_removed ? "A removed KAIZ community discussion." : post.body_markdown.slice(0, 155) } : { title: "Discussion not found" };
}

export default async function DiscussionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const profile = await getCurrentProfile();
  const { post, replies, hasUpvoted } = await getDiscussionPost(id, profile?.id);
  if (!post) notFound();
  const isOwner = profile?.id === post.author_id;
  const isAdmin = profile?.role === "admin";
  const category = DISCUSSION_CATEGORY_LABELS[post.category as keyof typeof DISCUSSION_CATEGORY_LABELS] ?? post.category;
  const replyAction = createDiscussionReply.bind(null, post.id);
  return <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
    <div className="grid gap-7 lg:grid-cols-[6rem_minmax(0,1fr)]">
      <aside className="lg:pt-16"><DiscussionVoteButton postId={post.id} score={post.score} active={hasUpvoted} signedIn={Boolean(profile)}/></aside>
      <main className="min-w-0">
        <article className="border bg-card">
          <header className="border-b p-5 sm:p-7"><div className="flex flex-wrap items-center gap-2"><Badge>{category}</Badge>{post.competition && <Link href={`/competitions/${post.competition.slug}`} className="font-mono text-xs text-primary hover:underline">{post.competition.title}</Link>}</div><h1 className="mt-4 text-2xl font-black leading-tight tracking-tight sm:text-4xl">{post.title}</h1><div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>by {post.author?.username ? <Link href={`/u/${post.author.username}`} className="font-semibold text-foreground hover:text-primary">@{post.author.username}</Link> : "Deleted user"}</span><time dateTime={post.created_at}>{formatDateTime(post.created_at)}</time>{post.edited_at && !post.is_removed && <span>edited</span>}{post.is_removed && <span className="text-destructive">{post.deletion_kind === "moderator" ? "removed by moderator" : "deleted by author"}</span>}</div></header>
          <div className="min-h-40 whitespace-pre-wrap break-words p-5 text-sm leading-7 sm:p-7 sm:text-base">{post.body_markdown}</div>
          {!post.is_removed && (isOwner || isAdmin) && <footer className="flex flex-wrap gap-2 border-t p-4">{isOwner && <Button asChild size="sm" variant="outline"><Link href={`/discussions/${post.id}/edit`}><Pencil className="size-3.5"/>Edit</Link></Button>}{isOwner && <form action={deleteDiscussionPost.bind(null, post.id)}><Button size="sm" variant="danger"><Trash2 className="size-3.5"/>Delete</Button></form>}{isAdmin && <form action={moderateDiscussionPost.bind(null, post.id)} className="flex gap-2"><input name="reason" className="h-8 max-w-52 rounded-[4px] border bg-background px-2 text-xs" maxLength={300} placeholder="Moderation reason (optional)"/><Button size="sm" variant="danger"><ShieldX className="size-3.5"/>Moderate</Button></form>}</footer>}
        </article>

        <section className="mt-8"><div className="flex items-center gap-2 border-b pb-3"><MessageSquare className="size-5 text-primary"/><h2 className="text-xl font-bold">Replies</h2><span className="tabular font-mono text-xs text-muted-foreground">{post.reply_count}</span></div>
          {replies.length ? <div className="border-x">{replies.map((reply) => { const replyOwner = profile?.id === reply.author_id; const editAction = updateDiscussionReply.bind(null, reply.id, post.id); return <article key={reply.id} className="border-b bg-card p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{reply.author?.username ? <Link href={`/u/${reply.author.username}`} className="font-semibold text-foreground hover:text-primary">@{reply.author.username}</Link> : "Deleted user"}</span><span><time dateTime={reply.created_at}>{formatDateTime(reply.created_at)}</time>{reply.edited_at && !reply.is_removed ? " · edited" : ""}</span></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{reply.body_markdown}</p>{!reply.is_removed && (replyOwner || isAdmin) && <div className="mt-4 flex flex-wrap items-start gap-2">{replyOwner && <details className="w-full max-w-xl"><summary className="cursor-pointer text-xs font-semibold text-primary">Edit reply</summary><div className="mt-3"><DiscussionReplyForm action={editAction} defaultValue={reply.body_markdown} compact label="Save reply"/></div></details>}{replyOwner && <form action={deleteDiscussionReply.bind(null, reply.id, post.id)}><Button size="sm" variant="ghost">Delete</Button></form>}{isAdmin && <form action={moderateDiscussionReply.bind(null, reply.id, post.id)} className="flex gap-2"><input name="reason" className="h-8 max-w-52 rounded-[4px] border bg-background px-2 text-xs" maxLength={300} placeholder="Reason (optional)"/><Button size="sm" variant="danger">Moderate</Button></form>}</div>}</article>; })}</div> : <div className="border-x border-b p-7 text-center text-sm text-muted-foreground">No replies yet. Add the first useful response.</div>}
        </section>

        {!post.is_removed && !post.is_locked && <section className="mt-8 border-t pt-6"><h2 className="text-lg font-bold">Add a reply</h2><div className="mt-4">{profile ? <DiscussionReplyForm action={replyAction}/> : <div className="border p-5 text-sm text-muted-foreground"><Link href={`/auth/login?next=/discussions/${post.id}`} className="font-semibold text-primary hover:underline">Sign in</Link> to reply or vote.</div>}</div></section>}
      </main>
    </div>
  </div>;
}
