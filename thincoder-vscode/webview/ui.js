/**
 * ui.js — DOM helpers for the chat panel
 * All functions take `ctx` which provides DOM refs and mutable state.
 * Leaf module: NO state.js import (loading.js owns the S-dependent setLoading).
 */

import { md, mdInline, esc } from "./md.js"
import { fmtTime, capText, isToolFailure } from "./lib.js"
import { t } from "./i18n.js"
import { buildFinishedToolCard } from "./tool-card-restore.mjs"
import { formatToolSummary } from "./tool-summary.js" // X3/X7：摘要族迁出（500 行限——见该叶头注）

// ─── Advisor review block (in-conversation, reasoning-style) ──

/**
 * Create the details block that streams an advisor review into the conversation.
 * `roundLabel` is the summary text (e.g. "Advisor Review (Round 2)").
 */
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

/**
 * Append one advisor progress chunk ({ kind: "think"|"tool"|"text", text }) to
 * the block's scrolling content region. Same-kind text runs merge; nothing is
 * ever truncated — the full review stays in the block (scrolling).
 * AGENT-LOOP-SUBAGENT.md §6.7.2 D-M8 nested sub-label: `sub` (e.g. "explore#1" — an INNER spawn's
 * attribution, carried on the chunk by subagent.mjs runChild forward) rides `dataset.sub` — 数据面
 * 保留（下方合并判据读它），**行首无可见子标**（两端同形 · 台账 #185 2026-09-25 收口；对齐方向 = VSC → CLI）。
 * §5.6 (渲染粒度对齐批): `meta` (optional structured chunk — absent = old behavior) carries
 * `face` / `tool` for the tool-face merge judgment: an output row (face "toolOutput") merges
 * into the last row iff that row is a tool row with the same face / tool / sub ⇒ RAW text-node
 * append (zero separator — CLI pushBlock parity); call rows (face "toolCall") and chunks without
 * face/tool always start a fresh row (fail-safe — never guessed).
 */
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
      last.appendChild(document.createTextNode(str)); return
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
    // 续写 = 追加文本节点（chunk RAW 拼接零分隔符；首行 `textContent = str` 同效）
    last.appendChild(document.createTextNode(str))
  } else {
    const div = document.createElement("div")
    div.className = "advisor-text" + (k === "think" ? " advisor-think" : "")
    div.dataset.kind = k
    if (subLabel) div.dataset.sub = subLabel
    div.textContent = str
    content.appendChild(div)
  }
}

// ─── Welcome / Banner ──────────────────────────

export function showWelcome(ctx) {
  const el = document.createElement("div")
  el.className = "welcome"
  // data-i18n/data-i18n-html：动态内容在 i18n 消息到达前渲染（脚本加载即 showWelcome）——
  // t() 此时返回键名——i18n-dom applyI18nToDOM 到达后按属性覆盖（2026-09-05 真机走查修复：
  // 此前只刷 .welcome h2，两个 p 键名残留）。shortcutsHtml 含 <code>——innerHTML 语义。
  // 首行文案按 provider 配置态两态（ctx._keyOk——providerStatus 消息置位；updateWelcomeStatus
  // 在 keyOk 晚到时刷新；键写入 data-i18n 属性——i18n-dom 刷新按当前态键取值）。
  const textKey = ctx._keyOk === true ? "welcome.textConfigured" : "welcome.text"
  el.innerHTML = `<h2 data-i18n="welcome.heading">${t("welcome.heading")}</h2>
    <p data-i18n="${textKey}">${t(textKey)}</p>
    <p data-i18n-html="welcome.shortcutsHtml" style="margin-top:8px;opacity:0.7">${t("welcome.shortcutsHtml")}</p>`
  ctx.messagesEl.appendChild(el)
}

/** keyOk 状态晚到时刷新欢迎条首行文案（providerStatus 消息——初始渲染常早于它）。 */
export function updateWelcomeStatus(ctx) {
  const p = ctx.messagesEl.querySelector(".welcome p[data-i18n]")
  if (!p) return
  p.dataset.i18n = ctx._keyOk === true ? "welcome.textConfigured" : "welcome.text"
  p.textContent = t(p.dataset.i18n)
}

