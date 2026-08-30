/**
 * subagent-blocks.mjs — 子agent 活动区块缓冲（AGENT-LOOP.md §7.2 D4，消费端）。
 *
 * state.subTasks[key] 是完整的活动缓冲：{ key, role, model, started, done, doneAt,
 * blocks: [{kind,text}], currentTool, toolArgs, turn, maxTurns, approval, lastError,
 * dropped, blockEpoch }。区块是子agent 活动的唯一载体（子工具调用不进父历史），
 * 跨 turn 保留、可重新展开；渲染为会话流内可折叠区块（render-conversation.mjs）。
 *
 * 数据层职责：前缀路由、事件 token 解析（D1/D2）、kind 合并追加、N2 环形上限、
 * N1 渲染节流（渲染调度节流，数据追加永不延迟）、完成冻结（freezeSubTaskLines
 * 家族——_frozenSubTask 载体行，渲染端 render-conversation.mjs 识别）。
 */

import { C } from "./ansi.mjs"

/** `role#id/` prefix router — hyphen included since the eng-coder fix (2026-08-21). */
export const SUB_PREFIX_RE = /^([\w-]+)#(\d+)\//
/** ⟦ev⟧ event token parser (D1/D2): `⟦ev⟧<name>\x1e<n>\x1e<max>\x1e<phase>\x1e<detail>`. */
export const SUB_EVENT_RE = /^⟦ev⟧(turn|approval)\x1e([^\x1e]*)\x1e([^\x1e]*)\x1e([^\x1e]*)\x1e?([\s\S]*)$/
/** N2: per-child display-line ring buffer cap — oldest lines drop with a marker. */
export const SUB_BLOCK_LINE_LIMIT = 500
/** N1: render-layer throttle for child tool-output appends (generation relays verbatim). */
export const SUB_RELAY_THROTTLE_MS = 250
/** Roles a subagent tool child can take (finishSubTask matches the block's role). */
export const SUBAGENT_ROLES = ["sub", "explore", "plan", "coder", "eng-coder"]

let _subRenderLast = 0
let _subRenderTimer = null

/** N1 throttle: leading-edge render + one coalesced trailing flush (final chunk
 *  within a window is not lost). Data appends are NEVER throttled — rendering only. */
export function throttleSubRender(scheduleRender) {
  const now = performance.now()
  const wait = SUB_RELAY_THROTTLE_MS - (now - _subRenderLast)
  if (wait <= 0) {
    _subRenderLast = now
    scheduleRender()
    return
  }
  if (_subRenderTimer) return
  _subRenderTimer = setTimeout(() => {
    _subRenderTimer = null
    _subRenderLast = performance.now()
    scheduleRender()
  }, wait)
  _subRenderTimer.unref?.()
}

export function ensureSubTask(state, subMatch) {
  const key = `${subMatch[1]}#${subMatch[2]}`
  state.subTasks ??= {}
  if (!state.subTasks[key]) {
    state.subTasks[key] = {
      key, role: subMatch[1], model: undefined, started: Date.now(), done: false, doneAt: null,
      blocks: [], currentTool: null, toolArgs: null, turn: 0, maxTurns: 0, approval: null,
      lastError: null, dropped: 0,
    }
  }
  return state.subTasks[key]
}

const countBlockLines = (text) => text.split("\n").length

/** Append (kind-merging) with the N2 ring-buffer cap. fresh=true starts a new block
 *  even when the previous block has the same kind (used per tool call). */
export function appendSubBlock(sub, kind, text, { fresh = false } = {}) {
  if (!text) return
  const last = sub.blocks.at(-1)
  if (!fresh && last && last.kind === kind) last.text += text
  else sub.blocks.push({ kind, text })
  sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
  trimSubBlocks(sub)
}

/** N2: keep at most SUB_BLOCK_LINE_LIMIT display lines per child; drop oldest
 *  lines and leave one cumulative "…（已省略 N 行）" marker block. Done blocks
 *  are bounded by the same cap (called from every append). */
