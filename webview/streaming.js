/**
 * streaming.js — token/reasoning stream rendering (rAF-throttled), turn finish,
 * code-block copy buttons, and the in-conversation advisor review block.
 * (SESSION-ACTIVITY-REVISED: subagent activity blocks live in the fixed
 * #subagent-activity area — activity.js.)
 */
import { ctx, S } from "./state.js"
import { md } from "./md.js"
import { t } from "./i18n.js"
import {
  newBlock, maybeScrollDown, escHtml,
  buildAdvisorBlock, appendAdvisorChunk,
} from "./ui.js"
import { setLoading } from "./loading.js"
import { renderStatusBar } from "./status-bar.js"
// SESSION-ACTIVITY-REVISED: subagent activity blocks are born in the fixed
// #subagent-activity AREA (activity.js) — lifecycle (create/header/freeze/ticker/
// ⏹) lives there; frozen blocks move into #messages (tail push / settle anchor);
// panels.js never imports streaming.js and activity.js imports neither (no cycles).
import { ensureBlock, noteChunk, resetActivity } from "./activity.js"

// Stream render scheduler: reasoning/token chunks arrive at thousands/sec; rendering
// markdown + innerHTML on EVERY chunk is O(n²) and floods the main thread — the backlog
// keeps the Stop button unresponsive long after the backend aborted (2026-08-16
// "Stop won't stop while thinking" bug). rAF throttles to one render per frame.
// Advisor/subagent content appends incrementally (appendAdvisorChunk), but their
// per-chunk scrollTop=scrollHeight forces a sync layout — that's folded in here too.
let _renderScheduled = false
let _reasoningDirty = false
let _tokenDirty = false
let _advisorScrollDirty = false
let _lastStreamRender = 0
const STREAM_RENDER_MIN_MS = 50 // 长回复降频：全量 md() 重渲染限到 ≥50ms 一次

function scheduleStreamRender() {
  if (_renderScheduled) return
  _renderScheduled = true
  requestAnimationFrame(() => {
    _renderScheduled = false
    const now = Date.now()
    if (now - _lastStreamRender < STREAM_RENDER_MIN_MS) {
      // 距上次渲染 <50ms：跳过一次，仍有脏内容则继续排队（flushStreamRender 兜底尾帧）
      if (_tokenDirty || _reasoningDirty || _advisorScrollDirty) scheduleStreamRender()
      return
    }
    _lastStreamRender = now
    if (ctx.currentReasoning && _reasoningDirty) {
      try { ctx.currentReasoning.innerHTML = md(ctx.currentReasoningRaw) } catch { ctx.currentReasoning.textContent = ctx.currentReasoningRaw }
      ctx.currentReasoning.scrollTop = ctx.currentReasoning.scrollHeight
      _reasoningDirty = false
    }
    if (ctx.currentBubble && _tokenDirty) {
      try { ctx.currentBubble.innerHTML = md(ctx.currentRaw) } catch { ctx.currentBubble.textContent = ctx.currentRaw }
      _tokenDirty = false
    }
    if (_advisorScrollDirty) {
      // 内容自滚扫活动区 live 块 + 流内 advisor 块（SESSION-ACTIVITY-REVISED：
      // 子代理 live 块固定于活动区——冻结块已落流（frozen 静态——跳过——注释同步））
      for (const block of [S._advisorBlock, ...S._subBlocks.values()]) {
        if (block?._subMeta?.frozen) continue // frozen blocks are static (in #messages)
        const c = block?.querySelector(".advisor-content")
        if (c) c.scrollTop = c.scrollHeight
      }
      _advisorScrollDirty = false
    }
    maybeScrollDown(ctx)
  })
}

function flushStreamRender() {
  // Synchronous flush on turn end — the final chunk must be painted before finish()
  // resets the bubble pointers, or the tail of the reply never renders.
  if (ctx.currentReasoning && _reasoningDirty) {
    try { ctx.currentReasoning.innerHTML = md(ctx.currentReasoningRaw) } catch { ctx.currentReasoning.textContent = ctx.currentReasoningRaw }
    ctx.currentReasoning.scrollTop = ctx.currentReasoning.scrollHeight
    _reasoningDirty = false
  }
  if (ctx.currentBubble && _tokenDirty) {
    try { ctx.currentBubble.innerHTML = md(ctx.currentRaw) } catch { ctx.currentBubble.textContent = ctx.currentRaw }
    _tokenDirty = false
  }
}