export function showBanner(ctx, text, keyOk) {
  let banner = document.getElementById("provider-banner")
  if (!banner) {
    banner = document.createElement("div")
    banner.id = "provider-banner"
    banner.className = "provider-banner"
    ctx.messagesEl.insertBefore(banner, ctx.messagesEl.firstChild)
  }
  banner.innerHTML = ""
  banner.className = keyOk ? "provider-banner ok" : "provider-banner warn"
  const label = document.createElement("span")
  // data-banner-key：横幅可能创建于 i18n 消息到达前（t() 返回键名——2026-09-05
  // 真机走查：banner.configured 键名残留同族）——i18n-dom 按此属性兜底刷新。
  label.dataset.bannerKey = keyOk ? "banner.configured" : "banner.notConfigured"
  label.textContent = text
  banner.appendChild(label)
}

// ─── Messages ──────────────────────────────────

/** Historical user message. `idx` (when set) is stored as data-idx on the element
 *  for lazy-load paging (minLoadedIdx) — no action buttons on messages.
 *  F（SESSION-RESTORE-PARITY）：时间只显真实 ts——缺失不显示（无 fmtTime(new Date())
 *  误导回退——恢复老文件无 ts 消息不得假显示"现在"）。 */
export function buildUserMessage(ctx, text, timestamp, idx) {
  const el = document.createElement("div")
  el.className = "message user"
  el.dataset.raw = String(text) // 待发送标记面锚定源（`queued-mark.js`——快照按原文匹配气泡）
  const ts = timestamp ? fmtTime(new Date(timestamp)) : ""
  if (timestamp) el.dataset.ts = String(timestamp) // 清标重建标签行用（无 ts 不显示纪律保持）
  if (idx !== undefined) el.dataset.idx = String(idx)
  el.innerHTML = `<div class="msg-label">❯ ${t("msg.user")}:${ts ? ` <span class="msg-time">${ts}</span>` : ""}</div><div class="bubble">${mdInline(text)}</div>` // mdInline escapes raw text — single escape point
  return el
}

export function addUser(ctx, text, timestamp, idx) {
  ctx.assistantLabeled = false // new turn — the next assistant label is allowed once
  const el = buildUserMessage(ctx, text, timestamp, idx !== undefined ? idx : ctx._nextIdx++)
  ctx.messagesEl.appendChild(el)
  trimOldMessages(ctx)
  scrollDown(ctx)
  return el // 标记面（`queued-mark.js`）需持有气泡引用
}

/** Restored assistant FRAME container (SESSION-RESTORE-PARITY — live-DOM parity):
 *  label（turnStart 才画——❯ ThinCoder: 恒无时间，live 同构）→ thinking 块
 *  （reasoning → details.reasoning-block[open]——md 渲染，live 同 DOM）→ content bubble
 *  → 嵌套工具卡 ×n。data-idx = 帧原始全局 idx——分页锚只外层消息。 */
export function buildAssistantRestore(ctx, msg) {
  const el = document.createElement("div")
  el.className = "message assistant"
  if (msg.idx !== undefined) el.dataset.idx = String(msg.idx)
  let html = ""
  if (msg.turnStart) html += `<div class="msg-label">❯ ${t("msg.assistant")}:</div>`
  if (msg.reasoning) html += `<details class="reasoning-block" open><summary>${escHtml(t("status.thinking"))}...</summary><div class="reasoning-content">${md(msg.reasoning)}</div></details>`
  if (typeof msg.text === "string" && msg.text.trim() !== "") html += `<div class="bubble content">${md(msg.text)}</div>`
  el.innerHTML = html
  for (const tc of msg.tools || []) {
    const card = buildFinishedToolCard(tc)
    if (card) el.appendChild(card)
  }
  return el
}

export function newBlock(ctx) {
  ctx.currentTools = []
  ctx.currentBubble = null
  ctx.currentRaw = ""
  ctx.currentBlock = document.createElement("div")
  ctx.currentBlock.className = "message assistant"
  ctx.currentBlock.dataset.idx = String(ctx._nextIdx++) // 窗口裁剪：live 块补全局 idx，供 loadOlder 锚回
  // One "❯ ThinCoder:" per turn (CLI ensureAssistantLabel parity): only the
  // turn's FIRST block carries the label; segments after tool batches start
  // fresh blocks but must not paint a second label.
  if (!ctx.assistantLabeled) {
    ctx.assistantLabeled = true
    ctx.currentBlock.innerHTML = `<div class="msg-label">❯ ${t("msg.assistant")}:</div>`
  }
  ctx.messagesEl.appendChild(ctx.currentBlock)
  trimOldMessages(ctx)
}

/** X2（显示面消差批 §2.1）：advisor 卡头轮次标签（字面 = CLI `tool-events.mjs:152` `roundTag` 逐字）
 *  `(round N · model)`；无 model ⇒ 降级形 `(round N)`（不显 `null`）；无 round ⇒ `""`（零改面——
 *  非 advisor / 无轮次载荷逐字节同修前）。状态行同用（`chat.js`：`advisor review${tag}`）。 */
