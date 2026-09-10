#!/usr/bin/env node
/**
 * check-doc-width.mjs — 文档宽度检查 + 文档一致性机械校验 V1/V2
 * （ENGINEERING-MODE.md §2.19 文档更新纪律 · D3/D4 的可机判最小集）。
 *
 * ① 宽度检查（既有）：扫描域内 .md 的 >max 字符单行（文档人类可读判据——README 归属规则 6）。
 *    扫描域 = docs/design + docs/requirements + docs/batches（排除 _archive/——历史快照豁免，
 *    同 collectMarkdown 口径）。
 * ② V1 段引用可解析：`文档.md §N`（含 [X.md](path) §N 链接形态）→ 目标文档节号必须存在；
 *    另收自指形态 `本文件/本档/本规范 §N`（同文档节号必须存在）。
 *    节号解析 = 标题编号（`## 2.15 标题` / `### §2.15 标题`），父节号算存在（`§18` 由 `### 18.5` 满足）。
 * ③ V2 计数与列表一致：声明“N 项/N 处/N 条”（N ≥ 2）且**紧邻**枚举时，枚举条数必须 == N。
 *    识别三形态：md 列表行 / 表格行 / 括号内顿号·斜杠枚举（声明前后紧邻）。
 *
 * 精度取向（评审要求“零假阳才能常驻”）：V2 只判**结构上明确相邻**的声明+枚举
 * （行内声明后紧跟列表/表格，或紧邻括号枚举）；正文散文里的计数不判（语义级一致性归评审——
 * §2.19 边界）。存量违规由基线吸收（`test/fixtures/doc-consistency-baseline.json`）：
 * **新增违规阻断、存量降为报告**（需求 §1.15 非功能性需求）。
 *
 * 用法：node scripts/check-doc-width.mjs [--dir <docs/design>] [--max 300]
 * 导出（test/doc-consistency.test.mjs 消费）：collectMarkdown / checkDocWidths /
 * checkSectionRefs / checkCountLists / checkDocConsistency / loadBaseline / SCAN_DIRS。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";

/** 文档一致性扫描域（排除 _archive/——历史快照豁免，同 check-doc-width 现行口径） */
export const SCAN_DIRS = ["docs/design", "docs/requirements", "docs/batches"];
/** 基线文件（首跑固化清单）：存量违规报告、新增违规阻断 */
export const BASELINE_PATH = "test/fixtures/doc-consistency-baseline.json";

/** 递归收集 .md 文件（跳过 _archive/——归档区是历史快照，不受人类可读判据与一致性校验约束） */
export function collectMarkdown(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === "_archive") continue; // 归档历史快照豁免
    if (statSync(p).isDirectory()) collectMarkdown(p, out);
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

/** 扫描域内的全部 .md（root 为仓库根；不存在的目录跳过）。 */
export function scanDomain(root) {
  const files = [];
  for (const d of SCAN_DIRS) {
    const abs = resolve(root, d);
    try { collectMarkdown(abs, files); } catch { /* 目录缺失：跳过（域外项目布局不报错） */ }
  }
  return files;
}

/** ① 宽度检查：返回 [{file, line, len}]（file 为绝对路径）。 */
export function checkDocWidths(root, { max = 300, dir = null } = {}) {
  const files = dir ? collectMarkdown(resolve(root, dir)) : scanDomain(root);
  const hits = [];
  for (const f of files) {
    readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (l.length > max) hits.push({ file: f, line: i + 1, len: l.length });
    });
  }
  return hits;
}

// ── V1 段引用可解析 ──────────────────────────────────────────────────────────
/** 标题编号集合（`## 2.15 x` / `### §2.15 x` / `## §1 x`） */
function sectionNumbers(text) {
  const nums = new Set();
  for (const line of text.split("\n")) {
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (!m) continue;
    for (const re of [/^§?\s*(\d+(?:\.\d+)*)\b/, /§\s*(\d+(?:\.\d+)*)/]) {
      const a = re.exec(m[1]);
      if (a) nums.add(a[1]);
    }
  }
  return nums;
}
/** 父节号算存在：§18 由 ### 18.5 满足 */
const hasSection = (nums, n) => nums.has(n) || [...nums].some((x) => x.startsWith(n + "."));

