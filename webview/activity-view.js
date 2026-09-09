/**
 * activity-view.js — 活动块呈现叶（ACTIVITY-SPLIT——live 呈现 + elapsed ticker）。
 * 单一权威：块头/状态词/tail-3/⏹/区显隐与 pin/noteChunk/ticker 生命周期（语义随各
 * 函数 doc——D-R22b/T-M23/F-1/F-2 口径；词汇经 W 走 i18n——fallback raw）。
 * 依赖 state.js + i18n.js——leaf——不依赖编排层 activity.js（hub re-export 经 core 对外）。
 */
import { ctx, S } from "./state.js"
import { t } from "./i18n.js"

// Roles whose header carries the sync/async mode word (CLI SUBAGENT_ROLES +
// advisor parity — consult/escalate keys embed their model instead).
export const FAMILY_ROLES = ["explore", "plan", "coder", "eng-coder", "advisor"]
const TICK_MS = 1000
const TAIL_LINES = 3

// ─── Header / summary build ──────────────────────

/** Meta word helpers — visible wording rides locale keys (fallback raw). */
export const W = {
  async: () => t("sub.async") || "async",
  sync: () => t("sub.sync") || "sync",
  done: () => t("sub.done") || "done",
  stopped: () => t("sub.stopped") || "stopped",
  error: () => t("sub.error") || "error",
  awaiting: () => t("sub.awaitingDigest") || "done · awaiting digestion",
  queued: () => t("sub.queued") || "queued",
  waiting: () => t("sub.waiting") || "waiting",
  position: (n) => t("sub.position", { n }) || `· position ${n}`,
  thinking: () => t("status.thinking") + "…",
}

/** Identity/status header line, e.g.:
 *  live   → "[▶ eng-coder#3 · async · glm-5.3 · 12s · turn 3/100] read x.mjs"
 *  queued → "[⏳ eng-coder#4] queued · position 2"（等待块头——状态词块外承载）
 *  frozen → "[✓ eng-coder#3 · async · glm-5.3 · done 15s · turn 4/100]"
 *  stopped→ "[⏹ eng-coder#3 · async · glm-5.3 · stopped 12s]"
 *  Parts are conditional on what the events actually carried (turn only with a
 *  real count — degraded mode, see module doc). */
function headerText(meta, now) {
  const frozen = meta.frozen
  // queued/waiting 等待块头（D-4）: 未启动——无 elapsed/mode/model 段（无 ticker——
  // 队列等待信息由 refreshBlock 块外状态词承载：queued · position N / waiting 原因）
  if (!frozen && meta.status === "queued") return `[⏳ ${meta.label}]`
  const sec = Math.max(0, Math.floor(((frozen || meta.status === "settled" ? (meta.doneAt ?? now) : now) - (meta.startedAt ?? now)) / 1000))
  let icon = "▶"
  let verb = null
  let note = null
  if (frozen) {
    if (meta.status === "cancelled") { icon = "⏹"; verb = W.stopped() }
    else if (meta.status === "error") { icon = "⏹"; verb = W.error(); note = meta.error ? String(meta.error) : null }
    else { icon = "✓"; verb = W.done() }
  } else if (meta.status === "settled") {
    icon = "✓"
  }
  let head = `[${icon} ${meta.label}`
  // Mode word: family roles only (consult/escalate keys already carry their
  // model — CLI exempt-role parity); omitted while unknown.
  if (FAMILY_ROLES.includes(meta.role) && meta.pool != null && !meta.queued) {
    head += " · " + (meta.pool ? W.async() : W.sync())
  }
  if (meta.model && !["consult", "escalate"].includes(meta.role)) head += " · " + meta.model
  if (verb) head += ` · ${verb} ${sec}s`
  else head += ` · ${sec}s`
  // Turn part renders only with a real (≥1) count — the live events carry none
  // today (D-R22b degraded mode, reported); the frozen terminal event does.
  if (meta.maxTurns > 0 && (meta.turn ?? 0) > 0) head += ` · turn ${meta.turn}/${meta.maxTurns}`
  head += "]"
  if (note) {
    const flat = note.replace(/\s+/g, " ").trim()
    if (flat) head += " — " + (flat.length > 140 ? flat.slice(0, 139) + "…" : flat)
  }
  return head
}

