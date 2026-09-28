/**
 * composer-send.mjs — 输入区**发送面**（「回合中插入」批 · **拆分产出**：自 `renderer/mount-composer.mjs` 拆出 ——
 * 该档触 300 行顾问线，在册预案「发送面拆出」本批落形；结构拆分零语义，只收「出站往返 + 提交判据 + 用户块写入」三件）：
 *   ① `ask(host, channel, payload)` —— 窄桥出站归一（桥缺 / 抛 / 畸形回执 ⇒ `{ ok:false, reason }` —— 失败必响亮，零假成功）；
 *   ② `withUserBlock(state, key, text, ts)` —— 用户块入流（#458 · KD-23 单源：键门 = 回执键 = **现刻**活动会话；
 *      块形与 `blockOfMessage` 回放块**同形** · 文本逐字 · 并笔回底 —— 「对齐第三批」项 13 直发 ∕ 回执两径同判）；
 *   ③ `submitDraft(deps, text, images)` —— 提交判据（回值 = 出口语汇）：空白串 ⇒ `empty`（零动作 · 零 IPC）∥
 *      无活动会话 ⇒ `no-session`（防御档 —— 锚已 `disabled`）∥ **忙态一律交宿主任判**（KD-40 ②：渲染面零本地判忙）：
 *      闲态直发 `msg:send`（零附件 ⇒ 不落 `images` 键）⇒ 回执 `ok` 真 ⇒ `sent` ∧ 用户块入流；回执
 *      `{ ok:true, queued:true }` ⇒ `queued`（**入队即出泡**：气泡由 `ev:queue` 镜面出 —— 本档零块写、零乐观写）
 *      ∥ `queue-full` ⇒ `full`（文本保留；提示行归挂载档派生读数）∥ 其余 `ok` 假 ⇒ `kept`（文本保留 —— 零静默丢字）。
 *  回执钩 `onReceipt(receipt, key)` 由调用面（输入区挂载档）注入 —— 降级码切片 / 失败提示两态记录。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据）；本档零文案（面向用户串归构树面与词表）。
 */
import { appendBlock, returnToBottom, store as defaultStore } from "./store.mjs"

/** 通道出口（归一化：桥缺 / 抛 / 畸形回执 ⇒ `{ ok:false, reason }` —— 失败必响亮，零假成功）。 */
export async function ask(host, channel, payload) {
  const invoke = host !== null && typeof host === "object" ? host.invoke : undefined
  if (typeof invoke !== "function") {
    console.error(`[composer] preload bridge missing: ${channel}`)
    return { ok: false, reason: "no-bridge" }
  }
  try {
    const receipt = await invoke(channel, payload)
    if (receipt === null || typeof receipt !== "object") {
      console.error(`[composer] ${channel}: malformed receipt`)
      return { ok: false, reason: "invalid-shape" }
    }
    if (receipt.ok !== true) console.error(`[composer] ${channel} failed: ${receipt.reason ?? "unknown"}`)
    return receipt
  } catch (error) {
    console.error(`[composer] ${channel} rejected:`, error)
    return { ok: false, reason: String(error?.message ?? error) }
  }
}

/** 用户块写入（#458 · KD-23 单源 · 「对齐第二批」项 4 载波面）：回执 `ok` 真 ∧ 本键 = **现刻**活动会话 ⇒ 尾追
 *  `{ kind: "user", text, ts? }`（与 `blockOfMessage` 回放块**同形**；`ts` = 提交 / 入队现刻 —— 非有限数 ⇒
 *  键缺席）；非活动键 ⇒ **零写**（`blocks` 引用不变）；写入走**既有**纯动作 `appendBlock`（`renderer/store.mjs`）
 *  ——**并笔回底**（「对齐第三批」项 13：`returnToBottom` 同一次 `set` ⇒ `following: true` / `pendingNew: 0`）。
 *  回值 = 下一态。**注**：队列消费径的用户块**不走本函数**（由 `ev:queue` 归约面入流 —— `renderer/events.mjs`）。 */
export function withUserBlock(state, key, text, ts) {
  if (state?.activeSession !== key) return state
  const block = { kind: "user", text }
  if (typeof ts === "number" && Number.isFinite(ts)) block.ts = ts
  return returnToBottom(appendBlock(state, block))
}

/** 提交判据（纯逻辑薄壳 · 注入面 = `{ store, host, onReceipt }` —— 平 node 可测；回值 = 出口语汇）：空白串 ⇒ `empty`
 *  （零动作 · 零 IPC）· 无活动会话 ⇒ `no-session`（零动作 —— 锚已 `disabled`，防御档）；
 *  提交一律走 `msg:send`（忙态受理判据 = 宿主在飞表 —— KD-40 ②；零附件 ⇒ **不落 `images` 键**（批 A 形不变））；
 *  回执 `ok` 真 ∧ `queued` 缺省 ⇒ `sent` ∧ **用户块入流**（`withUserBlock`）∥ `ok` 真 ∧ `queued` 真 ⇒ `queued`
 *  （零块写 —— 待发送气泡由镜面出）∥ `queue-full` ⇒ `full` ∥ 余 ⇒ `kept` —— 两失败径皆**文本保留**（零静默丢字；
 *  失败已由 `ask` 响亮）。`onReceipt` = 回执钩（降级码 / 失败面记录，随 `ask` 回递 —— 携本键）。 */
export async function submitDraft({ store = defaultStore, host, onReceipt } = {}, text, images) {
  const value = typeof text === "string" ? text : ""
  if (value.trim() === "") return "empty"
  const state = store.get()
  const key = state?.activeSession ?? null
  if (key === null) return "no-session"
  const payload = { key, text: value }
  if (Array.isArray(images) && images.length > 0) payload.images = images
  const receipt = await ask(host, "msg:send", payload)
  if (typeof onReceipt === "function") onReceipt(receipt, key)
  if (receipt.ok !== true) return receipt.reason === "queue-full" ? "full" : "kept"
  if (receipt.queued === true) return "queued" // 入队径：块与气泡归镜面（消费时刻才交接）
  store.set(withUserBlock(store.get(), key, value, Date.now())) // ts = 提交现刻（说话人标签时间面）
  return "sent"
}
