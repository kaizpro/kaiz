import type { Metadata } from "next";
import { createDiscussionPost } from "@/app/discussions/actions";
import { DiscussionPostForm } from "@/components/discussion-post-form";
import { requireUser } from "@/lib/auth";
import { listDiscussionCompetitions } from "@/lib/data/discussions";

export const metadata: Metadata = { title: "Start a discussion" };

export default async function NewDiscussionPage({ searchParams }: { searchParams: Promise<{ competition?: string }> }) {
  await requireUser("/discussions/new");
  const [competitions, query] = await Promise.all([listDiscussionCompetitions(), searchParams]);
  const selected = competitions.some((competition) => competition.id === query.competition) ? query.competition : null;
  return <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6"><header className="border-b pb-5"><p className="micro-label text-primary">Community</p><h1 className="mt-2 text-3xl font-black">Start a discussion</h1><p className="mt-2 text-sm text-muted-foreground">Ask clearly, share context, and keep the conversation useful.</p></header><div className="py-6"><DiscussionPostForm action={createDiscussionPost} competitions={competitions} values={{ competitionId: selected }} submitLabel="Publish discussion"/></div></div>;
}
