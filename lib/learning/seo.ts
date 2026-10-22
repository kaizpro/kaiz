import type { Metadata } from "next";

// Public canonical identity, not an Auth redirect destination. Query-state
// variants and Vercel previews must not become competing indexed topic URLs.
export const publicSiteOrigin = "https://kaizpro.com";
export function learningMetadata(path: string): Metadata {
  return { alternates: { canonical: `${publicSiteOrigin}${path}` } };
}
