import type { MetadataRoute } from "next";
import { getTopics, topicHref } from "@/lib/learning/curriculum";
import { publicSiteOrigin } from "@/lib/learning/seo";

export const dynamic = "error";
export default function sitemap(): MetadataRoute.Sitemap {
  // Build-time public inventory only. No cookie reads, database scans, private
  // progress, invented competition slugs, or misleading last-modified dates.
  return ["/", "/competitions", "/problems", "/roadmaps", "/learn", "/learn/topics", ...getTopics().map(topicHref)]
    .map(path => ({ url: `${publicSiteOrigin}${path}` }));
}
