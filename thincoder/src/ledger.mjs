/**
 * ledger.mjs — 台账（需求池 / 技术待办）单源读取面（LEDGER-SURFACE 批——设计档 §2.30.3）。
 *
 * 数字单源（F7）：解析（`scanGroups`）/ 计数 / 老化 / 阈值一处实现——机检器
 * （`scripts/check-ledger.mjs`）与显示面（CLI TUI `src/tui/ledger-surface.mjs`）共用本口径；
 * VSC 端为独立实现、语义同源（不跨仓 import）。
 * 口径（需求档 §1.18）：计数 = `##` 组内 `- [ ]` 未决条目；老化 = 技术组无 `触发=` 且行龄
 * > 30 天（行龄未知不计）；阈值 = 池 ≥ 3 或任一板块 ≥ 2；可动作 = 老化 > 0 或阈值达成。
 * 行文本逐字契约 = 设计档 §2.30.3.3（本模块只产出文本，色 / 态归各端显示面）。
 */
import { mkdirSync, opendirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { execFileSync } from "node:child_process"
import { configDir } from "./config.mjs"

/** 老化阈值（天——口径 = 需求档 §1.18；`days` 参数可覆盖）。 */
export const AGING_DAYS = 30
/** 「可开批」阈值：同一板块（池条目指针所指需求档文档名）未决 ≥ 2。 */
export const THRESHOLD_BOARD = 2
/** 「可开批」阈值：需求池未决 ≥ 3。 */
export const THRESHOLD_POOL = 3
/** 刷新周期（N2 实现常量；VSC 端另有换项目事件触发）。 */
export const REFRESH_MS = 120000
/** 变化行去重档（跨会话、跨端共享——需求档 §1.18 F5；configDir 先例 = crash-reports 同区）。 */
export const NOTIFY_FILE = join(configDir, "ledger-notify.json")
/** 空族提示（仅命令面——运行时面静默，N1 / 设计档 §2.30.3.3）。 */
export const EMPTY_FAMILY_LINE = "台账：未发现台账（docs/TODO.md）。"

const LEDGER_REL = join("docs", "TODO.md")
const H2_RE = /^##\s+(.*)$/
const DECL_RE = /（(\d+)\s*条）/
const OPEN_ENTRY_RE = /^- \[ \]\s+/
const TRIGGER_RE = /触发\s*=\s*([^·\n]*)/
const BOARD_REF_RE = /requirements\/([A-Za-z0-9_.-]+\.md)/

/** `##` 组扫描（与机检器 L2/L3 同源——解析唯一实现）：[{name,line,declared,entries:[{line,text}]}]。 */
export function scanGroups(lines) {
  const groups = []
  lines.forEach((l, i) => {
    const h = H2_RE.exec(l)
    if (h) groups.push({ name: h[1].trim(), line: i + 1, declared: Number((DECL_RE.exec(h[1]) ?? [])[1] ?? NaN), entries: [] })
    else if (groups.length && OPEN_ENTRY_RE.test(l)) groups[groups.length - 1].entries.push({ line: i + 1, text: l })
  })
  return groups
}

/** 条目归一化文本 = 条目键（去 `- [ ] ` 前缀 + 去首尾空白 + 连续空白折叠单空格）。
 *  位置无关（位移 / 他条编辑稳定）；自身文本变更 = 键变（最坏一次重报）。§2.30.3.2。 */
export function normalizeEntry(text) {
  return text.replace(/^- \[[ x]\]\s+/, "").trim().replace(/\s+/g, " ")
}

/** 条目标题：首个 `**…**` 段；无粗体段 → 归一化文本前 20 字（超出加 `…`）。§2.30.3.3 L3。 */
export function entryTitle(text) {
  const m = /\*\*(.+?)\*\*/.exec(text)
  if (m) return m[1]
  const norm = normalizeEntry(text)
  return norm.length > 20 ? norm.slice(0, 20) + "…" : norm
}

const isFile = (p) => { try { return statSync(p).isFile() } catch { return false } }

/** 向上（含自身）最近的含台账目录 → {root, ledger} / null（F4——CLI 锚 = cwd）。 */
export function findProject(anchor) {
  let dir = resolve(anchor)
  for (;;) {
    const ledger = join(dir, LEDGER_REL)
    if (isFile(ledger)) return { root: dir, ledger }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/** 同级枚举上限（N2 成本有界：父目录超此规模 = 缓存 / 临时等非仓族形态 → 退化空集，只显当前项目）。 */
export const MAX_SIBLING_SCAN = 100

/** 目录下含台账的直接子目录（目录名升序；不可读 → []；**惰性枚举 + 上限**——大目录零全量扫描）。 */
function ledgerChildren(dir) {
  const out = []
  let handle
  try { handle = opendirSync(dir) } catch { return out }
  try {
    let n = 0
    for (;;) {
      const ent = handle.readSync()
      if (!ent) break
      if (++n > MAX_SIBLING_SCAN) return []
      if (!ent.isDirectory()) continue
      const root = join(dir, ent.name)
      const ledger = join(root, LEDGER_REL)
      if (isFile(ledger)) out.push({ root, ledger })
    }
  } catch { /* 读中断 → 已得子集（尽力而为） */ }
  finally { try { handle.closeSync() } catch { /* 已关 */ } }
  return out.sort((a, b) => (a.root < b.root ? -1 : a.root > b.root ? 1 : 0))
}

/** 项目族发现：{current, projects}——projects = current + 其同级含台账目录（**发现序：current 在前**，
 *  其余按目录名升序）；current 缺（容器目录，K6）→ 上下文目录向上最近「含台账子目录」者取其子目录。 */
export function discoverFamily(anchor) {
  const current = findProject(anchor)
  if (current) {
    const siblings = ledgerChildren(dirname(current.root)).filter((p) => p.root !== current.root)
    return { current, projects: [current, ...siblings] }
  }
  let dir = resolve(anchor)
  for (;;) {
    const kids = ledgerChildren(dir)
    if (kids.length) return { current: null, projects: kids }
    const parent = dirname(dir)
    if (parent === dir) return { current: null, projects: [] }
    dir = parent
  }
}

/** 行龄 Map：全档一次 `git blame --porcelain` → Map<行号, 天>；非 git / 不可判定 → null（零假阳降级）。 */
export function blameAges(abs) {
  let out
  try {
    out = execFileSync("git", ["blame", "--porcelain", "--", abs], {
      cwd: dirname(abs), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 32 * 1024 * 1024,
    })
  } catch { return null }
  const times = new Map(), ages = new Map()
  const now = Date.now() / 1000
  let sha = null, line = 0
  for (const l of out.split("\n")) {
    const h = /^([0-9a-f^]{7,40})\s+\d+\s+(\d+)(?:\s+\d+)?$/.exec(l)
    if (h) { sha = h[1]; line = Number(h[2]); continue }
    if (l.startsWith("author-time ")) { times.set(sha, Number(l.slice(12))); continue }
    if (l.startsWith("\t")) {
      const t = times.get(sha)
      ages.set(line, t != null ? (now - t) / 86400 : null)
    }
  }
  return ages
}

/** 单项目汇总 → {name,root,ledger,pool,tech,aged,agedKeys,agedTitles,thresholdReached,boards,actionable}。
 *  `ageOf(abs)` → Map<行号,天>|null（注入面——确定性用例）；**无候选条目不调 ageOf**（N2）。 */
export function summarizeLedger(project, { days = AGING_DAYS, ageOf = blameAges } = {}) {
  const groups = scanGroups(readFileSync(project.ledger, "utf8").split("\n"))
  const poolEntries = groups.filter((g) => g.name.includes("需求池")).flatMap((g) => g.entries)
  const techEntries = groups.filter((g) => g.name.includes("技术")).flatMap((g) => g.entries)
  const candidates = techEntries.filter((e) => !TRIGGER_RE.test(e.text))
  const ages = candidates.length ? ageOf(project.ledger) : null
  const aged = candidates.filter((e) => { const a = ages?.get(e.line); return a != null && a > days })
  const boards = new Map()
  for (const e of poolEntries) {
    const m = BOARD_REF_RE.exec(e.text)
    if (m) boards.set(m[1], (boards.get(m[1]) ?? 0) + 1)
  }
  const thresholdReached = poolEntries.length >= THRESHOLD_POOL || [...boards.values()].some((n) => n >= THRESHOLD_BOARD)
  return {
    name: basename(project.root), root: project.root, ledger: project.ledger,
    pool: poolEntries.length, tech: techEntries.length, aged: aged.length,
    agedKeys: aged.map((e) => normalizeEntry(e.text)), agedTitles: aged.map((e) => entryTitle(e.text)),
    thresholdReached, boards, actionable: aged.length > 0 || thresholdReached,
  }
}

/** L1 状态标记（逐字——§2.30.3.3）。 */
export function formatMarker(scan) {
  return scan ? `台账 ${scan.pool}·${scan.tech}` : null
}

/** L2 明细行（逐字——`（老化 <n>）` 恒显；阈值达成加 ` — 可开批`）。 */
export function formatDetailLine(scan) {
  return `台账 ${scan.name}：需求池 ${scan.pool} · 技术待办 ${scan.tech}（老化 ${scan.aged}）${scan.thresholdReached ? " — 可开批" : ""}`
}

/** L3 变化行·老化（titles = 新增老化条目标题；> 3 条时第三项后接 `；…`）。 */
export function formatAgingLine(scan, titles) {
  return `台账变化：${scan.name} 老化首次越线 ${titles.length} 条（超 30 天未处置）：${titles.slice(0, 3).join("；")}${titles.length > 3 ? "；…" : ""}`
}

/** L4 变化行·阈值。 */
export function formatThresholdLine(scan) {
  return `台账变化：${scan.name} 需求池达阈值（${scan.pool} 条）— 可开批`
}

/** 明细行集 = {current} ∪ {可动作项目}（发现序——current 在前，其余按目录名升序；同项去重）。 */
export function detailScans(scans, current) {
  const out = []
  if (current) out.push(current)
  for (const s of scans) if (s !== current && s.actionable) out.push(s)
  return out
}

/** 变化行规划（纯函数）：{lines:[{text,warn}], next:{aged,threshold}}（去重口径 §2.30.3.2）。 */
export function planChangeLines(prev, scan) {
  const p = prev && typeof prev === "object" ? prev : {}
  const before = new Set(Array.isArray(p.aged) ? p.aged : [])
  const freshTitles = scan.agedKeys.map((k, i) => (before.has(k) ? null : scan.agedTitles[i])).filter((t) => t != null)
  const lines = []
  if (freshTitles.length) lines.push({ text: formatAgingLine(scan, freshTitles), warn: true })
  if (scan.thresholdReached && !p.threshold) lines.push({ text: formatThresholdLine(scan), warn: true })
  return { lines, next: { aged: scan.agedKeys, threshold: scan.thresholdReached } }
}

/** 去重档键 = 台账绝对路径·正斜杠 + **盘符大写**（跨端同规则——CLI 的 `process.cwd()` 盘符大写、
 *  VSC 的 `uri.fsPath` 小写（`session-slots.mjs` `normalizeCwd` 同一契约——session / checkpoint /
 *  trace 跨端共享即赖此）；CLI 写的键 VSC 须逐字认得）。 */
export function notifyKey(ledger) {
  return resolve(ledger).replace(/\\/g, "/").replace(/^([a-z]):/, (_, d) => `${d.toUpperCase()}:`)
}

/** 去重档读（缺失 / 坏 JSON → 空态——N1 降级不崩）。 */
export function loadNotifyState(file = NOTIFY_FILE) {
  try {
    const j = JSON.parse(readFileSync(file, "utf8"))
    if (j && typeof j === "object" && j.ledgers && typeof j.ledgers === "object") return { version: 1, ledgers: j.ledgers }
  } catch { /* 缺失 / 坏档 → 空态 */ }
  return { version: 1, ledgers: {} }
}

/** 去重档写（temp + rename 防撕裂；写失败静默返回 false——唯一写面，仅送达后调）。 */
export function saveNotifyState(file, state) {
  try {
    mkdirSync(dirname(file), { recursive: true })
    const tmp = `${file}.tmp-${process.pid}`
    writeFileSync(tmp, JSON.stringify(state), "utf8")
    renameSync(tmp, file)
    return true
  } catch { return false }
}
