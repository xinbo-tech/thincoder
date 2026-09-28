/**
 * queue.mjs — 排队消息面（「对齐第二批 · 六件」项 2 · **拆分产出**：队列三纯动作 + 满队常量自
 * `renderer/store.mjs` 拆出 —— 在册预案本批执行，结构拆分零语义）。
 * `pending` 切片（**按会话键分键** `{ [会话键]: [{ text, ts }] }`）的**唯一写面** = 三纯动作 + 常量单源；
 * 条目形 = `{ text, ts }`（`text` 逐字原样 —— 零显示串副本；`ts` = 入队现刻 ms，非有限数 ⇒ `null`）。
 * 分键两理由（设计 §2.4①）：① 未受理气泡挂某会话流 ⇒ 队列须带键（切会话不漂页）；② **flush 目标 =
 * 回合尾事件键**（原取「现刻活动会话」有「切会话错发」缺陷面 —— 该面随分键修）。
 * 读取面：`renderer/mount-composer.mjs`（满队闸 / 回合尾 flush 队首）· 视图面（流内待发送气泡组 /
 * 状态行段 14）按 `state.pending?.[键] ?? []` 直读。
 * 纪律：纯数据面（零 DOM / 零 IPC / 零 `node:` / 零裸包）；拒收 / 无变化 ⇒ **原引用**（零通知 ——
 * 同 `renderer/store.mjs` 其余纯动作）。形态单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 2。
 */

/** 满队常量（**单源** —— 本键队长上限；满队提示行与拒绝径共用同一个数）：设计面只点名「常量单源」
 *  而**未定值** —— 值 8 = 实施选择（满队判据 / 提示行 / 不入队三事皆与该值无关）。 */
export const QUEUE_MAX = 8

/** ① 入队（尾追一条）：**满队按键判**（本键队长 ≥ `QUEUE_MAX`）∥ 空白 / 非串文本 ∥ 非串空键 ⇒
 *  **原引用**（不收 —— 调用面据此判 `full` + 文本保留）。 */
export function enqueue(state, key, text, ts) {
  if (typeof key !== "string" || key === "") return state
  if (typeof text !== "string" || text.trim() === "") return state
  const table = state?.pending ?? {}
  const list = Array.isArray(table[key]) ? table[key] : []
  if (list.length >= QUEUE_MAX) return state
  const entry = { text, ts: typeof ts === "number" && Number.isFinite(ts) ? ts : null }
  return { ...state, pending: { ...table, [key]: [...list, entry] } }
}

/** ② 摘队首（只减不取值 —— 值面读 `pending[键][0]`：回合尾 flush **先发后出队**）；空队 / 无该键 ⇒
 *  **原引用**。 */
export function dequeue(state, key) {
  const table = state?.pending ?? {}
  const list = Array.isArray(table[key]) ? table[key] : []
  if (list.length === 0) return state
  return { ...state, pending: { ...table, [key]: list.slice(1) } }
}

/** ③ 排空本键队列（关页 / 复位路径；槽留空表）：空队 / 无该键 ⇒ **原引用**。 */
export function drainQueue(state, key) {
  const table = state?.pending ?? {}
  const list = Array.isArray(table[key]) ? table[key] : []
  if (list.length === 0) return state
  return { ...state, pending: { ...table, [key]: [] } }
}
