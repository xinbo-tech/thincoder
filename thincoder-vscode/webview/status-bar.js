/**
 * status-bar.js — the status line (tokens, cache, context %, current tool,
 * turn N/M, elapsed, status text segment, badges) and the usage-message handler.
 * §14 C-12/C-15（活动区收口批）：状态文本段（限流/过载/配额/索引）、`turn N/M` 段
 * （旧 `status.turns` 段退役）、✦reasoning 段——host 只发结构化载荷，文案在 webview
 * 按 locale 渲染（M3——locale 单源）。
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
  const hitText = cacheHit + cacheMiss > 0 ? Math.round((cacheHit / (cacheHit + cacheMiss)) * 100) : null
  const reasoning = u.reasoning_tokens ?? 0
  let parts = []
  if (S._planActive) parts.push(`<span style="color:var(--accent)">${t("status.plan")}</span>`)
  if (S._goalInfo?.status === "active") parts.push(`<span id="goal-badge" role="button" tabindex="0" aria-label="Goal panel" style="cursor:pointer">🎯</span>`)
  // 状态文本段（C-15）：限流/过载/配额/索引进度——host 发 kind，本端取 locale 文案；
  // 活动恢复即清（chat.js clearStatusText——C-15）。
  if (S._statusText) {
    const statusText = statusTextText(S._statusText)
    if (statusText) parts.push(escHtml(statusText))
  }
  parts.push(`↑${fmtK(prompt)} ↓${fmtK(completion)}`)
  if (reasoning > 0) parts.push(`✦${fmtK(reasoning)}`) // C-12#6：✦reasoning（>0 才显——同 CLI）
  if (hitText !== null) parts.push(`hit${hitText}%`)
  const ctxPct = (m && m.ctxPct != null) ? m.ctxPct : S._lastCtxPct
  if (ctxPct != null) {
    // CLI parity: context utilization ≥80% renders in warning color
    parts.push(ctxPct >= 80
      ? `<span style="color:var(--vscode-editorWarning-foreground, #cca700)">context ${ctxPct}%</span>`
      : `context ${ctxPct}%`)
  }
  // C2 (F-C2c——修 H-E): thinking 态 = S._phase 标记——由本函数（#status-line 唯一
  // writer）绘制——loading 消息不再 innerHTML 覆写状态行（徽标/挂起计数同线保留）。
  if (S._phase === "thinking") parts.push(`${t("status.thinking")}<span class="loading-dots"></span>`)
  // CLI status parity: current tool, turn count (LLM calls), elapsed seconds
  if (S._currentTool) parts.push(`<span class="status-tool">${t("status.currentTool")}: ${escHtml(S._currentTool)}</span>`)
  if (S._turnFrame) parts.push(t("status.turn", { n: S._turnFrame.turn, m: S._turnFrame.maxTurns })) // C-15：turn N/M 段（旧 status.turns 段退役）
  if (S._turnStart) parts.push(`${t("status.elapsed")} ${Math.round((Date.now() - S._turnStart) / 1000)}s`)
  if (S._taskStatus) parts.push(`<span id="task-badge" role="button" tabindex="0" aria-label="Task progress" style="cursor:pointer">${S._taskStatus}</span>`) // 子代理计数徽标已撤（SESSION-ACTIVITY-REVISED 评审 #2——活动区自动显隐——计数由 ⏳ 挂起段承担）
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
  // Wire click handlers for the two panel badges (the subagent count badge was
  // removed with the row panel — SESSION-ACTIVITY-REVISED 评审 #2 — the activity
  // area shows/hides itself) — `onclick` (not addEventListener): the status line
  // is rebuilt by innerHTML on every render, so old elements (and their
  // listeners) are discarded; onclick overwrites rather than stacks.
  const wire = (id, panelId) => {
    const el = document.getElementById(id)
    if (el) el.onclick = (e) => {
      e.stopPropagation()
      const p = document.getElementById(panelId)
      p.style.display = p.style.display === "none" ? "block" : "none"
    }
  }
  wire("task-badge", "task-panel")
  wire("goal-badge", "goal-panel")
}

/** usage message: cache the numbers, count the LLM call, repaint the bar. */
export function handleUsageMessage(m) {
  S._lastUsage = m.usage || {}
  S._llmCalls++ // one LLM call per usage report (CLI turn parity)
  if (m.ctxPct != null) S._lastCtxPct = m.ctxPct
  renderStatusBar(m)
}

/** statusText 段文案（C-12#1/C-15——host 发结构化 kind；webview 按 locale 渲染）：
 *  rateWait/rateLimited/overloaded/quota/index（scan·index 两相——W8：核 sync 相位，原 embed
 *  相位退场）；未知 kind → null（不渲染）。 */
function statusTextText(st) {
  switch (st?.kind) {
    case "rateWait": return t("status.rateWait", { s: st.seconds ?? "?" })
    case "rateLimited": return t("status.rateLimited", { s: st.seconds ?? "?" })
    case "overloaded": return t("status.overloaded", { s: st.seconds ?? "?" })
    case "quota": return t("status.quota", { msg: st.message ?? "" })
    case "index": return st.phase === "index"
      ? t("status.indexProgress", { done: st.done ?? "?", total: st.total ?? "?" })
      : t("status.indexScan", { n: st.total ?? "?" })
    default: return null
  }
}
