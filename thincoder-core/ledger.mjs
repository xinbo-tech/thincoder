/**
 * ledger.mjs — 台账（需求池 / 技术待办）单一权威源（M2 模块——设计档
 * docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md §2.2）。
 *
 * v1 md 台账（docs/TODO.md 扫描器）→ SQLite 单表（ledger.db，项目级、不进 git）：六态 CHECK 机械
 * 锁死、COUNT 单源计数、事务保证收口原子、归档 = 软删除。行龄源 = SQLite 时间戳（无 git blame）。
 *
 * 面：① 命令族（查询 = 只读全角色 / 写 = 仅主 agent——核函数 `ledger-cmd.mjs` + 工具定义 `ledger-tools.mjs`
 * 两源，接线见 `agent/family-tools.mjs`——统一入口 `ledger` 两变体，2026-10-05 统一入口批）
 * ② 族发现（findProject / discoverFamily——标记 = ledger.db）③ scan 组装（buildScan——行集 + ledgerCount
 * → scan 对象，形状契约 = pool/tech/aged/thresholdReached/actionable/root/name/ledger）
 * ④ 格式 helper（L1 标记 ∥ L2 明细行逐字契约——含标记范围归约 `scopeMarkerOf`，§7.2）。
 * 判活展示 = 拆分件 `ledger-executors.mjs`（在途 executor 解析 + 三态尾段——本档 re-export，
 * 消费面仍只认本档）。
 *
 * W8 契约②：ledger-db.mjs 静态 import node:sqlite ⇒ 消费侧一律**动态 import** 本档（禁止静态 import）。
 */
import { basename, dirname, resolve } from "node:path"
import { AGING_DAYS, PENDING_STATUSES, ledgerChildren, ledgerDbPath, resolveLedgerRoot } from "./ledger-db.mjs"
import { ledgerQuery } from "./ledger-cmd.mjs"
import { executorTail } from "./ledger-executors.mjs"

/** 「可开批」阈值：同一板块（需求类条目 board 列）未决 ≥ 2。 */
export const THRESHOLD_BOARD = 2
/** 「可开批」阈值：需求池未决 ≥ 3。 */
export const THRESHOLD_POOL = 3
/** 刷新周期（N2 实现常量；VSC 端另有换项目事件触发）。 */
export const REFRESH_MS = 120000
/** 空族提示（仅命令面——运行时面静默，N1 / 归档档 ENGINEERING-MODE.md §2.30.3.3——现行承接 = `docs/core/design/LEDGER.md`）。 */
export const EMPTY_FAMILY_LINE = "台账：未发现台账。"

/** 条目归一化文本 = 条目键（去 `- [ ] ` 前缀 + 去首尾空白 + 连续空白折叠单空格）。
 *  位置无关（位移 / 他条编辑稳定）；自身文本变更 = 键变（最坏一次重报）。归档档 ENGINEERING-MODE.md §2.30.3.2。 */
export function normalizeEntry(text) {
  return text.replace(/^- \[[ x]\]\s+/, "").trim().replace(/\s+/g, " ")
}

/** 条目标题：首个 `**…**` 段；无粗体段 → 归一化文本前 20 字（超出加 `…`）。归档档 ENGINEERING-MODE.md §2.30.3.3 L3。 */
export function entryTitle(text) {
  const m = /\*\*(.+?)\*\*/.exec(text)
  if (m) return m[1]
  const norm = normalizeEntry(text)
  return norm.length > 20 ? norm.slice(0, 20) + "…" : norm
}

/** 向上（含自身）最近的**已注册**项目根 → {root, ledger} / null（F4——CLI 锚 = cwd）。
 *  薄委托 `resolveLedgerRoot(anchor, anchor)`（设计档 §3.8——上溯以会话锚为界）：锚即本面的会话锚 ⇒
 *  界 = 锚自身（不越界探外层项目，与工具面同判）；`root` = 推导所得项目根（非锚）；
 *  多根工作区锚 ⇒ `null` ⇒ 族发现按工作区根形（族求和——§7.2 / AC-M2-18 / AC-M2-19）。
 *  `ledgerDbPath` 同一界（同一笔读数不能两界）。 */
