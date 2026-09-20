/**
 * streaming.js — token/reasoning stream rendering (rAF-throttled), turn finish,
 * code-block copy buttons, and subagent activity-stream chunks.
 * (2026-09-11 活动区回归 → 2026-09-12 §14 收口：live/awaitingDigest 驻留 `#subagent-activity`；
 * 终态折叠与归档落流在 activity.js——ensureBlock 可返 null（subagentChunk 空安全守卫）；rAF 尾
 * 区 pin = maybeScrollActivity + 块级跟滚 maybeScrollBlock。)
 */
import { ctx, S } from "./state.js"
import { md } from "./md.js"
import { t } from "./i18n.js"
import {
  newBlock, maybeScrollDown, maybeScrollActivity, escHtml,
  appendAdvisorChunk,
} from "./ui.js"
import { setLoading } from "./loading.js"
import { renderStatusBar } from "./status-bar.js"
// 2026-09-11 活动区回归: subagent activity blocks are born in the region
// (#subagent-activity — activity.js) — lifecycle (create/flip/fold/⏹) lives there;
// panels.js never imports streaming.js and activity.js imports neither (no cycles).
import { ensureBlock, noteChunk, resetActivity, maybeScrollBlock } from "./activity.js"
import { traceSubOnce } from "./activity-diag.js"

// Stream render scheduler: reasoning/token chunks arrive at thousands/sec; rendering
// markdown + innerHTML on EVERY chunk is O(n²) and floods the main thread — the backlog
// keeps the Stop button unresponsive long after the backend aborted (2026-08-16
// "Stop won't stop while thinking" bug). rAF throttles to one render per frame.
// Subagent content appends incrementally (appendAdvisorChunk) with block-level
// follow-scroll (maybeScrollBlock) — folded into the same frame here.
let _renderScheduled = false
let _reasoningDirty = false
let _tokenDirty = false
let _subScrollDirty = null // 子代理块跟滚脏集（Set 惰性建——§13 C-LU2；rAF 尾应用后置空）
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
      if (_tokenDirty || _reasoningDirty || _subScrollDirty) scheduleStreamRender()
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
    if (_subScrollDirty) {
      // 子代理块块级跟滚（§13 C-LU2——逐块应用后置空；让位旗标 = 内容区 _pinFollow）
      for (const block of _subScrollDirty) maybeScrollBlock(block)
      _subScrollDirty = null
    }
    maybeScrollDown(ctx)
    maybeScrollActivity(ctx) // 活动区独立 pin（§12.3 第 7 条——不与消息区互拉）
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

/** M1 回合尾清扫（显示面消差批 §2.1——VSC 无清扫 ⇒ 中止后工具卡永停「执行中…」）：
 *  未结算（`ref.done !== true`）的工具卡 ⇒ 状态词 `tool.interrupted` + 摘要 `→ (interrupted)`
 *  （CLI 标尺 = `thincoder-cli/src/tui/tool-display.mjs:60-72` `sweepToolBlocks`：`b.done = true`
 *  （清扫即结算——同形保留）+ `b.summary = "(interrupted)"` + 独立 interrupted 旗标；**不套错误色**
 *  （非 error 面）、正文（流内输出）原样保留）。已结算卡零改写（`finishToolCard` 首行置 `done`）。 */
function sweepUnsettledToolCards(ctx) {
  for (const ref of Object.values(ctx._toolRefs ?? {})) {
    if (!ref || ref.done) continue
    ref.done = true // CLI `sweepToolBlocks` 同形（`b.done = true`）——清扫即结算，重复命中幂等
    const statusEl = ref.h?.querySelector(".tool-call-status")
    if (statusEl) {
      statusEl.textContent = t("tool.interrupted")
      statusEl.style.color = ""
    }
    let summaryEl = ref.h?.querySelector(".tool-call-summary")
    if (ref.h && !summaryEl) {
      summaryEl = document.createElement("span")
      summaryEl.className = "tool-call-summary"
      ref.h.appendChild(summaryEl)
    }
    if (summaryEl) {
      summaryEl.textContent = "→ (interrupted)"
      summaryEl.style.display = ""
    }
  }
}