export function onReasoning(text) {
  // Start a new block if tool results arrived, if there are tools in the current
  // block, OR if content has already streamed into the current bubble. The last
  // case closes the sub-turn boundary for machine-only pushbacks (advisor/verify
  // guard `[System reminder]` + continue): the webview never sees that boundary,
  // so "reasoning arriving after content" is the only reliable signal of a new
  // provider turn. Within one stream reasoning ALWAYS precedes content, so a
  // reasoning chunk after a content bubble can only be a fresh sub-turn.
  if (ctx.hadToolResult || ctx.currentTools.length > 0 || ctx.currentBubble) {
    ctx.currentBubble = null; ctx.currentBlock = null; ctx.currentReasoning = null; ctx.currentReasoningRaw = ""; ctx.hadToolResult = false
  }
  if (!ctx.currentBlock) newBlock(ctx)
  if (!ctx.currentReasoning) {
    const details = document.createElement("details")
    details.className = "reasoning-block"
    details.open = true
    const summary = document.createElement("summary")
    summary.textContent = t("status.thinking") + "..."
    details.appendChild(summary)
    const div = document.createElement("div")
    div.className = "reasoning-content"
    details.appendChild(div)
    ctx.currentBlock.appendChild(details)
    ctx.currentReasoning = div
    ctx.currentReasoningRaw = ""
  }
  ctx.currentReasoningRaw += text
  _reasoningDirty = true
  scheduleStreamRender()
}

export function onToken(text) {
  // Start a new block if tool results arrived or if there are tools in the current block
  if (ctx.hadToolResult || ctx.currentTools.length > 0) { ctx.currentBubble = null; ctx.currentBlock = null; ctx.currentRaw = ""; ctx.hadToolResult = false }
  if (!ctx.currentBlock) newBlock(ctx)
  if (!ctx.currentBubble) {
    ctx.currentBubble = document.createElement("div")
    ctx.currentBubble.className = "bubble content"
    ctx.currentBlock.appendChild(ctx.currentBubble)
    ctx.currentRaw = ""
  }
  ctx.currentRaw += text
  _tokenDirty = true
  scheduleStreamRender()
}

export function onTurnBreak() {
  // Explicit sub-turn boundary sent by the host when the agent loop pushes a
  // machine-only reminder and `continue`s (advisor/verify/pending-task guards).
  // The webview otherwise cannot see that boundary — no toolCall/toolResult
  // fires — so the onReasoning heuristic (reasoning-after-content) is the only
  // backup. This explicit reset covers BOTH thinking and non-thinking models.
  // Paint any pending throttled chunks first (flushStreamRender) — resetting the
  // bubble pointers with unrendered tail would silently drop the last rendered
  // chunk (same guard as finish()).
  flushStreamRender()
  ctx.currentBubble = null
  ctx.currentBlock = null
  ctx.currentReasoning = null
  ctx.currentReasoningRaw = ""
  ctx.currentRaw = ""
  ctx.currentTools = []
  ctx.hadToolResult = false
}

export function finish(aborted) {
  // Paint any pending throttled chunks before the bubble pointers reset — otherwise
  // the tail of the reply/reasoning never renders.
  flushStreamRender()
  // A turn end without an answer leaves a stale inline question card — drop it
  // (aborted/error paths; a completed turn answers via questionResponse which
  // removes its own card).
  if (aborted) document.querySelectorAll(".question-card").forEach((el) => el.remove())
  if (aborted) {
    // Match CLI: push "[stopped]" as a line in the output stream
    if (!ctx.currentBubble) {
      ctx.currentRaw = ""
      if (!ctx.currentBlock) newBlock(ctx)
      ctx.currentBubble = document.createElement("div")
      ctx.currentBubble.className = "bubble content"
      ctx.currentBlock.appendChild(ctx.currentBubble)
    }
      ctx.currentRaw += "\n\n"
      // Append the "[stopped]" indicator AFTER markdown rendering — raw HTML
      // inside ctx.currentRaw would break if md() ever starts escaping HTML
      // (security hardening) or if the i18n string contains < > &.
      const indicator = `<span style="color:var(--vscode-editorWarning-foreground, #cca700);font-style:italic">${escHtml(t("status.stopped"))}</span>`
      try { ctx.currentBubble.innerHTML = md(ctx.currentRaw) + indicator } catch { ctx.currentBubble.textContent = ctx.currentRaw + " " + t("status.stopped") }
  }
  if (ctx.currentBubble) attachCopyButtons(ctx.currentBubble)
  ctx.currentBubble = null; ctx.currentBlock = null; ctx.currentTools = []; ctx.currentRaw = ""; ctx.currentReasoning = null; ctx.currentReasoningRaw = ""; ctx.hadToolResult = false
  ctx._toolRefs = {}
  S._currentTool = null
  S._turnStart = null
  // SESSION-ACTIVITY-REVISED（2026-09-09）: 活动块生命周期 = 块终态（freeze 落流）/池
  // 退出（suspension freeze）——不再随普通回合尾重置。行面板撤除后区内 live 块是池
  // children 的唯一承载面——正常 complete 尾池 live → 挂起会话接管（块驻留区等
  // settle/digest done 补发折叠）；池空 → 无 live 块——reset 恒 no-op。abort 且无挂起
  // 会话 → 池 children 持回合 controller signal 随中止而死（无终态通知）——resetActivity
  // 清孤儿 live 块；digest/会话内回合中止（_suspended true）不动块（池仍 live——children
  // 持会话 signal）。
  if (aborted && !S._suspended) resetActivity() // abort 无会话：池随回合死——孤儿 live 块清场（冻结块不动）
  if (!S._suspended) S._advisorBlock = null // in-flow sync-advisor block pointer — the element itself stays in the conversation
  setLoading(ctx, false)
  renderStatusBar()
}

