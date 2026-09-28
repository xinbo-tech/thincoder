/**
 * events-status.mjs — 状态面切片归约出档（R4 · 桌面功能对位批 —— `renderer/events.mjs` 483 行距 500 硬限余 17，
 * 本批两切片（`ev:statusText` ∕ `ev:compress`）须先出档；沿 `renderer/events-flags.mjs` 先例）。
 *
 * 三面：
 *   ① `onStatusText(state, ev)` —— **状态文本切片**（按会话键）：载荷 `{ kind, seconds? | message? | phase? done? total? }`
 *      （宿主产 = 桥 `onWait` ⇒ 核 `provider/wait-status.mjs` `waitStatusOf` 映射；五 kind = rateWait ∕ rateLimited ∕
 *      overloaded ∕ quota ∕ index）；`index` 且 `phase === "done"` ⇒ **清本键**（VSC `handleStatusText` 同判 ——
 *      索引结束回常态面）；表外 kind / 形不合 ⇒ 零写（禁假造）。读面 = 状态行段 3 状态文本支
 *      （`renderer/views/statusline-segments.mjs` —— 五 kind 取值表）。
 *   ② `onCompress(state, ev)` —— **压缩状态行切片**（按会话键）：载荷 `{ status, … }` 四态
 *      （start ∕ done ∕ fallback ∕ failed —— 宿主产 = 桥 `onCompressStart` ∕ `onCompress` ∕ `onCompressFail`，
 *      形 = VSC `panel-callbacks.mjs:175-183` 同式）；表外 status ⇒ 零写。读面 = 流内压缩状态行
 *      （`renderer/views/compress-status.mjs`；生命期 = 首屏页读整置即失 —— `renderer/page-read.mjs`）。
 *   ③ `expireStatusText(state, channel, ev, isTail)` —— **活动恢复即清**（VSC `chat-messages.js:54-107` 同清单：
 *      token ∕ reasoning ∕ toolCall ∕ toolResult ∕ complete ∕ aborted ∕ error ⇒ 七时点；本端映射 = `ev:token` ∕
 *      `ev:reasoning` ∕ `ev:tool-call` ∕ `ev:tool-result` ＋ 回合尾两形与错误径（`isTail` —— 判据单源
 *      `renderer/events.mjs` `isTurnTail`，由主档传入，本档零第二判据））；命中 ⇒ 清本键（无键 ⇒ 原引用）。
 *      主档 `reduce` 前置一行调用；写者两处无交叠（六时点与 `ev:statusText` 互斥）⇒ 先清后写与先写后清等价。
 *
 * 依赖单向：本档 → `renderer/events-flags.mjs`（`sameRecord` 共用件 —— 单一实现零副本）；主档反向引本档三件
 * （`onStatusText` ∕ `onCompress` ∕ `expireStatusText`）——无环。
 * 纪律：零 DOM / 零 IPC（平 node 直测）；文案零硬编码（本档不出词 —— 渲染面取核字典投影）。
 */
import { sameRecord } from "./events-flags.mjs"

/** 活动恢复即清（本端通道面四时点；另三时点 = 回合尾两形 + 错误径 —— `isTail` 由主档传入，判据单源）。 */
const ACTIVITY_CLEAR = Object.freeze(["ev:token", "ev:reasoning", "ev:tool-call", "ev:tool-result"])

/** 数值归一（缺 / 非数 ⇒ `null` —— 渲染面 `?` 兜底；零抛）。 */
function numOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/** 逐 kind 归一（表外 ⇒ `null` —— 零写；非串 `message` ⇒ `""`，沿 VSC `st.message ?? ""` 同判）。 */
function statusRecord(ev) {
  const kind = ev?.kind
  if (kind === "quota") return { kind, message: typeof ev.message === "string" ? ev.message : "" }
  if (kind === "rateWait" || kind === "rateLimited" || kind === "overloaded") return { kind, seconds: numOrNull(ev.seconds) }
  if (kind === "index") return { kind, phase: ev.phase === "index" ? "index" : "scan", done: numOrNull(ev.done), total: numOrNull(ev.total) }
  return null
}

/** 压缩四态归一（表外 ⇒ `null` —— 零写；缺值 ⇒ `null` 键在场 —— 渲染面 `?` 兜底，VSC `?? null` 同式）。 */
function compressRecord(ev) {
  const status = ev?.status
  if (status === "start") return { status, messages: numOrNull(ev.messages) }
  if (status === "done") return { status, tokensFreed: numOrNull(ev.tokensFreed), elapsedMs: numOrNull(ev.elapsedMs) }
  if (status === "fallback") return { status, tailMessages: numOrNull(ev.tailMessages) }
  if (status === "failed") return { status, error: typeof ev.error === "string" ? ev.error : "" }
  return null
}

/** 切片写（按会话键 · 同键同值 ⇒ 原引用 · 首写自种 —— 两切片共件）。 */
function writeSlice(state, name, key, record) {
  const table = state[name] ?? {}
  if (sameRecord(table[key], record)) return state
  return { ...state, [name]: { ...table, [key]: record } }
}

/** 清本键 statusText（**活动恢复即清**单点；无键 ⇒ 原引用）。 */
export function clearStatusText(state, key) {
  const table = state.statusText ?? {}
  if (!Object.hasOwn(table, key)) return state
  const next = { ...table }
  delete next[key]
  return { ...state, statusText: next }
}

/** 活动恢复即清判据面（主档 `reduce` 前置一行调用）：命中 ⇒ 清本键；不命中 ⇒ 原引用。 */
export function expireStatusText(state, channel, ev, isTail) {
  if (isTail !== true && !ACTIVITY_CLEAR.includes(channel)) return state
  return clearStatusText(state, ev?.key)
}

/** `ev:statusText` —— 状态文本切片写（按会话键 · 同键就地替换）：`index` `done` 相 ⇒ 清本键；表内 kind ⇒ 写归一记录。 */
export function onStatusText(state, ev) {
  if (ev?.kind === "index" && ev.phase === "done") return clearStatusText(state, ev.key)
  const record = statusRecord(ev)
  return record === null ? state : writeSlice(state, "statusText", ev.key, record)
}

/** `ev:compress` —— 压缩状态行切片写（按会话键 · 同键就地替换 —— 四态就地推进：start ⇒ done ∕ fallback ∕ failed）。 */
export function onCompress(state, ev) {
  const record = compressRecord(ev)
  return record === null ? state : writeSlice(state, "compress", ev.key, record)
}
