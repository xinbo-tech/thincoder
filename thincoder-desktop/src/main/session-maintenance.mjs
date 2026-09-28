/**
 * session-maintenance.mjs — 会话生命周期维护处理体（R1 · 桌面功能对位批 · §2.4 R1 #1）：会话数据回收 ∕
 * 索引重建 + 启动拍供面。**核零改**（出口全在 —— 本档只做薄处理体与转口，算法一行不复制；判据单源 =
 * `thincoder-core/session-gc.mjs` ∕ `session-stale.mjs` ∕ `session-index*.mjs`）。
 *
 * 三面：
 *   ① `runSessionGcMaintenance` —— 候选列举（冷 cwd 90 天面 ∪ 三合取存量组面，**并集去重**：同一组两判据
 *      可达 ⇒ 逐组恰回收一次）⇒ 计数 ⇒ **确认**（注入缝 `confirm({ count })`；缺失 ∕ 非 `true` ⇒ 零删除
 *      —— 先例 VSC `session-gc-command.mjs:29-70` 同律）⇒ 逐组 `deleteColdCwd`（**内部 TOCTOU 重校验**：
 *      期间变活 ∕ 出窗 ⇒ 拒绝该组，其余组继续）⇒ 汇总。
 *   ② `runSessionIndexMaintenance` —— 清四表 → 全量重扫会话档 → 摘要（`runSessionIndex --rebuild` 形；
 *      先例 VSC `session-index-command.mjs:16-43`）。**核索引面一律惰性载入**：`node:sqlite` 不得进入端壳
 *      静态闭包（VSC 纪律①同款 —— `session-index-command.mjs:6-7`）。
 *   ③ `scheduleSessionMaintenancePasses` —— 启动拍供面（GC + 索引两枚；核侧启动窗外 3s 延迟拍、
 *      每进程一次、异步非阻塞、失败静默）。
 *
 * 纪律：**零 `electron` 依赖**（宿主面 = 注入的 `confirm` ∕ 回执 —— 平 node 可直测）；核命令面壳体
 * （`runSessionGc` ∕ `runSessionIndex` 的 console 形态）**不消费**（属 CLI 壳）；`dir` 缺省 = 端侧派生
 * sessions 根（`session-slots.mjs` `sessionsDir()` —— 随核 `configDir` 与核沙箱缝自动随动），不依赖核函
 * 缺省（核内 `configDir` 版）。`now` ∕ `probeFn` ∕ `dbPath` = 注入缝。
 */
import { readdir } from "node:fs/promises"
import {
  deleteColdCwd, listColdCwds, listStaleCwds, scheduleSessionGC, scheduleSessionIndexPass, sessionsDir,
} from "./session-slots.mjs"

/** ① 会话数据回收（显式面）：返回汇总（候选数 ∕ 是否确认 ∕ 已回收组数 ∕ 文件数 ∕ 跳过项）。
 *  `confirm` 收到 `{ count }`（候选组数）—— UI 词面 ∕ 模态形属宿主侧（`window.mjs`）；**驳回 ∕ 缺失 ⇒
 *  `confirmed:false` 且零删除**（先例 VSC：`pick !== "Delete"` 即返，未触发任何核写面）。
 *  `probeFn` 缺省 = 核探测束（`probeOwnersAsync`）；给定时透传（用例注入缝）。 */
export async function runSessionGcMaintenance({ dir = sessionsDir(), now = Date.now(), probeFn = null, confirm = null } = {}) {
  const opts = probeFn ? { dir, now, probeFn } : { dir, now }
  const cold = await listColdCwds(opts)
  const stale = (await listStaleCwds({ ...opts, limit: Infinity })).candidates
  const coldHashes = new Set(cold.map((c) => c.hash)) // 同一组两判据可达 ⇒ 并集去重（逐组恰回收一次）
  const candidates = [...cold, ...stale.filter((c) => !coldHashes.has(c.hash))]

  if (!candidates.length) return { ok: true, candidates: 0, confirmed: false, deleted: 0, files: 0, skipped: 0, skippedFiles: 0 }
  const confirmed = typeof confirm === "function" && (await confirm({ count: candidates.length })) === true
  if (!confirmed) return { ok: true, candidates: candidates.length, confirmed: false, deleted: 0, files: 0, skipped: 0, skippedFiles: 0 }

  // 一次性目录名快照（逐组重校验复用免逐组全目录 readdir；① 面 manifest 读与探测束仍逐组新鲜）
  let entries = null
  try { entries = await readdir(dir) } catch { entries = null }
  let deleted = 0
  let files = 0
  let skipped = 0
  let skippedFiles = 0
  for (const c of candidates) {
    const r = await deleteColdCwd(c.hash, { ...opts, entries }) // 内部重校验（TOCTOU）：期间变活 / 出窗 ⇒ 拒绝（零删除）
    if (r.ok) {
      deleted += 1
      files += r.deleted.length
      skippedFiles += r.skipped?.length ?? 0 // 逐文件 rename 失败（占用 / 竞态）—— 原文件留在原地
    } else skipped += 1 // 拒绝行计入汇总（其余组继续）
  }
  return { ok: true, candidates: candidates.length, confirmed: true, deleted, files, skipped, skippedFiles }
}