/** State word after the bracket (live): last tool line tail / thinking /
 *  awaiting-digestion / queued-waiting — CLI currentTool parity. */
function stateWord(meta) {
  if (meta.status === "settled") return W.awaiting()
  if (meta.status === "queued") return meta.stateWord || W.queued()
  return meta.stateWord || W.thinking()
}

/** Last N non-empty content rows (dim folded-context lines). */
function tailLines(block, n) {
  const content = block.querySelector(".advisor-content")
  if (!content) return []
  const rows = [...content.children].filter((el) => el.textContent.trim())
  const out = []
  for (let i = rows.length - 1; i >= 0 && out.length < n; i--) {
    const line = rows[i].textContent.replace(/\s+/g, " ").trim()
    if (line) out.push(line.length > 200 ? line.slice(0, 199) + "…" : line)
  }
  return out.reverse()
}

/** Rebuild the summary: identity header + (folded) tail-3 dim lines.
 *  Safe to call on every chunk/status/tick — ⏹ is a sibling overlay on the
 *  details element, not a summary child. */
export function refreshBlock(block) {
  const meta = block._subMeta
  if (!meta) return
  const summary = block.querySelector("summary")
  if (!summary) return
  summary.replaceChildren()
  const hdr = document.createElement("span")
  hdr.className = "sub-hdr"
  if (meta.frozen && (meta.status === "cancelled" || meta.status === "error")) hdr.classList.add("sub-stopped")
  // Frozen: bracket only (verb inside: done/stopped/error Ns). Live settled:
  // bracket + "done · awaiting digestion" state word. Live running/queued:
  // bracket + state word (stateWord() falls back to thinking…).
  hdr.textContent = headerText(meta, Date.now()) + (meta.frozen ? "" : " " + stateWord(meta))
  summary.appendChild(hdr)
  // Folded context: tail-3 dim lines under the header. Live folded blocks show
  // their recent activity; FROZEN blocks mirror the CLI's folded-frozen form
  // (header + tail-3 — render-conversation frozenSubTaskLines parity), with the
  // report preview following the block in the flow.
  if (meta.frozen || !block.open) {
    const lines = tailLines(block, TAIL_LINES)
    if (lines.length) {
      const tail = document.createElement("span")
      tail.className = "sub-tail"
      tail.textContent = "\n" + lines.join("\n")
      summary.appendChild(tail)
    }
  }
  // ⏹ — running pool children AND queued/waiting heads of the cancelable
  // family (T-M23 + F-2 QUEUED-VISIBILITY: queued heads carry a cancel ⏹ — the
  // user can revoke a queue decision; never on sync spawns, never after terminal
  // states). ⏹ label differentiates: running = stop / queued = cancel queue.
  updateStopButton(block)
}

/** ⏹ stop overlay: visible while live + cancelable family role — running+pool
 *  (stop) or queued/waiting head (cancel queue — F-2 QUEUED-VISIBILITY). Label
 *  distinguishes the two actions; title refreshes on every call (idempotent — a
 *  queued→running flip re-arms the title, locale re-set included). */
function updateStopButton(block) {
  const meta = block._subMeta
  let btn = block.querySelector(".sub-stop-btn")
  const cancelingQueued = meta && !meta.frozen && meta.status === "queued"
  const want = meta
    && !meta.frozen
    && ((meta.status === "running" && meta.pool === true) || cancelingQueued)
    && FAMILY_ROLES.includes(meta.role)
    && block.isConnected
  if (want) {
    if (!btn) {
      btn = document.createElement("button")
      btn.className = "sub-stop-btn"
      btn.type = "button"
      btn.dataset.subId = String(meta.id)
      btn.dataset.subRole = meta.role
      btn.textContent = "⏹"
      block.appendChild(btn)
    }
    btn.title = cancelingQueued
      ? (t("sub.cancelQueueBtn") || "cancel queue")
      : (t("sub.stopBtn") || "Stop this subagent")
  } else if (btn) {
    btn.remove()
  }
}

