/**
 * activity.js — 子代理活动块生命周期（SESSION-ACTIVITY-REVISED——B1 修正——
 * CLI 单固定块面板形态回归——webview 镜像 CLI subagent-panel.mjs + subagent-freeze.mjs）。
 *
 * Live subagent/escalate/consult/advisor-async activity blocks render in the
 * FIXED ACTIVITY AREA (#subagent-activity — between #messages and the input):
 * born appended to the area container as siblings (parentNode = the area —
 * messages scroll never loses them), never embedded in a parent block. On
 * terminal states (done / stopped / error) the block FREEZES and MOVES INTO the
 * #messages flow: plain terminals append to the messages tail (CLI append
 * parity); §17 "settled" blocks (child finished while the suspension session is
 * live) stay parked in the AREA with the "done · awaiting digestion" header and
 * are inserted at their settle-time flow anchor (_freezeAtEl) when the digest
 * done re-post / session-exit freeze arrives — right BEFORE the digest report
 * that narrates them (CLI _freezeAt DOM 版). 150 块 DOM 窗口: 只数 #messages 内冻结
 * 块（live 块在活动区——不计窗——预算 = 并发池大小——池有界——裁剪函数零改）。
 *
 * Header field sources (D-R22b 数据源映射): model/startedAt/pool ride the
 * existing "started" status events (rows/panels.js map) or the channel name
 * itself (consult/escalate embed the model in the key); elapsed is a local
 * event-managed 1s ticker (no wall-clock idle — interval runs only while live
 * blocks exist); turn n/max renders ONLY when a status message carries the
 * fields (empirically the events do not carry live turn today — degraded per
 * design D-R22b: the terminal done event carries the final entry turn for pool
 * children; live headers omit the part until then). queued/waiting entries get
 * an AREA waiting block head ([⏳ key] + queued/waiting state word — no ⏹ —
 * never started; D-4) instead of a flow row.
 *
 * Import graph: state/ui/i18n only — no panels/streaming import (both import
 * this module; no cycles). ui.js keeps appendAdvisorChunk/maybeScrollDown (the
 * latter messages-only — the area pins its own bottom internally).
 */
import { ctx, S } from "./state.js"
import { t } from "./i18n.js"
import { buildAdvisorBlock, appendAdvisorChunk } from "./ui.js"

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

/** Row-map lookup (S._subagentMap — 行面板撤除后的簿记——仅供块 meta 水合):
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
  queued: () => t("sub.queued") || "queued",
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
  // ⏹ — running pool children of the cancelable family only (T-M23 semantics:
  // never on sync spawns, never after terminal states, never on queued heads).
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

// ─── Activity-area visibility & pin ─────────────

/** 区空隐藏（F-1/⑨）: 区内无块 → display none 零高（grid auto 行不占）；有块 → 显。
 *  与 base.css `#subagent-activity:empty{display:none}` 互为兜底（CSS 管静态空态；
 *  JS 管块生灭后的翻转——inline style 优先于 CSS 需显式复位）。 */
function updateAreaVisibility() {
  const area = ctx.subAgentArea
  if (!area) return
  area.style.display = area.children.length > 0 ? "" : "none"
}

/** 区内自滚管理——区底 pin（F-2）：区溢出（多块超 max-height 32vh）时新块出生若已在
 *  区底（近底 32px——与 messagesEl pinBottom 同语义）→ 滚到底；用户上读区内历史时
 *  不强拉。区内块内容增长在块内自滚（.advisor-content 100px）——区级 scrollHeight
 *  只随块生/灭变化——pin 只在出生/移除点评估。 */
function pinActivityArea() {
  const area = ctx.subAgentArea
  if (!area) return
  if (area.scrollHeight > area.clientHeight && area.scrollTop + area.clientHeight >= area.scrollHeight - 32) {
    area.scrollTop = area.scrollHeight
  }
}

// ─── Block lifecycle ─────────────────────────────

/** Get (create on first sight) the activity block for a channel name. The block
 *  is BORN IN the fixed activity area (F-1 — #subagent-activity container,
 *  between #messages and the input; messages scroll never displaces it); freeze
 *  later MOVES the element into the #messages flow (tail push / settle anchor —
 *  F-4). */
export function ensureBlock(name) {
  let block = S._subBlocks.get(name)
  if (block) {
    // 防御性清扫：map 中冻结块元素已被 150 窗口裁掉（isConnected=false）→ 迟来消息
    // 拿不到活元素——移出簿记（tombstone 语义由调用点 frozen 守卫承担——迟到 chunk
    // 丢弃路径见 streaming.subagentChunk）
    if (block._subMeta?.frozen && !block.isConnected) {
      S._subBlocks.delete(name)
      block = null
    } else {
      return block
    }
  }
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
    // F-4 落流锚（settle 时记录——CLI _freezeAt DOM 版）: 仅 settled 块携带
    _freezeAtEl: null, settleSeq: 0,
  }
  block.addEventListener("toggle", () => { if (block._subMeta && !block._subMeta.frozen) refreshBlock(block) })
  // 挂载点 = 活动区容器（F-1——不触碰 #messages——messages 滚动零扰动——live 固定可见）。
  if (ctx.subAgentArea) {
    ctx.subAgentArea.appendChild(block)
    pinActivityArea()
  }
  updateAreaVisibility()
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