export function finish(aborted) {
  // Paint any pending throttled chunks before the bubble pointers reset — otherwise
  // the tail of the reply/reasoning never renders.
  flushStreamRender()
  // M1：回合尾清扫**无条件**执行（complete / aborted 两路径同规 = CLI 回合 `finally` 恒清扫
  // ——`agent-turn.mjs:265`）；必须先于下方 `ctx._toolRefs = {}` 复位。
  sweepUnsettledToolCards(ctx)
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
  // 2026-09-11 活动区回归 → 2026-09-12 收口（WEBVIEW.md §14）：活动块生命周期 = 块终态
  // （终态消息即时折叠；settled → awaitingDigest 驻留、回收才归档）/会话退出兜底
  // （suspension freeze → 区全体归档）——不随普通回合尾重置。正常 complete 尾池 live →
  // 挂起会话接管（块留区内等终态通知）；池空 → 无 live 块——reset 恒 no-op。abort 且无
  // 挂起会话 → 池 children 持回合 controller signal 随中止而死（无终态通知）——
  // resetActivity 只清区子树（C-7——流内归档块留存）；digest/会话内回合中止（_suspended
  // true）不动块（池仍 live——children 持会话 signal）。
  if (aborted && !S._suspended) resetActivity() // abort 无会话：池随回合死——区子树复位（C-7：流内归档块留存）
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

/** Subagent/consultant/escalate activity stream — 2026-09-11 活动区回归: 块出生即
 *  活动区 `#subagent-activity` 区尾（activity.js ensureBlock——channel "sub:explore#1"/
 *  "sub:consult glm:glm-5.2 #4"…——label 去 sub: 前缀）；终态原地折叠（live→frozen
 *  ——头词 ✓ done Ns）；queued spawns 得 ⏳ 等待头（含取消 ⏹——F-2）。ensureBlock 可返
 *  null（map 有键且已终态 = 幂等守卫 / live 元素被移除 tombstone）——空安全守卫丢弃。
 *  2026-09-11 第 10 批（§5.1.4 第 5 条）：新代接管后本频道键指向**新块**——旧实例的迟到
 *  chunk 因而落进新块（显式取舍：仅“id 重复 + 两实例消息交错”可见——不做代际过滤守卫）。 */
export function subagentChunk(m) {
  const name = String(m.name ?? "")
  const block = ensureBlock(name)
  if (!block || block._subMeta?.frozen) {
    // ⑦ 非出生面禁静默（2026-09-19——§5.3）：冻结 / 墓碑键吞掉的 chunk 同样逐条入痕
    // （内容面高频 ⇒ 每频道每生命周期首条——`activity-diag.js` 去重）。
    const entry = S._subBlocks.get(name)
    if (entry?._subMeta?.frozen) traceSubOnce("drop-frozen", name)
    else if (entry && !entry.isConnected) traceSubOnce("drop-tombstone", name)
    return
  }
  const kind = m.kind ?? "text" // R4（渲染粒度对齐批 · §2.2 埋雷归一）：单点默认——与桥
  // `panel-toolpanel.mjs:15` 及 CLI `tool-events.mjs:324` 同值（旧 `?? "tool"` 会把绕过桥的裸载荷静默渲成工具行）
  appendAdvisorChunk(block, kind, m.text, m.sub, m) // m 随行（§5.6 合并判据读 face/tool）
  noteChunk(block, kind, m.text, m) // m 携结构化 tool/cmd（§14 C-11①——结果 chunk 不改写状态区）
  _subScrollDirty ??= new Set() // 块级跟滚脏集（§13 C-LU2——rAF 尾逐块应用）
  _subScrollDirty.add(block)
  scheduleStreamRender() // 块级跟滚随 rAF 帧应用（§13——节流帧不丢：重排条件含脏集）
}
