/**
 * activity-view.js — 活动块呈现叶（ACTIVITY-REWRITE-SIMPLE——B1 流尾简单形态回归）。
 * 单一权威：块头/状态词/折叠 tail/⏹ 停止与取消控件（refreshBlock/updateStopButton/
 * noteChunk——语义随各函数 doc）。区显隐/pin/ticker/settle 驻留/awaiting·position·
 * waiting 词随容器与状态机加戏全删——块生命周期只有 live → frozen——头词事件驱动
 * （无 1s ticker——无 idle 时钟）。
 * 依赖：state.js + i18n.js——leaf——不依赖编排层 activity.js。
 */
import { t } from "./i18n.js"

// Roles whose header carries the sync/async mode word (CLI SUBAGENT_ROLES +
// advisor parity — consult/escalate keys embed their model instead).
export const FAMILY_ROLES = ["explore", "plan", "coder", "eng-coder", "eng-designer", "advisor"]
const TAIL_LINES = 3

/** Meta word helpers — visible wording rides locale keys (fallback raw). */
const W = {
  async: () => t("sub.async") || "async",
  sync: () => t("sub.sync") || "sync",
  done: () => t("sub.done") || "done",
  stopped: () => t("sub.stopped") || "stopped",
  error: () => t("sub.error") || "error",
  thinking: () => t("status.thinking") + "…",
}

/** Identity/status header line:
 *  live   → "[▶ eng-coder#3 · async · glm-5.3 · 12s · turn 3/100]"
 *  queued → "[⏳ eng-coder#4]"（等待块头——⏳ 即全部语义——无位置/原因词）
 *  frozen → "[✓ eng-coder#3 · async · glm-5.3 · done 15s · turn 4/100]"
 *  stopped→ "[⏹ eng-coder#3 · async · glm-5.3 · stopped 12s]"
 *  Parts are conditional on what the events actually carried（turn 只在真实计数值时）。 */
function headerText(meta, now) {
  const frozen = meta.frozen
  if (!frozen && meta.status === "queued") return `[⏳ ${meta.label}]`
  const sec = Math.max(0, Math.floor(((frozen ? (meta.doneAt ?? now) : now) - (meta.startedAt ?? now)) / 1000))
  let icon = "▶"
  let verb = null
  let note = null
  if (frozen) {
    if (meta.status === "cancelled") { icon = "⏹"; verb = W.stopped() }
    else if (meta.status === "error") { icon = "⏹"; verb = W.error(); note = meta.error ? String(meta.error) : null }
    else { icon = "✓"; verb = W.done() }
  }
  let head = `[${icon} ${meta.label}`
  // Mode word: family roles only (consult/escalate keys already carry their model).
  if (FAMILY_ROLES.includes(meta.role) && meta.pool != null && !meta.queued) {
    head += " · " + (meta.pool ? W.async() : W.sync())
  }
  if (meta.model && !["consult", "escalate"].includes(meta.role)) head += " · " + meta.model
  if (verb) head += ` · ${verb} ${sec}s`
  else head += ` · ${sec}s`
  if (meta.maxTurns > 0 && (meta.turn ?? 0) > 0) head += ` · turn ${meta.turn}/${meta.maxTurns}`
  head += "]"
  if (note) {
    const flat = note.replace(/\s+/g, " ").trim()
    if (flat) head += " — " + (flat.length > 140 ? flat.slice(0, 139) + "…" : flat)
  }
  return head
}

/** State word after the bracket (live running): last tool line tail / thinking…
 *  queued 头无外置词（⏳ 即全部语义）。 */
function stateWord(meta) {
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
 *  Safe to call on every chunk/status — ⏹ is a sibling overlay on the details
 *  element, not a summary child. */
export function refreshBlock(block) {
  const meta = block._subMeta
  if (!meta) return
  const summary = block.querySelector("summary")
  if (!summary) return
  summary.replaceChildren()
  const hdr = document.createElement("span")
  hdr.className = "sub-hdr"
  if (meta.frozen && (meta.status === "cancelled" || meta.status === "error")) hdr.classList.add("sub-stopped")
  // Frozen: bracket only (verb inside: done/stopped/error Ns). Live running:
  // bracket + state word (tool tail / thinking…). Queued: ⏳ bracket only.
  hdr.textContent = headerText(meta, Date.now())
    + (!meta.frozen && meta.status !== "queued" ? " " + stateWord(meta) : "")
  summary.appendChild(hdr)
  // Folded context: tail-3 dim lines under the header（live 折叠态或冻结态——终态折叠后
  // 块 = header + tail-3——内容保留可展开——无报告 preview 元素）。
  if (meta.frozen || !block.open) {
    const lines = tailLines(block, TAIL_LINES)
    if (lines.length) {
      const tail = document.createElement("span")
      tail.className = "sub-tail"
      tail.textContent = "\n" + lines.join("\n")
      summary.appendChild(tail)
    }
  }
  updateStopButton(block)
}

/** ⏹ overlay：live + cancelable family 角色时可见——running+pool（stop）或 queued 等待
 *  头（cancel queue——F-2 QUEUED-VISIBILITY）。标签区分两动作；title 每次刷新（幂等——
 *  queued→running 翻转重挂 title，locale 重设在内）。冻结块随 freeze 移除按钮（无 ⏹）。 */
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
