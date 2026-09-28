/**
 * queue.mjs — 排队镜面（「对齐第二批」项 2 · **「回合中插入」批收正**：队列权威 = **宿主单源** ⇒ 本档 = 宿主快照的
 * **镜面应用纯动作**；原 `enqueue` / `dequeue` / `drainQueue` 三纯动作随本地队列退场 —— 档名不变，语义面收窄）。
 * `pending` 切片（**按会话键分键** `{ [会话键]: [{ text, ts }] }`）—— **写者两处同源**：
 *   `renderer/events.mjs` `ev:queue` 归约（快照整置：状态形 ∕ 消费回执形 —— 单源 = `docs/desktop/design/IPC.md` §1 该行）
 *   ∥ `renderer/page-read.mjs` `applyPage`（`history:page` 回执 `queue` 键 —— 首屏重建）。
 * 读面 = 输入区提示带「待发送」组（`renderer/views/chat-pending.mjs` —— 消费面 = `renderer/mount-composer.mjs` `paintNotices`；
 *  收正轮 B12 终态：流容器内零节点）/ 状态行段 14（`renderer/views/statusline.mjs`）。
 * 条目形 `{ text, ts }`（`text` 逐字原样 —— 零显示串副本；`ts` 非有限数 ⇒ `null`）；图不入快照（KD-40 ⑤）。
 * 形态单源 = `docs/desktop/design/UI.md` §1「本批注（回合中插入 · 步边界 pickup）」项 1 镜面句。
 * 纪律：纯数据面（零 DOM / 零 IPC / 零 `node:` / 零裸包）；形不合 / 无变化 ⇒ **原引用**（零通知）。
 */
// R1（流程对齐批 · 父侧裁 ①③）：满队常量改**核件单源**（原端侧自持字面 8 = 第三份副本；宿主判据已随 R3 住
// `@thincoder/core/queued.mjs`）——本档只作 re-export（导出名 / 值域零改，消费面零动）。
import { QUEUED_MAX_ITEMS } from "/rc/flow/queued-mark.mjs"

/** 满队常量（**显示面判据**：本键队长 ≥ 此值 ⇒ 满队提示行在场；拒绝径归**宿主回执** `queue-full`；
 *  容量判据单源 = 核件 → `@thincoder/core/queued.mjs` `QUEUED_MAX_ITEMS`，显示面单源 = `/rc/flow/queued-mark.mjs`）。 */
export const QUEUE_MAX = QUEUED_MAX_ITEMS

/** 快照条目归一（恰形 `{ text, ts }`：文本非串 ⇒ `""`（不抛 —— 宿主逐字投影面）；非有限数 `ts` ⇒ `null`）。 */
function entryOf(entry) {
  return {
    text: typeof entry?.text === "string" ? entry.text : "",
    ts: typeof entry?.ts === "number" && Number.isFinite(entry.ts) ? entry.ts : null,
  }
}

/** 列表等价判据（幂等面：长度 + 逐项 `text` 逐字 / `ts` 同值 ⇒ 零写）。 */
function sameList(a, b) {
  if (a === b) return true
  if (!Array.isArray(a) || a.length !== b.length) return false
  return a.every((entry, index) => entry?.text === b[index].text && entry?.ts === b[index].ts)
}

/** 本键镜面整置（纯动作 · 幂等 —— 快照整置语义）：非串键 / 非数组 ⇒ **原引用**（形不合零写 —— 禁假造）；
 *  同值 ⇒ 原引用（零通知）。空快照（`[]`）⇒ 本键落空表（气泡组由帧尾判据退场）。 */
export function applyQueue(state, key, items) {
  if (typeof key !== "string" || key === "") return state
  if (!Array.isArray(items)) return state
  const list = items.map(entryOf)
  const table = state?.pending ?? {}
  if (sameList(table[key], list)) return state
  return { ...state, pending: { ...table, [key]: list } }
}
