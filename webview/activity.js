/**
 * activity.js — 子代理活动块生命周期（B1 原地版——SESSION-FLOW-B F-B1b/F-B1c——
 * webview 镜像 CLI subagent-panel）。
 *
 * Live subagent/escalate/consult/advisor-async activity blocks render IN the
 * conversation flow: born appended to the #messages stream tail as stream-level
 * blocks — siblings of .message elements (落点 A), never embedded in a parent
 * block. On terminal states (done / stopped / error) the block FREEZES IN
 * PLACE (no DOM move — position == birth position, N3): collapsed block with
 * an identity header (✓/⏹ key · sync/async · model · done Ns · turn) + a dim
 * report preview inserted right after the block (≤8 lines — CLI
 * tool-events.mjs:187-191 parity; escalate gets no preview).
 *
 * §17 挂起例外: a "settled" (child finished while the suspension session is
 * live) does NOT freeze — the block stays LIVE in the flow at its birth
 * position with the "done · awaiting digestion" header until the digest
 * completes (host re-posts done — reclaimDigestedBlocks → freeze in place) or
 * the session exit freeze (freeze:true). 150 块 DOM 窗口（F-B1e）: live 与
 * 冻结子块从出生即计入 #messages 裁剪——无豁免（预算 = 并发池大小——池有界）。
 *
 * Header field sources (D-R22b 数据源映射): model/startedAt/pool ride the
 * existing "started" status events (rows/panels.js map) or the channel name
 * itself (consult/escalate embed the model in the key); elapsed is a local
 * event-managed 1s ticker (no wall-clock idle — interval runs only while live
 * blocks exist); turn n/max renders ONLY when a status message carries the
 * fields (empirically the events do not carry live turn today — degraded per
 * design D-R22b: the terminal done event carries the final entry turn for pool
 * children; live headers omit the part until then).
 *
 * Import graph: state/ui/i18n only — no panels/streaming import (both import
 * this module; no cycles). ui.js keeps appendAdvisorChunk/buildAdvisorBlock/
 * maybeScrollDown.
 */
import { ctx, S } from "./state.js"
import { t } from "./i18n.js"
import { buildAdvisorBlock, maybeScrollDown } from "./ui.js"

// Roles whose header carries the sync/async mode word (CLI SUBAGENT_ROLES +
// advisor parity — consult/escalate keys embed their model instead).
const FAMILY_ROLES = ["explore", "plan", "coder", "eng-coder", "advisor"]
const TICK_MS = 1000
const TAIL_LINES = 3
const PREVIEW_LINES = 8
const PREVIEW_LINE_CHARS = 120

// ─── Channel parsing ─────────────────────────────

/** Parse an activity channel name ("sub:eng-coder#1", "sub:consult glm-5.2 #4",
 *  "sub:escalate glm-5.2 #6") → { channel, label, role, id, model } (label = the
 *  header key — channel minus the "sub:" prefix). */
export function parseChannel(name) {
  const channel = String(name ?? "")
  const label = channel.startsWith("sub:") ? channel.slice(4) : channel
  const m = /^sub:(explore|plan|coder|eng-coder|advisor)#(\d+)$/.exec(channel)
  if (m) return { channel, label, role: m[1], id: Number(m[2]), model: null }
  const c = /^sub:(consult|escalate) (.+) #(\d+)$/.exec(channel)
  if (c) return { channel, label, role: c[1], id: Number(c[3]), model: c[2] } // 组序: c[2]=model 段, c[3]=数字 id（评审 #1——勿换位）
  return { channel, label, role: null, id: null, model: null }
}

/** Block names matching one child identity (message fields: role/id and — for
 *  consult whose key embeds the model — model/sessionId). Exported for the
 *  activity-flow test (两形态 coverage — family prefix/suffix + consult key). */
export function blockNamesFor(role, id, model, sessionId) {
  if (role === "consult" && model != null && sessionId != null) {
    return [`sub:consult ${model} #${sessionId}`]
  }
  const out = []
  for (const name of S._subBlocks.keys()) {
    if (name.startsWith(`sub:${role}`) && name.endsWith(`#${id}`)) out.push(name)
  }
  return out
}

