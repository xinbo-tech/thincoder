#!/usr/bin/env node
/**
 * doc-impact.mjs — 反查脚本（文档影响面；设计 `ENGINEERING-MODE.md` §2.32.5.1；需求 §1.20 F7 / FR26）。
 *
 * 目标：给批次「受影响文件表」一条机械化的补充来源——改了哪些文件 / 符号 → 哪些设计/需求档必须跟着改。
 * 接口：`node scripts/doc-impact.mjs --base <ref> [--files a,b] [--json]`；`--base` **必给**（无默认 HEAD——
 * 基准 = 上一批收口点，实施轮开工前跑）。**只读、不写、不阻断**（非门禁——命中不改变退出码）：
 * 正常运行 / git 降级（仓不可读、基准解析失败）退出码 **0**（降级打印「反查跳过」行——不静默空转）；
 * 用法错误（缺 `--base`）退出码 **2**（fail-loud——工具根本没跑起来）。
 * 输入：① 变更文件（`git diff --name-only <base>` + `--files` 追加）② 变更符号（`git diff -U0 <base>` 的新增/删除
 * 行内标识符候选——**强形态过滤保留**（camelCase / snake_case / 全大写常量 / `_` 前缀 / 点径（非扩展名尾）；纯小写单词与路径形
 * 不入符号面）；反引号标识符经 V5 `extractAnchors` 并入（宽形态面——较强形态更松，命中面偏宽 = 已登记取舍）。
 * 输出：① 变更面（文件 + 符号候选）② 反查命中档清单（`docs/{design,requirements}` 内——每档一行 + 命中词 + 命中数）
 * ③ 一行提示（建议录入批次档 §2 受影响文件表）。输出**不自动**写批次档（写权归作者）。
 * 实现形态（单源）：纯函数 `docImpact({changedFiles, changedSymbols, docsRoot})`（快层直驱可测）+
 * 薄 git 包装（子进程——慢层 `slow()` 归册）+ CLI。扫描域常量复用 `V5_SCAN_DIRS`（D2 单源）。
 * 导出：isStrongSymbol / changedTokensFromDiff / docImpact / gitChangedSurface / main（`test/doc-impact.test.mjs` 消费）。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { extractAnchors, V5_SCAN_DIRS } from "../../scripts/doc-anchors.mjs"; // 扫描域 / 抽取面单源（D2——S4 单仓化改指仓根统一版）

/** 字面量 / 伪标识符停止集（强形态过滤保留的残余面——`NaN` 类会撞 camelCase 形态）。 */
const LITERALS = new Set(["NaN", "Infinity", "constructor", "prototype"]);
/** 代码 / 文档扩展名（点径强形态排除——`loop.mjs` 类裸文件名形态不入符号面；与 VSC 侧 A2 排除式同族）。 */
const CODE_EXT_RE = /\.(?:mjs|cjs|js|json|md|css|html|svg|yml|yaml|sh|ps1)$/;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** 行内拆分（与 VSC 侧反查同族口径——空白 / 常见标点断开；`-` / `.` / `/` 不在断点）。 */
const PIECE_SPLIT_RE = /[\s,;:()[\]{}"'`|]+/;
/** 强形态判据（过滤保留——`oldName` ✓ / `all_lower` ✗ / `SNAKE_CASE` ✓ / `_private` ✓ / `a.b` ✓）。 */
export function isStrongSymbol(t) {
  if (t.length < 3) return false; // 短 token 不入候选（`_` / 两字符碎片）
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(t)) return /^[A-Za-z_$][A-Za-z0-9_$]*\.[A-Za-z_$][A-Za-z0-9_$]*$/.test(t) && !CODE_EXT_RE.test(t); // 点径（两段；裸文件名形态排除）
  if (/[a-z][A-Z]/.test(t)) return true; // camelCase（含 ≥1 处小写→大写跃迁）
  if (t.startsWith("_")) return true; // 下划线前缀
  if (/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/.test(t)) return true; // snake_case
  return /^[A-Z][A-Z0-9_]{3,}$/.test(t); // 全大写常量（≥4 字符）
}

/** 变更行 token 抽取（过滤保留；反引号标识符复用 V5 `extractAnchors`——同形态面单源）。 */
export function changedTokensFromDiff(diffText) {
  const symbols = new Set();
  for (const line of diffText.split("\n")) {
    if (!/^[+-]/.test(line) || /^(\+\+\+|---)/.test(line)) continue; // 新增 / 删除行（跳过 diff 头行）
    const body = line.slice(1);
    for (const piece of body.split(PIECE_SPLIT_RE)) {
      const t = piece.replace(/:\d+(?:-\d+)?$/, ""); // 行号 / 区间尾剥除（与 V5-A 坐标同规）
      if (t && !LITERALS.has(t) && isStrongSymbol(t)) symbols.add(t);
    }
    const ex = extractAnchors(body);
    for (const a of [...ex.symbols, ...ex.wide]) symbols.add(a.anchor);
  }
  return { symbols: [...symbols].sort() };
}

