"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { discussionPostSchema, discussionReplySchema, moderationSchema } from "@/lib/validation/discussion";

export type DiscussionActionState = { error?: string };
const uuid = z.string().uuid();

function slugify(title: string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "discussion";
  return `${base}-${randomUUID().slice(0, 8)}`;
}

async function validCompetition(competitionId: string | null) {
  if (!competitionId) return true;
  const supabase = await createClient();
  const { data } = await supabase.from("competitions").select("id").eq("id", competitionId).maybeSingle();
  return Boolean(data);
}

function refreshDiscussion(postId?: string, competitionSlug?: string | null) {
  revalidatePath("/discussions");
  revalidatePath("/u/[username]", "page");
  if (postId) revalidatePath(`/discussions/${postId}`);
  if (competitionSlug) revalidatePath(`/competitions/${competitionSlug}`);
}

export async function createDiscussionPost(_: DiscussionActionState, formData: FormData): Promise<DiscussionActionState> {
  const user = await requireUser("/discussions/new");
  const parsed = discussionPostSchema.safeParse({
    title: formData.get("title"), body: formData.get("body"), category: formData.get("category"), competitionId: formData.get("competitionId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!(await validCompetition(parsed.data.competitionId))) return { error: "Choose an existing competition." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").insert({
    author_id: user.id,
    title: parsed.data.title,
    slug: slugify(parsed.data.title),
    body_markdown: parsed.data.body,
    category: parsed.data.category,
    competition_id: parsed.data.competitionId,
  }).select("id,competition:competitions(slug)").single();
  if (error || !data) return { error: "Unable to create the discussion." };
  const competition = data.competition as unknown as { slug: string } | null;
  refreshDiscussion(data.id, competition?.slug);
  redirect(`/discussions/${data.id}`);
}

export async function updateDiscussionPost(postId: string, _: DiscussionActionState, formData: FormData): Promise<DiscussionActionState> {
  const user = await requireUser(`/discussions/${postId}/edit`);
  const validPostId = uuid.safeParse(postId);
  if (!validPostId.success) return { error: "Invalid discussion." };
  const parsed = discussionPostSchema.safeParse({
    title: formData.get("title"), body: formData.get("body"), category: formData.get("category"), competitionId: formData.get("competitionId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!(await validCompetition(parsed.data.competitionId))) return { error: "Choose an existing competition." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").update({
    title: parsed.data.title,
    body_markdown: parsed.data.body,
    category: parsed.data.category,
    competition_id: parsed.data.competitionId,
  }).eq("id", validPostId.data).eq("author_id", user.id).select("id,competition:competitions(slug)").maybeSingle();
  if (error || !data) return { error: "You can edit only your own active discussion." };
  const competition = data.competition as unknown as { slug: string } | null;
  refreshDiscussion(data.id, competition?.slug);
  redirect(`/discussions/${data.id}`);
}

export async function deleteDiscussionPost(postId: string) {
  await requireUser(`/discussions/${postId}`);
  const validPostId = uuid.parse(postId);
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_discussion_post", { target_post_id: validPostId });
  if (error) throw new Error("Unable to delete this discussion.");
  refreshDiscussion(validPostId);
}

export async function moderateDiscussionPost(postId: string, formData: FormData) {
  await requireAdmin();
  const validPostId = uuid.parse(postId);
  const parsed = moderationSchema.parse({ reason: formData.get("reason") || undefined });
  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_discussion_post", { target_post_id: validPostId, reason: parsed.reason || null });
  if (error) throw new Error("Unable to moderate this discussion.");
  refreshDiscussion(validPostId);
}

export async function createDiscussionReply(postId: string, _: DiscussionActionState, formData: FormData): Promise<DiscussionActionState> {
  const user = await requireUser(`/discussions/${postId}`);
  const validPostId = uuid.safeParse(postId);
  if (!validPostId.success) return { error: "Invalid discussion." };
  const parsed = discussionReplySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ post_id: validPostId.data, author_id: user.id, body_markdown: parsed.data.body });
  if (error) return { error: "Unable to add this reply." };
  refreshDiscussion(validPostId.data);
  return {};
}

export async function updateDiscussionReply(replyId: string, postId: string, _: DiscussionActionState, formData: FormData): Promise<DiscussionActionState> {
  const user = await requireUser(`/discussions/${postId}`);
  const parsedIds = z.object({ replyId: z.string().uuid(), postId: z.string().uuid() }).safeParse({ replyId, postId });
  if (!parsedIds.success) return { error: "Invalid reply." };
  const parsed = discussionReplySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { data, error } = await supabase.from("comments").update({ body_markdown: parsed.data.body }).eq("id", parsedIds.data.replyId).eq("post_id", parsedIds.data.postId).eq("author_id", user.id).select("id").maybeSingle();
  if (error || !data) return { error: "You can edit only your own active reply." };
  refreshDiscussion(parsedIds.data.postId);
  return {};
}

export async function deleteDiscussionReply(replyId: string, postId: string) {
  await requireUser(`/discussions/${postId}`);
  const validReplyId = uuid.parse(replyId);
  const validPostId = uuid.parse(postId);
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_discussion_reply", { target_comment_id: validReplyId });
  if (error) throw new Error("Unable to delete this reply.");
  refreshDiscussion(validPostId);
}

export async function moderateDiscussionReply(replyId: string, postId: string, formData: FormData) {
  await requireAdmin();
  const validReplyId = uuid.parse(replyId);
  const validPostId = uuid.parse(postId);
  const parsed = moderationSchema.parse({ reason: formData.get("reason") || undefined });
  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_discussion_reply", { target_comment_id: validReplyId, reason: parsed.reason || null });
  if (error) throw new Error("Unable to moderate this reply.");
  refreshDiscussion(validPostId);
}

export async function toggleDiscussionUpvote(postId: string) {
  const user = await requireUser(`/discussions/${postId}`);
  const validPostId = uuid.parse(postId);
  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase.from("votes").select("id").eq("post_id", validPostId).eq("user_id", user.id).maybeSingle();
  if (readError) throw new Error("Unable to read your vote.");
  const mutation = existing
    ? supabase.from("votes").delete().eq("id", existing.id).eq("user_id", user.id)
    : supabase.from("votes").insert({ post_id: validPostId, user_id: user.id, value: 1 });
  const { error } = await mutation;
  if (error) throw new Error("Unable to update your vote.");
  refreshDiscussion(validPostId);
}
