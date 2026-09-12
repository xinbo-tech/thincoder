#!/usr/bin/env node
/**
 * check-ledger.mjs — 需求池 / 技术待办台账机检（VSC 端——独立实现、语义同源；LEDGER-SELF-CONTAINED 批设计档 §7）。
 *
 * L1 指针可解析：`X.md §N` 形态（含 `X.md:§N` / 带标点容忍）——档存在 + 节号在标题里 + 无目录前缀时 basename 唯一。
 * L2 组计数：`## 组（N 条）` 声明 == 组内未决条目数（D3）。
 * L3 形态：①需求池条目单行 ②技术条目含 `file:line` ③锚形态与组结构一致（在途 / 待核销）④`status=` ∈ 六态
 *          ⑤活档 `- [x]` 零命中 ⑥`触发=` ∈ 三枚举。
 * L4 本仓可解析（本批新增）：①指针以 **本仓根 + 台账目录** 为基根解析——不可解析 ⇒ `[L4]`；
 *          ②证据形态 `path:line` 的路径段须在**本仓根内**为文件（他仓存在不算）——不可解析 ⇒ `[L4]`。
 *
 * 零假阳面（不入判据）：无路径散文（对位声明 / 镜像登记）· `名称（仓别）§N` 规范形态（无 `.md`、无路径前缀——两轴分离）· 组标题行。
 * L4② 判序（收紧——外仓前缀排除 + 全匹配）：① 跨仓形态（兄弟仓目录前缀 / `..` 逃逸 / 仓根外绝对路径）⇒ 违规（fail-closed——不回退 basename）；
 *          ② 本仓根直接解析 ⇒ 通过；③ 外仓前缀排除（相对路径——绝对路径由 ①/② 处置）：相对路径含目录前缀、全路径本仓不可解析时——
 *          前缀首段须为本仓根现存条目；不现存 ⇒ 跨仓形态（外仓前缀）⇒ 违规（不回退 basename）；④ 文档行坐标（`.md` + 行号）按同名 `.md` 仓内定位（≥1 通过）；
 *          ⑤ 仓内定位（裸 basename / 陈旧前缀——首段现存）按 basename 仓内唯一定位 ⇒ 通过；0 / ≥2 命中 ⇒ 违规。
 *          **全匹配**：证据场内多处证据逐处判（`matchAll`——首匹配实现会漏）。
 * 基线（`test/fixtures/ledger-baseline.json`）：**必须保持为空**——入基线 = 例外 = 违规（B16 阈值 = 0）；
 * 非空基线 ⇒ FAIL + 固定句「本基线必须保持为空」（fail-closed：违规一律阻断，不再降报告）。
 * 输出：红 = `<档>:<行号> [L1|L2|L3|L4] <症状> — 期望 … · 实得 …`；绿 = 每档一行 `OK: <档>`；尾行计数。
 * 用法：`node scripts/check-ledger.mjs [--root <仓根>] [--ledger <台账档>]...`（默认 = 本仓活档 + 归档档）。
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
// 数字单源：组扫描唯一解析实现 = `src/ledger.mjs` `scanGroups`（本端单源；不跨仓 import——设计档 §7.1）
import { scanGroups } from "../src/ledger.mjs"

/** 状态机六态（台账形态权威——ENGINEERING-MODE.md）。 */
export const SIX_STATES = ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"]
/** 触发字段三枚举。 */
export const TRIGGERS = ["归批", "条件", "认账不排期"]
/** 基线档：**必须保持为空**——入基线 = 例外 = 违规（B16 阈值 = 0；非空即 FAIL）。 */
export const BASELINE_PATH = "test/fixtures/ledger-baseline.json"
/** 默认台账清单：活档判 L3⑤（`- [x]` 零命中）；归档档不判（归档口径本就含已完成项）。 */
export const DEFAULT_LEDGERS = [
  { path: "docs/TODO.md", live: true },
  { path: "docs/TODO-archive.md", live: false },
]
/** 兄弟仓名（仅 L1 宽基根用；L4 恒不并入——设计档 §7.2「工作区根与兄弟仓并入 ⇒ 跨仓指针零命中」）。 */
const SIBLING_NAMES = ["thincoder", "thincoder-vscode"]
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".turbo"])
const ENTRY_RE = /^- \[[ x]\]\s+/
const OPEN_ENTRY_RE = /^- \[ \]\s+/
/** 指针形态：`X.md §N` / `X/y §N`（宽容尾反引号与标点间隔）。 */
const REF_RE = /([A-Za-z0-9_./-]+(?:\.md|\/[A-Za-z0-9_.-]+))`?\s*§\s*(\d+(?:\.\d+)*)/g
/** 证据形态：`path.ext:line`（可携盘符前缀——`C:/x/y.mjs:9`）。 */
const EVIDENCE_RE = /((?:[A-Za-z]:)?[A-Za-z0-9_./-]+\.[A-Za-z0-9]+)`?\s*:\s*(\d+)/
/** L4② 全匹配逐处判的全局实例（非全局 `EVIDENCE_RE` 的 L3 面语义零改）。 */
const EVIDENCE_RE_G = new RegExp(EVIDENCE_RE.source, "g")
const TRIGGER_RE = /触发\s*=\s*([^·\n]*)/
const STATUS_RE = /status=([^·\n（(]*)/
const DECL_RE = /（(\d+)\s*条）/

const isFile = (p) => { try { return statSync(p).isFile() } catch { return false } }

/** 标题编号集合（`## 1.13 x` / `### §2 x`；`### 18.5` 满足父节号 `§18`）。 */
export function sectionNums(file) {
  const out = new Set()
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^#{1,6}\s+(.*)$/.exec(line)
    if (!m) continue
    for (const re of [/^§?\s*(\d+(?:\.\d+)*)\b/, /§\s*(\d+(?:\.\d+)*)/]) {
      const a = re.exec(m[1])
      if (a) out.add(a[1])
    }
  }
  return out
}
const hasSection = (nums, n) => nums.has(n) || [...nums].some((x) => x.startsWith(n + "."))

