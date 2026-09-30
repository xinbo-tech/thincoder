/**
 * ui.js — DOM helpers for the chat panel
 * All functions take `ctx` which provides DOM refs and mutable state.
 * Leaf module: NO state.js import (loading.js owns the S-dependent setLoading).
 *
 * R2 换接（§3 行 51）：四构件面（块容器 / 工具卡 / 恢复面 / 错误横幅）单源 = 核包
 * `flow/block.mjs` + `flow/tool-card.mjs`——本档留端 = `ctx` 装配面
 * （`currentBlock` / `_toolRefs` / `_nextIdx` 簿记、append 位、消息窗裁剪、欢迎条与横幅）
 * 与唯一出站 `retry` 的 `postMessage` 绑定。类名 / 结构契约 = KD-RC-7（核逐字承源档）。
 *
 * 滚动族（2026-09-29 留端清算 ∕ 批 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.5）：判据 ∕
 * 写门 ∕ 旗标维护 = **核抽核件 `scroll.mjs` 工厂消费**（旗标宿主 = `ctx`——`_pinBottom` / `_pinActivity`
 * 键面与跨档共读面保持；事件集 `wheel` / `touchmove` / `scroll` 保持）；本档留帧调用点（四函数）。
 */
import { esc as escHtml } from "../node_modules/@thincoder/render-core/md.mjs"
import { applyPin, createPinWatch } from "../node_modules/@thincoder/render-core/scroll.mjs"
import { t } from "./i18n.js"
import {
  buildAdvisorBlock, appendAdvisorChunk, buildUserMessage as coreUserMessage,
  buildAssistantRestore as coreAssistantRestore, renderBlock, renderErrorBanner,
} from "../node_modules/@thincoder/render-core/flow/block.mjs"
import {
  renderToolCard, finishToolCard, renderToolHistory,
} from "../node_modules/@thincoder/render-core/flow/tool-card.mjs"

export { escHtml, buildAdvisorBlock, appendAdvisorChunk }

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

/** Historical user message（`ctx` 入参保留——核件去参，端壳面不变）。 */
export function buildUserMessage(ctx, text, timestamp, idx) {
  void ctx
  return coreUserMessage(text, timestamp, idx)
}

export function addUser(ctx, text, timestamp, idx) {
  ctx.assistantLabeled = false // new turn — the next assistant label is allowed once
  const el = buildUserMessage(ctx, text, timestamp, idx !== undefined ? idx : ctx._nextIdx++)
  ctx.messagesEl.appendChild(el)
  trimOldMessages(ctx)
  scrollDown(ctx)
  return el // 标记面（`queued-mark.js`）需持有气泡引用
}

/** Restored assistant FRAME container（核 `buildAssistantRestore`——live-DOM parity 同形）。 */
export function buildAssistantRestore(ctx, msg) {
  void ctx
  return coreAssistantRestore(msg)
}

