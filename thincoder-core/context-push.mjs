/**
 * context-push.mjs — 消息双线写入单点（写缝面 · 自 `context.mjs` 迁出 · 2026-10-01 core 拆分批 #755 ∥ #786）。
 * `pushReal` = 真实消息写缝（机器线 `agent.history` + 人读线 `agent._fullHistory` 同源双写）；
 * `pushRecord` = 人读线留档记录单点（机器线零触）。迁出块逐字；原档 `context.mjs` 经
 * `export { … } from` 转口保名（消费面 / 批内件 import 面零改）。
 */

/**
 * pushReal — the single entry point for REAL conversation messages.
 * A real message (user input, assistant reply, tool result, multimodal image) is appended to BOTH:
 *   agent.history      — the machine context (compaction shrinks this)
 *   agent._fullHistory — the human-readable record (persistence source)
 * Machine-only messages ([System reminder:...], compaction notes, task/plan/checkpoint re-injections)
 * are pushed directly to agent.history WITHOUT going through here, so they never enter _fullHistory.
 * The two lines are written independently at the source — no after-the-fact delta sync.
 * Message timestamps (SESSION.md §6.9): stamped HERE once at push time (epoch ms) — a single
 * point covers every real message. Pre-existing ts (e.g. from another end writing the shared slot)
 * is preserved; restored old messages keep no ts rather than getting a misleading backdate (D-S3).
 * ts is a LOCAL-ONLY field — the send layer strips it before any provider request (T-S3).
 *
 * TUI-OOM-ROOTCAUSE 批（SESSION.md §6.14）——人读线内存有界 + 磁盘为准：
 *   ① `agent._recordStore?.append(msg)`：记录同步追加（磁盘为准——append-only sidecar）；
 *   ② 窗口驱逐：绑定态（agent._historyWindow = 200）下 _fullHistory 只保最近窗口条——
 *      更早内容仅存磁盘（翻页/检索/保存从盘按需读）。未绑定（模式 F）不驱逐（零回归）。
 * 追加失败不阻断回合（独立 try/catch——尽力面 N-S6；store 内部另置 degraded 并停写）。
 */
export function pushReal(agent, msg) {
  if (!Array.isArray(agent._fullHistory)) agent._fullHistory = []
  if (msg && msg.ts === undefined) msg.ts = Date.now()
  agent._fullHistory.push(msg)
  try { agent._recordStore?.append(msg) } catch { /* 尽力面：落盘失败不阻断回合（N-S6） */ }
  const win = agent._historyWindow
  if (win > 0 && agent._fullHistory.length > win) {
    agent._fullHistory.splice(0, agent._fullHistory.length - win)
  }
  agent.history.push(msg)
}

/**
 * pushRecord — 人读线留档记录单点（消化生命周期面 · #726；形 ∥ 写缝 ∥ 判据单源 = SESSION.md §6.26）。
 * `pushReal` 双胞（直复用——零算法副本）：`ts` 打点 ∥ 记录存储追加（`_recordStore?.append`——§6.14）∥
 * 尾窗驱逐三面同源；**机器线零触** = `history` 以一次性弃数组承接 ⇒ 记录不入 `agent.history` /
 * `contextHistory`（不喂模型）。未绑定（`_recordStore` 缺）⇒ 人读线追加照常 ∥ 存储腿空转（零抛——模式 F
 * 零回归）；载体缺位（无活跃会话）⇒ 零动作（零抛——日志归端侧）。
 */
export function pushRecord(agent, record) {
  if (!agent || typeof agent !== "object") return // 载体缺位：零动作（零抛——§6.26 失败面）
  if (!Array.isArray(agent._fullHistory)) agent._fullHistory = []
  // 载体形人读线半提取（先例 = 桌面 `session-io.appendRecord`）：`history` 弃数组承接 ⇒ 机器线零触
  pushReal({ _fullHistory: agent._fullHistory, _recordStore: agent._recordStore, _historyWindow: agent._historyWindow, history: [] }, record)
}
