/**
 * session-index-command.mjs — 端侧命令：派生会话索引重建（VS Code 侧入口）。
 *
 * SESSION.md §6.19 D-SE46「VSC 对位」：命令 `thincoder.sessionIndexRebuild`——处理体跑**核数据面**
 * （清四表 → 全量重扫会话档 → 摘要），结果经宿主提示回报。纪律（`session-gc-command.mjs` 同族）：
 *   ① **核索引面一律动态 import**（`node:sqlite` 不得进入端壳静态闭包——`extension.mjs` 静态链
 *      零 node:sqlite 是既有结构机判，见 `thincoder-vscode/test/engine-floor-guard.test.mjs`）；
 *   ② 目录来源 = 端侧派生的 sessions 根（`session-slots.mjs` `sessionsDir()`——核 `configDir`
 *      与核沙箱缝自动随动），不依赖核函缺省 `dir`；索引库 = 单库 `~/.thincoder/session-index.db`
 *      （两端同库——索引是本机派生品，无端差）；
 *   ③ 宿主 API 经 `api` 注入（缺省由 `extension.mjs` 传真 `vscode`；本档零 `vscode` import，纯 Node 可测）。
 */
import { sessionsDir } from "./session-slots.mjs"

/** 命令处理体（返回结果汇总——用例直读；宿主提示为副作用面）。`dbPath` / `dir` / `now` = 注入缝。 */
export async function runSessionIndexCommand({ dir = sessionsDir(), dbPath = null, now = Date.now(), api } = {}) {
  const { clearIndex, indexSummary, openSessionIndex } = await import("@thincoder/core/session-index.mjs")
  const { rebuildAllSessions } = await import("@thincoder/core/session-index-pass.mjs")
  const db = openSessionIndex(dbPath ? { path: dbPath } : {})
  if (!db) {
    await api?.window?.showErrorMessage?.("ThinCoder: session index unavailable — the derived index could not be opened.")
    return { ok: false, sessions: 0, messages: 0 }
  }
  try {
    clearIndex(db)
    const r = rebuildAllSessions(db, { dir, now })
    const s = indexSummary(db, dbPath ? { path: dbPath } : {})
    await api?.window?.showInformationMessage?.(`ThinCoder: session index rebuilt — ${r.sessions} session(s), ${s.messages} messages, ${s.toolCalls} tool calls.`)
    return { ok: true, sessions: r.sessions, messages: s.messages, toolCalls: s.toolCalls, bytes: s.bytes }
  } catch (e) {
    await api?.window?.showErrorMessage?.(`ThinCoder: session index rebuild failed — ${e.message}`)
    return { ok: false, sessions: 0, messages: 0, error: e.message }
  } finally { db.close() }
}

/** 启动拍（触发点②）：核侧 `scheduleSessionIndexPass`（启动窗外 3s；单趟 ≤2s 且 ≤40 会话；
 *  失败静默 / 不 unref——索引 = 派生品，主存零险）。端壳只挂点，机制住核。 */
export async function scheduleSessionIndexPassSafe() {
  try {
    const { scheduleSessionIndexPass } = await import("@thincoder/core/session-index-pass.mjs")
    return scheduleSessionIndexPass()
  } catch { return false }
}
