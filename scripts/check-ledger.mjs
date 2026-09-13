#!/usr/bin/env node
/**
 * check-ledger.mjs — 需求池 / 技术待办台账机检（合并仓统一版 · S4 机检单仓化）。
 *
 * 来源 = 两产品同名档（CLI `thincoder/scripts/check-ledger.mjs` 与 VSC `thincoder-vscode/scripts/check-ledger.mjs`）
 * 的并集——跨仓闸（兄弟仓形态 / 工作区根基根 / 跨仓失败关闭）随两仓合并 S4 退役（设计档 TWO-REPO-MERGE.md §2.4 R6/R9）。
 * 本档 = 域参数化单份：**无域参 = 全域**（仓根发现域集——两产品各一份台账）；产品域由门禁显式传参（`--domain`）。
 *
 * L1 指针可解析（①归一 `§X` ↔ 标题编号 X ②basename 唯一 ③档存在且节号在标题里）· L2 组计数 == 未决实条目数（D3）·
 * L3 形态：①需求池条目单行 ②技术条目含 `file:line` 形态 ③锚形态与组标题结构一致 ④`status=` ∈ 六态
 * ⑤活文件 `- [x]` 零命中（归档口径）⑥`触发=` ∈ 三枚举。**只判形态**——症状 / 归属语义留评审。
 * L4 本仓可解析（单仓语义——「仓」= 合并仓）：①指针以**解析基根组**（合并仓根 + 台账所属域根 + 台账目录）**档级解析**（节号存在性 = L1 面——未决条目）
 * ②证据 `path.ext:line` 的路径段须在基根组内可定位（含同名文档 / 唯一 basename 回退）。不可解析 ⇒ `[L4]` + fail-closed。
 * 跨仓形态判据已删（外仓前缀排除的更名收正：`仓根外前缀` / `仓根外路径`——语义 = 越出合并仓，非「跨仓」）。
 * L4 不入判据（零假阳）：无路径散文 /「名称（仓别）§N」规范形态（无 `.md`）/ 组标题行。
 * 豁免（零假阳）：非必填态（待讨论 / 待设计）不判 ③；无 `status=` / `触发=` 场分别免 ④ / ⑥（后者进审计面）；无标记组不判 ③。
 * 基线：各域自持 `test/fixtures/ledger-baseline.json` **必须保持为空**——入基线 = 例外 = 违规（B16 阈值 = 0）；
 * 非空基线 ⇒ FAIL + 固定句「本基线必须保持为空」（fail-closed：违规一律阻断，不再降报告）。
 * L4② 判序（外仓形态删除后收正）：① `..` 逃逸 / 仓根外绝对路径 ⇒ 违规（fail-closed——不回退 basename）；
 * ② 基根组直接解析 ⇒ 通过；③ 前缀排除（相对路径——绝对路径由 ①/② 处置）：前缀首段须为基根条目；不现存 ⇒ 违规（不回退 basename）；
 * ④ 文档行坐标（`.md` + 行号）按同名 `.md` 域内定位（≥1 通过）；⑤ 域内定位（裸 basename / 陈旧前缀——首段现存）
 * 按 basename 域内唯一定位 ⇒ 通过；0 / ≥2 命中 ⇒ 违规。**全匹配**：证据场内多处证据逐处判（`matchAll`——首匹配实现会漏）。
 * 产品源码依赖（`src/ledger.mjs` 台账解析 / 数字单源）按**产品域**取用——两产品各自实现，不跨产品混用（设计档 §2.5）。
 * 输出：红 = `<档>:<行号> [L1|L2|L3|L4] <症状> — 期望 … · 实得 …` + `<n> 处违规`；绿 = 每档一行 `OK: <档>`。
 * 审计（`--audit`）：技术组无触发条目的「待处置清单」（行龄 > N 天标「老化」）——只读、退出码 0。
 * 汇总（`--summary`）：L2 明细行序列（每项目一行——产品域 `src/ledger.mjs` 口径 + 同 formatter）——只读、退出码 0（收口行）。
 * 用法：`node scripts/check-ledger.mjs [--root <仓根>] [--domain <产品域>] [--ledger <档>]... [--audit] [--summary] [--days N]`；
 * 扫描域 = 显式台账清单（默认 = 各域**活档 + 归档档**两档：活档判 L3⑤、归档档不判（`live:false`——归档口径本就含已完成项））——
 * 与 `check-doc-width.mjs` 互不侵入；不进产品提示词。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { discoverDomains, MERGED_SCRIPTS } from "./check-doc-width.mjs";
// 数字单源（F7/AC80）：台账解析 / 计数 / 老化阈值 / 显示面 formatter 按产品域取用（两产品各自实现——不跨产品混用）
import * as cliLedgerModule from "../thincoder/src/ledger.mjs";
import * as vscLedgerModule from "../thincoder-vscode/src/ledger.mjs";
/** 状态机六态（需求档 §1.13） */
export const SIX_STATES = ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"];
/** 触发字段三枚举（§2.24.9②） */
export const TRIGGERS = ["归批", "条件", "认账不排期"];
/** 老化阈值（天）——单源 = 产品域 `src/ledger.mjs`（`--days` 可覆盖） */
export const AGING_DAYS = cliLedgerModule.AGING_DAYS;
/** 基线档（键稳定、不含行号；**必须保持为空**——非空即 FAIL）。 */
export const BASELINE_PATH = "test/fixtures/ledger-baseline.json";
/** 默认台账清单：各域两档（活档判 L3⑤；归档档 `live:false` 不判）。缺档跳过不报。 */
export const DEFAULT_LEDGERS = [
  { path: "docs/TODO.md", live: true },
  { path: "docs/TODO-archive.md", live: false },
];
/** 域 → 产品 ledger 模块表（按域根目录名匹配；未列名域回退 CLI 模块——测试夹具域语义与 CLI 同源）。 */
const LEDGER_MODULES = [
  { dir: "thincoder-vscode", mod: vscLedgerModule },
  { dir: "thincoder", mod: cliLedgerModule },
];
/** 产品域 ledger 模块取用（`root` = 域根 / 台账所属域）；未列名 ⇒ 回退 CLI 模块。 */
export function ledgerModuleFor(root) {
  const b = basename(resolve(root));
  return LEDGER_MODULES.find((e) => e.dir === b)?.mod ?? cliLedgerModule;
}
const ENTRY_RE = /^- \[[ x]\]\s+/, OPEN_ENTRY_RE = /^- \[ \]\s+/; // 任意锚（条目键 / 全档扫）/ 未决条目（组计数——§2.24.4 未决口径）
const DECL_RE = /（(\d+)\s*条）/;
const H2_RE = /^##\s+(.*)$/;
const EVIDENCE_RE = /[A-Za-z0-9_./-]+\.[A-Za-z0-9]+`?\s*:\s*\d+/;
const EVIDENCE_RE_G = new RegExp(EVIDENCE_RE.source, "g"); // L4② 逐条 matchAll 用（既有 EVIDENCE_RE 非全局——L3② `.test` 语义零改）
const REF_RE = /([A-Za-z0-9_./-]+(?:\.md|\/[A-Za-z0-9_.-]+))`?\s*§\s*(\d+(?:\.\d+)*)/g;
const TRIGGER_RE = /触发\s*=\s*([^·\n]*)/;
const STATUS_RE = /status=([^·\n（(]*)/;
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".turbo"]);
/** 标题编号集合（`## 1.13 x` / `### §2.24 x`；`### 18.5` 满足父节号 `§18`）。 */
export function sectionNums(file) {
  const out = new Set();
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (!m) continue;
    for (const re of [/^§?\s*(\d+(?:\.\d+)*)\b/, /§\s*(\d+(?:\.\d+)*)/]) {
      const a = re.exec(m[1]);
      if (a) out.add(a[1]);
    }
  }
  return out;
}
const hasSection = (nums, n) => nums.has(n) || [...nums].some((x) => x.startsWith(n + "."));
/** 统一版脚本自身所属仓根（= 合并仓根——「本仓」解析面：引用仓根 `scripts/` 的台账证据在
 *  产品根调用（测试面）下仍可解析；仓外夹具根（tmp）不并入——保测试隔离）。 */