export function advisorRoundTag(round, model) {
  if (round == null) return ""
  return `(round ${round}${model ? " · " + model : ""})`
}

/** `roundTag`（X2，可选）= advisor 轮次标签——非空才加一格 span（其余调用零改）。 */
export function addTool(ctx, name, args, id, roundTag) {
  if (!ctx.currentBlock) newBlock(ctx)

  const c = document.createElement("div")
  c.className = "tool-call"
  c.dataset.startTime = String(Date.now())

  const h = document.createElement("div")
  h.className = "tool-call-header"
  h.tabIndex = 0
  h.setAttribute("role", "button")
  h.setAttribute("aria-expanded", "false")
  h.innerHTML =
    `<span class="tool-call-icon"></span>` +
    `<span class="tool-call-name">${esc(name)}</span>` +
    (roundTag ? `<span class="tool-call-round">${esc(roundTag)}</span>` : "") +
    `<span class="tool-call-args" title="${esc(args)}">${esc(args.slice(0, 80))}</span>` +
    `<span class="tool-call-status">${t("tool.running")}</span>`

  const b = document.createElement("div")
  b.className = "tool-call-body"
  b.setAttribute("role", "region")
  b.setAttribute("aria-label", `Output of ${name}`)
  b.textContent = t("tool.initial")

  h.addEventListener("click", () => {
    h.querySelector(".tool-call-icon").classList.toggle("open")
    b.classList.toggle("open")
    h.setAttribute("aria-expanded", String(b.classList.contains("open")))
  })

  c.appendChild(h)
  c.appendChild(b)
  c.dataset.toolId = id || name  // fallback: findable via DOM query even if _toolRefs cleared
  ctx.currentBlock.appendChild(c)
  // `done` = 「已结算」唯一写点（`finishToolCard` 置真；回合尾清扫 `streaming.js` 只碰 `!done` 卡）
  const ref = { h, b, name, id: id || name, startTime: Date.now(), done: false }
  ctx.currentTools.push(ref)
  ctx._toolRefs[id || name] = ref  // flat lookup — primary path
  scrollDown(ctx)
}

/** Wrap verified file paths in clickable spans (text-node level — never inside
 *  attributes). One link per text node is enough; paths repeat across output. */
function linkifyPaths(bodyEl, links) {
  if (!links?.length) return
  const NF = window.NodeFilter
  const walker = document.createTreeWalker(bodyEl, NF.SHOW_TEXT)
  const nodes = []
  let n
  while ((n = walker.nextNode())) nodes.push(n)
  for (const node of nodes) {
    const text = node.nodeValue
    let idx = -1, hit = null
    for (const l of links) {
      const i = text.indexOf(l.raw)
      if (i >= 0 && (idx < 0 || i < idx)) { idx = i; hit = l }
    }
    if (!hit) continue
    const frag = document.createDocumentFragment()
    if (idx > 0) frag.appendChild(document.createTextNode(text.slice(0, idx)))
    const span = document.createElement("span")
    span.className = "file-link"
    span.textContent = hit.raw
    span.dataset.path = hit.path
    if (hit.line) span.dataset.line = String(hit.line)
    span.setAttribute("role", "link")
    span.tabIndex = 0
    frag.appendChild(span)
    const rest = text.slice(idx + hit.raw.length)
    if (rest) frag.appendChild(document.createTextNode(rest))
    node.parentNode.replaceChild(frag, node)
  }
}

// 摘要族（`resultSummary`）已整段迁出 `tool-summary.js`（X3/X7——500 行限；判据/字面单源见该叶）。

