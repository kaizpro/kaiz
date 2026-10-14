// Reuses PR #22's organizer research; URLs rechecked 2026-10-14.
// These are external source pages, NOT published/imported KAIZ result sets.
export const officialResultLinks: Readonly<Record<string, { href: string; label: string; coverage: string }>> = {
  "ioai-2025": { href: "https://ioai-official.org/china-2025/results-2025/", label: "IOAI 2025 organizer results", coverage: "Individual contest, Final Round of Team Challenge and GAITE are separate sections at the source." },
  "ioai-2026": { href: "https://ioai-official.org/republic-of-kazakhstan/results-2026/", label: "IOAI 2026 organizer results", coverage: "Individual contest and GAITE are separate sections at the source." },
  "apoai-2026": { href: "https://www.apoai.org/apoai2026", label: "APOAI 2026 official edition and standings", coverage: "The official edition page links competition information and its published standings." },
  "euroai-2026": { href: "https://euroai-official.org/2026/results/", label: "EUROAI 2026 official results and awards", coverage: "Member standings and remote awards must not be treated as one ranking." },
};
export function getOfficialResultLink(slug: string) { return Object.hasOwn(officialResultLinks, slug) ? officialResultLinks[slug] : undefined; }
