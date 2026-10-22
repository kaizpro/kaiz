import type { MetadataRoute } from "next";
import { publicSiteOrigin } from "@/lib/learning/seo";

export const dynamic = "error";
export default function robots(): MetadataRoute.Robots {
  // Advisory crawl guidance only, never an authorization boundary. Keep the
  // canonical learning pages accessible; avoid tree/filter query permutations.
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/auth/", "/dashboard", "/onboarding", "/settings/", "/learn?*", "/learn/*?*"] },
    sitemap: `${publicSiteOrigin}/sitemap.xml`,
  };
}