export function trimSubBlocks(sub) {
  const total = () => sub.blocks.reduce((n, b) => n + countBlockLines(b.text), 0)
  let over = total() - SUB_BLOCK_LINE_LIMIT
  if (over <= 0) return
  let droppedNow = 0
  while (over > 0 && sub.blocks.length > 0) {
    const first = sub.blocks[0]
    const lines = countBlockLines(first.text)
    const take = Math.min(lines, over)
    if (take >= lines) {
      sub.blocks.shift()
      droppedNow += lines
    } else {
      first.text = first.text.split("\n").slice(take).join("\n")
      droppedNow += take
    }
    over -= take
  }
  sub.dropped += droppedNow
  const marker = `…（已省略 ${sub.dropped} 行）`
  const first = sub.blocks[0]
  if (first && first.kind === "meta") first.text = marker
  else sub.blocks.unshift({ kind: "meta", text: marker })
}

/** Mark the earliest running child of the given role(s) as done (✓ header, frozen elapsed). */
export function finishSubTask(state, roles, lastError = null) {
  state.subTasks ??= {}
  const roleSet = new Set(Array.isArray(roles) ? roles : [roles])
  const running = Object.values(state.subTasks)
    .filter((s) => !s.done && roleSet.has(s.role))
    .sort((a, b) => a.started - b.started)
  if (running.length === 0) return
  const sub = running[0]
  sub.done = true
  sub.doneAt = Date.now()
  sub.currentTool = null
  sub.approval = null
  if (lastError) sub.lastError = lastError
  sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
}

/** Freeze a finished (or interrupted) child's activity block into state.lines
 *  (§7.2 D4 — the block is the child activity's only carrier; moved here from
 *  agent-turn.mjs 2026-08-30). Rendering it as a pinned conversation-tail section
 *  made every ✓ block a permanent "ghost" stuck above the input box (user report
 *  2026-08-30); frozen into the stream it scrolls away with the conversation AND
 *  stays an independent collapsible block — the folded form is a single header
 *  summary line, the expanded form re-renders the full activity timeline from the
 *  SAME block source. The payload travels as a JSON line flagged with
 *  _frozenSubTask; render-conversation.mjs recognizes it and renders the ▶/▼
 *  interaction keyed by `sub-${key}` (user ruled 2026-08-30: clickable after
 *  freezing — full design interaction, not a dim-lines fallback). subTasks loses
 *  the entry on release; memory stays bounded by N2 (ring buffer already applied). */
export function freezeSubTaskLines(state, sub) {
  if (!sub) return
  sub.done = true
  sub.doneAt = sub.doneAt ?? Date.now()
  state.lines.push({ text: `subagent activity: ${sub.key}`, color: C.dim, _frozenSubTask: sub })
}

/** Freeze + release every already-done child block (tool-result sweep:
 *  subagent/escalate/consult-check completions each call this after finishSubTask). */
export function freezeDoneSubTasks(state) {
  for (const key of Object.keys(state.subTasks ?? {})) {
    if (state.subTasks[key].done) {
      freezeSubTaskLines(state, state.subTasks[key])
      delete state.subTasks[key]
    }
  }
}

/** Turn-end sweep (runAgentTurn finally): freeze ALL remaining blocks — interrupted
 *  runs (Ctrl+C abort / error mid-turn) would otherwise linger as pinned ghosts
 *  above the input box. Not-done children get done + lastError="interrupted"
 *  (skipped when the status already recovered to "Ready"). */
export function freezeAllSubTasks(state) {
  for (const key of Object.keys(state.subTasks ?? {})) {
    const sub = state.subTasks[key]
    if (!sub.done) {
      sub.done = true
      sub.doneAt = Date.now()
      if (!sub.lastError && state.status !== "Ready") sub.lastError = "interrupted"
    }
    freezeSubTaskLines(state, sub)
    delete state.subTasks[key]
  }
}