const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** 解析基根组（单仓）：合并仓根（调用根）+ 台账所属域根 + 台账目录——去重、依次搜索。 */
export function resolutionBases(rootBase, domainRoot, ledgerDir) {
  return [...new Set([resolve(rootBase), resolve(domainRoot), resolve(ledgerDir), ...(withinRoot(SCRIPT_ROOT, rootBase) ? [SCRIPT_ROOT] : [])])];
}
/** 档引用解析（搜索序见上）；命中返回绝对路径，否则 null。 */
function resolveDoc(p, bases) {
  for (const b of bases) {
    for (const c of [resolve(b, p), p.endsWith(".md") ? null : resolve(b, p + ".md")]) {
      if (!c) continue;
      try { if (statSync(c).isFile()) return c; } catch { /* 下一候选 */ }
    }
  }
  return null;
}
/** 包含判据：`abs` 在 `root` 内（`..` 逃逸 / 跨盘 → false）。 */
export function withinRoot(root, abs) {
  const rel = relative(resolve(root), resolve(abs));
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}
/** 全仓 basename 计数（L4② 域内定位用；排除 SKIP_DIRS——与 `mdBasenames` 同口径）。 */
function allBasenames(root, out = new Map()) {
  for (const name of readdirSync(root)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(root, name);
    try { if (statSync(p).isDirectory()) allBasenames(p, out); else out.set(name, (out.get(name) ?? 0) + 1); } catch { /* 跳过 */ }
  }
  return out;
}
/** 证据场（L4② 扫描窗——末个「证据」标记之后段；无标记 ⇒ 整条；标记前的行内散文提及不判）。 */
function evidenceScope(text) {
  const marker = text.lastIndexOf("证据");
  return marker >= 0 ? text.slice(marker) : text;
}
/**
 * L4② 证据解析（单仓判序——跨仓形态判据随 S4 退役）。返回 null（通过）或违规描述字符串。
 * 判序：① `..` 逃逸 / 仓根外绝对路径 ⇒ 违规（fail-closed，不回退 basename）；
 * ② 基根组直接解析（明细定位处）⇒ 通过；③ 前缀排除（收紧——相对路径）：前缀首段须为域根现存条目；
 * 不现存 ⇒ 违规（不回退 basename——防「外前缀 + 域内唯一 basename」假阴面）；④ 文档行坐标（`.md` + 行号——非证据形态）：
 * 按同名 `.md` 域内定位（≥1 即通过；0 ⇒ 违规）；⑤ 域内定位（裸 basename / 陈旧前缀）：basename 唯一 ⇒ 通过；0 / ≥2 ⇒ 违规。
 */
