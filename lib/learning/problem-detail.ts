export function hasStatementPermission(provenance: unknown) {
  if (!provenance || typeof provenance !== "object" || Array.isArray(provenance)) return false;
  const source = provenance as Record<string, unknown>;
  return source.statement_permission === "granted" || ["CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0"].includes(String(source.statement_license));
}
