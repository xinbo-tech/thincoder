/**
 * queued-mark.js — busy 排队「待发送」标记面（queue-visible 批 2026-09-24）。
 *
 * 契约单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则⑦（逐条标记 / 消费即清 /
 * 多批合泡 / 防悬空 / 引用失效守卫）；快照字段 = `docs/vsc/design/WEBVIEW-PROTOCOL.md`
 * §3.2 行 17（`busyQueued { pending, count, items, text, merged }`）。
 * 零新 CSS（类 `pending` 落 DOM = 机检把手；视觉仍由既有 `.message.user` 承担）。
 */
import { t } from "./i18n.js"
import { fmtTime } from "./lib.js"
import { addUser } from "./ui.js"

/** 队容量（webview 面副本——值同 `src/extension/queued-merge.mjs` 与 CLI `queued-merge.mjs`；
 *  浏览器面不 import 扩展模块 ⇒ 双写登记（对拍锁 = `test/queue-visible-vsc.test.mjs` T-V16-14）。 */
export const QUEUED_MAX_ITEMS = 8

const rawOf = (el) => (el?.dataset ? el.dataset.raw ?? null : null)
const connected = (el) => el.isConnected !== false

/** 标签行常态重建（`❯ <user>:` + ts——"无 ts 不显示"纪律：无 `data-ts` ⇒ 零 ts 段）。 */
function paintLabel(el) {
  const label = el.querySelector(".msg-label")
  if (!label) return
  const ts = el.dataset.ts ? fmtTime(new Date(Number(el.dataset.ts))) : ""
  label.innerHTML = `❯ ${t("msg.user")}:${ts ? ` <span class="msg-time">${ts}</span>` : ""}`
}

/** 标记（幂等）：类 `pending` + 标签行换 `⏳ <queued.pending>`（原文照常显示——时间缺席）。 */
export function markPending(el) {
  if (!el || el.classList.contains("pending")) return
  el.classList.add("pending")
  const label = el.querySelector(".msg-label")
  if (label) label.innerHTML = `⏳ ${t("queued.pending")}`
}

/** 清标（幂等）：类去除 + 标签行回常态（气泡不删——回声面）。 */
export function clearPending(el) {
  if (!el) return
  el.classList.remove("pending")
  paintLabel(el)
}

/** 已标记气泡（DOM 序；引用失效守卫 = `isConnected` 假即弃——快照幂等重推自愈）。 */
function markedBubbles(ctx) {
  return [...ctx.messagesEl.querySelectorAll(".message.user.pending")].filter(connected)
}

/** 末条同文气泡（本地提交路径的新泡恒在流尾；未标记 ⇒ 就地标记，免重复建泡）。 */
function lastBubbleWithRaw(ctx, raw, exclude) {
  const all = [...ctx.messagesEl.querySelectorAll(".message.user")].filter(connected)
  for (let i = all.length - 1; i >= 0; i--) if (!exclude.has(all[i]) && rawOf(all[i]) === raw) return all[i]
  return null
}

/**
 * 快照应用（`case "busyQueued"`——host 权威推送 / 忙分支判决 / 握手重推，全幂等）：
 * ① 镜像：`S._busyQueuedCount`（提交守卫判据源）+ `S._busyQueuedPending`（= count > 0，保留字段）；
 * ② 标记：`items` 每条——末条同文气泡就地标记；无同文气泡 ⇒ 流尾新建 + 标记（Reload 冷启 / retry 无回显入口）；
 * ③ 清标与合并：`merged` 在场——单条批（文本 = 某已标记气泡原文）⇒ 清标保留（气泡 = 回声面）；
 *    多条批且有已标记气泡 ⇒ 移除已标记气泡 + 追加一条合并气泡（文本 = `merged`）；
 * ④ 防悬空：已标记气泡原文 ∉ `items` 且非本批 `merged` ⇒ 移除（已被消费且无回声面）。
 */
export function applyBusyQueued(ctx, S, m) {
  const count = typeof m.count === "number" ? m.count : (m.pending === true ? 1 : 0)
  S._busyQueuedCount = count
  S._busyQueuedPending = count > 0
  let marked = markedBubbles(ctx)
  const merged = typeof m.merged === "string" ? m.merged : null
  if (merged !== null) {
    const single = marked.find((el) => rawOf(el) === merged)
    if (single) { clearPending(single); marked = marked.filter((el) => el !== single) }
    else if (marked.length > 0) {
      for (const el of marked) el.remove()
      marked = []
      addUser(ctx, merged) // 合并气泡（本批形态 = merged 原文；无已标记气泡 ⇒ 零动作——回声面已在位）
    }
  }
  const items = (Array.isArray(m.items) ? m.items : []).map((s) => String(s))
  const claimed = new Set()
  for (const item of items) {
    const i = marked.findIndex((el) => !claimed.has(el) && rawOf(el) === item)
    if (i >= 0) { claimed.add(marked[i]); continue } // 已存在 ⇒ 保持
    const hit = lastBubbleWithRaw(ctx, item, claimed)
    if (hit) { markPending(hit); claimed.add(hit); continue }
    markPending(addUser(ctx, item))
  }
  for (const el of marked) if (!claimed.has(el)) el.remove() // 防悬空（已被消费且无回声面）
}