/** 回收汇总句（端词面单源 —— 菜单对话框与回执消费面共用；零宿主依赖）。 */
export function gcSummaryText(summary) {
  if (!summary?.candidates) return "ThinCoder: no cold session data found — nothing to clean."
  if (!summary.confirmed) return `ThinCoder: ${summary.candidates} cold project(s) — cancelled, nothing deleted.`
  const notes = []
  if (summary.skipped) notes.push(`${summary.skipped} no longer cold`)
  if (summary.skippedFiles) notes.push(`${summary.skippedFiles} file(s) locked/racing`)
  return `ThinCoder: recycled ${summary.deleted} project(s), ${summary.files} file(s)` +
    (notes.length ? `; skipped ${notes.join(" · ")}.` : ".")
}

/** 索引失败回执（形恒全键 —— 消费面零解引用坑；`error` = 原因句）。 */
const indexFailure = (error) => ({ ok: false, sessions: 0, changed: 0, messages: 0, toolCalls: 0, bytes: 0, error })

/** ② 派生会话索引重建：清四表（FTS 同删义务面在核）→ 全量重扫 → 摘要。
 *  返回 `{ ok:true, sessions, changed, messages, toolCalls, bytes }` ∥ `{ ok:false, …, error }`；本函数不抛
 *  （不可得 ∕ 重建失败皆落 `{ok:false}` 回执 —— 菜单与 `session:index` 通道两径可见）。 */
export async function runSessionIndexMaintenance({ dir = sessionsDir(), dbPath = null, now = Date.now() } = {}) {
  let db = null
  try {
    const index = await import("@thincoder/core/session-index.mjs") // 惰性：`node:sqlite` 不进静态闭包
    const pass = await import("@thincoder/core/session-index-pass.mjs")
    db = index.openSessionIndex(dbPath ? { path: dbPath } : {})
    if (!db) return indexFailure("index unavailable — the derived index could not be opened (disk / permissions)")
    index.clearIndex(db)
    const rebuilt = pass.rebuildAllSessions(db, { dir, now })
    const summary = index.indexSummary(db, dbPath ? { path: dbPath } : {})
    return { ok: true, sessions: rebuilt.sessions, changed: rebuilt.changed, messages: summary.messages, toolCalls: summary.toolCalls, bytes: summary.bytes }
  } catch (error) {
    return indexFailure(error?.message ?? String(error))
  } finally { db?.close() }
}

/** 索引汇总句（端词面单源 —— 同 `gcSummaryText`）。 */
export function indexSummaryText(summary) {
  if (summary?.ok !== true) return `ThinCoder: session index rebuild failed — ${summary?.error ?? "unknown error"}.`
  return `ThinCoder: session index rebuilt — ${summary.sessions} session(s), ${summary.messages} messages, ${summary.toolCalls} tool calls.`
}

/** ③ 启动拍供面（两枚）：GC 拍 + 索引拍各一次（核侧启动窗外 3s 延迟拍；**每进程一次** —— 核内
 *  `scheduledPrefixes` ∕ `passScheduled` 去重，重复点火零副作用；异步非阻塞 · 失败静默 —— 索引 = 派生品、
 *  主存零险）。`cwd` = 残留面前缀来源（项目未开 ⇒ 传 `null`：GC 拍零动作，索引拍恒点火 —— 全根扫描无需 cwd）。
 *  返回 = 索引拍调度结果（`false` = 已调度过 ∕ 不可得 ∕ 根不可得）。**不抛**（stderr 一行 —— 启动链
 *  不得因维护拍成红）。 */
export async function scheduleSessionMaintenancePasses({ cwd = null, dir = null } = {}) {
  try {
    if (typeof cwd === "string" && cwd !== "") scheduleSessionGC(cwd) // 核 `sessionPath(cwd)` 须 cwd ⇒ 缺省零动作
    return await scheduleSessionIndexPass({ dir: dir ?? sessionsDir() })
  } catch (error) {
    console.error("[session-maintenance] startup passes unavailable:", error)
    return false
  }
}
