/**
 * queued-mark.mjs — busy 排队「待发送」标记面（核化 `webview/queued-mark.js` 的标记口径与
 * 防悬空逻辑——判定表 §3 行 30「拆」；契约单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6
 * 细则⑦ / `WEBVIEW-PROTOCOL.md` §3.2 行 17）。
 *
 * 拆面：标记口径（`pending` 类 / 标签行两形态）+ 快照应用**纯逻辑**（合并 / 逐条标记 / 防悬空
 * ——`planBusyQueued`）+ 两个 DOM 标记原语（`markPending` / `clearPending`——类名与标签字面
 * 单源）。留端：气泡 DOM 查询与快照来源（`S._busyQueuedCount` / `_busyQueuedPending` 镜像、
 * 消息到达）。
 *
 * 快照面注：`planBusyQueued` 按**前态快照**推演，两张不可见集与源档 DOM 实读对齐——
 * ① **已删集**：合并批移除的气泡 `remove` 对 items 扫描不可见（源档先移除后逐条认领，
 *    `lastBubbleWithRaw` 只扫在连 DOM ⇒ 残项须重建泡）。**生产可达**：宿主按批取（多批 =
 *    多回合）⇒ 推 `{items: 残项, merged: 本批}`（`panel-turn-stages.mjs` / `suspension.mjs`
 *    消费点；形 = `test/queued-mark.test.mjs`「合并批 + 残项」）。
 * ② 本批**新建泡**入本批 items 匹配（源档 `addUser` 新泡对 items 循环可见 —— **消**：
 *    2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` · #673）：同文重项
 *    （Reload 冷启 / 清屏后重推 `items: ["x","x"]`）⇒ 第二条认领首条**本批新建泡**、不重复建泡
 *    （回源档 1 泡口径）；`merged ∈ items` 形不可达不变（多条批 `merged` = 编号格式，单条批走
 *    清标保留路径）。
 */
import { t } from "../i18n.mjs"
import { fmtTime } from "../lib.mjs"

/** 队容量（webview 面副本——值同 `src/extension/queued-merge.mjs` 与 CLI `queued-merge.mjs`；
 *  浏览器面不 import 扩展模块 ⇒ 双写登记（对拍锁 = `test/queue-visible-vsc.test.mjs` T-V16-14）。 */
export const QUEUED_MAX_ITEMS = 8

/** 标签行常态重建（`❯ <user>:` + ts——"无 ts 不显示"纪律：无 `data-ts` ⇒ 零 ts 段）。 */
export function paintLabel(el) {
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

/** 已标记气泡原文的末条命中（源档 `lastBubbleWithRaw` 判据——DOM 序倒扫、`claimed` 占位排除、
 *  `removed` 已删集排除〔源档只扫在连 DOM——已删气泡对认领不可见〕）。 */
function lastIndexOfRaw(bubbles, raw, claimed, removed) {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    if (!claimed.has(i) && !removed.has(i) && bubbles[i].raw === raw) return i
  }
  return null
}

/**
 * 快照 → 动作计划（纯函数——`applyBusyQueued` 的逻辑面，逐条承源档语义）：
 *   ① 镜像：`count`（载荷 `count` 优先，缺省按 `pending === true` 折算 1）与 `pending`；
 *   ② 合并（`merged` 在场）：单条批（文本 = 某已标记气泡原文）⇒ 清标保留；
 *      多条批且有已标记气泡 ⇒ 移除全部已标记气泡 + 追加一条合并气泡（`mark: false`）；
 *   ③ 逐条标记：`items` 每条——已标记同文 ⇒ 保持；另有同文未标记气泡 ⇒ 就地标记（末条优先）；
 *      本批已建同文泡 ⇒ 保持（不重复建泡 —— #673）；再没有 ⇒ 追加并标记（`mark: true`）；
 *   ④ 防悬空：已标记但本批未认领 ⇒ 移除。
 *
 * 入参 `bubbles` = 会话流内**在连**用户气泡（DOM 序）`[{ raw, marked }]`——DOM 与快照来源留端。
 * 返回动作表（索引针对 `bubbles`）：`{ count, pending, clear[], remove[], mark[], append[{raw, mark}] }`。
 */
export function planBusyQueued(bubbles = [], snap = {}) {
  const count = typeof snap.count === "number" ? snap.count : (snap.pending === true ? 1 : 0)
  const merged = typeof snap.merged === "string" ? snap.merged : null
  const clear = []
  const remove = []
  const mark = []
  const append = []
  let marked = bubbles.map((b, i) => i).filter((i) => bubbles[i].marked === true)
  if (merged !== null) {
    const single = marked.find((i) => bubbles[i].raw === merged)
    if (single !== undefined) { clear.push(single); marked = marked.filter((i) => i !== single) }
    else if (marked.length > 0) {
      remove.push(...marked)
      marked = []
      append.push({ raw: merged, mark: false })
    }
  }
  const items = (Array.isArray(snap.items) ? snap.items : []).map((s) => String(s))
  const claimed = new Set()
  const dropped = new Set(remove) // 合并批已删气泡：源档此刻已出 DOM ⇒ items 认领不可见（残项重建泡）
  const born = [] // 本批**新建泡**原文（`append` 产出 —— 源档新泡对 items 循环可见）
  for (const item of items) {
    const i = marked.find((i) => !claimed.has(i) && bubbles[i].raw === item)
    if (i !== undefined) { claimed.add(i); continue } // 已存在 ⇒ 保持
    const hit = lastIndexOfRaw(bubbles, item, claimed, dropped)
    if (hit !== null) { mark.push(hit); claimed.add(hit); continue }
    if (born.includes(item)) continue // 「本批新建泡」匹配：同文重项 ⇒ 首泡已建，不重复建泡
    born.push(item)
    append.push({ raw: item, mark: true })
  }
  for (const i of marked) if (!claimed.has(i)) remove.push(i) // 防悬空（已被消费且无回声面）
  return { count, pending: count > 0, clear, remove, mark, append }
}
