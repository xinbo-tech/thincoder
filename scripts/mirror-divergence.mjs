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
 * ── 覆盖面（F10——本板块全部招牌数字由本脚本唯一复现） ─────────────────────────
 *  ① 主面（`src/**`）：同路径对数 · 逐字节对数 · ≥0.9 对数 · 中位（全体 + 逐子目录）
 *  ② 按类型（扩展名）拆分 · 按目录拆分 · 相似度分布分档
 *  ③ 单端枚举计数（仅一侧存在的档数 + 行数）
 *  ④ 中文权威镜像对（两产品 `docs/design/prompts/`）
 *  ⑤ 提示词面逐档读数（`src/prompts/**` 15 档 + `src/tools/*.md` 25 档：档名集合枚举 + 逐档 sha256）
 *  ⑥ S0a / S0b 席位判定（判据 = 逐字节同 ∨ sim ≥ 0.90；语义对位遍行非本脚本可枚举）
 *  ⑦ 枚举面补充（口径块外）：符号链接**跟随目标**（不静默跳过）· 同一真实目录只遍历一次（realpath 防环）
 *
 * ── 输出（默认人类可读；`--json` 给机器——单行 JSON） ─────────────────────────
 *  1. 两树档数 · 同路径对数
 *  2. 逐字节完全相同对数（+ 名单）
 *  3. 相似度 ≥0.9 对数（+ 名单，含各自相似度值）
 *  4. 全体中位数 + 分子目录中位数
 *  5. 按类型拆分 · 6. 按目录拆分 · 7. 相似度分布分档
 *  8. 单端枚举（计数 + 逐目录；逐档名单见 `--json` 的 `singleEnd`）
 *  9. 中文镜像对 · 10. 提示词面逐档读数 · 11. 席位判定
 *
 * ── 用法 / 退出码契约 ─────────────────────────────────────────────────────────
 *  node scripts/mirror-divergence.mjs [--json] [--help]
 *      [--root <dir>] [--a <dir>] [--b <dir>] [--mirror-a <dir>] [--mirror-b <dir>]
 *   --root <dir>        仓根（默认 = 本脚本所在仓根，即 `scripts/` 的父目录）
 *   --a / --b <dir>     主面两侧待比目录（默认 = <仓根>/thincoder/src ·
 *                       <仓根>/thincoder-vscode/src）
 *   --mirror-a/-b <dir> 中文镜像两侧（默认 = <仓根>/thincoder/docs/design/prompts ·
 *                       <仓根>/thincoder-vscode/docs/design/prompts）
 *   --json              机器可读输出（单行 JSON）
 *   --help / -h         打印本用法（stdout）· exit 0
 *   相对路径一律按仓根解析，绝对路径原样；旗标缺值 · 值为空 · 值以 `-` 开头（防吞下一个旗标）⇒ 用法错误。
 *  退出码：0 = 成功（含 `--help`）· 2 = 用法错误（未知旗标 / 旗标缺值）·
 *          1 = 运行期错误（含输入面：目录不存在 / 不可读 / 链接悬空；其余运行期失败同码）。
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** 默认主面两侧待比目录（相对仓根）。 */
export const DEFAULT_A = "thincoder/src";
export const DEFAULT_B = "thincoder-vscode/src";
/** 默认中文权威镜像两侧（相对仓根——F10 ④）。 */
export const DEFAULT_MIRROR_A = "thincoder/docs/design/prompts";
export const DEFAULT_MIRROR_B = "thincoder-vscode/docs/design/prompts";
/** 相似度「近同」阈值（口径固定值——不改）。 */
export const NEAR_SAME = 0.9;
/** 顶层档（相对路径无 `/`）的分组名。 */
export const TOP_BUCKET = "(top)";
/** 无扩展名档的类型名。 */
export const NO_EXT = "(none)";
/** 相似度分布分档（下界闭 / 上界开；与需求档 §1 的四档逐位一致）。 */
export const DIST_BUCKETS = [
  { label: "≥0.9", min: 0.9 },
  { label: "0.5–0.9", min: 0.5 },
  { label: "0.2–0.5", min: 0.2 },
  { label: "<0.2", min: 0 },
];
/** 提示词面（F10 ⑤）：槽位提示词 = 目录全档；工具描述 = 该目录下 `.md`。 */
export const PROMPT_FACES = [
  { name: "prompts", a: "thincoder/src/prompts", b: "thincoder-vscode/src/prompts", ext: null },
  { name: "tool-docs", a: "thincoder/src/tools", b: "thincoder-vscode/src/tools", ext: ".md" },
];

