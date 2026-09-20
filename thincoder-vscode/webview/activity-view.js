/**
 * activity-view.js — 活动块呈现叶（2026-09-12 活动区收口——WEBVIEW.md §14 现行机制）。
 * 单一权威：块头/状态词/折叠 tail/⏹ 停止与取消控件（refreshBlock/updateStopButton/
 * noteChunk——语义随各函数 doc）。块生命周期 live → frozen（frozen 上 awaitingDigest
 * 单标志 = 待消化驻留态词）；头词事件驱动（无 1s ticker——elapsed 由 panels `_panelTimer`
 * 2s 同点 refreshLiveHeaders 刷新）；区显隐 = CSS `:empty`、区 pin = ui.js 滚动族
 * （maybeScrollActivity/initScrollFollow）——本叶零参与显隐/pin。
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
  queued: () => t("sub.queued") || "queued",
  waiting: () => t("sub.waiting") || "waiting",
  thinking: () => t("status.thinking") + "…",
}

/** Identity/status header line:
 *  live   → "[▶ eng-coder#3 · async · glm-5.3 · 12s · turn 3/100]" + 状态词
 *  queued → "[⏳ eng-coder#4 · queued|waiting]"（#118 R4：`kind` 判词——CLI `:73` 对位）
 *           + 状态区排队信息（C-11②：位置/原因）
 *  frozen → "[✓ eng-coder#3 · async · glm-5.3 · done 15s · turn 4/100]"
 *  awaiting（settled 待消化）→ "[✓ eng-coder#3 · async · glm-5.3 · 15s] done · awaiting digestion"
 *           （C-2：括号去 verb + awaiting 态词）
 *  stopped→ "[⏹ eng-coder#3 · async · glm-5.3 · stopped 12s]"（该面**零注记**——#134 ② 收口：
 *           原因词与 verb 重复 ⇒ relay 不传；CLI 标尺同面零注记）
 *  live 审批 → "[⏸ coder#2 · async · …] 等待审批: write"（§18 C-8——icon 覆盖 ▶）
 *  冻结注记 → 尾接 ` — <note>`（X6/X11：done 停因（turn-cap / stopped-by-user）与 X11 `interrupted`
 *           读 `meta.note`；error 则读 `meta.error`）
 *  Parts are conditional on what the events actually carried（turn 只在真实计数值时）。 */
function headerText(meta, now) {
  const frozen = meta.frozen
  // #118 R4：排队头状态词（判据 = 载荷 `kind`——CLI `subagent-panel.mjs:73` 同形）：`kind === "slot"`
  // ⇒ queued；其余（含 `kind` 缺省 = 降级态）+ 与 R5 降级形同一判据 ⇒ waiting。
  if (!frozen && meta.status === "queued") {
    return `[⏳ ${meta.label} · ${meta.queueInfo?.kind === "slot" ? W.queued() : W.waiting()}]`
  }
  const sec = Math.max(0, Math.floor(((frozen ? (meta.doneAt ?? now) : now) - (meta.startedAt ?? now)) / 1000))
  let icon = "▶"
  let verb = null
  let note = null
  // §18 C-8（child permission gate）：live 审批态（child ask 在途）→ ⏸ 覆盖 ▶；终态
  // 图标不覆盖（冰冻头词优先——freezeBlock 已清 approval）。
  if (!frozen && meta.approval) icon = "⏸"
  if (frozen) {
    if (meta.status === "cancelled") { icon = "⏹"; verb = W.stopped() }
    else if (meta.status === "error") { icon = "⏹"; verb = W.error(); note = meta.error ? String(meta.error) : null }
    else { icon = "✓"; verb = W.done() }
    // X6/X11（显示面消差批 §2.2 · 收口轮 #134 ②）：注记承面由「仅 error」扩到 done（+ X11 interrupted）
    // ——载体 = `meta.note`（turn-cap / stopped-by-user / interrupted 共用单一字段）；error 面维持 `meta.error`（零回归）。
    if (meta.status !== "error" && meta.note) note = String(meta.note)
  }
  let head = `[${icon} ${meta.label}`
  // Mode word: family roles only (consult/escalate keys already carry their model).
  if (FAMILY_ROLES.includes(meta.role) && meta.pool != null && !meta.queued) {
    head += " · " + (meta.pool ? W.async() : W.sync())
  }
  if (meta.model && !["consult", "escalate"].includes(meta.role)) head += " · " + meta.model
  if (verb && !meta.awaitingDigest) head += ` · ${verb} ${sec}s` // awaiting：括号去 verb（C-2）
  else head += ` · ${sec}s`
  if (meta.maxTurns > 0 && (meta.turn ?? 0) > 0) head += ` · turn ${meta.turn}/${meta.maxTurns}`
  head += "]"
  if (note) {
    const flat = note.replace(/\s+/g, " ").trim()
    if (flat) head += " — " + (flat.length > 140 ? flat.slice(0, 139) + "…" : flat)
  }
  return head
}

