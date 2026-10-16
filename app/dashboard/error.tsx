"use client";
export default function DashboardError({reset}:{reset:()=>void}){return <section className="mx-auto max-w-6xl px-6 py-8"><h1 className="text-xl font-bold">Your dashboard is unavailable</h1><p className="my-3 text-sm text-muted-foreground">No saved progress is assumed. Please try again.</p><button onClick={reset} className="min-h-11 border px-3 text-sm">Try again</button></section>;}