/** 解析基根组：宽组（L1——含工作区根与兄弟仓）vs 本仓组（L4——本仓根 + 台账目录）。 */
export function refBases(root, ledgerDir) {
  const ws = resolve(root, "..")
  return {
    wide: [...new Set([root, ledgerDir, ws, ...SIBLING_NAMES.map((n) => join(ws, n))])],
    own: [...new Set([root, ledgerDir])],
  }
}
/** 档引用解析（`raw` 或 `raw + ".md"`）；命中返回绝对路径，否则 null。 */
function resolveIn(raw, bases) {
  for (const b of bases) {
    for (const c of [resolve(b, raw), raw.endsWith(".md") ? null : resolve(b, raw + ".md")]) {
      if (c && isFile(c)) return c
    }
  }
  return null
}
/** 仓内 `.md` basename 计数（L1③：只写 basename 时同名 ≥2 即多义）。 */
function mdBasenames(root, out = new Map()) {
  for (const name of readdirSync(root)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(root, name)
    try { if (statSync(p).isDirectory()) mdBasenames(p, out); else if (name.endsWith(".md")) out.set(name, (out.get(name) ?? 0) + 1) } catch { /* 跳过 */ }
  }
  return out
}
/** 全仓 basename 计数（L4② 仓内定位用；排除 SKIP_DIRS）。 */
function allBasenames(root, out = new Map()) {
  for (const name of readdirSync(root)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(root, name)
    try { if (statSync(p).isDirectory()) allBasenames(p, out); else out.set(name, (out.get(name) ?? 0) + 1) } catch { /* 跳过 */ }
  }
  return out
}
/**
 * L4② 证据解析（判序收紧——外仓前缀排除）。返回 null（通过）或违规描述字符串。
 * ① 跨仓形态（兄弟仓目录前缀 / `..` 逃逸 / 仓根外绝对路径）⇒ 违规（fail-closed，不回退 basename）；② 本仓根直接解析 ⇒ 通过；
 * ③ 外仓前缀排除（收紧——相对路径；绝对路径由 ①/② 处置）：相对路径含目录前缀、全路径本仓不可解析时——前缀首段须为本仓根现存条目；
 * 不现存 ⇒ 跨仓形态（外仓前缀）⇒ 违规（不回退 basename——防「外仓前缀 + 仓内唯一 basename」假阴面）；
 * ④ 文档行坐标（`.md` + 行号——非证据形态）：同名 `.md` 仓内 ≥1 ⇒ 通过；⑤ 仓内定位（裸 basename /
 * 陈旧前缀——首段现存）：basename 唯一 ⇒ 通过；0 / ≥2 命中 ⇒ 违规（不可定位 / 多义）。
 */