/** 用法（`--help` 与用法错误提示共用——与头注「用法 / 退出码契约」同源）。 */
export const USAGE = [
  "用法：node scripts/mirror-divergence.mjs [--json] [--help]",
  "        [--root <dir>] [--a <dir>] [--b <dir>] [--mirror-a <dir>] [--mirror-b <dir>]",
  "  --root <dir>        仓根（默认 = 本脚本所在仓根）",
  "  --a / --b <dir>     主面两侧待比目录（默认 = <仓根>/thincoder/src · <仓根>/thincoder-vscode/src）",
  "  --mirror-a/-b <dir> 中文镜像两侧（默认 = <仓根>/thincoder{,-vscode}/docs/design/prompts）",
  "  --json              机器可读输出（单行 JSON）",
  "  --help / -h         打印本用法并 exit 0",
  "  （旗标值不得为空、不得以 - 开头——防把下一个旗标吞成值）",
  "退出码：0 = 成功 · 2 = 用法错误（未知旗标 / 旗标缺值）· 1 = 运行期错误（含输入面：目录缺失 / 不可读）",
].join("\n");

/** 本脚本所在仓根 = `scripts/` 的父目录。 */
export function scriptRoot() {
  return dirname(dirname(fileURLToPath(import.meta.url)));
}

/**
 * 递归列目录下全部文件；返回**相对 base** 的路径（`/` 分隔、大小写原样、仅文件）。
 * 符号链接**跟随目标**（目录 ⇒ 递归 · 文件 ⇒ 计入）——不静默跳过；同一真实目录只遍历一次（防环）。
 * 悬空链接 ⇒ 抛（由 CLI 归入输入面错误 · exit 1）。
 */
