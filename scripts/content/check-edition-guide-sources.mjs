// Anonymous, read-only source check. Never downloads restricted sheets or result rows to disk.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const catalog = JSON.parse(await readFile('content/competitions/2026-10-19/release-catalog.json', 'utf8'));
const guides = JSON.parse(await readFile('content/competitions/edition-guides.json', 'utf8'));
const urls = [...new Set(catalog.editions.flatMap(e => [
  ...e.metadataSources, ...e.stages.map(s => s.source),
  ...e.tasks.flatMap(t => [t.provenance, ...(t.url ? [t.url] : [])]),
]).concat(guides.flatMap(e => [...e.sources, ...e.results.map(r => r.url), ...e.tasks.flatMap(t => t.url ? [t.url] : [])])))];
const records = []; let index = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (index < urls.length) {
    const url = urls[index++];
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const body = await response.arrayBuffer();
      records.push({ url, status: response.status, finalUrl: response.url, bytes: body.byteLength,
        sha256: createHash('sha256').update(Buffer.from(body)).digest('hex'), reachable: response.ok });
    } catch { records.push({ url, status: null, reachable: false }); }
  }
}));
await mkdir('work/beta-content', { recursive: true });
await writeFile('work/beta-content/source-checks.json', JSON.stringify({ checkedAt: new Date().toISOString(),
  productionWrites: 0, permissionInferred: false, accuracyInferred: false,
  records: records.sort((a, b) => a.url.localeCompare(b.url)) }, null, 2) + '\n');
console.log(JSON.stringify({ checked: records.length, reachable: records.filter(r => r.reachable).length,
  review: records.filter(r => !r.reachable), note: 'HTTP status does not prove task access, accuracy or republication rights.' }));