/** Row-map lookup (S._subagentMap — row panel bookkeeping) for meta hydration:
 *  family/escalate rows are id-keyed; consult rows carry sessionId + model. */
function rowFor(ch) {
  if (ch.role === "consult") {
    for (const row of Object.values(S._subagentMap)) {
      if (row.role === "consult" && row.model === ch.model && String(row.sessionId) === String(ch.id)) return row
    }
    return null
  }
  const row = S._subagentMap[ch.id]
  return row && (ch.role === null || row.role === ch.role) ? row : null
}

// ─── Header / summary build ──────────────────────

/** Meta word helpers — visible wording rides locale keys (fallback raw). */
const W = {
  async: () => t("sub.async") || "async",
  sync: () => t("sub.sync") || "sync",
  done: () => t("sub.done") || "done",
  stopped: () => t("sub.stopped") || "stopped",
  error: () => t("sub.error") || "error",
  awaiting: () => t("sub.awaitingDigest") || "done · awaiting digestion",
  thinking: () => t("status.thinking") + "…",
}

/** Identity/status header line, e.g.:
 *  live   → "[▶ eng-coder#3 · async · glm-5.3 · 12s · turn 3/100] read x.mjs"
 *  frozen → "[✓ eng-coder#3 · async · glm-5.3 · done 15s · turn 4/100]"
 *  stopped→ "[⏹ eng-coder#3 · async · glm-5.3 · stopped 12s]"
 *  Parts are conditional on what the events actually carried (turn only with a
 *  real count — degraded mode, see module doc). */