/** Update a tool card to its done state: elapsed ms, result summary, collapse/expand, error tint. */
function finishToolCard(ref, name, text, links, truncated) {
  ref.done = true // M1：已结算唯一写点（回合尾清扫只碰 `!done` 卡）
  // 截断超长输出入 DOM（防无界增长），完整结果不保留——摘要已在 header 显示
  ref.b.textContent = capText(text || "")
  // X5（显示面消差批 §2.2）：宿主切片点携事实旗标 ⇒ 正文明示截断（**旗标驱动**——不由长度比较
  // 驱动：恰 64K 与超出同判，`lib.js capText` 的 `<= max` 边界洞不复辟）。
  if (truncated) ref.b.textContent += "\n" + t("tool.truncated")
  linkifyPaths(ref.b, links)
  const ms = Date.now() - (ref.startTime || Date.now())
  const isError = isToolFailure(text) // F-W16：判据单源（lib.js——与恢复卡同读）
  const statusEl = ref.h.querySelector(".tool-call-status")
  if (statusEl) {
    if (isError) {
      statusEl.textContent = `${t("tool.error")} (${ms}ms)`
      statusEl.style.color = "#f14c4c"
    } else {
      statusEl.textContent = `${t("tool.done")} (${ms}ms)`
      statusEl.style.color = "#4ec9b0"
    }
  }
  // CLI parity: completion summary visible in the header（X3/X7：分派字面见 tool-summary.js）
  const summary = formatToolSummary(name, text)
  let summaryEl = ref.h.querySelector(".tool-call-summary")
  if (summary || truncated) {
    if (!summaryEl) {
      summaryEl = document.createElement("span")
      summaryEl.className = "tool-call-summary"
      ref.h.appendChild(summaryEl)
    }
    summaryEl.textContent = "→ " + [summary, truncated ? t("tool.truncated") : ""].filter(Boolean).join(" ")
    summaryEl.style.display = ""
  } else if (summaryEl) {
    summaryEl.style.display = "none"
  }
  // Auto-collapse on success: the header already shows the → summary, so a finished
  // card folds up to one line (CLI outputPanel parity). Errors stay EXPANDED — the
  // user must see what failed without an extra click.
  if (isError) {
    ref.b.classList.add("open")
    ref.h.querySelector(".tool-call-icon")?.classList.add("open")
    ref.h.setAttribute("aria-expanded", "true")
  } else {
    ref.b.classList.remove("open")
    ref.h.querySelector(".tool-call-icon")?.classList.remove("open")
    ref.h.setAttribute("aria-expanded", "false")
  }
}

export function finishTool(ctx, name, id, text, links, truncated) {
  // Primary: O(1) flat lookup by tool_call_id
  const key = id || name
  const ref = ctx._toolRefs[key]
  if (ref) {
    finishToolCard(ref, name, text, links, truncated)
    ctx.hadToolResult = true
    scrollDown(ctx) // the auto-expanded output must scroll into view, not sit below the fold
    return
  }
  // Fallback: DOM traversal for any reason the map missed
  const el = ctx.messagesEl.querySelector(`.tool-call[data-tool-id="${globalThis.CSS.escape(key)}"] .tool-call-status`)
  if (el) {
    const card = el.closest(".tool-call")
    const body = card?.querySelector(".tool-call-body")
    finishToolCard({ h: card, b: body, startTime: card?.dataset.startTime ? Number(card.dataset.startTime) : Date.now() }, name, text, undefined, truncated)
    ctx.hadToolResult = true
    scrollDown(ctx)
  }
}

// ─── Loading / Error ───────────────────────────
// setLoading moved to loading.js (AGENT-LOOP-ASYNC-POOL.md §6.8 split — ui.js stays free of the state.js
// bridge dependency; suspension-aware loading state lives with state.js consumers)

/** Historical tool call rendered from the human line (collapsed card, read-only). */
export function buildToolHistory(ctx, name, text, idx) {
  const c = document.createElement("div")
  c.className = "tool-call"
  c.dataset.toolId = "hist-" + (idx ?? name)

  const h = document.createElement("div")
  h.className = "tool-call-header"
  h.tabIndex = 0
  h.setAttribute("role", "button")
  h.setAttribute("aria-expanded", "false")
  if (idx !== undefined) c.dataset.idx = String(idx) // lazy-load paging (minLoadedIdx)
  const summary = formatToolSummary(name, text) // 恢复面同判据（X3/X7 单源——活卡/恢复卡同字面）
  h.innerHTML =
    `<span class="tool-call-icon"></span>` +
    `<span class="tool-call-name">${esc(name)}</span>` +
    `<span class="tool-call-status" style="color:#4ec9b0">${t("tool.done")}</span>` +
    (summary ? `<span class="tool-call-summary">→ ${esc(summary)}</span>` : "")

  const b = document.createElement("div")
  b.className = "tool-call-body"
  b.setAttribute("role", "region")
  b.setAttribute("aria-label", `Output of ${name}`)
  b.textContent = text || ""

  h.addEventListener("click", () => {
    h.querySelector(".tool-call-icon").classList.toggle("open")
    b.classList.toggle("open")
    h.setAttribute("aria-expanded", String(b.classList.contains("open")))
  })

  c.appendChild(h)
  c.appendChild(b)
  return c
}

