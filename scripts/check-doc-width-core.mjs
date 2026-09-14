/**
 * check-doc-width-core.mjs — 文档格式 + 文档一致性机械校验 · 判据核（域驱动 / V1 / V2 / V3 / 基线）。
 *
 * 本档 = `check-doc-width.mjs`（入口 / 报告 / 宽度判据）的判据核（R24a 拆分——各档 ≤300 行）：
 * 域驱动（collectMarkdown / discoverDomains / scanDomain）· V1 段引用（**按域隔离解析**——T-M9：全域 = 逐域
 * 各跑一次，无 basename 一对多 fail-open）· V2 计数 · V3 批次档 · 基线读写 ·
 * 共享豁免谓词（isExecutableLine / inCodeSpan——统一版 `doc-anchors.mjs` / `check-ledger.mjs` 同源复用）。
 * 判据说明（精度取向 / 基线口径 / 用法）权威 = 入口档头注（本档不重述）。
 * S4 单仓化（设计档 TWO-REPO-MERGE.md §2.4 R5/R8）：V4 跨仓形态整类退役。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

/** 文档一致性扫描域（排除 _archive/——历史快照豁免，同 check-doc-width 现行口径） */
export const SCAN_DIRS = ["docs/design", "docs/requirements", "docs/batches", "docs/core/design", "docs/core/requirements", "docs/vsc/design", "docs/vsc/requirements"];
/** 基线文件：**必须保持为空**（新增违规一律红——入基线 = 例外 = 违规，fail-closed） */
export const BASELINE_PATH = "test/fixtures/doc-consistency-baseline.json";
/** V3 判据射程起点：批次档段写入工具（batch_segment）落地 = 2026-09-10（第 4 批）；
 *  该日及之前的批次档 §3 无工具写入通道（父侧代写）——结构性历史事实，非违规。 */
export const V3_ERA_START = "2026-09-11";
/** 域发现跳过目录（不视作候选产品域）。 */
const DOMAIN_SKIP = new Set(["node_modules", ".git", "dist", "build", "coverage", ".turbo", "_archive"]);

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

/** 域发现：仓根本身（含 `docs/` 即自成一域）+ 各含 `docs/` 的一级子目录（合并仓两产品两域）。 */
export function discoverDomains(root) {
  const rootAbs = resolve(root);
  const hasDocs = (p) => { try { return statSync(join(p, "docs")).isDirectory(); } catch { return false; } };
  const out = [];
  if (hasDocs(rootAbs)) out.push(rootAbs);
  let names = [];
  try { names = readdirSync(rootAbs); } catch { /* 不可读：零域 */ }
  for (const n of names) {
    if (DOMAIN_SKIP.has(n)) continue;
    const p = join(rootAbs, n);
    try { if (statSync(p).isDirectory() && hasDocs(p)) out.push(p); } catch { /* 跳过 */ }
  }
  return out;
}

/** 扫描域基列表（域驱动单源）：显式 `domain` → 该域；无域参 → 发现域集（为空回退仓根本身）。 */
function scanBases(root, domain = null) {
  const list = domain ? [resolve(root, domain)] : discoverDomains(root);
  return list.length ? list : [resolve(root)];
}

/** 单域收集：域基 × SCAN_DIRS 的 .md（目录缺失跳过——域外项目布局不报错）。 */
function collectDomain(base) {
  const files = [];
  for (const d of SCAN_DIRS) {
    try { collectMarkdown(join(base, d), files); } catch { /* 目录缺失：跳过（域外项目布局不报错） */ }
  }
  return files;
}

