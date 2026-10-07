const validationOrigin = "https://kaiz.invalid";

/** Return a canonical application path, never an absolute or network-path URL. */
export function safeAuthRedirect(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (/[\\\u0000-\u0020\u007f]/u.test(value)) return "/";

  const path = value.split(/[?#]/u, 1)[0];
  // Reject encoded separators, controls and nested encoding before URL normalization.
  if (/%(?:2f|5c|25|0[0-9a-f]|1[0-9a-f]|7f)/iu.test(path)) return "/";
  try {
    decodeURIComponent(path);
    const url = new URL(value, validationOrigin);
    if (url.origin !== validationOrigin || url.pathname.startsWith("//")) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
