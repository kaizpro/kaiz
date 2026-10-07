"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-3xl px-4 py-10"><h1 className="text-2xl font-bold">Problem management unavailable</h1><p role="alert" className="my-4 text-sm text-muted-foreground">The archive could not be loaded. Try again or contact an administrator if the problem persists.</p><Button onClick={reset}>Try again</Button></main>;
}