export function findProject(anchor) {
  const derived = resolveLedgerRoot(anchor, anchor)
  return derived ? { root: derived.root, ledger: ledgerDbPath(derived.root, derived.root) } : null
}

/** 项目族发现：{current, projects}——current = `findProject`（**祖先支**：容器 ∥ 工作区锚 ⇒ `null` ⇒ 按
 *  容器形落子目录族）；projects = current + 其**同级已注册**目录（**发现序：current 在前**，其余按目录
 *  名升序）；current 缺（容器目录，K6）→ **锚本地**：取锚自身**已注册**的直接子目录（不沿祖先链上找）。
 *  「工作区根不充当项目」的判据单源 = `resolveLedgerRoot` 的库臂排除（§2.1）——本函数零自持判据。 */
export function discoverFamily(anchor) {
  const current = findProject(anchor)
  if (current) {
    const siblings = ledgerChildren(dirname(current.root)).filter((p) => p.root !== current.root)
    return { current, projects: [current, ...siblings] }
  }
  return { current: null, projects: ledgerChildren(resolve(anchor)) }
}

/** scan 组装（SQLite 行集 + 计数单源 → scan 对象）——形状契约（设计档 §2.2）：pool/tech/aged/
 *  agedKeys/agedTitles/overdue/thresholdReached/boards/actionable/root/name/ledger。行龄 = 时间戳
 *  （updated_at ?? created_at 距今 > days；未知不计——零假阳降级，同 v1 行龄未知口径）。
 *  `now`/`days` = 注入面（确定性用例——替代 v1 ageOf git 注入面）。
 *  **`days` 只作用于展示面 `aged`**（本函数局部阈值）；`overdue`（出口态）恒按核常量 `AGING_DAYS`
 *  （`overdueOf` 单源）——故 `days` 调小时 `aged` 会先于 `overdue` 涨（两数口径不同，非矛盾）。
 *  **根推导**（设计档 §3.8）：`root` / `name` / `ledger` = `resolveLedgerRoot(anchor, anchor)` 推导所得项目根
 *  （界 = 本面会话锚 ⇒ 命中即根 = 锚自身；多根工作区锚 ⇒ 无根）——与行集读取同一单源；无根 ⇒ `ledger` = `null`
 *  （不落兜底根——该态下 `root` / `name` 回落锚、行集为空，且该 scan 不进族枚举（`discoverFamily` 只列已注册子目录））。
 *  `inflightExecutors`（F-LX1 · sync 零变——K-LX2）：在途且 executor 非空行集原样携带
 *  {executor, updated_at, created_at}——判活解析由 `resolveExecutorStates` async 单源负责，本函数零探测。 */
export function buildScan({ cwd, days = AGING_DAYS, now = Date.now() } = {}) {
  const anchor = resolve(cwd)
  const derived = resolveLedgerRoot(anchor, anchor) // 界 = 会话锚（本面锚即会话锚——与工具面同判）
  const root = derived ? derived.root : anchor
  const rows = ledgerQuery({ cwd: anchor, boundary: anchor, now }) // `now` 透传（两读数同时钟——`overdue` 的行键由核同一 `now` 算）
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
  const inflightExecutors = pending
    .filter((r) => r.status === "在途" && r.executor)
    .map((r) => ({ executor: r.executor, updated_at: r.updated_at ?? null, created_at: r.created_at ?? null }))
  return {
    name: basename(root), root, ledger: derived ? ledgerDbPath(root, root) : null,
    pool: poolEntries.length, tech: techEntries.length, aged: aged.length,
    overdue: pending.filter((r) => r.overdue != null).length, // 待处置（§3.7——机判单源 = 行集 `overdue` 键，行值与 `now` 均同源）
    agedKeys: aged.map((r) => normalizeEntry(r.title)), agedTitles: aged.map((r) => entryTitle(r.title)),
    thresholdReached, boards, actionable: aged.length > 0 || thresholdReached,
    inflightExecutors,
  }
}

/** L1 状态标记（逐字——归档档 ENGINEERING-MODE.md §2.30.3.3）。 */
export function formatMarker(scan) {
  return scan ? `台账 ${scan.pool}·${scan.tech}` : null
}

