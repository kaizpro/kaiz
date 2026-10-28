export const KAZAKHSTAN_RESULTS_PDFS = {
  "ai-olymp-kazakhstan-2025": {
    year: "2025", label: "AI Olymp Kazakhstan 2025 results PDF",
    coverage: "38 recorded / 40 announced finalists. No medals inferred.",
  },
  "ai-olymp-kazakhstan-2026": {
    year: "2026", label: "AI Olymp Kazakhstan 2026 results PDF",
    coverage: "39 recorded / 40 qualifiers. Confirmed medals: 3 Gold, 5 Silver, 15 Bronze.",
  },
} as const;

export type KazakhstanResultsPdf = { url: string; label: string; coverage: string };

export function getKazakhstanPdfDefinition(slug: string) {
  return Object.hasOwn(KAZAKHSTAN_RESULTS_PDFS, slug)
    ? KAZAKHSTAN_RESULTS_PDFS[slug as keyof typeof KAZAKHSTAN_RESULTS_PDFS] : undefined;
}

// Configuration is an operator-controlled publication decision, not user input.
// Accept only canonical Drive file VIEW links, never workbooks, folders, edit or
// download endpoints, credentials, resource keys, fragments or arbitrary hosts.
// A valid shape does NOT prove PDF type, sharing permission or public access.
export function getKazakhstanResultsPdf(slug: string, configuredUrl?: string): KazakhstanResultsPdf | null {
  const definition = getKazakhstanPdfDefinition(slug);
  if (!definition || !configuredUrl?.trim()) return null;
  try {
    const url = new URL(configuredUrl.trim());
    if (url.protocol !== "https:" || url.hostname !== "drive.google.com" || url.port
      || url.username || url.password || url.hash || /[\s\\]/.test(configuredUrl)
      || !/^\/file\/d\/[A-Za-z0-9_-]{20,200}\/view$/.test(url.pathname)) return null;
    const parameters = [...url.searchParams];
    if (parameters.length > 1 || parameters.some(([key, value]) => key !== "usp" || !["sharing", "drive_link"].includes(value))) return null;
    return { url: `${url.origin}${url.pathname}`, label: definition.label, coverage: definition.coverage };
  } catch { return null; }
}