/**
 * Apply one ⟦ev⟧ event token payload to the child's block header (D1/D2):
 * turn/approval update turn n/max + waiting state. Events NEVER enter blocks
 * or the main stream — header only.
 * @returns {boolean} true = payload was a well-formed event token (consumed)
 */
export function applySubEvent(sub, payload) {
  const ev = payload.match(SUB_EVENT_RE)
  if (!ev) return false
  if (ev[1] === "turn") {
    sub.turn = Number(ev[2]) || sub.turn
    sub.maxTurns = Number(ev[3]) || sub.maxTurns
    sub.approval = null
  } else if (ev[1] === "approval") {
    sub.turn = Number(ev[2]) || sub.turn
    sub.maxTurns = Number(ev[3]) || sub.maxTurns
    sub.approval = ev[5] ? ev[5].slice(0, 40) : (ev[4] === "approval" ? "tool" : ev[4])
  }
  return true
}

// ─── Prefix routing (agent-turn callbacks delegate here) ────────────────────
// Each router returns true when the name/token carried a role#id/ prefix and was
// consumed into the child's block buffer; false = not a child item (main path).

/** Child LLM text / `[model]` metadata / ⟦ev⟧ event token (onToken branch). */
export function routeSubToken(state, t, scheduleRender) {
  const subMatch = t.match(SUB_PREFIX_RE)
  if (!subMatch) return false
  const sub = ensureSubTask(state, subMatch)
  const payload = t.slice(subMatch[0].length)
  // ⟦ev⟧ event token: turn/approval progress → header ONLY (never blocks,
  // never the main stream — D1).
  if (payload.startsWith("⟦ev⟧")) {
    applySubEvent(sub, payload)
    scheduleRender()
    return true
  }
  // `[model]<name>` metadata token: record the subagent's model (may differ from the
  // parent's) — shown in the block header, NOT appended to its content stream.
  // Only treat as metadata when the model isn't set yet (it's always the FIRST token);
  // a child content token that happens to start with "[model]" must not be swallowed.
  if (payload.startsWith("[model]") && sub.model === undefined) {
    sub.model = payload.slice(7)
    scheduleRender()
    return true
  }
  // Child LLM text → text block (N2 cap inside appendSubBlock).
  appendSubBlock(sub, "text", payload)
  scheduleRender()
  return true
}

/** Child reasoning token → think block (F2: same treatment as main reasoning). */
export function routeSubReasoning(state, t, scheduleRender) {
  const subMatch = t.match(SUB_PREFIX_RE)
  if (!subMatch) return false
  appendSubBlock(ensureSubTask(state, subMatch), "think", t.slice(subMatch[0].length))
  scheduleRender()
  return true
}

/** Child tool call → fresh tool block + header currentTool. */
export function routeSubToolCall(state, name, args, scheduleRender) {
  const subMatch = name.match(SUB_PREFIX_RE)
  if (!subMatch) return false
  const sub = ensureSubTask(state, subMatch)
  sub.currentTool = name.slice(subMatch[0].length)
  sub.toolArgs = args
  sub.approval = null
  appendSubBlock(sub, "tool", `❯ ${sub.currentTool}${args?.command ? " — " + String(args.command).replace(/\s+/g, " ").trim().slice(0, 80) : ""}\n`, { fresh: true })
  scheduleRender()
  return true
}

/** Child tool output (D1 prefixed-name relay) → append into the CURRENT tool block.
 *  Data append immediate; render throttled (N1). */
export function routeSubToolOutput(state, name, part, scheduleRender) {
  const subMatch = name.match(SUB_PREFIX_RE)
  if (!subMatch) return false
  const sub = ensureSubTask(state, subMatch)
  const toolName = name.slice(subMatch[0].length)
  appendSubBlock(sub, "tool", part.text + "\n", { fresh: sub.currentTool !== toolName })
  if (sub.currentTool !== toolName) sub.currentTool = toolName
  throttleSubRender(scheduleRender)
  return true
}
