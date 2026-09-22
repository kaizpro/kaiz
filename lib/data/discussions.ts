import "server-only";
import { createClient } from "@/lib/supabase/server";

export const DISCUSSIONS_PER_PAGE = 10;

export type DiscussionAuthor = { username: string | null; display_name: string };
export type DiscussionCompetition = { id: string; title: string; slug: string };
export type DiscussionPost = {
  id: string;
  author_id: string | null;
  title: string;
  body_markdown: string;
  category: string;
  score: number;
  reply_count: number;
  is_locked: boolean;
  is_removed: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  deletion_kind: "author" | "moderator" | null;
  created_at: string;
  updated_at: string;
  author: DiscussionAuthor | null;
  competition: DiscussionCompetition | null;
};

export type DiscussionReply = {
  id: string;
  post_id: string;
  author_id: string | null;
  body_markdown: string;
  is_removed: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  deletion_kind: "author" | "moderator" | null;
  created_at: string;
  author: DiscussionAuthor | null;
};

const postSelect = `
  id,author_id,title,body_markdown,category,score,reply_count,is_locked,is_removed,
  edited_at,deleted_at,deletion_kind,created_at,updated_at,
  author:profiles!posts_author_id_fkey(username,display_name),
  competition:competitions(id,title,slug)
`;

export async function listDiscussionPosts(options: {
  category?: string;
  sort?: "latest" | "top";
  page?: number;
  competitionId?: string;
  authorId?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const limit = options.limit ?? DISCUSSIONS_PER_PAGE;
  const from = (page - 1) * limit;
  let query = supabase
    .from("posts")
    .select(postSelect, { count: "exact" })
    .eq("is_removed", false);
  if (options.category && options.category !== "all") query = query.eq("category", options.category);
  if (options.competitionId) query = query.eq("competition_id", options.competitionId);
  if (options.authorId) query = query.eq("author_id", options.authorId);
  query = options.sort === "top"
    ? query.order("score", { ascending: false }).order("created_at", { ascending: false }).order("id", { ascending: false })
    : query.order("created_at", { ascending: false }).order("id", { ascending: false });
  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw new Error("Unable to load discussions.");
  return { posts: (data ?? []) as unknown as DiscussionPost[], count: count ?? 0, page, limit };
}

export async function getDiscussionPost(id: string, viewerId?: string) {
  const supabase = await createClient();
  const [postResult, repliesResult, voteResult] = await Promise.all([
    supabase.from("posts").select(postSelect).eq("id", id).maybeSingle(),
    supabase.from("comments").select(`
      id,post_id,author_id,body_markdown,is_removed,edited_at,deleted_at,deletion_kind,created_at,
      author:profiles!comments_author_id_fkey(username,display_name)
    `).eq("post_id", id).order("created_at", { ascending: true }).order("id", { ascending: true }),
    viewerId ? supabase.from("votes").select("id").eq("post_id", id).eq("user_id", viewerId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (postResult.error || repliesResult.error || voteResult.error) throw new Error("Unable to load this discussion.");
  return {
    post: postResult.data as unknown as DiscussionPost | null,
    replies: (repliesResult.data ?? []) as unknown as DiscussionReply[],
    hasUpvoted: Boolean(voteResult.data),
  };
}

export async function listDiscussionCompetitions() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("competitions").select("id,title,slug").order("start_date", { ascending: false });
  if (error) throw new Error("Unable to load competitions.");
  return (data ?? []) as DiscussionCompetition[];
}
