/**
 * ledger.mjs — 台账（需求池 / 技术待办）单一权威源（M2 模块——设计档
 * docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md §2.2）。
 *
 * v1 md 台账（docs/TODO.md 扫描器）→ SQLite 单表（ledger.db，项目级、不进 git）：六态 CHECK 机械
 * 锁死、COUNT 单源计数、事务保证收口原子、归档 = 软删除。行龄源 = SQLite 时间戳（无 git blame）。
 *
 * 面：① 命令族（查询 = 只读全角色 / 写 = 仅主 agent——接线见 tools/index.mjs 与 agent/family-tools.mjs）
 * ② 族发现（findProject / discoverFamily——标记 = ledger.db）③ scan 组装（buildScan——行集 + ledgerCount
 * → scan 对象，形状契约 = pool/tech/aged/thresholdReached/actionable/root/name/ledger）
 * ④ 通知去重（送达门 + 一次性去重——去重档跨会话、跨端共享）⑤ 格式 helper（行文本逐字契约）。
 *
 * W8 契约②：ledger-db.mjs 静态 import node:sqlite ⇒ 消费侧一律**动态 import** 本档（禁止静态 import）。
 */
import { mkdirSync, opendirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { configDir } from "./config.mjs"
import { ledgerDbPath, PENDING_STATUSES } from "./ledger-db.mjs"
import { ledgerQuery } from "./ledger-cmd.mjs"

/** 老化阈值（天——口径 = 需求档；`days` 参数可覆盖）。 */
export const AGING_DAYS = 30
/** 「可开批」阈值：同一板块（需求类条目 board 列）未决 ≥ 2。 */
export const THRESHOLD_BOARD = 2
/** 「可开批」阈值：需求池未决 ≥ 3。 */
export const THRESHOLD_POOL = 3
/** 刷新周期（N2 实现常量；VSC 端另有换项目事件触发）。 */
export const REFRESH_MS = 120000
/** 变化行去重档（跨会话、跨端共享——需求档 §1.18 F5；configDir 先例 = crash-reports 同区）。 */
export const NOTIFY_FILE = join(configDir, "ledger-notify.json")
/** 空族提示（仅命令面——运行时面静默，N1 / 设计档 §2.30.3.3）。 */
export const EMPTY_FAMILY_LINE = "台账：未发现台账。"

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

/** 向上（含自身）最近的已注册台账项目根 → {root, ledger} / null（F4——CLI 锚 = cwd；
 *  标记 = 用户数据目录里以该项目路径为键的台账库——项目目录内不落任何标记文件）。 */
export function findProject(anchor) {
  let dir = resolve(anchor)
  for (;;) {
    const ledger = ledgerDbPath(dir)
    if (isFile(ledger)) return { root: dir, ledger }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/** 同级枚举上限（N2 成本有界：父目录超此规模 = 缓存 / 临时等非仓族形态 → 退化空集，只显当前项目）。 */
export const MAX_SIBLING_SCAN = 100

/** 目录下已注册台账的直接子目录（目录名升序；不可读 → []；**惰性枚举 + 上限**——大目录零全量扫描）。 */
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
      const ledger = ledgerDbPath(root)
      if (isFile(ledger)) out.push({ root, ledger })
    }
  } catch { /* 读中断 → 已得子集（尽力而为） */ }
  finally { try { handle.closeSync() } catch { /* 已关 */ } }
  return out.sort((a, b) => (a.root < b.root ? -1 : a.root > b.root ? 1 : 0))
}

/** 项目族发现：{current, projects}——projects = current + 其同级含台账库目录（**发现序：current 在前**，
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

/** scan 组装（SQLite 行集 + 计数单源 → scan 对象）——形状契约（设计档 §2.2）：pool/tech/aged/
 *  agedKeys/agedTitles/thresholdReached/boards/actionable/root/name/ledger。行龄 = 时间戳
 *  （updated_at ?? created_at 距今 > days；未知不计——零假阳降级，同 v1 行龄未知口径）。
 *  `now`/`days` = 注入面（确定性用例——替代 v1 ageOf git 注入面）。 */
export function buildScan({ cwd, days = AGING_DAYS, now = Date.now() } = {}) {
  const rows = ledgerQuery({ cwd })
  const pending = rows.filter((r) => PENDING_STATUSES.includes(r.status))
  const poolEntries = pending.filter((r) => r.kind === "requirement")
  const techEntries = pending.filter((r) => r.kind === "tech_todo")
  const candidates = techEntries.filter((r) => !r.trigger)
  const aged = candidates.filter((r) => {
    const t = r.updated_at ?? r.created_at
    return t != null && (now - Date.parse(t)) / 86400000 > days
  })
  const boards = new Map()
  for (const e of poolEntries) {
    const key = e.board ?? (e.req_doc ? basename(String(e.req_doc).split(/\s+/)[0]) : null)
    if (key) boards.set(key, (boards.get(key) ?? 0) + 1)
  }
  const thresholdReached = poolEntries.length >= THRESHOLD_POOL || [...boards.values()].some((n) => n >= THRESHOLD_BOARD)
  const root = resolve(cwd)
  return {
    name: basename(root), root, ledger: ledgerDbPath(root),
    pool: poolEntries.length, tech: techEntries.length, aged: aged.length,
    agedKeys: aged.map((r) => normalizeEntry(r.title)), agedTitles: aged.map((r) => entryTitle(r.title)),
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

/** 去重档键 = 台账库绝对路径·正斜杠 + **盘符大写**（跨端同规则——CLI 的 `process.cwd()` 盘符大写、
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

// ── re-export（拆分件接口——命令面接线 = 动态 import 本档，KD-M2-3） ──
export { ALLOWED_MIGRATIONS, ledgerDbPath, openLedger, PENDING_STATUSES, _setLedgerDirForTest, _resetLedgerDirForTest } from "./ledger-db.mjs"
export { ledgerAdd, ledgerAddTool, ledgerClose, ledgerCloseTool, ledgerCount, ledgerCountTool, ledgerQuery, ledgerQueryTool, ledgerUpdate, ledgerUpdateTool } from "./ledger-cmd.mjs"
