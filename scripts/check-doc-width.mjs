#!/usr/bin/env node
// 文档宽度检查：扫描 docs/design/（含子目录）所有 .md，报 >300 字符单行的文件。
// 用途：文档人类可读判据（README 归属规则 6）——防 markdown 整节压成单行的格式债复发。
// 用法：node scripts/check-doc-width.mjs [--dir <docs/design>] [--max 300]
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const maxW = (() => {
  const i = args.indexOf("--max");
  return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 300;
})();
const root = (() => {
  const i = args.indexOf("--dir");
  return i >= 0 && args[i + 1] ? resolve(args[i + 1]) : join(process.cwd(), "docs", "design");
})();

/** 递归收集 .md 文件 */
function collect(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

let badFiles = 0;
let badLines = 0;
for (const f of collect(root)) {
  const lines = readFileSync(f, "utf8").split("\n");
  const long = lines
    .map((l, i) => ({ len: l.length, i: i + 1 }))
    .filter((x) => x.len > maxW);
  if (long.length) {
    badFiles++;
    badLines += long.length;
    const rel = f.replace(root + /[\\/]?/, "");
    console.log(`✗ ${rel}: ${long.length} 行 >${maxW} 字符`);
    for (const x of long.slice(0, 3)) console.log(`    :${x.i} (${x.len} chars)`);
    if (long.length > 3) console.log(`    … 共 ${long.length} 行`);
  }
}

if (badFiles) {
  console.log(`\nFAIL: ${badFiles} 文件 / ${badLines} 行超 ${maxW} 字符——违反 README 归属规则 6（文档人类可读）。`);
  process.exit(1);
}
console.log(`OK: docs/design/ 全部 .md 无 >${maxW} 字符单行（${collect(root).length} 文件）。`);