/** Attach copy buttons to all code blocks in a container */
export function attachCopyButtons(container) {
  if (!container) return
  const blocks = container.querySelectorAll(".code-block")
  for (const block of blocks) {
    if (block.querySelector(".code-copy-btn")) continue // already has one
    const btn = document.createElement("button")
    btn.className = "code-copy-btn"
    btn.textContent = t("msg.copy")
    btn.addEventListener("click", async () => {
      const code = block.querySelector("code")?.textContent || ""
      try { await navigator.clipboard.writeText(code) } catch { /* */ }
      btn.textContent = t("msg.copied")
      btn.classList.add("copied")
      setTimeout(() => { btn.textContent = t("msg.copy"); btn.classList.remove("copied") }, 2000)
    })
    block.appendChild(btn)
  }
}

/**
 * Advisor output renders as an in-conversation details block (reasoning-style):
 * full content streams into a scrolling region — NEVER truncated — and the
 * summary carries the round number. A "start" chunk opens (and closes the
 * previous round's block); think/tool/text chunks append inside it.
 */
export function advisorChunk(m) {
  if (m.kind === "start") {
    if (S._advisorBlock) S._advisorBlock.open = false // previous round collapses (stays readable)
    // Show the advisor's effective model in the block title (it may differ from the main agent's).
    const details = buildAdvisorBlock(t("advisor.round", { round: m.round ?? "?" }) + (m.model ? " · " + m.model : ""))
    if (ctx.currentBlock) ctx.currentBlock.appendChild(details)
    else ctx.messagesEl.appendChild(details)
    S._advisorBlock = details
    return
  }
  if (!S._advisorBlock) return
  appendAdvisorChunk(S._advisorBlock, m.kind ?? "text", m.text)
  _advisorScrollDirty = true
  scheduleStreamRender()
}


/** Subagent/consultant/escalate activity stream — SESSION-ACTIVITY-REVISED:
 *  blocks are born in the FIXED activity area (#subagent-activity — one block per
 *  channel "sub:explore#1", "sub:consult glm:glm-5.2 #4" …). Terminal states
 *  FREEZE and MOVE the block into the #messages flow (activity.freezeBlock —
 *  identity header + expandable content + report preview; plain terminals tail
 *  push, §17 settled parkers insert at their settle anchor before the digest
 *  report); queued spawns get an area waiting block head. The summary header
 *  carries [▶/⏳ key · sync/async · model · elapsed · turn] + current tool/state
 *  word + folded tail-3 dim (D-R22b). §19.5 D-M7/D-M8: ⏹ mounts only on running
 *  pool entries; nested `sub` labels render via appendAdvisorChunk. */
export function subagentChunk(m) {
  const name = String(m.name ?? "")
  const block = ensureBlock(name) // born in the activity area; freeze moves it into the flow later
  // §27.1 F3（缺陷①）: 冻结块迟到 chunk 丢弃（CLI tombstone 丢弃链对齐——§7.2 D4 完成态冻结）
  if (block._subMeta?.frozen) return
  appendAdvisorChunk(block, m.kind ?? "tool", m.text, m.sub)
  noteChunk(block, m.kind ?? "tool", m.text)
  _advisorScrollDirty = true
  scheduleStreamRender()
}