/** `X.md §N`（含 `[X.md](path) §N` / `X.md:§N`）——链接括号与标点容忍 */
const QUALIFIED_REF_RE = /\[?([A-Za-z0-9_\-./]+\.md)\]?(?:\([^)\n]*\))?[^\S\n]*[（(【]?[^\S\n]*[:：]?[^\S\n]*§\s*(\d+(?:\.\d+)*)/g;
/** 自指形态：本文件/本档/本规范… §N（同文档节号） */
const SELF_REF_RE = /(本文件|本档|本规范|本设计档|本设计文档|本需求档|本批次档)\s*§\s*(\d+(?:\.\d+)*)/g;

/**
 * V1：段引用可解析。返回 [{file, ref, reason}]（file 仓库相对路径）。
 * reason：unknown-doc（目标文档不在扫描域）| no-section（目标节号不存在）
 */
export function checkSectionRefs(root) {
  const files = scanDomain(root);
  const byBase = new Map();
  for (const f of files) {
    const b = basename(f);
    if (!byBase.has(b)) byBase.set(b, []);
    byBase.get(b).push(f);
  }
  const numsCache = new Map();
  const numsOf = (f) => {
    if (!numsCache.has(f)) numsCache.set(f, sectionNumbers(readFileSync(f, "utf8")));
    return numsCache.get(f);
  };
  const rel = (f) => f.slice(root.length + 1).replace(/\\/g, "/");
  const out = [];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(QUALIFIED_REF_RE)) {
      const cands = byBase.get(basename(m[1])) ?? [];
      if (!cands.length) out.push({ file: rel(f), ref: m[0].trim(), reason: "unknown-doc" });
      else if (!cands.some((c) => hasSection(numsOf(c), m[2]))) out.push({ file: rel(f), ref: m[0].trim(), reason: "no-section" });
    }
    const nums = numsOf(f);
    for (const m of text.matchAll(SELF_REF_RE)) {
      if (!hasSection(nums, m[2])) out.push({ file: rel(f), ref: m[0].trim(), reason: "no-section" });
    }
  }
  return out;
}

// ── V2 计数与列表一致 ────────────────────────────────────────────────────────
const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 两: 2 };
const toNum = (s) => (/^\d+$/.test(s) ? Number(s) : [...s].reduce((a, c) => a + (CN_NUM[c] ?? 0), 0));
/** 声明：数字 + 项/处/条（前导不得是数字/字母；`目` 排除“项目/条目”类复合词） */
const DECL_RE = /(?<![\dA-Za-z])(\d+|[一二三四五六七八九十两])\s*(项|处|条)(?!目)/g;
/** 枚举形态：md 列表行 / 表格行（表头 + 分隔行） */
const LIST_ITEM_RE = /^\s*(?:[-*+]|\d+[.)])\s+/;
const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const isTableSep = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
const isBlank = (l) => /^\s*$/.test(l);
/** 声明前后可忽略的标点/强调符 */
const PUNCT_RE = /^[\s：:。，,——\-—*]+|[\s：:。，,——\-—*]+$/g;
/**
 * 声明行余部“干净”（只有标点 + 可选短名词短语 + 可选单组**纯解释**括号）——才允许向后续块找枚举。
 * 排除：含数字/#/斜杠/顿号的括号（那是枚举或引用编号，不是解释——否则“…（#3/#4，第 2 批）：”会被误判为枚举头）。
 */