/** State word after the bracket:
 *  - awaitingDigest 驻留（C-2）→ `t("sub.awaitingDigest")`（en 逐字 `done · awaiting digestion`）
 *  - approval（C-8）→ `t("sub.awaitingApproval", { tool })`（child ask 在途——最高优先级；
 *    清态（tool:null）即回落）
 *  - queued（C-11②/#118 R5）→ **`kind` 优先**（CLI `thincoder-cli/src/tui/subagent-panel.mjs:100-102`
 *    同形）：`kind === "slot"` ⇒ `t("sub.queueSlot", {n: position})`；其余（含 `kind` 缺省）⇒
 *    `reason` 原文零改写；无 `reason` ⇒ 中性回落 `t("sub.queued")`（= CLI `queued.detail || "queued"`）
 *  - live running → 结构化工具行（C-11①：`tool — cmd ≤60`）/ 工具文本尾句 / thinking… */
function stateWord(meta) {
  if (meta.approval) return t("sub.awaitingApproval", { tool: meta.approval }) || `Awaiting approval: ${meta.approval}`
  if (meta.awaitingDigest) return t("sub.awaitingDigest") || "done · awaiting digestion"
  if (meta.status === "queued" && !meta.frozen) {
    const q = meta.queueInfo
    if (q?.kind === "slot") return t("sub.queueSlot", { n: q.position ?? "?" }) || `queued · position ${q?.position ?? "?"} (slot full)`
    if (q?.reason) return String(q.reason) // wait/depc：detail 原文（CLI 同形——零改写）
    return t("sub.queued") || "queued" // 降级 / 空 detail：中性回落（= CLI `queued.detail || "queued"`）
  }
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
    + (!meta.frozen || meta.awaitingDigest ? " " + stateWord(meta) : "")
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

/** ⏹ overlay：live + cancelable family 角色时可见——running+pool（stop）、queued 等待
 *  头（cancel queue——F-2 QUEUED-VISIBILITY）或 **running+syncLive**（X10：宿主确证可中止的
 *  sync 子代理——核 registry 只读判定）时可见。标签区分两动作（sync =停标签同 async）；
 *  title 每次刷新（幂等——queued→running 翻转重挂 title，locale 重设在内）。冻结块随 freeze
 *  移除按钮（无 ⏹）。 */
function updateStopButton(block) {
  const meta = block._subMeta
  let btn = block.querySelector(".sub-stop-btn")
  const cancelingQueued = meta && !meta.frozen && meta.status === "queued"
  const want = meta
    && !meta.frozen
    && ((meta.status === "running" && (meta.pool === true || meta.syncLive === true)) || cancelingQueued)
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

/** Chunk-level state-word tracking (think → thinking…; tool → `${tool} — ${cmd ≤60}`
 *  or legacy line tail; result chunk 不改写状态区 — CLI currentTool parity §14 C-11①). */
export function noteChunk(block, kind, text, m) {
  if (!block?._subMeta || block._subMeta.frozen) return
  const meta = block._subMeta
  if (kind === "tool") {
    if (typeof m?.tool === "string" && m.tool) {
      // 结构化工具字段（C-11①）：`${tool} — ${cmd ≤60}`（无 cmd 仅 tool）
      const cmd = typeof m.cmd === "string" ? m.cmd.replace(/\s+/g, " ").trim() : ""
      meta.stateWord = cmd ? `${m.tool} — ${cmd.length > 60 ? cmd.slice(0, 59) + "…" : cmd}` : m.tool
    } else if (/^→ /.test(String(text ?? ""))) {
      return // 结果 chunk 不改写状态区（CLI currentTool 语义——C-11①）
    } else {
      const lines = String(text ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
      const tail = lines[lines.length - 1] ?? ""
      const flat = tail.replace(/\s+/g, " ").trim()
      meta.stateWord = flat ? (flat.length > 64 ? flat.slice(0, 63) + "…" : flat) : meta.stateWord
    }
    refreshBlock(block)
  } else if (kind === "think") {
    meta.stateWord = W.thinking()
    refreshBlock(block)
  }
}