// ─── Activity-area visibility & pin ─────────────

/** 区空隐藏（F-1/⑨）: 区内无块 → display none 零高（grid auto 行不占）；有块 → 显。
 *  与 base.css `#subagent-activity:empty{display:none}` 互为兜底（CSS 管静态空态；
 *  JS 管块生灭后的翻转——inline style 优先于 CSS 需显式复位）。 */
export function updateAreaVisibility() {
  const area = ctx.subAgentArea
  if (!area) return
  area.style.display = area.children.length > 0 ? "" : "none"
}

/** 区内自滚管理——区底 pin（F-2）：区溢出（多块超 max-height 32vh）时新块出生若已在
 *  区底（近底 32px——与 messagesEl pinBottom 同语义）→ 滚到底；用户上读区内历史时
 *  不强拉。区内块内容增长在块内自滚（.advisor-content 100px）——区级 scrollHeight
 *  只随块生/灭变化——pin 只在出生/移除点评估。 */
export function pinActivityArea() {
  const area = ctx.subAgentArea
  if (!area) return
  if (area.scrollHeight > area.clientHeight && area.scrollTop + area.clientHeight >= area.scrollHeight - 32) {
    area.scrollTop = area.scrollHeight
  }
}

/** Chunk-level state-word tracking (think → thinking…; tool → line tail;
 *  text leaves the word untouched — CLI currentTool parity). */
export function noteChunk(block, kind, text) {
  if (!block?._subMeta || block._subMeta.frozen) return
  const meta = block._subMeta
  if (kind === "tool") {
    const lines = String(text ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
    const tail = lines[lines.length - 1] ?? ""
    const flat = tail.replace(/\s+/g, " ").trim()
    meta.stateWord = flat ? (flat.length > 64 ? flat.slice(0, 63) + "…" : flat) : meta.stateWord
    refreshBlock(block)
  } else if (kind === "think") {
    meta.stateWord = W.thinking()
    refreshBlock(block)
  }
}

// ─── Elapsed ticker (event-managed — CLI 1s ticker parity, no idle clock) ──

let _ticker = null
// Test seam (restore in finally): disables the real 1s interval so DOM tests can
// drive elapsed deterministically via activityTick() with a patched clock.
let _tickDisabled = false
export function setActivityTickDisabled(v) {
  _tickDisabled = !!v
  if (_tickDisabled && _ticker) { clearInterval(_ticker); _ticker = null }
}

function liveBlocks() {
  return [...S._subBlocks.values()].filter((b) => b._subMeta && !b._subMeta.frozen
    && (b._subMeta.status === "running" || b._subMeta.status === "settled") && b.isConnected)
}

export function ensureTicker() {
  if (!_tickDisabled && !_ticker && liveBlocks().length > 0 && typeof setInterval === "function") {
    _ticker = setInterval(activityTick, TICK_MS)
  }
}

/** One tick — refresh live blocks' elapsed headers; stop when nothing lives. */
export function activityTick() {
  const live = liveBlocks()
  if (live.length === 0) {
    if (_ticker) { clearInterval(_ticker); _ticker = null }
    return
  }
  for (const b of live) {
    if (b._subMeta.status === "running") refreshBlock(b) // elapsed part ticks
  }
}

/** Ticker cleanup（ACTIVITY-SPLIT 评审 #1：resetActivity 清理行提来——行为与原内联行一致）。 */
export function stopTicker() {
  if (_ticker) { clearInterval(_ticker); _ticker = null }
}
