/**
 * session-index-cmd.mjs — 会话索引命令面（SESSION.md §6.19 D-SE46）。
 *
 * `thincoder session index [--status | --rebuild]`（双端对位：VSC 命令 `thincoder.sessionIndexRebuild`
 * 走同一核数据面）——**核内零消费方结构机检**：console 形态属壳侧，本档只取 `out` / `err` 注入缝。
 *   --status    会话 / 消息 / 工具调用行数 + 库字节 + 水位覆盖（已索引 / 盘上会话档）+ 上次变更时刻
 *   --rebuild   清四表 → 全量重扫（存量首建 / 运维兜底；索引可丢弃 ⇒ 重建即迁移）
 *   无参        同 --status
 * 返回进程退出码（0 / 1）。
 */
import { clearIndex, indexSummary, openSessionIndex } from "./session-index.mjs"
import { listSessionFiles, sessionsRoot } from "./session-index-build.mjs"
import { rebuildAllSessions } from "./session-index-pass.mjs"

/** 用法行（错用一律拒——零静默忽略旗标）。 */
export const SESSION_INDEX_USAGE = "Usage: thincoder session index [--status | --rebuild]"

const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`
const iso = (ms) => (ms > 0 ? new Date(ms).toISOString() : "(never)")

/** 状态摘要行（读数单源 = `indexSummary` + 盘上会话档计数）。 */
export function sessionIndexStatusLine(summary, onDisk) {
  return `Session index: ${summary.sessions} sessions (sidecar ${summary.sidecar} / json ${summary.json})` +
    ` · ${summary.messages} messages · ${summary.toolCalls} tool calls` +
    ` · ${mb(summary.bytes)} on disk` +
    ` · covered ${summary.sessions}/${onDisk} session file(s) on disk` +
    ` · last change ${iso(summary.passAt)}`
}

/**
 * 命令面执行体。`args` = 原始 argv 片段（`args[0]` 须为 `"index"`——壳侧分发同源）；
 * `dir` = sessions 根（缺省核侧派生）；`dbPath` = 索引库路径（缺省 `~/.thincoder/session-index.db`）；
 * `out` / `err` = 输出缝（缺省 console）；`now` = 时钟缝。
 */
export async function runSessionIndex(args, { dir = sessionsRoot(), dbPath = null, out = console.log, err = console.error, now = Date.now() } = {}) {
  const argv = Array.isArray(args) ? args : []
  const flags = argv.slice(1)
  const bad = flags.filter((f) => f !== "--status" && f !== "--rebuild")
  if (argv[0] !== "index" || bad.length > 0 || (flags.includes("--status") && flags.includes("--rebuild"))) {
    err(SESSION_INDEX_USAGE)
    return 1
  }
  const db = openSessionIndex(dbPath ? { path: dbPath } : {})
  if (!db) {
    err("Session index unavailable — the derived index could not be opened (disk / permissions); queries fall back to the session files.")
    return 1
  }
  try {
    if (flags.includes("--rebuild")) {
      clearIndex(db) // 清四表（FTS 同删义务面之一）
      const r = rebuildAllSessions(db, { dir, now })
      out(`Session index rebuilt: ${r.changed}/${r.sessions} session file(s) indexed`)
    }
    const onDisk = listSessionFiles({ dir }).length
    out(sessionIndexStatusLine(indexSummary(db, dbPath ? { path: dbPath } : {}), onDisk))
    return 0
  } catch (e) {
    err(`Session index error: ${e.message}`)
    return 1
  } finally { db.close() }
}