function isCleanRest(rest) {
  let s = rest.replace(PUNCT_RE, "");
  if (!s) return true;
  const noun = /^[\u4e00-\u9fa5A-Za-z]{1,8}/.exec(s);
  if (noun) s = s.slice(noun[0].length).replace(PUNCT_RE, "");
  if (!s) return true;
  const p = /^（([^（）]*)）$/.exec(s);
  return p ? !/[0-9#／/、]/.test(p[1]) : false;
}
/** 紧邻括号枚举（声明之后，中间不夹强调符——设计口径“括号内计数”） */
const PAREN_AFTER_RE = /^[\s：:。，,——\-—]*[（(]([^（）()]*)[）)]/;
const countItems = (s) => s.split(/[、／]|\s\/\s/).map((x) => x.trim()).filter(Boolean).length;

/**
 * 数一个列表块（从首个列表项行起）：容忍**条目续行**（非缩进的续行也是同一条目——
 * 中文文档常见）与空行分隔的宽松列表；遇标题/表格/代码围栏或“空行后跟非列表项”即停
 * （防吞并下一段落的无关列表）。
 */
function countListBlock(lines, start) {
  let count = 0, k = start;
  while (k < lines.length) {
    const l = lines[k];
    if (isBlank(l)) {
      let n = k + 1;
      while (n < lines.length && isBlank(lines[n])) n++;
      if (n < lines.length && LIST_ITEM_RE.test(lines[n])) { k = n; continue; }
      break;
    }
    if (/^#{1,6}\s/.test(l) || /^\s*```/.test(l) || isTableRow(l)) break;
    if (LIST_ITEM_RE.test(l)) count++;
    k++;
  }
  return count;
}

/**
 * V2：计数与列表一致。返回 [{file, line, decl, declared, found, form}]。
 */
export function checkCountLists(root) {
  const out = [];
  for (const f of scanDomain(root)) {
    const relF = f.slice(root.length + 1).replace(/\\/g, "/");
    const lines = readFileSync(f, "utf8").split("\n");
    let fence = false;
    lines.forEach((line, i) => {
      if (/^\s*```/.test(line)) { fence = !fence; return; }
      if (fence) return;
      if (LIST_ITEM_RE.test(line)) return; // 列表项自身不作声明行
      DECL_RE.lastIndex = 0;
      let m;
      while ((m = DECL_RE.exec(line))) {
        const declared = toNum(m[1]);
        if (declared < 2) continue; // 散文里的单数用法（“补一条”）不判
        const rest = line.slice(m.index + m[0].length);
        const push = (found, form) => out.push({ file: relF, line: i + 1, decl: m[0].trim(), declared, found, form });
        // 形态③ 括号内顿号·斜杠枚举（紧邻声明之后）
        const pa = PAREN_AFTER_RE.exec(rest);
        if (pa && countItems(pa[1]) >= 2) { const c = countItems(pa[1]); if (c !== declared) push(c, "paren"); continue; }
        if (!isCleanRest(rest)) continue;
        // 形态①/② 声明行之后紧跟列表块 / 表格块（空行容忍——首个非空行起算）
        let j = i + 1;
        while (j < lines.length && isBlank(lines[j])) j++;
        if (j >= lines.length) continue;
        if (isTableRow(lines[j]) && j + 1 < lines.length && isTableSep(lines[j + 1])) {
          let k = j + 2, c = 0;
          while (k < lines.length && isTableRow(lines[k])) { c++; k++; }
          if (c >= 2 && c !== declared) push(c, "table");
          continue;
        }
        if (LIST_ITEM_RE.test(lines[j])) {
          // found < 2 → 解析伪影（如续行恰好以 "+" 开头）多于真实计数漂移——不判（零假阳优先）
          const c = countListBlock(lines, j);
          if (c >= 2 && c !== declared) push(c, "list");
        }
      }
    });
  }
  return out;
}

/** V1+V2 一次跑全：{ v1, v2 } */
export function checkDocConsistency(root) {
  return { v1: checkSectionRefs(root), v2: checkCountLists(root) };
}

/** 基线条目键（稳定：不含行号——文档编辑位移不影响） */
export const v1Key = (r) => `V1|${r.file}|${r.ref}`;
export const v2Key = (r) => `V2|${r.file}|${r.decl}|${r.declared}|${r.found}|${r.form}`;

/** 读基线清单（缺失/损坏 → 空清单 = 全部视为新增）。 */
export function loadBaseline(root) {
  try {
    const j = JSON.parse(readFileSync(resolve(root, BASELINE_PATH), "utf8"));
    return new Set(Array.isArray(j.entries) ? j.entries : []);
  } catch { return new Set(); }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const args = process.argv.slice(2);
  const argOf = (flag) => { const i = args.indexOf(flag); return i >= 0 && args[i + 1] ? args[i + 1] : null; };
  const maxW = argOf("--max") ? parseInt(argOf("--max"), 10) : 300;
  const root = process.cwd();
  const dirArg = argOf("--dir");

  // ① 宽度——扫描域已扩为 docs/design + docs/requirements + docs/batches
  const widthFiles = dirArg ? collectMarkdown(resolve(root, dirArg)) : scanDomain(root);
  const widthHits = [];
  for (const f of widthFiles) {
    readFileSync(f, "utf8").split("\n").forEach((l, i) => { if (l.length > maxW) widthHits.push({ file: f, line: i + 1, len: l.length }); });
  }
  const byFile = new Map();
  for (const h of widthHits) byFile.set(h.file, [...(byFile.get(h.file) ?? []), h]);
  for (const [f, hs] of byFile) {
    console.log(`✗ ${f.replace(root + /[\\/]?/, "")}: ${hs.length} 行 >${maxW} 字符`);
    for (const x of hs.slice(0, 3)) console.log(`    :${x.line} (${x.len} chars)`);
    if (hs.length > 3) console.log(`    … 共 ${hs.length} 行`);
  }
  if (widthHits.length) {
    console.log(`\nFAIL(宽度): ${byFile.size} 文件 / ${widthHits.length} 行超 ${maxW} 字符——违反 README 归属规则 6（文档人类可读）。`);
  } else {
    console.log(`OK(宽度): 扫描域全部 .md 无 >${maxW} 字符单行（${widthFiles.length} 文件）。`);
  }

  // ② 一致性 V1/V2——新增阻断、存量报告（基线 = test/fixtures/doc-consistency-baseline.json）
  const { v1, v2 } = checkDocConsistency(root);
  const baseline = loadBaseline(root);
  const all = [...v1.map((r) => [v1Key(r), r]), ...v2.map((r) => [v2Key(r), r])];
  const fresh = all.filter(([k]) => !baseline.has(k));
  const known = all.length - fresh.length;
  for (const [, r] of fresh) {
    console.log(r.declared !== undefined
      ? `✗ V2 ${r.file}:${r.line} “${r.decl}” 声明 ${r.declared} ≠ 枚举 ${r.found}（${r.form}）`
      : `✗ V1 ${r.file} “${r.ref}”（${r.reason}）`);
  }
  console.log(`一致性 V1/V2：新增违规 ${fresh.length} 条 · 存量（基线内）${known} 条。`);
  if (fresh.length) {
    console.log(`\nFAIL(一致性): ${fresh.length} 条新增违规（V1 段引用 / V2 计数）——修掉或（存量）入基线 ${BASELINE_PATH}。`);
    process.exit(1);
  }
  process.exit(widthHits.length ? 1 : 0);
}
