// Optional local-only browser fixture, isolated from Next.js and Supabase.
import { createServer } from "node:http";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { build } = await import(pathToFileURL(resolve("work/release-postgres/node_modules/esbuild/lib/main.js")));
const result = await build({ entryPoints: ["tests/fixtures/competition-pages-qa.tsx"], bundle: true,
  platform: "browser", format: "esm", write: false, define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" } });
const css = readdirSync(".next/static/chunks").filter((file) => file.endsWith(".css"))
  .map((file) => readFileSync(resolve(".next/static/chunks", file), "utf8")).join("\n");
const server = createServer((request, response) => {
  const path = new URL(request.url, "http://127.0.0.1:3111").pathname;
  response.setHeader("Cache-Control", "no-store");
  if (path === "/qa.js") { response.setHeader("Content-Type", "text/javascript"); response.end(result.outputFiles[0].contents); }
  else if (path === "/qa.css") { response.setHeader("Content-Type", "text/css"); response.end(css); }
  else if (path === "/") { response.setHeader("Content-Type", "text/html"); response.end('<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>KAIZ local component QA</title><link rel="stylesheet" href="/qa.css"></head><body><div id="qa-root"></div><script type="module" src="/qa.js"></script></body></html>'); }
  else { response.writeHead(404); response.end(); }
});
server.listen(3111, "127.0.0.1", () => console.log("Local component QA: http://127.0.0.1:3111 (no database or auth)"));
process.on("SIGINT", () => server.close());