/** Status-message effects on blocks (rows bookkeeping is in panels.js). */
export function applySubagentStatus(m) {
  if (m.status === "queued") {
    // D-4（SESSION-ACTIVITY-REVISED——queued 等待块头）: 排队 spawn 即建区内等待块头
    // （行面板撤除后 queued/waiting 等待态的唯一承载面——CLI waiting 块等价——F-3）。
    // 重复 queued（位置/等待态刷新——cancel 前移/依赖终态转移）覆盖式更新头；
    // 启动（started）后转 running（⏹ 随之出现——running+pool）；取消（was:"queued"）
    // 移除块头（从未启动——不冻结——CLI waiting 块移除同语义）。
    if (m.id == null || m.role == null) return
    const name = `sub:${m.role}#${m.id}`
    const block = ensureBlock(name)
    const meta = block._subMeta
    if (meta.frozen) return
    meta.status = "queued"
    meta.queued = true
    if (m.waiting) {
      meta.stateWord = "waiting" + (m.reason ? " — " + String(m.reason).replace(/\s+/g, " ").trim().slice(0, 64) : "")
    } else if (m.position != null) {
      meta.stateWord = `${W.queued()} · position ${m.position}`
    } else {
      meta.stateWord = W.queued()
    }
    refreshBlock(block)
    return
  }
  if (m.status === "started") {
    // Pool children of the cancelable family get their block at START (visible
    // before the first relay chunk; sync spawns create on first chunk). A queued
    // head (status queued) flips to running here — stale queue state word cleared.
    if (FAMILY_ROLES.includes(m.role) && m.pool && m.id != null) ensureBlock(`sub:${m.role}#${m.id}`)
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      // §27.1 F3（缺陷①）: 冻结块不收 started——不半复活（与终态分支同形）
      if (!block?._subMeta || block._subMeta.frozen) continue
      const meta = block._subMeta
      meta.status = "running"
      meta.stateWord = null // queued 头残留的等待标注清掉（转 running——由 chunk 状态词接管）
      meta.queued = false
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
  if (m.status === "settled") {
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      if (!block?._subMeta || block._subMeta.frozen) continue
      // F-4（SESSION-ACTIVITY-REVISED）: settle 翻状态 + 块留驻活动区（✓ "done ·
      // awaiting digestion"——区内等待 digest）——记落流锚 _freezeAtEl = settle 时
      // #messages 流尾元素（digest 报告流内排在锚后——digest done 补发时块插回
      // 报告前——CLI _freezeAt DOM 版）。多 settled 同锚按 settle 序升序落流
      // （settleSeq 单调——插入点 walk 见 freezeInsertPoint）。挂起期终态通知同携
      // entry 快照（terminalStatus）——冻结头 turn 延续（digest 补发 done 不再带
      // turn——meta 已存）。
      const meta = block._subMeta
      meta.status = "settled"
      meta.queued = false
      meta.doneAt = Date.now()
      meta._freezeAtEl = ctx.messagesEl ? ctx.messagesEl.lastElementChild : null
      meta.settleSeq = ++_settleSeq
      if (m.maxTurns != null) meta.maxTurns = m.maxTurns
      if (m.turn != null) meta.turn = m.turn
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
  // §20 D-SD3b: cancelled 带 was:"queued" = queued 取消（从未启动——无冻结）→ 等待
  // 块头移除（行面板撤前同语义——CLI waiting 块移除）。
  if (m.status === "cancelled" && m.was === "queued") {
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      if (block?._subMeta && !block._subMeta.frozen && block._subMeta.status === "queued") {
        S._subBlocks.delete(name)
        block.remove()
        updateAreaVisibility()
      }
    }
    return
  }
  const names = blockNamesFor(m.role, m.id, m.model, m.sessionId)
  let found = false
  for (const name of names) {
    const block = S._subBlocks.get(name)
    if (block?._subMeta) { found = true; break }
  }
  // ⑭ consult answered 无块防御（评审 #3——SESSION-ACTIVITY-REVISED）: answered 携
  // replyPreview 而无活动块（频道工具流未及建块/块已随重置消失——行面板撤后回复不
  // 得丢）→ 按 replyPreview 行快照建块再冻结（report 内容 = 快照行——digest 轮逐字
  // 呈现仍是回复权威呈现面——此块为防御承载）。
  if (!found && m.status === "answered" && m.model != null && m.sessionId != null && m.replyPreview) {
    const snap = ensureBlock(`sub:consult ${m.model} #${m.sessionId}`)
    appendAdvisorChunk(snap, "text", String(m.replyPreview))
    freezeBlock(snap, "done")
    return
  }
  for (const name of names) {
    const block = S._subBlocks.get(name)
    if (!block?._subMeta || block._subMeta.frozen) continue
    const meta = block._subMeta
    if (kind === "error" && m.error) meta.error = m.error
    if (m.maxTurns != null) meta.maxTurns = m.maxTurns
    if (m.turn != null) meta.turn = m.turn
    freezeBlock(block, kind)
  }
}

// ─── Freeze → 落流（F-4：CLI _freezeAt DOM 版——普通终态尾推 / settled 锚插）──

/** 落流插入点（settled 锚插用）：自锚向后 walk——同锚且 settle 更早的已冻结块
 *  （及其紧跟 preview）属于"应排在本块之前"的插入组——跳过；遇同锚 settle 更晚的
 *  冻结块/其他内容（digest 报告等）即停——本块插其前。任意到达序（digest 补发
 *  done = settle 升序；freezeSettledBlocks 退出批 = 已按 settleSeq 排序）下同锚
 *  相对序都 = settle 序（后 settle 先插进组——相对序 = settle 序——设计定论）。 */
function freezeInsertPoint(anchor, meta) {
  let el = anchor.nextSibling
  while (el) {
    const m = el._subMeta
    if (m?.frozen && m._freezeAtEl === anchor && (m.settleSeq ?? 0) < meta.settleSeq) {
      el = el.nextSibling
      if (el?.classList?.contains("sub-report-preview")) el = el.nextSibling
      continue
    }
    break
  }
  return el
}

/** Fold a live block AND MOVE it into the #messages flow (F-4 — B1 原地折叠的
 *  修正反转：DOM move 红线从"无 move"反转为"落流必 move"——区外冻结块 = 会话流
 *  历史一部分——150 裁剪只数冻结——区为纯 live 面): terminal status flip, class
 *  sub-live → sub-frozen, collapse (open=false), ⏹ removal, header refresh +
 *  dim report preview inserted right after the block in the flow (CLI parity;
 *  escalate excluded, stopped excluded). Plain terminals (never settled): tail
 *  push (appendChild — CLI append parity). §17 settled parkers: insert at
 *  meta._freezeAtEl 后（digest 报告前）——锚被 150 裁（isConnected=false）→ 尾推
 *  退化（⑫）。不强制滚动（折叠单行落定——不调 maybeScrollDown）。 */
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
  // 落流（DOM move——活动区 → #messages）: 区内移除由 insertBefore/appendChild 隐含。
  const target = ctx.messagesEl ?? block.parentNode
  if (target) {
    if (meta._freezeAtEl?.isConnected) target.insertBefore(block, freezeInsertPoint(meta._freezeAtEl, meta))
    else target.appendChild(block) // 普通终态/锚被裁（⑫ 尾推退化）
  }
  updateAreaVisibility()
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

// settle 序单调计数器（同锚多 settled 落流序——Date.now() 同毫秒不可靠）
let _settleSeq = 0

/** Session-exit freeze (suspension freeze:true — §17.5.5 兜底): every block
 *  still live with a settled row freezes as done (anchored insert — settle 序
 *  升序逐块——同锚相对序 = settle 序）。 */
export function freezeSettledBlocks() {
  const blocks = []
  for (const [id, row] of Object.entries(S._subagentMap)) {
    if (row.status !== "settled") continue
    for (const name of blockNamesFor(row.role, row.id ?? id, row.model, row.sessionId)) {
      const block = S._subBlocks.get(name)
      if (block?._subMeta && !block._subMeta.frozen && block._subMeta.status === "settled") blocks.push(block)
    }
  }
  blocks.sort((a, b) => (a._subMeta.settleSeq ?? 0) - (b._subMeta.settleSeq ?? 0))
  for (const block of blocks) freezeBlock(block, "done")
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

/** Full reset — turn abort（无挂起会话）/ session clear: live blocks are REMOVED
 *  from the activity AREA, map cleared, ticker stopped. Frozen blocks in
 *  #messages are NOT touched (F-4 — they live in the conversation history until
 *  the 150-block DOM window trims them). Defensive: stray live blocks outside
 *  the map (edge paths) are removed by their .sub-block.sub-live class — frozen
 *  blocks never carry sub-live. 区空即隐藏（updateAreaVisibility）。 */
export function resetActivity() {
  if (_ticker) { clearInterval(_ticker); _ticker = null }
  for (const block of S._subBlocks.values()) {
    if (block?._subMeta && !block._subMeta.frozen && block.isConnected) block.remove()
  }
  S._subBlocks.clear()
  // 防御清：map 外孤儿 live 块（非冻结点产生的残留路径）——frozen 不动
  for (const el of document.querySelectorAll(".sub-block.sub-live")) el.remove()
  updateAreaVisibility()
}