/**
 * Build one history element from a historyPage message ({ kind, text, name,
 * timestamp, idx, turnStart?, reasoning?, tools? }) — the lazy-loading counterpart
 * of the eager per-message loaders above. Returns null for kinds the UI does not
 * render. assistant = 帧容器（reasoning/嵌套工具卡）；tool = 真孤儿保底顶层卡。
 */
export function buildHistoryMessage(ctx, msg) {
  if (!msg) return null
  if (msg.kind === "user") return buildUserMessage(ctx, msg.text, msg.timestamp, msg.idx)
  if (msg.kind === "assistant") return buildAssistantRestore(ctx, msg)
  if (msg.kind === "tool") return buildToolHistory(ctx, msg.name ?? "tool", msg.text, msg.idx)
  return null
}

export function showError(ctx, text, techInfo) {
  if (!ctx.currentBlock) newBlock(ctx)
  const err = document.createElement("div")
  err.className = "error-banner"
  let html = `<div class="error-text">${escHtml(text)}</div>`
  if (techInfo) html += `<details class="error-details"><summary>Details</summary><pre>${escHtml(techInfo)}</pre></details>`
  html += `<button class="error-retry-btn">${t("error.retry")}</button>`
  err.innerHTML = html
  err.querySelector(".error-retry-btn").addEventListener("click", () => {
    ctx.vscode.postMessage({ type: "retry" })
  })
  ctx.currentBlock.appendChild(err)
  scrollDown(ctx)
}

export function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** Follow-scroll: pinned to the bottom by default; the user scrolling up unpins
 *  (reading history), scrolling back to the bottom repins. Stream-driven callers use
 *  maybeScrollDown; explicit user actions (the scroll-bottom button) call scrollDown. */
export function scrollDown(ctx) {
  // 用超大值替代读 scrollHeight，避免强制同步布局（代价随 DOM 变大而涨）
  ctx.messagesEl.scrollTop = Number.MAX_SAFE_INTEGER
  ctx._pinBottom = true
}

export function maybeScrollDown(ctx) {
  if (ctx._pinBottom !== false) ctx.messagesEl.scrollTop = Number.MAX_SAFE_INTEGER
}

/** 活动区 pin（§12.3 第 7 条——同 `#messages` 口径）：默认钉底；buildBlock 与流式帧
 *  （streaming.js rAF 尾）驱动——上滚解 pin、回底重 pin（initScrollFollow 区监听）。 */
export function maybeScrollActivity(ctx) {
  if (ctx._pinActivity === false || !ctx.activityEl) return
  ctx.activityEl.scrollTop = Number.MAX_SAFE_INTEGER
}

/** 窗口化裁剪：顶层内容块超过上限时删最旧的，防 DOM 无界增长（webview 输入卡顿治本）。
 *  被裁掉的块带 data-idx（history 来自宿主、live 由本地 _nextIdx 续接），向上滚动时 loadOlder 拉回。
 *  §14 T-CL9（2026-09-12）：消化后归档的子代理块（`.sub-block`）落流后随本窗出入（同一 DOM 无界纪律）。 */
const MAX_MESSAGE_BLOCKS = 150
export function trimOldMessages(ctx) {
  const blocks = [...ctx.messagesEl.children].filter((el) =>
    el.classList.contains("message") || el.classList.contains("tool-call") || el.classList.contains("advisor-block") || el.classList.contains("sub-block"))
  const overflow = blocks.length - MAX_MESSAGE_BLOCKS
  if (overflow <= 0) return
  for (let i = 0; i < overflow; i++) blocks[i].remove()
  ctx._hasOlder = true
}

/** Wire the pin/unpin listeners once. Threshold ~24px counts "near the bottom" as bottom.
 *  活动区（§12.3 第 7 条）同口径独立 pin——同一 watch 闭包双目标；`?.` 空安全：
 *  夹具缺区 id 零抛错。 */
export function initScrollFollow(ctx) {
  ctx._pinBottom = true
  ctx._pinActivity = true
  const watch = (el, key) => {
    const onScroll = () => { ctx[key] = el.scrollHeight - el.scrollTop - el.clientHeight < 24 }
    // §5.5（2026-09-19 批）：`scroll` 为唯一「滚动已生效」后触发者（键盘 / 拖条 / 程序写入全覆盖）
    for (const ev of ["wheel", "touchmove", "scroll"]) el?.addEventListener(ev, onScroll, { passive: true })
  }
  watch(ctx.messagesEl, "_pinBottom")
  watch(ctx.activityEl, "_pinActivity")
}