/** 扫描域内的全部 .md（root 为仓根；域 = 发现域集（或显式 `domain` 产品域）；不存在的目录跳过）。 */
export function scanDomain(root, domain = null) {
  const files = [];
  for (const base of scanBases(root, domain)) files.push(...collectDomain(base));
  return files;
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
/** 产品域外引用豁免（原「（CLI 侧）」注记——单仓语义：产品域扫描时带「对方产品侧」注记的引用不判）。 */
const PRODUCT_SIDE_RE = /[（(]\s*(?:CLI|VSC)\s*侧/;
/** 命中位置所在**行**含产品侧注记 → 豁免。 */
function productSideAnnotated(text, idx) {
  const start = text.lastIndexOf("\n", idx - 1) + 1;
  const end = text.indexOf("\n", idx);
  return PRODUCT_SIDE_RE.test(text.slice(start, end === -1 ? text.length : end));
}

/**
 * V1：段引用可解析。返回 [{file, ref, reason}]（file 相对传入 root）。
 * reason：unknown-doc（目标文档不在扫描域）| no-section（目标节号不存在）
 * 解析**按域隔离**（T-M9）：全域 = 逐域各跑一次——每域的引用只对本域文件解析（跨域同名档不互相
 * 满足节号——无 basename 一对多 fail-open）；产品域态（显式 `domain`）与逐域语义逐字一致。
 */
export function checkSectionRefs(root, domain = null) {
  const numsCache = new Map();
  const numsOf = (f) => {
    if (!numsCache.has(f)) numsCache.set(f, sectionNumbers(readFileSync(f, "utf8")));
    return numsCache.get(f);
  };
  const rel = (f) => f.slice(resolve(root).length + 1).replace(/\\/g, "/");
  const out = [];
  for (const base of scanBases(root, domain)) {
    const files = collectDomain(base);
    const byBase = new Map(); // 本域索引——不跨域并表（跨域同名 = 掩蔽源，T-M9）
    for (const f of files) {
      const b = basename(f);
      if (!byBase.has(b)) byBase.set(b, []);
      byBase.get(b).push(f);
    }
    for (const f of files) {
      const text = readFileSync(f, "utf8");
      for (const m of text.matchAll(QUALIFIED_REF_RE)) {
        if (productSideAnnotated(text, m.index)) continue; // 产品域外引用豁免
        const cands = byBase.get(basename(m[1])) ?? [];
        if (!cands.length) out.push({ file: rel(f), ref: m[0].trim(), reason: "unknown-doc" });
        else if (!cands.some((c) => hasSection(numsOf(c), m[2]))) out.push({ file: rel(f), ref: m[0].trim(), reason: "no-section" });
      }
      const nums = numsOf(f);
      for (const m of text.matchAll(SELF_REF_RE)) {
        if (productSideAnnotated(text, m.index)) continue;
        if (!hasSection(nums, m[2])) out.push({ file: rel(f), ref: m[0].trim(), reason: "no-section" });
      }
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
export const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
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
export function checkCountLists(root, domain = null) {
  const out = [];
  for (const f of scanDomain(root, domain)) {
    const relF = f.slice(resolve(root).length + 1).replace(/\\/g, "/");
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

// ── 共享豁免谓词（V5 统一锚检查同源复用——单源） ─────────────────────────────
/** 行内可执行坐标（命令 / 搜索模式串码段）——射程豁免（证据与命令保字面；D19 同类）。 */
export function isExecutableLine(line) {
  if (/`[^`\n]*&&[^`\n]*`/.test(line)) return true; // 命令链（cd … && …）
  if (/`[^`\n]*\b(?:cd|node|npm|npx|grep|rg|git)\s[^`\n]*`/.test(line)) return true; // 码段内命令词
  if (/`[^`\n]*(?:\[\^|\\\.|\(\?<|\(\?:|\{\d)/.test(line)) return true; // 码段内搜索模式串片段
  return false;
}
/** 行内位置是否在反引号码段内（引述面——仓标 + 裸 §N 的引述不判）。 */
export function inCodeSpan(line, idx) {
  return (line.slice(0, idx).match(/`/g) ?? []).length % 2 === 1;
}

/** V1+V2+V3 一次跑全：{ v1, v2, v3 }（V4 跨仓形态随两仓合并 S4 整类退役——设计档 §2.4 R5/R8）。 */
export function checkDocConsistency(root, domain = null) {
  return { v1: checkSectionRefs(root, domain), v2: checkCountLists(root, domain), v3: checkBatchSegments(root, domain) };
}

/** V3：批次档 §4/§6 有实质内容（排骨架行/斜体占位行）时，§3 必须含工具写入的轮次行。
 *  在飞批次不报；**工具前时代（文件名日期 < `V3_ERA_START`）不判**（§3 无工具写入通道）；
 *  判据不引用 §1 讨论状态词。split 只吃标题前缀——每段首行剩标题余文，先剥。 */
export function checkBatchSegments(root, domain = null) {
  const out = [];
  for (const f of scanDomain(root, domain).filter((p) => /[\\/]docs[\\/]batches[\\/]/.test(p))) {
    const era = /(\d{4}-\d{2}-\d{2})/.exec(basename(f))?.[1];
    if (era && era < V3_ERA_START) continue; // 工具前时代：§3 父侧代写——结构性历史事实，不判
    const parts = readFileSync(f, "utf8").split(/^## §(\d+)(?=\s|$)/m), sec = {};
    for (let i = 1; i < parts.length; i += 2) sec[parts[i]] = parts[i + 1].replace(/^[^\n]*\n?/, "");
    const real = (n) => String(sec[n] ?? "").split("\n").some((l) => l.trim() && !/^#{1,6}\s/.test(l) && !/^_[（(].*[）)]_$/.test(l.trim()));
    if ((real("4") || real("6")) && !/^### 轮次 \d+（评审子代理）/m.test(sec["3"] ?? "")) {
      out.push({ file: f.slice(resolve(root).length + 1).replace(/\\/g, "/"), kind: "batch" });
    }
  }
  return out;
}

/** 基线条目键（稳定：不含行号——文档编辑位移不影响） */
export const v1Key = (r) => `V1|${r.file}|${r.ref}`;
export const v2Key = (r) => `V2|${r.file}|${r.decl}|${r.declared}|${r.found}|${r.form}`;
/** V3 条目键（同一批次档一条——修好即可从基线移除） */
export const v3Key = (r) => `V3|${r.file}`;
/** 读基线清单（缺失/损坏 → 空清单 = 全部视为新增）。 */
export function loadBaseline(root) {
  try {
    const j = JSON.parse(readFileSync(resolve(root, BASELINE_PATH), "utf8"));
    return new Set(Array.isArray(j.entries) ? j.entries : []);
  } catch { return new Set(); }
}
