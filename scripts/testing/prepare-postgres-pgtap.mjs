// Installs pinned upstream pgTAP SQL into the ignored disposable runtime only.
// No production/project dependencies or database connections are touched.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const platform = process.platform === "win32" ? "windows" : process.platform;
// The pinned Linux distribution installs into share/postgresql/extension;
// Windows installs into share/extension. Do not write outside the test runtime.
const share = process.platform === "linux" ? "share/postgresql" : "share";
const destination = resolve(`work/release-postgres/node_modules/@embedded-postgres/${platform}-${process.arch}/native/${share}/extension`);
assert.ok(destination.startsWith(resolve("work/release-postgres/node_modules") + "/") || destination.startsWith(resolve("work/release-postgres/node_modules") + "\\"));
await access(destination);
const source = "https://raw.githubusercontent.com/theory/pgtap/v1.3.3/sql/pgtap.sql.in";
const response = await fetch(source);
assert.equal(response.ok, true, "pgTAP download failed");
const sql = await response.text();
assert.equal(createHash("sha256").update(sql).digest("hex"), "7be61f3cacc0e85547eae17a4829438029d149e05a1b2cacb7f2727c46326bd6", "pgTAP source changed; inspect before running");
await writeFile(resolve(destination, "pgtap--1.3.3.sql"), sql.replaceAll("__VERSION__", "1.3").replaceAll("__OS__", process.platform));
await writeFile(resolve(destination, "pgtap.control"), "comment = 'Pinned pgTAP for disposable QA'\ndefault_version = '1.3.3'\nrelocatable = true\n");
console.log("Pinned pgTAP prepared in disposable runtime; no database operations performed.");
