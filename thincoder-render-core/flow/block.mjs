/**
 * block.mjs — 会话流块构件面（核化 `webview/ui.js` 的块容器 / 恢复帧 / 错误横幅 / 顾问块内容
 * 四面——判定表 §3 行 51「拆」）。ctx / S 装配、滚动族（scrollDown / trimOldMessages /
 * initScrollFollow）、欢迎条与横幅留端。
 *
 * 端注入面（核不持句柄）：`deps = { emit(type, payload), t, now? }`——出站一律经 emit
 * （VSC 绑 postMessage / 桌面绑 invoke）；t 缺省 = 核 i18n `t`（端经 `setStrings` 注入口径）。
 * 类名 / 结构逐字承源档（KD-RC-7）。
 */
import { md, mdInline, esc as escHtml } from "../md.mjs"
import { fmtTime } from "../lib.mjs"
import { t as coreT } from "../i18n.mjs"
import { buildFinishedToolCard } from "./tool-card-restore.mjs"
import { renderToolHistory } from "./tool-card.mjs"

// ─── 顾问块（advisor / 子代理块共用的块容器与内容面）──

/** 顾问 / 子代理块容器（承 `ui.js:19-30` 逐字）：`details.advisor-block[open]` + summary + `.advisor-content`。 */
export function buildAdvisorBlock(roundLabel) {
  const details = document.createElement("details")
  details.className = "advisor-block"
  details.open = true
  const summary = document.createElement("summary")
  summary.textContent = roundLabel
  const content = document.createElement("div")
  content.className = "advisor-content"
  details.appendChild(summary)
  details.appendChild(content)
  return details
}

/** 续写并入末文本节点：末子为文本节点 ⇒ `appendData`（原地并写，文本节点 ∕ 行 O(1)）；末子非文本
 *  节点 ⇒ 维持新建文本节点（兜底——既不丢串、也不改写他节点）。两处续写支共用（RAW 拼接零分隔符）。 */
function appendIntoLastTextNode(parent, str) {
  const tail = parent.lastChild
  if (tail?.nodeType === 3) tail.appendData(str)
  else parent.appendChild(document.createTextNode(str))
}

/** 顾问块内容追加（承 `ui.js:45-85` 逐字——合并判据 / 冻结守卫 / §5.6 toolOutput RAW 拼接语义全同）。
 *  `block` = 块元素（含 `.advisor-content`）；返回零值（DOM 原地追加）。 */
export function appendAdvisorChunk(block, kind, text, sub, meta) {
  // §27.1 F3（缺陷①）: 冻结块不接受追加（advisor 块无 _subMeta——不受影响）
  if (block._subMeta?.frozen) return
  const content = block.querySelector(".advisor-content")
  if (!content) return
  const str = String(text ?? "")
  if (!str) return
  const subLabel = typeof sub === "string" && sub ? sub : null
  if (kind === "tool") {
    const face = typeof meta?.face === "string" ? meta.face : null, tool = typeof meta?.tool === "string" && meta.tool ? meta.tool : null
    const last = content.lastElementChild
    // §5.6 合并路径（CLI pushBlock 判据）：末子行 ∧ 面 = toolOutput ∧ tool 同 ∧ sub 同 ⇒ RAW 拼接
    // （零分隔符）；不满足（调用行 / 旧形无 face·tool / 不同 sub）⇒ 恒新行。
    if (face === "toolOutput" && tool && last?.classList.contains("advisor-tool-line")
      && last.dataset.face === "toolOutput" && last.dataset.tool === tool && (last.dataset.sub ?? "") === (subLabel ?? "")) {
      appendIntoLastTextNode(last, str); return
    }
    const line = document.createElement("div")
    line.className = "advisor-tool-line"
    if (face) line.dataset.face = face; if (tool) line.dataset.tool = tool
    if (subLabel) line.dataset.sub = subLabel
    line.textContent = str
    content.appendChild(line)
    return
  }
  const k = kind ?? "text"
  const last = content.lastElementChild
  const sameRow = last && last.classList.contains("advisor-text")
    && last.dataset.kind === k && (last.dataset.sub ?? "") === (subLabel ?? "")
  if (sameRow) {
    // 续写 = 并入末文本节点（chunk RAW 拼接零分隔符——文本节点 ∕ 行 O(1)；首行 `textContent = str` 同效）
    appendIntoLastTextNode(last, str)
  } else {
    const div = document.createElement("div")
    div.className = "advisor-text" + (k === "think" ? " advisor-think" : "")
    div.dataset.kind = k
    if (subLabel) div.dataset.sub = subLabel
    div.textContent = str
    content.appendChild(div)
  }
}

