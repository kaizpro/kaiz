import "server-only";
import { getKazakhstanPdfDefinition, getKazakhstanResultsPdf } from "@/lib/results/kazakhstan-pdf";

export function getConfiguredKazakhstanResultsPdf(slug: string) {
  const definition = getKazakhstanPdfDefinition(slug);
  if (!definition) return null;
  const url = definition.year === "2025"
    ? process.env.KAIZ_KAZAKHSTAN_2025_RESULTS_PDF_URL
    : process.env.KAIZ_KAZAKHSTAN_2026_RESULTS_PDF_URL;
  return getKazakhstanResultsPdf(slug, url);
}
