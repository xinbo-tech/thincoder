/**
 * status-bar.js — the status line (tokens, cache, context %, current tool,
 * turns, elapsed, badges) and the usage-message handler.
 */
import { S } from "./state.js"
import { t } from "./i18n.js"
import { fmtK } from "./lib.js"
import { escHtml } from "./ui.js"

export function renderStatusBar(m) {
  // m is optional — if not passed, uses cached state from _lastUsage
  const u = m ? (m.usage || {}) : (S._lastUsage || {})
  const prompt = u.prompt_tokens ?? 0
  const completion = u.completion_tokens ?? 0
  const cacheHit = u.prompt_cache_hit_tokens ?? 0
  const cacheMiss = u.prompt_cache_miss_tokens ?? 0
  const cachePct = cacheHit + cacheMiss > 0 ? Math.round((cacheHit / (cacheHit + cacheMiss)) * 100) : null
  let parts = []
  if (S._planActive) parts.push(`<span style="color:var(--accent)">${t("status.plan")}</span>`)
  if (S._goalInfo?.status === "active") parts.push(`<span id="goal-badge" role="button" tabindex="0" aria-label="Goal panel" style="cursor:pointer">🎯</span>`)
  parts.push(`↑${fmtK(prompt)} ↓${fmtK(completion)}`)
  if (cachePct !== null) parts.push(`hit${cachePct}%`)
  const ctxPct = (m && m.ctxPct != null) ? m.ctxPct : S._lastCtxPct
  if (ctxPct != null) {
    // CLI parity: context utilization ≥80% renders in warning color
    parts.push(ctxPct >= 80
      ? `<span style="color:var(--vscode-editorWarning-foreground, #cca700)">context ${ctxPct}%</span>`
      : `context ${ctxPct}%`)
  }
  // CLI status parity: current tool, turn count (LLM calls), elapsed seconds
  if (S._currentTool) parts.push(`<span class="status-tool">${t("status.currentTool")}: ${escHtml(S._currentTool)}</span>`)
  if (S._llmCalls > 0) parts.push(`${t("status.turns")} ${S._llmCalls}`)
  if (S._turnStart) parts.push(`${t("status.elapsed")} ${Math.round((Date.now() - S._turnStart) / 1000)}s`)
  const subCount = Object.keys(S._subagentMap).length
  if (subCount > 0) parts.push(`<span id="sub-badge" role="button" tabindex="0" aria-label="${subCount} subagents" style="cursor:pointer">sub:${subCount}</span>`)
  if (S._taskStatus) parts.push(`<span id="task-badge" role="button" tabindex="0" aria-label="Task progress" style="cursor:pointer">${S._taskStatus}</span>`)
  // §17 background-mode status line (D-S8): "后台 N 子代理运行中" while the suspension
  // session is live — appended after the usage stats, dim badge.
  if (S._suspended) {
    const c = S._suspCounts
    const n = (c?.running ?? 0) + (c?.queued ?? 0)
    // §17.5（17.5.4 #6 文案区分）：pending 移交项 + 回合尾留池 settled 未消费项（done）
    // 同为"完成待消化"——纯 settled 池进挂起时首帧不误报 winding/0
    const digesting = (c?.pending ?? 0) + (c?.done ?? 0)
    const text = n > 0
      ? t("susp.running", { n }) + (digesting > 0 ? " · " + t("susp.digesting", { n: digesting }) : "")
      : digesting > 0 ? t("susp.digesting", { n: digesting }) : t("susp.winding")
    parts.push(`<span class="susp-status">⏳ ${escHtml(text)}</span>`)
  }
  document.getElementById("status-line").innerHTML = parts.join(` <span class="status-sep">|</span> `)
  // Wire click handlers for all three badges — `onclick` (not addEventListener):
  // the status line is rebuilt by innerHTML on every render, so old elements
  // (and their listeners) are discarded; onclick overwrites rather than stacks.
  const wire = (id, panelId) => {
    const el = document.getElementById(id)
    if (el) el.onclick = (e) => {
      e.stopPropagation()
      const p = document.getElementById(panelId)
      p.style.display = p.style.display === "none" ? "block" : "none"
    }
  }
  wire("task-badge", "task-panel")
  wire("sub-badge", "subagent-panel")
  wire("goal-badge", "goal-panel")
}

/** usage message: cache the numbers, count the LLM call, repaint the bar. */
export function handleUsageMessage(m) {
  S._lastUsage = m.usage || {}
  S._llmCalls++ // one LLM call per usage report (CLI turn parity)
  if (m.ctxPct != null) S._lastCtxPct = m.ctxPct
  renderStatusBar(m)
}
