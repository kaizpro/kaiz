import { safeAuthRedirect } from "./redirects";

type Environment = Readonly<Record<string, string | undefined>>;

export function resolveSiteOrigin(env: Environment): string {
  const hosted = env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview"
    || (env.VERCEL === "1" && env.VERCEL_ENV !== "development");
  const deploymentUrl = env.VERCEL_URL ?? env.NEXT_PUBLIC_VERCEL_URL;
  const value = env.NEXT_PUBLIC_SITE_URL ?? (env.VERCEL_ENV === "preview"
    ? deploymentUrl
    : env.VERCEL_PROJECT_PRODUCTION_URL ?? deploymentUrl);

  if (!value) {
    if (!hosted && env.NODE_ENV !== "production") return "http://localhost:3000";
    throw new Error("Configure NEXT_PUBLIC_SITE_URL before enabling production authentication.");
  }

  let url: URL;
  try {
    url = new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid HTTP(S) origin.");
  }
  const local = url.hostname === "localhost" || url.hostname.endsWith(".localhost")
    || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password
    || url.pathname !== "/" || url.search || url.hash || (hosted && (local || url.protocol !== "https:"))) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin; hosted authentication requires public HTTPS.");
  }
  return url.origin;
}

export function authCallbackUrl(origin: string, next: string): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeAuthRedirect(next));
  return url.toString();
}