export function walkFiles(dir, base = dir, acc = [], seen = new Set()) {
  let real;
  try { real = realpathSync(dir); } catch { real = dir; }
  if (seen.has(real)) return acc;
  seen.add(real);
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(abs, base, acc, seen);
    else if (ent.isFile()) acc.push(relative(base, abs).split(sep).join("/"));
    else if (ent.isSymbolicLink()) {
      const st = statSync(abs);
      if (st.isDirectory()) walkFiles(abs, base, acc, seen);
      else if (st.isFile()) acc.push(relative(base, abs).split(sep).join("/"));
    }
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

/** 档型 = 扩展名（无扩展名 ⇒ `(none)`）。 */
export function typeOf(rel) {
  const i = rel.lastIndexOf(".");
  return i > rel.lastIndexOf("/") ? rel.slice(i) : NO_EXT;
}

/** 档行数 = 换行符计数（`wc -l` 口径——与设计档 §2.8 行数口径同）。 */
export function countLines(absPath) {
  return readFileSync(absPath, "utf8").split("\n").length - 1;
}

/** 按相对路径首段分组（顶层档 ⇒ `(top)`）。 */
export function groupByDir(rels) {
  const m = new Map();
  for (const p of rels) {
    const k = bucketOf(p);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(p);
  }
  return m;
}

/** 相似度分布分档计数（档位 = `DIST_BUCKETS` 中首个满足 `v ≥ min` 者）。 */
export function distribution(values) {
  const counts = DIST_BUCKETS.map((b) => ({ label: b.label, count: 0 }));
  for (const v of values) counts[DIST_BUCKETS.findIndex((b) => v >= b.min)].count++;
  return counts;
}

/** 按名称升序（`dir` / `type` 通用）。 */
const byName = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

/**
 * 成对读数（相对路径逐段相等者成对）——主面与镜像面 / 提示词面共用。
 * @param {string} dirA 侧 A 根（绝对路径）
 * @param {string} dirB 侧 B 根（绝对路径）
 * @param {{ext?: string|null}} [opts] `ext` = 只收该后缀（提示词工具描述面用 `.md`）
 */
export function collect(dirA, dirB, { ext = null } = {}) {
  const keep = (p) => ext === null || p.endsWith(ext);
  const filesA = walkFiles(dirA).filter(keep).sort();
  const filesB = walkFiles(dirB).filter(keep).sort();
  const setA = new Set(filesA);
  const setB = new Set(filesB);
  const rows = filesA.filter((p) => setB.has(p)).map((rel) => {
    const absA = join(dirA, ...rel.split("/"));
    const absB = join(dirB, ...rel.split("/"));
    const shaA = sha256(absA);
    const shaB = sha256(absB);
    return { path: rel, jaccard: jaccard(lineSet(absA), lineSet(absB)), shaA, shaB, identical: shaA === shaB };
  });
  return {
    filesA,
    filesB,
    rows,
    onlyA: filesA.filter((p) => !setB.has(p)),
    onlyB: filesB.filter((p) => !setA.has(p)),
  };
}

/**
 * 全量读数（主面 / 镜像面共用）：成对 + 中位 + 拆分 + 分布 + 单端枚举。
 * 前 6 键（`a` / `b` / `pairs` / `identical` / `similar` / `median`）与旧口径逐位一致。
 * @param {string} dirA 侧 A 根（绝对路径）
 * @param {string} dirB 侧 B 根（绝对路径）
 * @param {{threshold?: number, ext?: string|null}} [opts]
 */
export function analysis(dirA, dirB, { threshold = NEAR_SAME, ext = null } = {}) {
  const { filesA, filesB, rows, onlyA, onlyB } = collect(dirA, dirB, { ext });
  const identical = rows.filter((r) => r.identical);
  const similar = rows.filter((r) => r.jaccard >= threshold);
  const groups = new Map();
  const types = new Map();
  for (const r of rows) {
    const bucket = bucketOf(r.path);
    if (!groups.has(bucket)) groups.set(bucket, []);
    groups.get(bucket).push(r);
    const type = typeOf(r.path);
    if (!types.has(type)) types.set(type, []);
    types.get(type).push(r);
  }
  const stat = (rs) => ({
    count: rs.length,
    identical: rs.filter((r) => r.identical).length,
    similar: rs.filter((r) => r.jaccard >= threshold).length,
    median: median(rs.map((r) => r.jaccard)),
  });
  const side = (root, files) => ({
    count: files.length,
    lines: files.reduce((s, p) => s + countLines(join(root, ...p.split("/"))), 0),
    byDir: [...groupByDir(files).entries()]
      .map(([dir, fs]) => ({
        dir,
        count: fs.length,
        lines: fs.reduce((s, p) => s + countLines(join(root, ...p.split("/"))), 0),
      }))
      .sort((x, y) => byName(x.dir, y.dir)),
    files: files.map((p) => ({ path: p, lines: countLines(join(root, ...p.split("/"))) })),
  });
  return {
    a: { dir: dirA, files: filesA.length },
    b: { dir: dirB, files: filesB.length },
    pairs: rows.length,
    identical: { count: identical.length, list: identical.map((r) => ({ path: r.path, sha256: r.shaA })) },
    similar: { threshold, count: similar.length, list: similar.map((r) => ({ path: r.path, jaccard: r.jaccard })) },
    median: {
      overall: median(rows.map((r) => r.jaccard)),
      bySubdir: [...groups.entries()]
        .map(([dir, xs]) => ({ dir, median: median(xs.map((r) => r.jaccard)), count: xs.length }))
        .sort((x, y) => (x.dir < y.dir ? -1 : x.dir > y.dir ? 1 : 0)),
    },
    rows: rows.map((r) => ({ path: r.path, jaccard: r.jaccard, identical: r.identical })),
    split: {
      byType: [...types.entries()]
        .map(([type, rs]) => ({ type, ...stat(rs) }))
        .sort((x, y) => (y.count - x.count) || byName(x.type, y.type)),
      byDir: [...groups.entries()].map(([dir, rs]) => ({ dir, ...stat(rs) })).sort((x, y) => byName(x.dir, y.dir)),
    },
    distribution: {
      byType: [...types.entries()]
        .map(([type, rs]) => ({ type, buckets: distribution(rs.map((r) => r.jaccard)) }))
        .sort((x, y) => byName(x.type, y.type)),
      buckets: distribution(rows.map((r) => r.jaccard)),
    },
    singleEnd: { a: side(dirA, onlyA), b: side(dirB, onlyB) },
  };
}

/** 兼容投影（旧消费面——`analysis()` 前 6 键）。 */
export function analyze(dirA, dirB, opts) {
  const { a, b, pairs, identical, similar, median: med } = analysis(dirA, dirB, opts);
  return { a, b, pairs, identical, similar, median: med };
}

/** 提示词面逐档读数（F10 ⑤）：档名集合枚举 + 逐档 sha256（双侧）。 */
export function promptFace(rootAbs) {
  const faces = PROMPT_FACES.map((f) => {
    const dirA = resolve(rootAbs, f.a);
    const dirB = resolve(rootAbs, f.b);
    const { filesA, filesB, rows, onlyA, onlyB } = collect(dirA, dirB, { ext: f.ext });
    const entries = rows.map((r) => ({
      name: r.path,
      sha256A: r.shaA,
      sha256B: r.shaB,
      identical: r.identical,
      jaccard: r.jaccard,
    }));
    const one = (root, p) => ({ name: p, sha256: sha256(join(root, ...p.split("/"))) });
    return {
      name: f.name,
      ext: f.ext,
      dirA,
      dirB,
      countA: filesA.length,
      countB: filesB.length,
      namesA: filesA,
      namesB: filesB,
      pairs: rows.length,
      onlyA: onlyA.map((p) => one(dirA, p)),
      onlyB: onlyB.map((p) => one(dirB, p)),
      identical: { count: entries.filter((e) => e.identical).length, list: entries.filter((e) => e.identical).map((e) => e.name) },
      different: { count: entries.filter((e) => !e.identical).length, list: entries.filter((e) => !e.identical).map((e) => e.name) },
      entries,
    };
  });
  return {
    faces,
    totals: {
      files: faces.reduce((s, f) => s + f.pairs, 0),
      identical: faces.reduce((s, f) => s + f.identical.count, 0),
      different: faces.reduce((s, f) => s + f.different.count, 0),
    },
  };
}

/** S0a / S0b 席位判定（F10 ⑥）：判据 = 逐字节同 ∨ sim ≥ threshold。 */
export function seats(main, mirror, threshold = NEAR_SAME) {
  const inS0a = (r) => r.identical || r.jaccard >= threshold;
  const pick = (rows) => ({
    total: rows.length,
    s0a: rows.filter(inS0a).length,
    s0b: rows.filter((r) => !inS0a(r)).length,
    s0aList: rows.filter(inS0a).map((r) => ({ path: r.path, jaccard: r.jaccard, identical: r.identical })),
  });
  const samePath = pick(main.rows);
  const mirrored = pick(mirror.rows);
  return {
    threshold,
    predicate: `逐字节同（sha256）∨ sim ≥ ${threshold}`,
    samePath,
    mirror: mirrored,
    s0aTotal: samePath.s0a + mirrored.s0a,
    s0bTotal: samePath.s0b + mirrored.s0b,
    note: "S0b 另含语义对位遍产出行全集（B9 / B16）——由 S0 逐条发现，非本脚本可枚举",
  };
}

/** 组装参数 → 全量度量（`a` / `b` / 镜像面相对仓根解析；绝对路径原样）。 */
export function run({ root = scriptRoot(), a = null, b = null, mirrorA = null, mirrorB = null, threshold = NEAR_SAME } = {}) {
  const rootAbs = resolve(root);
  const main = analysis(resolve(rootAbs, a ?? DEFAULT_A), resolve(rootAbs, b ?? DEFAULT_B), { threshold });
  const mirror = analysis(resolve(rootAbs, mirrorA ?? DEFAULT_MIRROR_A), resolve(rootAbs, mirrorB ?? DEFAULT_MIRROR_B), { threshold });
  return {
    root: rootAbs,
    ...main,
    mirror: {
      a: mirror.a,
      b: mirror.b,
      pairs: mirror.pairs,
      identical: mirror.identical,
      similar: mirror.similar,
      median: mirror.median,
      rows: mirror.rows,
    },
    promptFace: promptFace(rootAbs),
    seats: seats(main, mirror, threshold),
  };
}

const f4 = (x) => (x === null ? "n/a" : x.toFixed(4));

/** 人类可读报告（入参 = `run()` 的返回——`analyze()` 的返回不含新增面，此处兜底）。 */
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
  if (!res.split) return out.join("\n"); // 旧消费面（`analyze()` 结果）——只出 1–4
  const line = (key, s) =>
    `    ${String(key).padEnd(14)} ${String(s.count).padStart(3)} 对  逐字节同 ${String(s.identical).padStart(3)}` +
    `  ≥${res.similar.threshold} ${String(s.similar).padStart(3)}  中位 ${f4(s.median)}`;
  out.push("");
  out.push("[5] 按类型拆分（类型 = 扩展名）：");
  for (const t of res.split.byType) out.push(line(t.type, t));
  out.push("");
  out.push("[6] 按目录拆分：");
  for (const d of res.split.byDir) out.push(line(d.dir, d));
  out.push("");
  out.push("[7] 相似度分布分档（下界闭 / 上界开）：");
  const fmt = (bs) => bs.map((b) => `${b.label} = ${b.count}`).join(" · ");
  out.push(`    全体           ${fmt(res.distribution.buckets)}`);
  for (const t of res.distribution.byType) out.push(`    ${t.type.padEnd(14)} ${fmt(t.buckets)}`);
  out.push("");
  out.push("[8] 单端枚举（仅一侧存在；逐档名单见 --json 的 singleEnd）：");
  for (const [label, s] of [["A", res.singleEnd.a], ["B", res.singleEnd.b]]) {
    out.push(`    ${label} 端独有 = ${s.count} 档 / ${s.lines} 行`);
    for (const d of s.byDir) out.push(`      ${d.dir.padEnd(14)} ${String(d.count).padStart(3)} 档 / ${d.lines} 行`);
  }
  out.push("");
  out.push(`[9] 中文权威镜像对 = ${res.mirror.pairs} 对`);
  out.push(`    A = ${res.mirror.a.dir}（${res.mirror.a.files} 档）· B = ${res.mirror.b.dir}（${res.mirror.b.files} 档）`);
  out.push(`    逐字节同 ${res.mirror.identical.count} · ≥${res.mirror.similar.threshold} ${res.mirror.similar.count} · 中位 ${f4(res.mirror.median.overall)}`);
  for (const r of res.mirror.rows) out.push(`      · ${f4(r.jaccard)}  ${r.path}${r.identical ? "（逐字节同）" : ""}`);
  out.push("");
  out.push("[10] 提示词面逐档读数（档名集合枚举 + 逐档 sha256；此处取前 12 位——完整值见 --json 的 promptFace）：");
  for (const f of res.promptFace.faces) {
    out.push(
      `    ${f.name}：A ${f.countA} 档 / B ${f.countB} 档 · 成对 ${f.pairs} · 逐字节同 ${f.identical.count}` +
        ` · 不同 ${f.different.count} · 仅 A ${f.onlyA.length} / 仅 B ${f.onlyB.length}`,
    );
    for (const e of f.entries) out.push(`      · ${e.identical ? "同" : "异"} ${e.name}  ${e.sha256A.slice(0, 12)} ${e.sha256B.slice(0, 12)}`);
    for (const x of f.onlyA) out.push(`      · 仅 A ${x.name}  ${x.sha256.slice(0, 12)}`);
    for (const x of f.onlyB) out.push(`      · 仅 B ${x.name}  ${x.sha256.slice(0, 12)}`);
  }
  out.push(`    合计：${res.promptFace.totals.files} 档 · 逐字节同 ${res.promptFace.totals.identical} · 不同 ${res.promptFace.totals.different}`);
  out.push("");
  out.push(`[11] S0a / S0b 席位判定（判据 = ${res.seats.predicate}）：`);
  out.push(`    同路径对：S0a ${res.seats.samePath.s0a} · S0b ${res.seats.samePath.s0b}（共 ${res.seats.samePath.total}）`);
  out.push(`    中文镜像对：S0a ${res.seats.mirror.s0a} · S0b ${res.seats.mirror.s0b}（共 ${res.seats.mirror.total}）`);
  out.push(`    合计：S0a ${res.seats.s0aTotal} · S0b ${res.seats.s0bTotal}`);
  out.push(`    ${res.seats.note}`);
  return out.join("\n");
}

/** 用法错误（未知旗标 / 旗标缺值 ⇒ exit 2）。 */
class UsageError extends Error {}

/** 解析 argv——未知旗标 / 旗标缺值 ⇒ 抛 `UsageError`（不静默忽略；契约见头注）。 */
export function parseArgs(argv) {
  const opts = { json: false, help: false };
  const valued = { "--root": "root", "--a": "a", "--b": "b", "--mirror-a": "mirrorA", "--mirror-b": "mirrorB" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") opts.json = true;
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg in valued) {
      const value = argv[++i];
      if (!value || value.startsWith("-")) throw new UsageError(`参数缺值：${arg}`);
      opts[valued[arg]] = value;
    } else throw new UsageError(`未知参数：${arg}`);
  }
  return opts;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`${err.message}\n${USAGE}`);
    process.exit(2);
  }
  if (opts.help) {
    console.log(USAGE);
    process.exit(0);
  }
  let res;
  try {
    res = run(opts);
  } catch (err) {
    console.error(`运行期错误：${err.message}`);
    process.exit(1);
  }
  console.log(opts.json ? JSON.stringify(res) : formatReport(res));
}
