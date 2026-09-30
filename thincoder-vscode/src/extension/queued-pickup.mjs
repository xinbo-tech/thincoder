/**
 * queued-pickup.mjs — 步边界 pickup（VSC 半——端壳自有 depth-0 循环同址回调）。
 *
 * 机制单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则② ⓪（端壳循环头 `consumeQueuedInput`——
 * 同址 = `thincoder-vscode/src/agent.mjs` `opts.turnInput?.()` 消费段之后）+ `docs/core/design/
 * AGENT-LOOP-ASYNC-POOL.md` §6.8「步边界 pickup」。语义 = 不中断（在飞工具 / signal 零触碰）·
 * 下一步生效 · 普通 user 消息落历史（`pushReal`）+ 快照推送（webview 消费成形）。
 * 取批语义 = **统一语义：计划首动作即消费**（`turn` ⇒ 合并批一次消费；`slash` ⇒ 单条原文——保序 ·
 * 不合并；分类 ∕ 取项 = 核 `planQueuedInput` 单源）。取项面（载具取批）已收编归核件
 * `@thincoder/core/queued.mjs` `takeQueuedBatchItem`（本档零本地副本）。
 */
import { pushReal } from "../agent/run-helpers.mjs"
import { pushBusyQueued } from "./panel-messages.mjs"
import { planQueuedInput } from "./queued-merge.mjs"

/** 载体两态（C-B2-6：无会话 `panel._busyQueued` ∥ 会话在飞 `susp.pendingInput`）。 */
function carrier(panel) {
  return panel._susp?.pendingInput ?? panel._busyQueued ?? null
}

/** 贴图判定（批量退化与步边界让位共用——图片随条目元数据走 F-1 降级面，不静默丢）。 */
const hasImages = (q) => Array.isArray(q?.images) && q.images.length > 0

/**
 * 步边界取批（端壳循环头回调——空队列 no-op；系统轮不传回调）。
 * 取数 = 计划首动作（`planQueuedInput`——统一语义：首动作即消费；`turn` 2 条短消息 ⇒ 合并批一次消费；
 * `slash` ⇒ 单条原文，保序 · 不合并 · 零滞留）。
 * **贴图批让位**：本回调是同步面（F-1 视觉降级 = 异步读图，不可达）⇒ 批内任一条目携
 * `images` 即不消费，留给既有送达路径（driver 步骤 1 / 装载② / 退出残余——同过降级判定），
 * 不静默丢图片。
 * @param {object} panel 面板（`_busyQueued` / `_susp.pendingInput` 两载体）
 * @param {{history: Array, fullHistory: Array}} lines 历史双线（runTurnLoop 实参）
 */
export function pickupQueuedAtStepBoundary(panel, { history, fullHistory }) {
  const queue = carrier(panel)
  if (!Array.isArray(queue) || queue.length === 0) return
  const action = planQueuedInput(queue.map((q) => String(q?.text ?? "")))[0]
  if (queue.slice(0, action.count).some(hasImages)) return
  queue.splice(0, action.count)
  pushReal(history, fullHistory, { role: "user", content: action.text }) // 下一步生效（非中断通道）
  pushBusyQueued(panel, action.text) // 快照：pending:false + 剩余实况 + merged（webview 消费成形）
}
