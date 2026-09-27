/**
 * queued-mark.js — busy 排队「待发送」标记壳（queue-visible 批 2026-09-24）。
 *
 * 契约单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则⑦（逐条标记 / 消费即清 /
 * 多批合泡 / 防悬空 / 引用失效守卫）；快照字段 = `WEBVIEW-PROTOCOL.md` §3.2 行 17
 * （`busyQueued { pending, count, items, text, merged }`）。
 * R2 换接：标记口径（类 `pending` / 标签行两形态）+ 快照应用**纯逻辑**（合并 / 逐条 / 防悬空
 * ——`planBusyQueued`）+ 两个 DOM 标记原语单源 = 核包 `flow/queued-mark.mjs`；本档留端 =
 * 气泡 DOM 查询（`.message.user`——含引用失效守卫）与快照来源（`S` 镜像写入）。
 * 零新 CSS（类 `pending` 落 DOM = 机检把手；视觉仍由既有 `.message.user` 承担）。
 */
import { planBusyQueued, markPending, clearPending, QUEUED_MAX_ITEMS } from "../node_modules/@thincoder/render-core/flow/queued-mark.mjs"
import { addUser } from "./ui.js"

export { markPending, clearPending, QUEUED_MAX_ITEMS }

const rawOf = (el) => el?.dataset ? el.dataset.raw ?? null : null
const connected = (el) => el.isConnected !== false

/**
 * 快照应用（`case "busyQueued"`——host 权威推送 / 忙分支判决 / 握手重推，全幂等）：
 * ① 镜像：`S._busyQueuedCount`（提交守卫判据源）+ `S._busyQueuedPending`（= count > 0）；
 * ② 在连用户气泡（DOM 序）⇒ 核 `planBusyQueued` 纯逻辑 ⇒ 动作表逐条执行（清标 / 移除 /
 *    就地标记 / 追加气泡——`mark:true` 者追加即标记）；气泡不删留回声面。
 */
export function applyBusyQueued(ctx, S, m) {
  const bubbles = [...ctx.messagesEl.querySelectorAll(".message.user")]
    .filter(connected)
    .map((el) => ({ el, raw: rawOf(el), marked: el.classList.contains("pending") }))
  const plan = planBusyQueued(bubbles, m)
  S._busyQueuedCount = plan.count
  S._busyQueuedPending = plan.pending
  for (const i of plan.clear) clearPending(bubbles[i].el)
  for (const i of plan.remove) bubbles[i].el.remove()
  for (const i of plan.mark) markPending(bubbles[i].el)
  for (const a of plan.append) {
    const el = addUser(ctx, a.raw)
    if (a.mark) markPending(el)
  }
}
