import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BarChart3, ExternalLink, Github, Globe2, MapPin, MessageSquare, Pencil, School, ShieldCheck, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { divisionFor } from "@/lib/constants";
import { getProfile } from "@/lib/data/profiles";
import { getCurrentUser } from "@/lib/auth";
import { listDiscussionPosts } from "@/lib/data/discussions";
import { DISCUSSION_CATEGORY_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params; const profile = await getProfile(username);
  if (!profile) return { title: "Profile not found" };
  const description = profile.bio ?? `${profile.display_name}'s competitive AI profile on KAIZ.`;
  return { title: `@${profile.username}`, description, openGraph: { title: `@${profile.username} · KAIZ`, description, images: [] }, twitter: { title: `@${profile.username} · KAIZ`, description, images: [] } };
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return <div className="min-w-0 border-r px-4 py-4 first:pl-0 last:border-r-0"><p className="micro-label truncate text-muted-foreground">{label}</p><p className={`tabular mt-2 truncate font-mono text-2xl font-black ${accent ? "text-primary" : ""}`}>{value}</p></div>;
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params; const profile = await getProfile(username); if (!profile) notFound();
  const [user, discussionResult] = await Promise.all([getCurrentUser(), listDiscussionPosts({ authorId: profile.id, limit: 3 })]);
  const isOwner = user?.id === profile.id;
  const division = divisionFor(profile.rating);
  return <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8">
    <header className="grid gap-6 border-b pb-7 md:grid-cols-[auto_1fr_auto] md:items-end">
      <div className="grid size-20 place-items-center border bg-card font-mono text-xl font-black text-primary sm:size-24">{profile.display_name.slice(0,2).toUpperCase()}</div>
      <div><div className="flex flex-wrap items-center gap-2"><p className="micro-label text-primary">Competitor profile</p>{profile.country === "Kazakhstan" && <Badge>KZ</Badge>}</div><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">@{profile.username}</h1><p className="mt-1 text-base text-muted-foreground">{profile.display_name}</p></div>
      {isOwner ? <Button asChild variant="outline"><Link href="/settings/profile"><Pencil className="size-4"/>Edit profile</Link></Button> : <Button variant="outline" disabled>Social features · Milestone 5</Button>}
    </header>

    <div className="grid gap-8 py-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="space-y-7">
        <div><p className="micro-label text-muted-foreground">Competitive division</p><div className="mt-3 flex items-center gap-3 border-l-2 pl-4" style={{ borderColor: division.color }}><Trophy className="size-5" style={{ color: division.color }}/><div><p className="font-bold" style={{ color: division.color }}>{division.name}</p><p className="tabular font-mono text-xs text-muted-foreground">{profile.rating} rating</p></div></div></div>
        {profile.bio && <div><p className="micro-label text-muted-foreground">Bio</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{profile.bio}</p></div>}
        <div className="space-y-3 border-t pt-5 text-sm text-muted-foreground">{profile.school && <p className="flex items-start gap-2"><School className="mt-0.5 size-4 shrink-0"/>{profile.school}</p>}{profile.city && <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0"/>{profile.city}, {profile.country}</p>}{profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary"><Globe2 className="size-4"/>Website <ExternalLink className="ml-auto size-3"/></a>}{profile.external_accounts?.map((account: any) => <a key={account.provider} href={account.provider === "github" ? `https://github.com/${account.external_username}` : `https://kaggle.com/${account.external_username}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary"><Github className="size-4"/>{account.provider === "github" ? "GitHub" : "Kaggle"}<span className="ml-auto truncate font-mono text-xs">{account.external_username}</span></a>)}</div>
        {!!profile.skills?.length && <div className="border-t pt-5"><p className="micro-label text-muted-foreground">Specialties</p><div className="mt-3 flex flex-wrap gap-2">{profile.skills.map((skill: string) => <Badge key={skill}>{skill}</Badge>)}</div></div>}
      </aside>

      <main className="min-w-0 space-y-10">
        <section className="grid grid-cols-2 border-y sm:grid-cols-4"><Stat label="Rating" value={profile.rating} accent/><Stat label="KZ rank" value={profile.kz_rank ? `#${profile.kz_rank}` : "—"}/><Stat label="Completed" value={profile.competitions_completed ?? 0}/><Stat label="Followers" value={profile.follower_count ?? 0}/></section>

        <section><div className="mb-3 flex items-end justify-between border-b pb-3"><div><p className="micro-label text-primary">Performance</p><h2 className="mt-1 text-xl font-bold">Rating history</h2></div><BarChart3 className="size-5 text-muted-foreground"/></div>{profile.rating_history?.length ? <div className="border bg-card p-5"><div className="space-y-3">{profile.rating_history.slice(0,8).map((item: any) => <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b pb-3 last:border-0 last:pb-0"><span className="text-sm text-muted-foreground">Rated competition</span><span className={`tabular font-mono text-sm font-bold ${item.change >= 0 ? "text-success" : "text-destructive"}`}>{item.change >= 0 ? "+" : ""}{item.change}</span><span className="tabular font-mono text-sm font-bold">{item.new_rating}</span></div>)}</div></div> : <UnavailablePanel title="No rating history" description="A verified rated result will start this chart." className="min-h-44"/>}</section>

        <section><div className="mb-3 flex items-center gap-2 border-b pb-3"><ShieldCheck className="size-5 text-primary"/><h2 className="text-xl font-bold">Competition history</h2></div><div className="border bg-card">{profile.competition_results?.length ? profile.competition_results.map((result: any) => <Link key={result.competitions.slug} href={`/competitions/${result.competitions.slug}`} className="grid grid-cols-[1fr_4rem_6rem] items-center gap-3 border-b px-4 py-4 transition-colors last:border-0 hover:bg-muted/50"><div><p className="font-semibold">{result.competitions.title}</p><p className="mt-1 text-xs text-muted-foreground">{result.verified ? "Verified result" : "Pending verification"}</p></div><p className="tabular text-right font-mono font-black">#{result.rank ?? "—"}</p><p className="tabular text-right font-mono text-sm text-muted-foreground">{result.score ?? "—"}</p></Link>) : <div className="p-8 text-center text-sm text-muted-foreground">No completed competitions yet.</div>}</div></section>

        <section><div className="mb-3 flex items-center gap-2 border-b pb-3"><Award className="size-5 text-gold"/><h2 className="text-xl font-bold">Achievements</h2></div>{profile.user_achievements?.length ? <div className="grid gap-px border bg-border sm:grid-cols-2">{profile.user_achievements.map((item: any) => <div key={item.earned_at} className="bg-card p-4"><p className="font-semibold text-gold">{item.achievements.name}</p><p className="mt-1 text-sm text-muted-foreground">{item.achievements.description}</p></div>)}</div> : <UnavailablePanel title="No achievements earned" description="Competition and community achievements will appear here."/>}</section>

        <section><div className="mb-3 flex items-center gap-2 border-b pb-3"><MessageSquare className="size-5 text-primary"/><h2 className="text-xl font-bold">Recent discussions</h2></div>{discussionResult.posts.length ? <div className="border bg-card">{discussionResult.posts.map((post) => <Link key={post.id} href={`/discussions/${post.id}`} className="block border-b px-4 py-4 last:border-0 hover:bg-muted/50"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{post.title}</p><time className="font-mono text-[11px] text-muted-foreground" dateTime={post.created_at}>{formatDateTime(post.created_at)}</time></div><p className="mt-1 text-xs text-muted-foreground">{DISCUSSION_CATEGORY_LABELS[post.category as keyof typeof DISCUSSION_CATEGORY_LABELS] ?? post.category} · {post.score} votes · {post.reply_count} replies</p></Link>)}</div> : <UnavailablePanel title="No community posts yet" description={`@${profile.username} has not started a discussion.`}/>}</section>
      </main>
    </div>
  </div>;
}
