#!/usr/bin/env node
/**
 * mirror-divergence.mjs — 两产品镜像发散度度量（可复现工具 · 零依赖 · 只用 node: 内建）。
 *
 * ── 口径（本工具存在的全部意义——数字可复现的前提；逐字如此，勿改） ────────────
 *  · 成对判据：两产品 `<仓根>/thincoder/src/**` ↔ `<仓根>/thincoder-vscode/src/**` 下
 *    **相对路径逐段相等**者成对（仅文件；大小写敏感、扩展名在内）。
 *  · 相似度：两侧各自读成行、**去首尾空白 + 丢空行**后取**行集合**，
 *    相似度 = **Jaccard = |交集| / |并集|**。
 *  · 另报**逐字节完全相同**（sha256 比对）对数。
 *  注：口径**不按扩展名过滤**——`src/**` 下全部档型（`.md` 等非代码档）一并计入成对与统计；
 *      与「仅代码档」口径的数字不可直接互照，比对前先确认口径一致。
 *
 * ── 输出（默认人类可读；`--json` 给机器——单行 JSON） ─────────────────────────
 *  1. 两树档数 · 同路径对数
 *  2. 逐字节完全相同对数（+ 名单）
 *  3. 相似度 ≥0.9 对数（+ 名单，含各自相似度值）
 *  4. 全体中位数 + 分子目录中位数（子目录 = 相对路径首段；顶层档归 `(top)`）
 *
 * ── 用法 ──────────────────────────────────────────────────────────────────────
 *  node scripts/mirror-divergence.mjs [--json] [--root <dir>] [--a <dir>] [--b <dir>]
 *   --root <dir>    仓根（默认 = 本脚本所在仓根，即 scripts/ 的父目录）
 *   --a / --b <dir> 两侧待比目录（默认 = <仓根>/thincoder/src 与
 *                   <仓根>/thincoder-vscode/src；相对路径按仓根解析，绝对路径原样）
 *   --json          机器可读输出（单行 JSON）
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** 默认两侧待比目录（相对仓根）。 */
export const DEFAULT_A = "thincoder/src";
export const DEFAULT_B = "thincoder-vscode/src";
/** 相似度「近同」阈值（口径固定值——不改）。 */
export const NEAR_SAME = 0.9;
/** 顶层档（相对路径无 `/`）的分组名。 */
export const TOP_BUCKET = "(top)";

/** 本脚本所在仓根 = `scripts/` 的父目录。 */
export function scriptRoot() {
  return dirname(dirname(fileURLToPath(import.meta.url)));
}

/** 递归列目录下全部文件；返回**相对 base** 的路径（`/` 分隔、大小写原样、仅文件）。 */
export function walkFiles(dir, base = dir, acc = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(abs, base, acc);
    else if (ent.isFile()) acc.push(relative(base, abs).split(sep).join("/"));
  }
  return acc;
}