/** 标记范围归约（L1 取值单源——LEDGER.md §7.2「标记范围」）：`current` 在场 ⇒ 范围 = `scans` 中
 *  `root` = `family.current.root` 的 scan（命中但不在 `scans`——不可读 ⇒ 空范围，不掺兄弟）；
 *  `current` 缺席（容器根锚）⇒ 范围 = `scans` 全体（族内已读项目——构建期不可读已跳过）。
 *  空范围 ⇒ `{ marker: null, warn: false }`（不落 `0·0`）；范围非空 ⇒ `marker` = `formatMarker`
 *  逐字（两池分列求和——F1）；`warn` = 范围内任一项 `overdue>0 ∨ deadExecutors>0`（§3.7——`aged ⊂
 *  overdue` ⇒ 警示色不缩；端零重算）。消费面 = 核拍面（`ledger-surface.mjs`）∥ VSC item。 */
export function scopeMarkerOf(scans, family) {
  const list = Array.isArray(scans) ? scans : []
  const currentRoot = family?.current?.root ?? null
  const range = currentRoot === null ? list : list.filter((s) => s?.root === currentRoot)
  if (range.length === 0) return { marker: null, warn: false }
  let pool = 0
  let tech = 0
  let warn = false
  for (const s of range) {
    pool += s.pool
    tech += s.tech
    if (s.overdue > 0 || s.deadExecutors > 0) warn = true
  }
  return { marker: formatMarker({ pool, tech }), warn }
}

/** L2 明细行（逐字——`（老化 <n> · 待处置 <m>）` 两数恒显（含 0——§3.7 出口面恒显位扩）；
 *  阈值达成加 ` — 可开批`；判活尾段 = executorTail 三态——在途 executor 缺席时尾段空串）。 */
export function formatDetailLine(scan) {
  return `台账 ${scan.name}：需求池 ${scan.pool} · 技术待办 ${scan.tech}（老化 ${scan.aged} · 待处置 ${scan.overdue}）${scan.thresholdReached ? " — 可开批" : ""}${executorTail(scan)}`
}

/** 明细行集 = {current} ∪ {可动作项目}（发现序——current 在前，其余按目录名升序；同项去重）。 */
export function detailScans(scans, current) {
  const out = []
  if (current) out.push(current)
  for (const s of scans) if (s !== current && s.actionable) out.push(s)
  return out
}

// ── re-export（拆分件接口——命令面接线 = 动态 import 本档，KD-M2-3；`AGING_DAYS` 常量单源 = `ledger-db.mjs`
//    ——2026-10-07 批 ledger-tool 自本档迁入，公共面零变；`ledgerChildren` / `MAX_SIBLING_SCAN` / `resolveLedgerRoot`
//    ——2026-10-16 批 ledger-root-derivation 随迁 / 新增，公共面形零改） ──
export { AGING_DAYS, ALLOWED_MIGRATIONS, EVIDENCE_SOFT_LIMIT, MAX_SIBLING_SCAN, ledgerChildren, ledgerDbPath, ledgerKey, ledgerDirPath, openLedger, PENDING_STATUSES, resolveLedgerRoot, ROUND_MARKER, _setLedgerDirForTest, _resetLedgerDirForTest, ensureColumn, ensureExecutorColumn } from "./ledger-db.mjs"
export { ledgerAdd, ledgerBatchRows, ledgerClose, ledgerCloseBatch, ledgerCount, ledgerEvidenceOversize, ledgerQuery, ledgerReanchorBatch, ledgerUpdate, ledgerUpdateBatch, overdueOf } from "./ledger-cmd.mjs"
export { ledgerTool, ledgerReadTool, ledgerAddTool, ledgerCloseTool, ledgerCountTool, ledgerQueryTool, ledgerUpdateTool } from "./ledger-tools.mjs"
export { runLedgerAudit, runLedgerMigrate } from "./ledger-migrate.mjs"
export { resolveExecutorStates, executorTail, _setExecutorProbeTtlForTest } from "./ledger-executors.mjs"
