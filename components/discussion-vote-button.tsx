import { ArrowBigUp } from "lucide-react";
import { toggleDiscussionUpvote } from "@/app/discussions/actions";
import { Button } from "@/components/ui/button";

export function DiscussionVoteButton({ postId, score, active, signedIn }: { postId: string; score: number; active: boolean; signedIn: boolean }) {
  const action = toggleDiscussionUpvote.bind(null, postId);
  return <form action={action}><Button type="submit" variant={active ? "default" : "outline"} className="h-auto min-w-20 flex-col gap-0.5 py-3" aria-pressed={active} title={signedIn ? (active ? "Remove upvote" : "Upvote") : "Sign in to vote"}><ArrowBigUp className="size-5"/><span className="tabular font-mono text-base font-black">{score}</span><span className="text-[10px] uppercase tracking-wider">{active ? "Upvoted" : "Upvote"}</span></Button></form>;
}
