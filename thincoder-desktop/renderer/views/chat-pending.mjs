/**
 * chat-pending.mjs — 排队期「待发送块」（**输入区上方带 · 派生** —— 输入逻辑收正轮 B12 新口径 · 参照 CLI
 * `thincoder-cli/src/tui/render-conversation.mjs:359-385` + `docs/cli/design/TUI.md` §7.5 形态）：
 *   **载体 = 派生**（判据 = 队镜面非空，渲染期现算 —— 零块序写入 ∕ 零生命周期簿记；消费 ∕ 中止随判据消失）；
 *   **落位 = 输入行上方带**（消费面 = `renderer/mount-composer.mjs` `paintNotices` —— 贴输入框上沿 ⇒
 *     与输入面板**恒定邻接**（任意内容高度 ∕ 任意滚动位置下间距恒定 —— 硬验收：短会话不得浮在会话区上方）；
 *     非 `[data-block-kind]` 块 ⇒ `data-blocks` 不变式零破）；
 *   **形态照 CLI**（标签行单条 ∕ 多条两形 + 逐条原文 dim + 多条 `i. ` 编号 + 逐条 ≤3 行 + 超限尾标记）；
 *   **零真块**（收正轮 ④）：一切入队受理径的本地泡不残留（滞后径退流住 `renderer/composer-wire.mjs`）；
 *   消费时刻 = 派生块消失 + 真块入流（单帧切换，零空窗零重复）。
 * 文案一律经 `t()`（零硬编码 —— 词键住 `renderer/i18n-views.mjs`）；零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
import { t } from "../i18n.mjs"

/** 逐条原文上限行数（CLI `QUEUED_ITEM_MAX_LINES` 同值 —— 超限 ⇒ 尾标记行）。 */
const ITEM_MAX_LINES = 3

/** 队镜面切片（判据面 —— 宿主权威快照，未过滤；本档只读不写）。 */
export function pendingOf(state) {
  const key = state?.activeSession ?? null
  const list = key === null ? null : state?.pending?.[key]
  return Array.isArray(list) ? list : []
}

/** 待发送块构树（派生 —— `null` = 判据空 ⇒ 零节点）：标签行（单条 ∕ 多条两形）+ 逐条原文（多条带 `i. ` 编号）。
 *  行锚 = `[data-pending-item]` + `[data-raw]`（原文逐字 —— 机检 ∕ 复制面同约）；尾标记行初置 `hidden`（量面归帧尾）。 */
export function pendingGroupNode(model) {
  const items = Array.isArray(model?.pending) ? model.pending : []
  if (items.length === 0) return null
  const multi = items.length >= 2
  const children = [{
    tag: "div",
    props: { class: "chat-pending-label" },
    children: [multi ? t("chat.pending.multi", { count: String(items.length) }) : t("chat.pending.single")],
  }]
  for (const [index, entry] of items.entries()) {
    const raw = typeof entry?.text === "string" ? entry.text : ""
    children.push({
      tag: "div",
      props: { class: "chat-pending-item", "data-pending-item": "", "data-raw": raw },
      children: [
        { tag: "div", props: { class: "chat-pending-body" }, children: [multi ? `${index + 1}. ${raw}` : raw] },
        { tag: "div", props: { class: "chat-pending-more", "data-pending-more": "", hidden: true }, children: [] },
      ],
    })
  }
  return { tag: "div", props: { class: "chat-pending", "data-pending": "" }, children }
}

/** 逐条超限尾标记（帧尾量面 —— CLI `:379-384` 对位）：正文折行高 ÷ 行高 > 上限 ⇒ 摘 `hidden` ∧ 填行数词；
 *  平 node ∕ 零版式面（`scrollHeight` / 行高缺）⇒ 早返零写。 */
export function paintPendingOverflow(root) {
  if (typeof root?.querySelectorAll !== "function") return
  for (const body of root.querySelectorAll(".chat-pending-body")) {
    const more = typeof body.parentElement?.querySelector === "function" ? body.parentElement.querySelector("[data-pending-more]") : null
    if (more === null || more === undefined) continue
    if (typeof body.scrollHeight !== "number" || typeof body.clientHeight !== "number") return
    const style = typeof globalThis.getComputedStyle === "function" ? globalThis.getComputedStyle(body) : null
    const lineHeight = Number.parseFloat(style?.lineHeight ?? "")
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return
    const rows = Math.max(1, Math.round(body.scrollHeight / lineHeight))
    const over = rows > ITEM_MAX_LINES
    more.hidden = !over
    if (over) more.textContent = t("chat.pending.more", { lines: String(rows) })
  }
}

/** 帧尾同步 —— 消费面（`renderer/mount-composer.mjs` `paintNotices`）每帧重挂整组；本档只供标签 ∕ 项构树
 *  与尾标记量面两件。 */