/** 空助手块 + `ctx` 装配（`_nextIdx` 分配 / `assistantLabeled` 翻转 / append / 窗口裁剪留端）。 */
export function newBlock(ctx) {
  ctx.currentTools = []
  ctx.currentBubble = null
  ctx.currentRaw = ""
  const withLabel = !ctx.assistantLabeled
  if (withLabel) ctx.assistantLabeled = true // One "❯ ThinCoder:" per turn (CLI ensureAssistantLabel parity)
  ctx.currentBlock = renderBlock({ idx: ctx._nextIdx++, withLabel })
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

/** 建工具卡 + `ctx` 簿记（`_toolRefs` 平表 / `currentTools` 表 / append / scrollDown 留端）。 */
export function addTool(ctx, name, args, id, roundTag) {
  if (!ctx.currentBlock) newBlock(ctx)
  const { el, ref } = renderToolCard({ name, args, id, roundTag })
  ctx.currentBlock.appendChild(el)
  // `done` = 「已结算」唯一写点（`finishToolCard` 置真；回合尾清扫 `streaming.js` 只碰 `!done` 卡）
  ctx.currentTools.push(ref)
  ctx._toolRefs[id || name] = ref  // flat lookup — primary path
  scrollDown(ctx)
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

/** Historical tool call rendered from the human line (collapsed card, read-only；`ctx` 入参未用)。 */
export function buildToolHistory(ctx, name, text, idx) {
  void ctx
  return renderToolHistory(name, text, idx)
}

/**
 * Build one history element from a historyPage message ({ kind, text, name,
 * timestamp, idx, turnStart?, reasoning?, tools? }) — the lazy-loading counterpart
 * of the eager per-message loaders above（`ctx` 装配面留端——核构件去参）。
 * 注：核 `flow/block.mjs` 同名导出 = 无 ctx 形（桌面侧消费面）；本档 = 核/端**双份分派壳**
 * （实件单源仍是核件各 builder——本处只做 `ctx` 穿参与 kind→构件映射）。
 */
export function buildHistoryMessage(ctx, msg) {
  if (!msg) return null
  if (msg.kind === "user") return buildUserMessage(ctx, msg.text, msg.timestamp, msg.idx)
  if (msg.kind === "assistant") return buildAssistantRestore(ctx, msg)
  if (msg.kind === "tool") return buildToolHistory(ctx, msg.name ?? "tool", msg.text, msg.idx)
  return null
}

/** 错误横幅：唯一出站 `retry`（`:413`）经 `ctx.vscode.postMessage` 绑定注入（判别式字面量须在
 *  发射位可提取——§13 发面机检）；建块 / append / 跟滚留端。 */
export function showError(ctx, text, techInfo) {
  if (!ctx.currentBlock) newBlock(ctx)
  const err = renderErrorBanner(text, techInfo, { emit: () => ctx.vscode.postMessage({ type: "retry" }) })
  ctx.currentBlock.appendChild(err)
  scrollDown(ctx)
}

// ─── Loading / Error ───────────────────────────
// setLoading moved to loading.js (AGENT-LOOP-ASYNC-POOL.md §6.8 split — ui.js stays free of the state.js
// bridge dependency; suspension-aware loading state lives with state.js consumers)

/** Follow-scroll: pinned to the bottom by default; the user scrolling up unpins
 *  (reading history), scrolling back to the bottom repins. Stream-driven callers use
 *  maybeScrollDown; explicit user actions (the scroll-bottom button) call scrollDown. */

export function scrollDown(ctx) {
  // 用超大值替代读 scrollHeight，避免强制同步布局（代价随 DOM 变大而涨）—— 写口 = 核工厂 `applyPin`
  applyPin(ctx.messagesEl, true)
  ctx._pinBottom = true // 重 pin（显式动作——旗标键面 = 跨档共读面，保持）
}

export function maybeScrollDown(ctx) {
  applyPin(ctx.messagesEl, ctx._pinBottom)
}

/** 活动区 pin（§12.3 第 7 条——同 `#messages` 口径）：默认钉底；buildBlock 与流式帧
 *  （streaming.js rAF 尾）驱动——上滚解 pin、回底重 pin（initScrollFollow 区监听）。 */
export function maybeScrollActivity(ctx) {
  if (!ctx.activityEl) return
  applyPin(ctx.activityEl, ctx._pinActivity)
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

/** Wire the pin/unpin listeners once（核工厂直写模式 —— 近底直写；事件集 `wheel` / `touchmove` / `scroll` 保持）。
 *  活动区（§12.3 第 7 条）同口径独立 pin——两 watch 各自宿主键面；`?.` 空安全：
 *  夹具缺区 id 零抛错（缺 el ⇒ `attach` 零动作）。 */
export function initScrollFollow(ctx) {
  ctx._pinBottom = true
  ctx._pinActivity = true
  createPinWatch(ctx.messagesEl, { holder: ctx, flagKey: "_pinBottom" }).attach()
  createPinWatch(ctx.activityEl, { holder: ctx, flagKey: "_pinActivity" }).attach()
}
