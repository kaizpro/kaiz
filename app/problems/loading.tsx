export default function Loading() {
  return <div role="status" aria-label="Loading archive" className="mx-auto max-w-6xl space-y-4 px-4 py-10"><div className="h-10 w-64 animate-pulse bg-muted"/><div className="h-48 animate-pulse bg-muted"/><span className="sr-only">Loading archive…</span></div>;
}