// ─── 消息块（user / assistant 帧 / 恢复面）──

/** 历史用户消息气泡（承 `ui.js:136-145`；`ctx` 入参未用——去参）。时间只显真实 ts
 *  （缺失不显示——无 `fmtTime(new Date())` 误导回退）；`dataset.raw` = 待发送标记面锚定源。 */
export function buildUserMessage(text, timestamp, idx) {
  const el = document.createElement("div")
  el.className = "message user"
  el.dataset.raw = String(text) // 待发送标记面锚定源（`queued-mark.js`——快照按原文匹配气泡）
  const ts = timestamp ? fmtTime(new Date(timestamp)) : ""
  if (timestamp) el.dataset.ts = String(timestamp) // 清标重建标签行用（无 ts 不显示纪律保持）
  if (idx !== undefined) el.dataset.idx = String(idx)
  el.innerHTML = `<div class="msg-label">❯ ${coreT("msg.user")}:${ts ? ` <span class="msg-time">${ts}</span>` : ""}</div><div class="bubble">${mdInline(text)}</div>` // mdInline escapes raw text — single escape point
  return el
}

/** 恢复助手帧容器（承 `ui.js:160-174`——live-DOM parity：label（turnStart 才画）→ thinking 块
 *  → content bubble → 嵌套工具卡 ×n；data-idx = 帧原始全局 idx——分页锚只外层消息）。
 *  #875（2026-10-04）：推理块恢复径默认折叠（`open` 属性删——与 live 径 `flow/reasoning.mjs` 同拍）。 */
export function buildAssistantRestore(msg) {
  const el = document.createElement("div")
  el.className = "message assistant"
  if (msg.idx !== undefined) el.dataset.idx = String(msg.idx)
  let html = ""
  if (msg.turnStart) html += `<div class="msg-label">❯ ${coreT("msg.assistant")}:</div>`
  if (msg.reasoning) html += `<details class="reasoning-block"><summary>${escHtml(coreT("status.thinking"))}...</summary><div class="reasoning-content">${md(msg.reasoning)}</div></details>`
  if (typeof msg.text === "string" && msg.text.trim() !== "") html += `<div class="bubble content">${md(msg.text)}</div>`
  el.innerHTML = html
  for (const tc of msg.tools || []) {
    const card = buildFinishedToolCard(tc)
    if (card) el.appendChild(card)
  }
  return el
}

/** 空助手块容器（承 `ui.js:176-189` newBlock 的 DOM 面——`withLabel` = 本回合首块（未画过 label）；
 *  `_nextIdx` 分配、`assistantLabeled` 翻转、append 与窗口裁剪留端）。 */
export function renderBlock({ idx, withLabel = false } = {}) {
  const block = document.createElement("div")
  block.className = "message assistant"
  if (idx !== undefined) block.dataset.idx = String(idx) // 窗口裁剪：live 块补全局 idx，供 loadOlder 锚回
  // One "❯ ThinCoder:" per turn (CLI ensureAssistantLabel parity)
  if (withLabel) block.innerHTML = `<div class="msg-label">❯ ${coreT("msg.assistant")}:</div>`
  return block
}

/** 懒加载历史元素分派（承 `ui.js:396-402`；返回 null = 该 kind 不渲）。 */
export function buildHistoryMessage(msg) {
  if (!msg) return null
  if (msg.kind === "user") return buildUserMessage(msg.text, msg.timestamp, msg.idx)
  if (msg.kind === "assistant") return buildAssistantRestore(msg)
  if (msg.kind === "tool") return renderToolHistory(msg.name ?? "tool", msg.text, msg.idx)
  return null
}

// ─── 错误横幅 ──────────────────────────────────

/** 错误横幅（承 `ui.js:404-417`；唯一出站 `retry`（`:413`）经 `deps.emit("retry", {})` 注入；
 *  `currentBlock` 建块与 scrollDown 留端）。 */
export function renderErrorBanner(text, techInfo, deps = {}) {
  const t = deps.t ?? coreT
  const err = document.createElement("div")
  err.className = "error-banner"
  let html = `<div class="error-text">${escHtml(text)}</div>`
  if (techInfo) html += `<details class="error-details"><summary>Details</summary><pre>${escHtml(techInfo)}</pre></details>`
  html += `<button class="error-retry-btn">${t("error.retry")}</button>`
  err.innerHTML = html
  err.querySelector(".error-retry-btn").addEventListener("click", () => {
    deps.emit?.("retry", {})
  })
  return err
}