/** 目录行走（跳过 `_archive` 等历史快照——与 V5 扫描域口径同源）。 */
function walkDocs(dir, out = []) {
  let names;
  try { names = readdirSync(dir); } catch { return out; }
  for (const n of names) {
    if (n === "_archive" || n === "node_modules") continue;
    const p = join(dir, n);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walkDocs(p, out);
    else if (p.endsWith(".md")) out.push(p);
  }
  return out;
}

/** 反查纯函数：变更面 × `docs/{design,requirements}` 全文 → 命中档清单（每档一行 + 命中词 + 命中数）。 */
export function docImpact({ changedFiles = [], changedSymbols = [], docsRoot }) {
  const files = [...new Set(changedFiles.map((f) => f.replace(/\\/g, "/").replace(/^\.\//, "")))].sort();
  const symbols = [...new Set(changedSymbols)].sort();
  const seen = new Set(), words = [];
  const push = (word, re) => { if (!seen.has(word)) { seen.add(word); words.push({ word, re }); } };
  for (const w of symbols) push(w, new RegExp(`(?<![A-Za-z0-9_$])${escapeRe(w)}(?![A-Za-z0-9_$])`, "g"));
  for (const w of files) { // 档引用面 = 全路径或 basename 形态（`src/a/x.mjs` / `x.mjs:12` 同判）
    const b = w.split("/").pop();
    push(b, new RegExp(`(?<![A-Za-z0-9_.\\-])${escapeRe(b)}(?![A-Za-z0-9_.\\-])`, "g"));
  }
  const hits = [];
  let scanned = 0;
  for (const dir of V5_SCAN_DIRS) {
    for (const abs of walkDocs(join(docsRoot, dir))) {
      scanned++;
      const found = [];
      const text = readFileSync(abs, "utf8");
      for (const w of words) {
        const n = [...text.matchAll(w.re)].length;
        if (n > 0) found.push({ word: w.word, count: n });
      }
      if (!found.length) continue;
      found.sort((a, b) => b.count - a.count || (a.word < b.word ? -1 : 1));
      hits.push({ doc: relative(docsRoot, abs).replace(/\\/g, "/"), count: found.reduce((s, w) => s + w.count, 0), words: found });
    }
  }
  hits.sort((a, b) => b.count - a.count || (a.doc < b.doc ? -1 : 1));
  return { docsRoot: resolve(docsRoot), changedFiles: files, changedSymbols: symbols, scanned, hits };
}

/** 薄 git 包装（子进程——慢层归册）：`--base` 起 diff → 变更文件（`--files` 追加）+ 变更符号。 */
export function gitChangedSurface({ base, extraFiles = [], cwd = process.cwd() }) {
  const run = (args) => {
    const r = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")} 失败：${String(r.stderr ?? "").trim()}`);
    return String(r.stdout ?? "");
  };
  const names = run(["diff", "--name-only", base]).split("\n").map((s) => s.trim()).filter(Boolean);
  const tokens = changedTokensFromDiff(run(["diff", "-U0", base]));
  return { files: [...new Set([...names, ...extraFiles])].sort(), symbols: tokens.symbols };
}

const USAGE = "用法：node scripts/doc-impact.mjs --base <ref> [--files a,b] [--json]（--base 必给——基准 = 上一批收口点）";
/** CLI 主行程：正常 / git 降级 ⇒ 0（非门禁——命中不阻断）；缺 `--base` ⇒ 2（fail-loud）。 */
export function main(argv = process.argv.slice(2), { cwd = process.cwd() } = {}) {
  const i = argv.indexOf("--base"), base = i >= 0 ? argv[i + 1] : undefined;
  if (!base || base.startsWith("--")) { console.error(USAGE); return 2; }
  const f = argv.indexOf("--files");
  const extraFiles = f >= 0 && argv[f + 1] && !argv[f + 1].startsWith("--") ? argv[f + 1].split(",").map((s) => s.trim()).filter(Boolean) : [];
  let surface;
  try { surface = gitChangedSurface({ base, extraFiles, cwd }); }
  catch (e) { console.log(`反查跳过（不阻断）：git 不可用 / 基准不可读（base = ${base}）——${String(e.message).split("\n")[0]}`); return 0; }
  const r = docImpact({ changedFiles: surface.files, changedSymbols: surface.symbols, docsRoot: cwd });
  if (argv.includes("--json")) { console.log(JSON.stringify({ base, ...r }, null, 2)); return 0; }
  console.log(`文档影响面反查（base = ${base}）`);
  console.log(`变更面：文件 ${r.changedFiles.length} 个 · 符号候选 ${r.changedSymbols.length} 个`);
  if (r.changedFiles.length) console.log(`  文件：${r.changedFiles.join(" · ")}`);
  if (r.changedSymbols.length) console.log(`  符号：${r.changedSymbols.join(" · ")}`);
  console.log(r.hits.length
    ? `反查命中 ${r.hits.length} 档（${V5_SCAN_DIRS.join(" + ")}）：`
    : `反查命中 0 档（${V5_SCAN_DIRS.join(" + ")}——变更面未被设计/需求档引用）`);
  for (const h of r.hits) console.log(`${h.doc} — 命中 ${h.count} 处：${h.words.map((w) => `${w.word}(${w.count})`).join(" · ")}`);
  console.log("以上档建议录入批次档 §2 受影响文件表");
  return 0;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) process.exit(main());