/** 读成行 → 去首尾空白 + 丢空行 → 行集合（相似度判据的输入面）。 */
export function lineSet(absPath) {
  const set = new Set();
  for (const line of readFileSync(absPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (t) set.add(t);
  }
  return set;
}

/** Jaccard = |交集| / |并集|（两侧皆空 ⇒ 1）。 */
export function jaccard(a, b) {
  let inter = 0;
  for (const v of a) if (b.has(v)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}

/** 逐字节判据（sha256）。 */
export function sha256(absPath) {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex");
}

/** 中位数（偶数取中二均值；空输入 ⇒ null）。 */
export function median(values) {
  const n = values.length;
  if (!n) return null;
  const s = [...values].sort((x, y) => x - y);
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

/** 相对路径首段 = 所属子目录（无 `/` 的顶层档 ⇒ `(top)`）。 */
export function bucketOf(rel) {
  return rel.includes("/") ? rel.split("/")[0] : TOP_BUCKET;
}

/**
 * 全量度量。
 * @param {string} dirA 侧 A 根（绝对路径）
 * @param {string} dirB 侧 B 根（绝对路径）
 * @param {{threshold?: number}} [opts]
 */
export function analyze(dirA, dirB, { threshold = NEAR_SAME } = {}) {
  const filesA = walkFiles(dirA).sort();
  const setB = new Set(walkFiles(dirB));
  const pairs = filesA.filter((p) => setB.has(p)); // 相对路径逐段相等 = 两侧同口径字符串相等

  const rows = pairs.map((rel) => {
    const absA = join(dirA, ...rel.split("/"));
    const absB = join(dirB, ...rel.split("/"));
    const digA = sha256(absA);
    return { path: rel, jaccard: jaccard(lineSet(absA), lineSet(absB)), digA, identical: digA === sha256(absB) };
  });

  const groups = new Map();
  for (const r of rows) {
    const bucket = bucketOf(r.path);
    if (!groups.has(bucket)) groups.set(bucket, []);
    groups.get(bucket).push(r.jaccard);
  }

  const identical = rows.filter((r) => r.identical);
  const similar = rows.filter((r) => r.jaccard >= threshold);
  return {
    a: { dir: dirA, files: filesA.length },
    b: { dir: dirB, files: setB.size },
    pairs: rows.length,
    identical: { count: identical.length, list: identical.map((r) => ({ path: r.path, sha256: r.digA })) },
    similar: { threshold, count: similar.length, list: similar.map((r) => ({ path: r.path, jaccard: r.jaccard })) },
    median: {
      overall: median(rows.map((r) => r.jaccard)),
      bySubdir: [...groups.entries()]
        .map(([dir, xs]) => ({ dir, median: median(xs), count: xs.length }))
        .sort((x, y) => (x.dir < y.dir ? -1 : x.dir > y.dir ? 1 : 0)),
    },
  };
}

const f4 = (x) => (x === null ? "n/a" : x.toFixed(4));

/** 人类可读报告（入参 = `run()` 的返回——`analyze()` 的返回不含 `root`，此处兜底）。 */
export function formatReport(res) {
  const out = [];
  out.push(`镜像发散度度量 — 仓根 ${res.root ?? "(未提供)"}`);
  out.push(`  A = ${res.a.dir}（${res.a.files} 档）`);
  out.push(`  B = ${res.b.dir}（${res.b.files} 档）`);
  out.push(`[1] 同路径对数 = ${res.pairs}`);
  out.push("");
  out.push(`[2] 逐字节完全相同（sha256）= ${res.identical.count} 对`);
  for (const x of res.identical.list) out.push(`  · ${x.path}`);
  out.push("");
  out.push(`[3] 相似度 ≥${res.similar.threshold} = ${res.similar.count} 对`);
  for (const x of res.similar.list) out.push(`  · ${f4(x.jaccard)}  ${x.path}`);
  out.push("");
  out.push(`[4] 相似度中位数：全体 = ${f4(res.median.overall)}（n=${res.pairs}）`);
  out.push(`  分子目录（子目录 = 相对路径首段；顶层档 = ${TOP_BUCKET}）：`);
  for (const g of res.median.bySubdir) out.push(`    ${g.dir.padEnd(14)} ${f4(g.median)}  (n=${g.count})`);
  return out.join("\n");
}

/** 组装参数 → 度量结果（`a` / `b` 相对仓根解析；绝对路径原样）。 */
export function run({ root = scriptRoot(), a = null, b = null, threshold = NEAR_SAME } = {}) {
  const rootAbs = resolve(root);
  return {
    root: rootAbs,
    ...analyze(resolve(rootAbs, a ?? DEFAULT_A), resolve(rootAbs, b ?? DEFAULT_B), { threshold }),
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const args = process.argv.slice(2);
  const argOf = (flag) => { const i = args.indexOf(flag); return i >= 0 && args[i + 1] ? args[i + 1] : null; };
  const res = run({ root: argOf("--root") ?? scriptRoot(), a: argOf("--a"), b: argOf("--b") });
  console.log(args.includes("--json") ? JSON.stringify(res) : formatReport(res));
}