function headerText(meta, now) {
  const frozen = meta.frozen
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
 *  awaiting-digestion — CLI currentTool parity. */
function stateWord(meta) {
  if (meta.status === "settled") return W.awaiting()
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
  // bracket + "done · awaiting digestion" state word. Live running: bracket +
  // current-tool/state word (stateWord() falls back to thinking…).
  hdr.textContent = headerText(meta, Date.now()) + (meta.frozen ? "" : " " + (meta.status === "settled" ? W.awaiting() : stateWord(meta)))
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
  // ⏹ — running pool children of the cancelable family only (T-M23 semantics:
  // never on sync spawns, never after terminal states).
  updateStopButton(block)
}

/** ⏹ stop overlay: visible only while running + pool-marked + cancelable role. */
function updateStopButton(block) {
  const meta = block._subMeta
  const btn = block.querySelector(".sub-stop-btn")
  const want = meta
    && !meta.frozen && meta.status === "running" && meta.pool === true
    && FAMILY_ROLES.includes(meta.role)
    && block.isConnected
  if (want && !btn) {
    const b = document.createElement("button")
    b.className = "sub-stop-btn"
    b.type = "button"
    b.dataset.subId = String(meta.id)
    b.dataset.subRole = meta.role
    b.textContent = "⏹"
    b.title = t("sub.stopBtn") || "Stop this subagent"
    block.appendChild(b)
  } else if (!want && btn) {
    btn.remove()
  }
}

// ─── Block lifecycle ─────────────────────────────

/** Get (create on first sight) the activity block for a channel name. The block
 *  is BORN IN the #messages flow (F-B1b) — appended to the current stream tail
 *  as a sibling of .message elements; freeze later folds the SAME element in
 *  place (no DOM move — N3; key/identity continuity — fold state carries over). */
export function ensureBlock(name) {
  let block = S._subBlocks.get(name)
  if (block) return block
  const ch = parseChannel(name)
  const row = rowFor(ch)
  block = buildAdvisorBlock(ch.label)
  block.classList.add("sub-block", "sub-live")
  block.dataset.subname = ch.channel
  block.dataset.subrole = ch.role ?? ""
  if (ch.id != null) block.dataset.subid = String(ch.id)
  block.open = true
  block._subMeta = {
    channel: ch.channel, label: ch.label, role: ch.role, id: ch.id, model: ch.model ?? (row?.model ?? null),
    startedAt: row?.startedAt ?? Date.now(), pool: row?.pool ?? null,
    turn: null, maxTurns: 0, status: "running", stateWord: null,
    doneAt: null, frozen: false, error: null, queued: false,
  }
  block.addEventListener("toggle", () => { if (block._subMeta && !block._subMeta.frozen) refreshBlock(block) })
  // 挂载点 = #messages 流尾（落点 A——流级独立块，150 裁剪只数直接子元素——F-B1e）。
  // 出生即钉底（maybeScrollDown——pinBottom 语义替代 R22 面板 scrollTop：用户上读
  // 时不强拉）。freezeBlock 不再移动该元素——终态在出生位原地折叠。
  if (ctx.messagesEl) {
    ctx.messagesEl.appendChild(block)
    maybeScrollDown(ctx)
  }
  S._subBlocks.set(name, block)
  ensureTicker()
  refreshBlock(block)
  return block
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

/** Status-message effects on blocks (rows are handled in panels.js). */
export function applySubagentStatus(m) {
  if (m.status === "started") {
    // Pool children of the cancelable family get their block at START (visible
    // before the first relay chunk; sync spawns create on first chunk).
    if (FAMILY_ROLES.includes(m.role) && m.pool && m.id != null) ensureBlock(`sub:${m.role}#${m.id}`)
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      // §27.1 F3（缺陷①）: 冻结块不收 started——不半复活（与终态分支同形）
      if (!block?._subMeta || block._subMeta.frozen) continue
      const meta = block._subMeta
      meta.status = "running"
      // pool 标记语义: async 池条目 started 携 pool:true；同步 spawn 不带 → false。
      // （escalate-async/advisor-async 亦携 pool:true——escalate 无 mode 词豁免）
      meta.pool = m.pool === true
      if (m.startedAt) meta.startedAt = m.startedAt
      if (m.model) meta.model = m.model
      if (m.maxTurns != null) meta.maxTurns = m.maxTurns
      if (m.turn != null) meta.turn = m.turn
      refreshBlock(block)
    }
    return
  }
  if (m.status === "queued") return // queued rows only — no activity block yet
  if (m.status === "settled") {
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      if (!block?._subMeta || block._subMeta.frozen) continue
      // B1（F-B1c）: settle 只翻状态——✓ + "done · awaiting digestion" 原地显示
      // （块已出生在流内出生位——无 freezeAnchor 记录、无 DOM move——N3 不变式）。
      // digest 完成后 host 补发 done → freezeBlock 原地冻结；settle 到 done 之间
      // 渲染的 digest 报告/后续消息自然排在块后（CLI _freezeAt 语义由出生时序
      // 结构性取代）。挂起期终态通知同携 entry 快照（subagent.mjs runChild
      // terminalStatus）——冻结头 turn 延续（digest 补发 done 不再带 turn——meta 已存）。
      block._subMeta.status = "settled"
      block._subMeta.doneAt = Date.now()
      if (m.maxTurns != null) block._subMeta.maxTurns = m.maxTurns
      if (m.turn != null) block._subMeta.turn = m.turn
      refreshBlock(block)
    }
    return
  }
  // Terminal statuses → freeze into the message flow.
  const kind = m.status === "done" ? "done"
    : m.status === "cancelled" ? "stopped"
    : m.status === "error" ? "error"
    : m.status === "answered" ? "done"
    : m.status === "terminated" ? "stopped"
    : m.status === "failed" ? "error"
    : null
  if (kind === null) return
  for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
    const block = S._subBlocks.get(name)
    if (!block?._subMeta || block._subMeta.frozen) continue
    const meta = block._subMeta
    if (kind === "error" && m.error) meta.error = m.error
    if (m.maxTurns != null) meta.maxTurns = m.maxTurns
    if (m.turn != null) meta.turn = m.turn
    freezeBlock(block, kind)
  }
}