export function evidenceState(root, p, cache) {
  const norm = p.replace(/\\/g, "/")
  const segs = norm.split("/").filter(Boolean)
  if (segs.includes("..") || SIBLING_NAMES.includes(segs[0])) return "跨仓形态（逃逸 / 兄弟仓目录前缀）"
  const abs = isAbsolute(p) ? p : resolve(root, p)
  if (isFile(abs) && withinRoot(root, abs)) return null
  if (isAbsolute(p) && !withinRoot(root, abs)) return "跨仓形态（仓根外绝对路径）"
  if (!isAbsolute(p) && segs.length > 1) { // ③ 外仓前缀排除（收紧）：前缀首段非本仓根现存条目 ⇒ 跨仓形态
    cache.rootEntries ??= new Set(readdirSync(root))
    if (!cache.rootEntries.has(segs[0])) return "跨仓形态（外仓前缀）"
  }
  const base = basename(norm)
  if (norm.endsWith(".md")) {
    cache.md ??= mdBasenames(root)
    return (cache.md.get(base) ?? 0) >= 1 ? null : "本仓无同名文档"
  }
  cache.all ??= allBasenames(root)
  const n = cache.all.get(base) ?? 0
  if (n === 1) return null
  return n === 0 ? "本仓无同名文件" : `仓内同名 ${n} 份（多义）`
}
/** 路径段是否落在本仓根内（跨平台比较键：正斜杠；win32 大小写不敏感）。 */
export function withinRoot(root, abs) {
  const norm = (p) => resolve(p).replace(/\\/g, "/")
  const key = (p) => (process.platform === "win32" ? norm(p).toLowerCase() : norm(p))
  const r = key(root).replace(/\/$/, "")
  const a = key(abs)
  return a === r || a.startsWith(r + "/")
}
/** 条目键（基线键用——稳定、不含行号）：首个 `**…**` 段；无则归一化文本前 40 字。 */
export function entryKey(text) {
  const m = /\*\*(.+?)\*\*/.exec(text)
  const base = m ? m[1] : text.replace(ENTRY_RE, "")
  return base.split(/[（(：:——]/)[0].trim().slice(0, 40) || text.trim().slice(0, 40)
}
/** 档显示名（仓目录名 + 仓内相对路径——不随 cwd 漂移）。 */
export const displayName = (abs, root) => basename(root) + "/" + relative(root, abs).replace(/\\/g, "/")

/**
 * 单档机检：返回违规 `[{kind, line, key, msg}]`。`abs` = 台账绝对路径；`root` = 所属仓根。
 * `live` = 活档（判 L3⑤）。
 */
export function checkLedger(abs, root, { live = true } = {}) {
  const display = displayName(abs, root)
  const lines = readFileSync(abs, "utf8").split("\n")
  const bases = refBases(root, dirname(abs))
  const hits = []
  const add = (kind, line, keyTail, symptom, expect, got) =>
    hits.push({
      kind, line,
      key: `${kind}|${display}|${keyTail}`,
      msg: `${display}:${line} [${kind}] ${symptom} — 期望 ${expect} · 实得 ${got}`,
    })
  const cache = new Map()
  const resolveCached = (raw, which) => {
    const k = `${which}|${raw}`
    if (!cache.has(k)) cache.set(k, resolveIn(raw, bases[which]))
    return cache.get(k)
  }
  const numsCache = new Map()
  const numsOf = (f) => {
    if (!numsCache.has(f)) numsCache.set(f, sectionNums(f))
    return numsCache.get(f)
  }

  // L3⑤ 活档 `- [x]` 零命中（归档口径：已核销 / 已废弃移入同仓 TODO-archive.md）
  if (live) {
    lines.forEach((l, i) => {
      if (/^- \[x\]/.test(l)) add("L3", i + 1, entryKey(l), "活档含 `- [x]`（归档口径）", "0 命中（已核销 / 已废弃移入归档档）", "1 条")
    })
  }

  // 组扫描（解析唯一实现 = `src/ledger.mjs` scanGroups——数字单源）
  const groups = scanGroups(lines)
  let baseNames = null
  for (const g of groups) {
    // L2 组计数一致（D3）：声明 == 组内**未决**条目数（scanGroups 口径）
    if (Number.isFinite(g.declared) && g.declared !== g.entries.length) {
      add("L2", g.line, g.name.replace(DECL_RE, ""), `组计数不符（${g.name}）`, `声明 ${g.declared} 条 == 组内未决条目数`, `${g.entries.length} 条`)
    }
  }
  // L4 条目面 = 全部条目（未决 + 归档闭环——R1 射程含归档指针）；L1 / L3 面 = 未决条目（scanGroups 口径，与对端同规）
  const groupOf = (lineNo) => { let g = null; for (const x of groups) { if (x.line <= lineNo) g = x; else break } return g }
  const closed = []
  lines.forEach((l, i) => { if (ENTRY_RE.test(l) && !OPEN_ENTRY_RE.test(l)) closed.push({ line: i + 1, text: l, group: groupOf(i + 1) }) })
  /** L4① 指针本仓解析（本仓根 + 台账目录——不含工作区根 / 兄弟仓；判据见设计档 §7.1）。 */
  const l4Refs = (e) => {
    for (const r of [...e.text.matchAll(REF_RE)].map((m) => ({ raw: m[1], sec: m[2] }))) {
      if (!resolveCached(r.raw, "own")) {
        add("L4", e.line, `${r.raw} §${r.sec}`, `指针不可本仓解析（${r.raw} §${r.sec}）`, "以本仓根 + 台账目录为基根可解析", "仅他仓可解析 / 不存在（跨仓指针禁——R1）")
      }
    }
  }
  /** L4② 证据路径（证据场 = 末个「证据」标记之后段——无标记 ⇒ 整条；段内**全匹配逐处判**；标记前的行内散文提及不判）。
   *  判序（外仓前缀排除 + 全匹配）见 `evidenceState`：省略 / 陈旧前缀的仓内引用通过；跨仓形态 / 不可定位 / 多义 ⇒ 违规。 */
  const evCache = {}
  const l4Evidence = (e) => {
    const marker = e.text.lastIndexOf("证据")
    const scope = marker >= 0 ? e.text.slice(marker) : e.text
    for (const m of scope.matchAll(EVIDENCE_RE_G)) {
      const p = m[1]
      if (!p || p.includes("*")) continue
      const why = evidenceState(root, p, evCache)
      if (why) {
        add("L4", e.line, `evi:${p}`, `证据不可本仓解析（${p}）`, "本仓可定位（根解析 / 唯一 basename；跨仓形态禁）", why)
      }
    }
  }
  for (const e of closed) { l4Refs(e); l4Evidence(e) } // 归档闭环条目：只判 L4（跨仓面）
  for (const g of groups) {
    for (const e of g.entries) {
      const isPool = g.name.includes("需求池")
      const isTech = g.name.includes("技术")
      const key = entryKey(e.text)
      const refs = [...e.text.matchAll(REF_RE)].map((m) => ({ raw: m[1], sec: m[2] }))
      const status = (STATUS_RE.exec(e.text) ?? [])[1]?.trim() ?? null
      const evidence = EVIDENCE_RE.exec(e.text)

      for (const r of refs) {
        // L1 指针可解析（宽基根——语义同源面）
        const wide = resolveCached(r.raw, "wide")
        if (!wide) add("L1", e.line, `${r.raw} §${r.sec}`, `指针不可解析（${r.raw} §${r.sec}）`, "档存在且节号在标题中", "unknown-doc（档不存在）")
        else if (!hasSection(numsOf(wide), r.sec)) add("L1", e.line, `${r.raw} §${r.sec}`, `指针不可解析（${r.raw} §${r.sec}）`, "节号在标题中（`§X` ↔ 标题编号 X）", "no-section（档内无该节）")
        if (!r.raw.includes("/")) {
          baseNames ??= mdBasenames(root)
          const n = baseNames.get(basename(r.raw)) ?? 0
          if (n > 1) add("L1", e.line, `basename:${r.raw}`, `basename 多义（${r.raw}）`, "带目录前缀（仓内同名 ≥2）", `同名 ${n} 份`)
        }
      }
      // L4① / L4②（本仓面——判据见上方 l4Refs / l4Evidence）
      l4Refs(e)
      l4Evidence(e)

      // L3① 需求池组条目单行（续行即违规）
      if (isPool && (lines[e.line] ?? "").trim() && !/^(#{1,6}\s|-\s\[|\||>|```|---)/.test(lines[e.line])) {
        add("L3", e.line + 1, key, "需求池条目含续行（单行硬约束）", "一行一条", `第 ${e.line + 1} 行为续行`)
      }
      // L3④ status ∈ 六态（无 `status=` 场豁免）
      if (status && !SIX_STATES.includes(status)) add("L3", e.line, key, "status 取值越域", `∈ {${SIX_STATES.join(" / ")}}`, status)
      if (isTech) {
        // L3② 技术组条目含 `file:line` 证据形态
        if (!EVIDENCE_RE.test(e.text)) add("L3", e.line, key, "技术条目缺 `file:line` 证据形态", "含 file:line 正则", "未见匹配")
        // L3⑥ 触发取值合法（无 `触发=` 场 → 审计面，不判红）
        const trig = (TRIGGER_RE.exec(e.text) ?? [])[1]?.trim() ?? null
        if (trig && !TRIGGERS.some((t) => trig === t || trig.startsWith(t + "（"))) add("L3", e.line, key, "触发取值非法", `∈ {${TRIGGERS.join(" / ")}}`, trig.slice(0, 30))
      }
      // L3③ 条目锚形态与组标题结构一致（非必填态豁免）
      if ((status === "在途" || status === "待核销") && (isPool || isTech)) {
        const docRef = refs.some((r) => resolveCached(r.raw, "wide"))
        const poolOk = docRef && refs.some((r) => r.raw.includes("requirements/")) && refs.some((r) => r.raw.includes("batches/"))
        const techOk = docRef || !!evidence || /(^|[·→\s])—([·\s（]|$)/.test(e.text)
        if (isPool && !poolOk) add("L3", e.line, key, "条目锚形态与需求池组结构不符", "需求档节 + 任务书 §2", "缺 需求档节 / 任务书")
        if (isTech && !techOk) add("L3", e.line, key, "条目锚形态与技术组结构不符", "归属档节 / 证据行", "两者皆无")
      }
    }
  }
  return hits
}

/** 读基线清单（缺失 / 损坏 → 空集）。**必须保持为空**——非空即 FAIL（入基线 = 例外 = 违规）。 */
export function loadBaseline(root) {
  try {
    const j = JSON.parse(readFileSync(resolve(root, BASELINE_PATH), "utf8"))
    return new Set(Array.isArray(j.entries) ? j.entries : [])
  } catch { return new Set() }
}

/** 多档机检：`{perFile, fresh（阻断——全部违规）, baseline（基线条目——必须为空）, skipped}`。
 *  基线不再分流（B16：阈值 = 0——「入基线」已废；非空基线 = 独立 FAIL 面，见 `main`）。 */
export function runCheck({ root = process.cwd(), ledgers = null, baseline = null } = {}) {
  const targets = (ledgers ?? DEFAULT_LEDGERS).map((t) => (typeof t === "string" ? { path: t, live: true } : t))
  const baselineList = [...(baseline ?? loadBaseline(root))]
  const perFile = [], skipped = [], fresh = []
  for (const t of targets) {
    const abs = resolve(root, t.path)
    if (!isFile(abs)) { skipped.push(abs); continue } // 缺档 → 跳过不报（降级不阻断）
    const hits = checkLedger(abs, root, { live: t.live !== false })
    perFile.push({ file: displayName(abs, root), hits, fresh: hits })
    fresh.push(...hits)
  }
  return { perFile, fresh, baseline: baselineList, skipped }
}

/** CLI 主行程（导出以便用例进程内断言退出码语义）。 */
export function main(args = process.argv.slice(2), { cwd = process.cwd(), log = console.log } = {}) {
  const argOf = (f) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : null }
  const root = resolve(argOf("--root") ?? cwd)
  const ledgers = args.flatMap((a, i) => (a === "--ledger" && args[i + 1] ? [{ path: args[i + 1], live: !args[i + 1].includes("archive") }] : []))
  const { perFile, fresh, baseline, skipped } = runCheck({ root, ledgers: ledgers.length ? ledgers : null })
  for (const abs of skipped) log(`SKIP: ${relative(root, abs)}（不可读——跳过不报）`)
  // 基线**必须保持为空**（B16 闸门收紧）：入基线 = 例外 = 违规——非空即 FAIL
  if (baseline.length) {
    log(`FAIL(基线): 基线清单非空（${baseline.length} 条）——**本基线必须保持为空**：入基线 = 例外 = 违规（不得再入基线；条目须修掉）。`)
    for (const k of baseline) log(`    ${k}`)
  }
  for (const f of perFile) {
    for (const v of f.fresh) log(v.msg)
    if (!f.fresh.length) log(`OK: ${f.file}`)
  }
  log(`${fresh.length} 处违规（阻断——修掉）· 基线 ${baseline.length} 条（**本基线必须保持为空**）。`)
  return fresh.length || baseline.length ? 1 : 0
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) process.exit(main())