export function evidenceState(root, p, cache) {
  const norm = p.replace(/\\/g, "/");
  const segs = norm.split("/").filter(Boolean);
  if (segs.includes("..")) return "仓根外路径（`..` 逃逸）";
  const abs = isAbsolute(p) ? p : resolve(root, p);
  if (isFile(abs) && withinRoot(root, abs)) return null;
  if (isAbsolute(p) && !withinRoot(root, abs)) return "仓根外绝对路径";
  if (!isAbsolute(p) && segs.length > 1) { // ③ 前缀排除（收紧）：前缀首段非域根现存条目 ⇒ 违规
    cache.rootEntries ??= new Set(readdirSync(root));
    if (!cache.rootEntries.has(segs[0])) return "仓根外前缀（首段非仓根条目）";
  }
  const base = basename(norm);
  if (norm.endsWith(".md")) { // 文档行坐标：同名 `.md` 域内 ≥1 即在仓（行号非稳定坐标——档引用由指针面判）
    cache.md ??= mdBasenames(root);
    return (cache.md.get(base) ?? 0) >= 1 ? null : "本仓无同名文档";
  }
  cache.all ??= allBasenames(root);
  const n = cache.all.get(base) ?? 0;
  if (n === 1) return null; // 域内唯一定位（省略 / 陈旧目录前缀——首段现存）
  return n === 0 ? "本仓无同名文件" : `仓内同名 ${n} 份（多义）`;
}
/** L4② 全链路：基根组解析（合并仓根 / 本产品域 / 台账目录）→ 六档并入映射 → 域内回退（`evidenceState`）。返回 null 或违规描述。 */
function evidenceStateIn(bases, domainRoot, p, cache) {
  const norm = p.replace(/\\/g, "/");
  const segs = norm.split("/").filter(Boolean);
  if (!segs.includes("..") && !isAbsolute(p)) {
    for (const b of bases) { if (isFile(resolve(b, norm))) return null; } // 基根组命中即通过
    const merged = MERGED_SCRIPTS[basename(norm)];
    if (merged) for (const b of bases) { if (isFile(resolve(b, "scripts", merged))) return null; } // 六档并入映射（退场注记语义的机器侧对位）
  }
  return evidenceState(domainRoot, p, cache);
}
const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };
/** 域内 `.md` basename 计数（L1②：只写 basename 时同名 ≥2 即多义）。 */
function mdBasenames(root, out = new Map()) {
  for (const name of readdirSync(root)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(root, name);
    try { if (statSync(p).isDirectory()) mdBasenames(p, out); else if (name.endsWith(".md")) out.set(name, (out.get(name) ?? 0) + 1); } catch { /* 跳过 */ }
  }
  return out;
}
/** 条目键（基线键用——稳定、不含行号）：首个 `**…**` 标题的首分句。 */
export function entryKey(text) {
  const m = /\*\*(.+?)\*\*/.exec(text);
  return ((m ? m[1] : text.replace(ENTRY_RE, "")).split(/[（(：:——]/)[0].trim() || text).slice(0, 40);
}
/** 档显示名（域目录名 + 域内相对路径——不随 cwd 漂移）。 */
export const displayName = (abs, root) => basename(root) + "/" + relative(root, abs).replace(/\\/g, "/");

/** 单档机检：返回违规 [{kind, line, key, msg}]。`abs` = 台账绝对路径；`root` = 所属域根；`rootBase` = 调用根（合并仓根；缺省 = 域根）。 */
export function checkLedger(abs, root, { live = true, cache = null, rootBase = null } = {}) {
  const domainRoot = resolve(root);
  const display = displayName(abs, domainRoot);
  const lines = readFileSync(abs, "utf8").split("\n");
  const bases = resolutionBases(rootBase ?? domainRoot, domainRoot, dirname(abs));
  const { scanGroups } = ledgerModuleFor(rootBase ?? domainRoot); // 产品域单源（不跨产品混用）
  const seen = new Map();
  const resolveRef = (raw) => (seen.has(raw) ? seen.get(raw) : (seen.set(raw, resolveDoc(raw, bases)), seen.get(raw)));
  const hits = [];
  const evCache = cache ?? {}; // L4② 定位缓存容器（同轮多档共享，避免重复全仓扫描）
  const rc = (evCache[domainRoot] ??= {}); // 按域根分键——多域清单下逐域独立（防计数串用）
  const add = (kind, line, keyTail, symptom, expect, got) =>
    hits.push({ kind, line, key: `${kind}|${display}|${keyTail}`, msg: `${display}:${line} [${kind.slice(0, 2)}] ${symptom} — 期望 ${expect} · 实得 ${got}` });

  // L3⑤ 活文件 `- [x]` 零命中（归档口径；归档档 `live:false` 免判——其条目本就含已完成闭环）
  if (live) lines.forEach((l, i) => {
    if (/^- \[x\]/.test(l)) add("L3⑤", i + 1, entryKey(l), "活文件含 `- [x]`（归档口径）", "0 命中（已核销 / 已废弃移入同仓 TODO-archive.md）", "1 条");
  });

  // 组扫描（L2 计数 + L3①③ 分组识别）——解析唯一实现 = 产品域 `src/ledger.mjs` `scanGroups`（数字单源 F7/AC80）
  const groups = scanGroups(lines);

  let baseNames = null;
  for (const g of groups) {
    // L2 计数一致（D3）：声明「（N 条）」== 组内未决实条目数（无声明不判）
    if (Number.isFinite(g.declared) && g.declared !== g.entries.length) {
      add("L2", g.line, g.name.replace(DECL_RE, ""), `组计数不符（${g.name}）`, `声明 ${g.declared} 条 == 组内未决条目数`, `${g.entries.length} 条`);
    }
    const isPool = g.name.includes("需求池");
    const isTech = g.name.includes("技术");
    for (const e of g.entries) {
      const key = entryKey(e.text);
      const refs = [...e.text.matchAll(REF_RE)].map((m) => ({ raw: m[1], sec: m[2] }));
      const status = (STATUS_RE.exec(e.text) ?? [])[1]?.trim() ?? null;
      // L1 指针可解析（三条子判据）
      for (const r of refs) {
        const target = resolveRef(r.raw);
        if (!target) add("L1", e.line, `${r.raw} §${r.sec}`, `指针不可解析（${r.raw} §${r.sec}）`, "档存在且节号在标题中", "unknown-doc（档不存在）");
        else if (!hasSection(sectionNums(target), r.sec)) add("L1", e.line, `${r.raw} §${r.sec}`, `指针不可解析（${r.raw} §${r.sec}）`, "节号在标题中（`§X` ↔ 标题编号 X）", "no-section（档内无该节）");
        if (!r.raw.includes("/")) {
          baseNames ??= mdBasenames(domainRoot);
          const n = baseNames.get(basename(r.raw)) ?? 0;
          if (n > 1) add("L1", e.line, `basename:${r.raw}`, `basename 多义（${r.raw}）`, "带目录前缀（仓内同名 ≥2）", `同名 ${n} 份`);
        }
      }
      // L4 本仓可解析（单仓——「仓」= 合并仓；判据 = 基根组可解析。节号存在性 = L1 面（未决条目）——L4① 只判可解析）
      for (const r of refs) {
        const target = resolveDoc(r.raw, bases);
        if (!target) add("L4", e.line, `${r.raw} §${r.sec}`, `指针本仓不可解析（${r.raw} §${r.sec}）`, "基根组（仓根 / 产品域 / 台账目录）可解析到档", "本仓不可解析");
      }
      for (const m of evidenceScope(e.text).matchAll(EVIDENCE_RE_G)) {
        const label = m[0].replace(/`/g, "");
        const p = m[0].replace(/`?\s*:\s*\d+$/, "");
        const why = evidenceStateIn(bases, domainRoot, p, rc);
        if (why) add("L4", e.line, label, `证据路径本仓不可解析（${p}）`, "本仓可定位（基根组 / 唯一 basename；越出合并仓禁）", why);
      }
      if (isPool && (lines[e.line] ?? "").trim() && !/^(#{1,6}\s|-\s\[|\||>|```|---)/.test(lines[e.line])) {
        add("L3①", e.line + 1, key, "需求池条目含续行（单行硬约束）", "一行一条", `第 ${e.line + 1} 行为续行`);
      }
      // L3④ status ∈ 六态（无 `status=` 场豁免）
      if (status && !SIX_STATES.includes(status)) add("L3④", e.line, key, "status 取值越域", `∈ {${SIX_STATES.join(" / ")}}`, status);
      if (isTech) {
        // L3② 技术组条目含 `file:line` 正则形态
        if (!EVIDENCE_RE.test(e.text)) add("L3②", e.line, key, "技术条目缺 `file:line` 证据形态", "含 file:line 正则", "未见匹配");
        // L3⑥ 触发取值合法（无 `触发=` 场 → 审计面，不判红）
        const trig = (TRIGGER_RE.exec(e.text) ?? [])[1]?.trim() ?? null;
        if (trig && !TRIGGERS.some((t) => trig === t || trig.startsWith(t + "（"))) add("L3⑥", e.line, key, "触发取值非法", `∈ {${TRIGGERS.join(" / ")}}`, trig.slice(0, 30));
      }
      // L3③ 条目锚形态与组标题结构一致（非必填态豁免）
      if ((status === "在途" || status === "待核销") && (isPool || isTech)) {
        const docRef = refs.some((r) => resolveRef(r.raw));
        const poolOk = docRef && refs.some((r) => r.raw.includes("requirements/")) && refs.some((r) => r.raw.includes("batches/"));
        const techOk = docRef || EVIDENCE_RE.test(e.text) || /(^|[·→\s])—([·\s（]|$)/.test(e.text);
        if (isPool && !poolOk) add("L3③", e.line, key, "条目锚形态与需求池组结构不符", "需求档节 + 任务书 §2", "缺 需求档节 / 任务书");
        if (isTech && !techOk) add("L3③", e.line, key, "条目锚形态与技术组结构不符", "归属档节 / 证据行", "两者皆无");
      }
    }
  }
  // L4 归档闭环条目面（`- [x]`——已核销 / 已废弃条目仍属本仓射程；L1/L3 面 = 未决条目）
  lines.forEach((l, i) => {
    if (!ENTRY_RE.test(l) || OPEN_ENTRY_RE.test(l)) return;
    for (const r of [...l.matchAll(REF_RE)].map((m) => ({ raw: m[1], sec: m[2] }))) {
      const target = resolveDoc(r.raw, bases);
      if (!target) add("L4", i + 1, `${r.raw} §${r.sec}`, `指针本仓不可解析（${r.raw} §${r.sec}）`, "基根组（仓根 / 产品域 / 台账目录）可解析到档", "本仓不可解析");
    }
    for (const m of evidenceScope(l).matchAll(EVIDENCE_RE_G)) {
      const label = m[0].replace(/`/g, "");
      const p = m[0].replace(/`?\s*:\s*\d+$/, "");
      const why = evidenceStateIn(bases, domainRoot, p, rc);
      if (why) add("L4", i + 1, label, `证据路径本仓不可解析（${p}）`, "本仓可定位（基根组 / 唯一 basename；越出合并仓禁）", why);
    }
  });
  return hits;
}

/** 读基线清单（缺失 / 损坏 → 空集 = 全部视为新增）。 */
export function loadBaseline(root) {
  try {
    const j = JSON.parse(readFileSync(resolve(root, BASELINE_PATH), "utf8"));
    return new Set(Array.isArray(j.entries) ? j.entries : []);
  } catch { return new Set(); }
}
/** 默认台账清单（各域两档；`domain` 显式时仅该域）。 */
function defaultEntries(rootAbs, domain = null) {
  const list = domain ? [resolve(rootAbs, domain)] : discoverDomains(rootAbs);
  const bases = list.length ? list : [rootAbs];
  return bases.flatMap((d) => DEFAULT_LEDGERS.map((e) => ({ path: relative(rootAbs, resolve(d, e.path)).replace(/\\/g, "/"), live: e.live })));
}

/** 多档机检：{perFile, fresh（阻断——全部违规）, baseline（基线条目——必须为空）, checked, skipped, targetPaths}。
 *  基线不再分流（B16：阈值 = 0——「入基线」已废；非空基线 = 独立 FAIL 面，见 `main`）。 */
export function runCheck({ root = process.cwd(), domain = null, ledgers = null, baseline = null } = {}) {
  const rootAbs = resolve(root);
  const entries = (ledgers ?? null)
    ? ledgers.map((p) => (typeof p === "string" ? { path: p, live: true } : p))
    : defaultEntries(rootAbs, domain);
  const domainRoots = [...new Set(entries.map((e) => resolve(dirname(resolve(rootAbs, e.path)), "..")))];
  const baselineList = [...(baseline ?? new Set([...domainRoots, ...(domain ? [resolve(rootAbs, domain)] : discoverDomains(rootAbs))].flatMap((d) => [...loadBaseline(d)])))];
  const perFile = [], skipped = [], fresh = [];
  const evCache = {}; // L4② 定位缓存容器（同轮共享；内层按域根分键——每域全仓 basename 扫描一次）
  for (const e of entries) {
    const abs = resolve(rootAbs, e.path);
    if (!isFile(abs)) { skipped.push(abs); continue; } // 缺档 → 跳过不报（降级不阻断）
    const domainRoot = resolve(dirname(abs), "..");
    const hits = checkLedger(abs, domainRoot, { live: e.live !== false, cache: evCache, rootBase: rootAbs });
    perFile.push({ file: displayName(abs, domainRoot), hits, fresh: hits });
    fresh.push(...hits);
  }
  return { perFile, fresh, baseline: baselineList, checked: perFile.length, skipped, targetPaths: entries.map((e) => resolve(rootAbs, e.path)) };
}

/** 行龄（天）：git blame 行级最近变更时间；非 git / 不可判定 → null（标「年龄未知」，零假阳降级）。 */
export function blameDays(abs, line) {
  try {
    const out = execFileSync("git", ["blame", "--porcelain", "-L", `${line},${line}`, "--", abs], { cwd: dirname(abs), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const m = /^author-time (\d+)$/m.exec(out);
    return m ? (Date.now() / 1000 - Number(m[1])) / 86400 : null;
  } catch { return null; }
}

/** 审计（只读）：技术组无触发条目清单（`ageOf` 可注入以便确定性用例）。 */
export function collectPending(abs, { days = AGING_DAYS, ageOf = blameDays } = {}) {
  const display = displayName(abs, resolve(dirname(abs), ".."));
  const out = [];
  let isTech = false;
  readFileSync(abs, "utf8").split("\n").forEach((l, i) => {
    const h = H2_RE.exec(l);
    if (h) { isTech = h[1].includes("技术"); return; }
    if (!isTech || !OPEN_ENTRY_RE.test(l) || TRIGGER_RE.test(l)) return; // 有触发场 → 不属「待处置」；只列未决条目
    const age = ageOf(abs, i + 1);
    out.push({ file: display, line: i + 1, title: entryKey(l), ageDays: age, aged: age != null && age > days });
  });
  return out;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
/** CLI 主行程（导出以便用例在进程内断言退出码语义；`node scripts/check-ledger.mjs` 走此路）。 */
export function main(args = process.argv.slice(2), { cwd = process.cwd(), log = console.log } = {}) {
  const argOf = (f) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : null; };
  const root = resolve(argOf("--root") ?? cwd);
  const domainArg = argOf("--domain");
  const ledgers = args.flatMap((a, i) => (a === "--ledger" && args[i + 1] ? [args[i + 1]] : []));
  const ledgerEntries = ledgers.length ? ledgers.map((p) => ({ path: p, live: !p.includes("archive") })) : null;
  const mod = ledgerModuleFor(root); // 主行程功能面（审计 / 汇总）按调用根取模块
  if (args.includes("--summary")) { // 汇总面（收口行 F6——只读）：L2 明细行序列（每项目一行）
    const family = mod.discoverFamily(root);
    const rows = [];
    for (const p of family.projects) {
      try { rows.push(mod.formatDetailLine(mod.summarizeLedger(p, { ageOf: mod.blameAges }))); } catch { /* 不可读 → 跳过（N1） */ }
    }
    for (const r of rows) log(r);
    if (!rows.length) log(mod.EMPTY_FAMILY_LINE);
    return 0;
  }
  if (args.includes("--audit")) { // 审计模式：只读，退出码 0
    const days = argOf("--days") ? Number(argOf("--days")) : AGING_DAYS;
    const entries = ledgerEntries ?? defaultEntries(root, domainArg);
    const pending = [];
    for (const e of entries) {
      const abs = resolve(root, e.path);
      try { if (statSync(abs).isFile()) pending.push(...collectPending(abs, { days })); } catch { /* 跳过 */ }
    }
    log("待处置清单（技术组无触发条目——报告只读，处置要人判）：");
    for (const r of pending) {
      const age = r.ageDays == null ? "年龄未知" : `行龄 ${Math.floor(r.ageDays)} 天${r.aged ? "【老化】" : ""}`;
      log(`  ${r.file}:${r.line} ${age} — ${r.title}`);
    }
    log(`合计 ${pending.length} 条（老化 ${pending.filter((r) => r.aged).length} 条）。`);
    return 0;
  }
  const { perFile, fresh, baseline, skipped } = runCheck({ root, domain: domainArg, ledgers: ledgerEntries });
  for (const abs of skipped) log(`SKIP: ${relative(root, abs)}（不可读——跳过不报）`);
  // 基线**必须保持为空**（B16 闸门收紧）：入基线 = 例外 = 违规——非空即 FAIL
  if (baseline.length) {
    log(`FAIL(基线): 基线清单非空（${baseline.length} 条）——**本基线必须保持为空**：入基线 = 例外 = 违规（不得再入基线；条目须修掉）。`);
    for (const k of baseline) log(`    ${k}`);
  }
  for (const f of perFile) {
    for (const v of f.fresh) log(v.msg); // 红：<档>:<行号> [L1|L2|L3|L4] <症状> — 期望 … · 实得 …
    if (!f.fresh.length) log(`OK: ${f.file}`);
  }
  log(`${fresh.length} 处违规（阻断——修掉）· 基线 ${baseline.length} 条（**本基线必须保持为空**）。`);
  return fresh.length || baseline.length ? 1 : 0;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) process.exit(main());