/** Fold a live block IN PLACE (B1 F-B1c — no DOM move, position == birth
 *  position; N3): terminal status flip, class sub-live → sub-frozen, collapse
 *  (open=false), ⏹ removal, header refresh + dim report preview inserted right
 *  after the block (still in the flow — CLI tool-events parity; escalate
 *  excluded, stopped excluded). Blocks frozen from the §17 settled park show
 *  the digest's completion order: settle order == birth order — no anchor chain
 *  needed (the CLI _freezeAt machinery is structurally replaced by the birth
 *  timeline). */
export function freezeBlock(block, kind) {
  const meta = block._subMeta
  if (!meta || meta.frozen) return
  meta.status = kind === "stopped" ? "cancelled" : kind === "error" ? "error" : "done"
  meta.frozen = true
  meta.doneAt = meta.doneAt ?? Date.now()
  block.classList.remove("sub-live")
  block.classList.add("sub-frozen")
  block.open = false
  block.querySelector(".sub-stop-btn")?.remove()
  refreshBlock(block)
  if (kind === "done" || kind === "error") appendPreview(block) // stopped = interrupted — no report preview (CLI parity)
  ensureTicker()
}

/** Frozen report preview — last "text" row's first ≤8 lines, dim, in the flow
 *  (CLI tool-events.mjs:187-191 parity). escalate: no preview (legacy surface). */
function appendPreview(block) {
  const meta = block._subMeta
  if (!meta || meta.role === "escalate") return
  const content = block.querySelector(".advisor-content")
  if (!content) return
  const rows = [...content.children]
  // The final report = the last text-kind row (think rows excluded; tool rows
  // are activity, not report). Text rows merge same-kind runs, so the last one
  // holds the whole tail answer.
  let report = null
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].classList.contains("advisor-text") && rows[i].dataset.kind === "text") { report = rows[i].textContent; break }
  }
  if (!report || !report.trim()) return
  const lines = report.split("\n").map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return
  const preview = lines.slice(0, PREVIEW_LINES).map((l) => l.length > PREVIEW_LINE_CHARS ? l.slice(0, PREVIEW_LINE_CHARS - 1) + "…" : l).join("\n")
  const div = document.createElement("div")
  div.className = "sub-report-preview"
  div.textContent = preview + (lines.length > PREVIEW_LINES ? `\n… (${lines.length - PREVIEW_LINES} more lines)` : "")
  block.insertAdjacentElement("afterend", div)
}

/** Session-exit freeze (suspension freeze:true — §17.5.5 兜底): every block
 *  still live with a settled row freezes as done (in place — no move). */
export function freezeSettledBlocks() {
  for (const [id, row] of Object.entries(S._subagentMap)) {
    if (row.status !== "settled") continue
    for (const name of blockNamesFor(row.role, row.id ?? id, row.model, row.sessionId)) {
      const block = S._subBlocks.get(name)
      if (block?._subMeta && !block._subMeta.frozen) freezeBlock(block, "done")
    }
  }
  ensureTicker()
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

function ensureTicker() {
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

/** Full reset — turn end (!suspended), session clear / send: live blocks are
 *  REMOVED from the #messages flow (turn-scoped), map cleared, ticker stopped.
 *  Frozen blocks in #messages are NOT touched (F-B1d — they live in the
 *  conversation history until the 150-block DOM window trims them). Defensive:
 *  stray live blocks outside the map (edge paths) are removed by their
 *  .sub-block.sub-live class — frozen blocks never carry sub-live. */
export function resetActivity() {
  if (_ticker) { clearInterval(_ticker); _ticker = null }
  for (const block of S._subBlocks.values()) {
    if (block?._subMeta && !block._subMeta.frozen && block.isConnected) block.remove()
  }
  S._subBlocks.clear()
  // 防御清：map 外孤儿 live 块（非冻结点产生的残留路径）——frozen 不动
  for (const el of document.querySelectorAll(".sub-block.sub-live")) el.remove()
}
