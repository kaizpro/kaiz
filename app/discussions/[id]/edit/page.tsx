import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { updateDiscussionPost } from "@/app/discussions/actions";
import { DiscussionPostForm } from "@/components/discussion-post-form";
import { requireUser } from "@/lib/auth";
import { getDiscussionPost, listDiscussionCompetitions } from "@/lib/data/discussions";

export const metadata: Metadata = { title: "Edit discussion" };

export default async function EditDiscussionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await requireUser(`/discussions/${id}/edit`);
  const [{ post }, competitions] = await Promise.all([getDiscussionPost(id, user.id), listDiscussionCompetitions()]);
  if (!post) notFound();
  if (post.author_id !== user.id || post.is_removed) redirect(`/discussions/${id}`);
  const action = updateDiscussionPost.bind(null, post.id);
  return <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6"><header className="border-b pb-5"><p className="micro-label text-primary">Owner controls</p><h1 className="mt-2 text-3xl font-black">Edit discussion</h1></header><div className="py-6"><DiscussionPostForm action={action} competitions={competitions} values={{ title: post.title, body: post.body_markdown, category: post.category, competitionId: post.competition?.id }} submitLabel="Save changes"/></div></div>;
}
