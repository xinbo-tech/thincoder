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
import { describeToolArgs } from "./tool-args.mjs"

/** `role#id/` prefix router — hyphen included since the eng-coder fix (2026-08-21). */
export const SUB_PREFIX_RE = /^([\w-]+)#(\d+)\//
/** ⟦ev⟧ event token parser (D1/D2): `⟦ev⟧<name>\x1e<n>\x1e<max>\x1e<phase>\x1e<detail>`.
 *  phase "done" (§15 D-A3): async child finished — settle-time emits (each entry,
 *  it so the child's block freezes (the spawn tool result is a status JSON and
 *  must not freeze a still-running block). */
  // eslint-disable-next-line no-control-regex -- 有意为之：控制字符协议/转义序列剥离正则（ANSI/⟦ev⟧/SGR/history 双线分隔）
export const SUB_EVENT_RE = /^⟦ev⟧(turn|approval|done)\x1e([^\x1e]*)\x1e([^\x1e]*)\x1e([^\x1e]*)\x1e?([\s\S]*)$/
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
  // Tombstone guard (2026-08-30 consult residual): a child aborted mid-flight
  // can relay tail tokens AFTER its block was frozen — ensureSubTask must not
  // resurrect it (the recreated running block had no one left to freeze it and
  // sat pinned above the input box until the next turn).
  state._frozenSubKeys ??= new Set()
  if (state._frozenSubKeys.has(key)) return null
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
  if (!fresh && last && last.kind === kind) {
    // Merged append: account only the NET new lines. Counting the full split of
    // every single-line chunk (each ends with \n → 2 segments) would inflate the
    // incremental total far above the block's real line count (P1 修, 2026-08-30).
    const before = countBlockLines(last.text)
    last.text += text
    sub._lineCount = (sub._lineCount ?? 0) + countBlockLines(last.text) - before
  } else {
    sub.blocks.push({ kind, text })
    sub._lineCount = (sub._lineCount ?? 0) + countBlockLines(text)
  }
  sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
  trimSubBlocks(sub)
}

/** N2: keep at most SUB_BLOCK_LINE_LIMIT display lines per child; drop oldest
 *  lines and leave one cumulative "…（已省略 N 行）" marker block. Done blocks
 *  are bounded by the same cap (called from every append). */
export function trimSubBlocks(sub) {
  // Incremental line accounting (P1, 2026-08-30): appendSubBlock keeps
  // sub._lineCount; the old implementation recomputed the total with a full
  // blocks.reduce on EVERY append — O(n) per token, O(n²) over a stream.
  sub._lineCount = (sub._lineCount ?? 0)
  let over = sub._lineCount - SUB_BLOCK_LINE_LIMIT
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
  sub._lineCount -= droppedNow
  sub.dropped += droppedNow
  const marker = `…（已省略 ${sub.dropped} 行）`
  const first = sub.blocks[0]
  if (first && first.kind === "meta") first.text = marker
  else { sub.blocks.unshift({ kind: "meta", text: marker }); sub._lineCount += 1 }
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
  state._frozenSubKeys ??= new Set()
  state._frozenSubKeys.add(sub.key)
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

/** Mark ALL running blocks of the given role(s) done — session-level settle.
 *  A consult spawns N parallel children (consult#1..#N); the single-shot
 *  finishSubTask only ever settled the earliest one, leaving N-1 running
 *  ghosts pinned above the input box until turn end (consult residual,
 *  2026-08-30 consult review — 4/4 models converged on this). */
export function finishSubTasksByRole(state, roles, lastError = null) {
  state.subTasks ??= {}
  const roleSet = new Set(Array.isArray(roles) ? roles : [roles])
  for (const sub of Object.values(state.subTasks)) {
    if (!sub.done && roleSet.has(sub.role)) {
      sub.done = true
      sub.doneAt = Date.now()
      sub.currentTool = null
      sub.approval = null
      if (lastError) sub.lastError = lastError
      sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
    }
  }
}

/** Precise settle: mark the child of `role` whose [model] token recorded
 *  `model` as done. consult_check returns the reply's model — the earliest-
 *  running heuristic froze the WRONG block when models settle out of order. */
export function finishSubTaskByModel(state, role, model, lastError = null) {
  state.subTasks ??= {}
  // Model-string normalization (2026-08-30 follow-up consult): the [model]
  // token carries the BARE model name (resolveChildProvider keeps mname),
  // while consult_check's r.model is consultLabel = "provider:model". Compare
  // tail segments — a full "provider:model" reply matches a bare-name block.
  const want = String(model ?? "").includes(":") ? String(model).split(":").pop() : String(model ?? "")
  for (const sub of Object.values(state.subTasks)) {
    const have = String(sub.model ?? "")
    const haveTail = have.includes(":") ? have.split(":").pop() : have
    if (!sub.done && sub.role === role && haveTail === want) {
      sub.done = true
      sub.doneAt = Date.now()
      sub.currentTool = null
      sub.approval = null
      if (lastError) sub.lastError = lastError
      sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
      return sub
    }
  }
  return null
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
  if (!sub) return true // frozen tombstone — late token from an aborted child: drop
  const payload = t.slice(subMatch[0].length)
  // ⟦ev⟧ event token: turn/approval progress → header ONLY (never blocks,
  // never the main stream — D1). phase "done" (§15 D-A3): the async child
  // finished — freeze its block (it stayed live through the background run).
  if (payload.startsWith("⟦ev⟧")) {
    const ev = payload.match(SUB_EVENT_RE)
    if (ev?.[1] === "done") {
      sub.done = true
      sub.doneAt = Date.now()
      sub.currentTool = null
      sub.approval = null
      sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
      freezeSubTaskLines(state, sub)
      delete state.subTasks[sub.key]
      scheduleRender()
      return true
    }
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
  const sub = ensureSubTask(state, subMatch)
  if (!sub) return true // frozen tombstone — drop late token
  appendSubBlock(sub, "think", t.slice(subMatch[0].length))
  scheduleRender()
  return true
}

/** Child tool call → fresh tool block + header currentTool. */
export function routeSubToolCall(state, name, args, scheduleRender) {
  const subMatch = name.match(SUB_PREFIX_RE)
  if (!subMatch) return false
  const sub = ensureSubTask(state, subMatch)
  if (!sub) return true // frozen tombstone — drop late token
  sub.currentTool = name.slice(subMatch[0].length)
  sub.toolArgs = args
  sub.approval = null
  // 2026-08-31: 工具行带参数摘要（与主 agent 工具块同款 describeToolArgs 单源）——
  // 此前只显示工具名（bash 独享 "— 命令"），read/grep/glob 等全裸名。
  const argsDesc = describeToolArgs(sub.currentTool, args)
  appendSubBlock(sub, "tool", `❯ ${sub.currentTool}${argsDesc ? " " + argsDesc : ""}\n`, { fresh: true })
  scheduleRender()
  return true
}

/** Child tool output (D1 prefixed-name relay) → append into the CURRENT tool block.
 *  Data append immediate; render throttled (N1). */
export function routeSubToolOutput(state, name, part, scheduleRender) {
  const subMatch = name.match(SUB_PREFIX_RE)
  if (!subMatch) return false
  const sub = ensureSubTask(state, subMatch)
  if (!sub) return true // frozen tombstone — drop late token
  const toolName = name.slice(subMatch[0].length)
  appendSubBlock(sub, "tool", part.text + "\n", { fresh: sub.currentTool !== toolName })
  if (sub.currentTool !== toolName) sub.currentTool = toolName
  throttleSubRender(scheduleRender)
  return true
}

// ─── Compression panel (CONTEXT-COMPACTION.md §7 D-C2) ─────────────────────
// The compression session reuses the subagent block machinery — user ruling
// "压缩会话像子agent 面板那样显示". While the summary call is in flight the panel
// lives in state.subTasks (role "compress") and renders in the running subagent
// panel (subagent-panel.mjs) — the existing 1s turn ticker (agent-turn.mjs
// subRunning) makes the elapsed header tick; on completion/fallback it freezes
// into the stream as a collapsible block via freezeSubTaskLines, exactly like a
// finished child. The panel carries STATUS ONLY (D-C2): the summary body is a
// machine artifact and never enters the blocks.

let _compressSeq = 0

/** Live compression panel (role "compress", not done) or null. */
function liveCompressPanel(state) {
  return Object.values(state.subTasks ?? {}).find((s) => s.role === "compress" && !s.done) ?? null
}

/**
 * Open (or reset — retry) the compression panel. Fired by onCompressStart BEFORE
 * the summary LLM call. info.messages = number of history messages being
 * summarized ("summarizing N messages" stage label). Each attempt restarts the
 * elapsed ticker (panel.started); the previous attempt's failure line stays in
 * the block timeline so the retry history is visible.
 */
export function ensureCompressPanel(state, info = {}) {
  state.subTasks ??= {}
  let panel = liveCompressPanel(state)
  if (!panel) {
    panel = {
      key: `compress#${++_compressSeq}`,
      role: "compress",
      model: undefined,
      started: Date.now(), done: false, doneAt: null,
      blocks: [], currentTool: null, toolArgs: null,
      turn: 0, maxTurns: 0, approval: null,
      lastError: null, dropped: 0,
    }
    state.subTasks[panel.key] = panel
  }
  // Per-attempt reset (D-C2 state machine): retries return to "Compressing…",
  // the elapsed ticker restarts from this attempt's start.
  panel.done = false
  panel.doneAt = null
  panel.lastError = null
  panel.started = Date.now()
  panel.currentTool = "compressing context…"
  const messages = Number.isInteger(info.messages) && info.messages >= 0 ? info.messages : "?"
  appendSubBlock(panel, "status", "Compressing context…\n", { fresh: true })
  appendSubBlock(panel, "meta", `summarizing ${messages} messages\n`, { fresh: true })
  return panel
}

/** Failure state (onCompressFail): error text ONLY — no degradation note. The
 *  fallback note is bound to 3 CONSECUTIVE failures (markCompressFallback) and
 *  must not appear on a single failure (D-C2 state machine). */
export function markCompressFailed(state, error) {
  const panel = liveCompressPanel(state)
  if (!panel) return
  const text = error?.message ? String(error.message) : String(error ?? "unknown error")
  panel.lastError = text
  appendSubBlock(panel, "err", `Compression failed: ${text}\n`, { fresh: true })
}

/** Freeze the compression panel into the stream (collapsible, subagent-style —
 *  same carrier/fold-key as a finished child) and release the live entry. */
function freezeCompressPanel(state, panel) {
  freezeSubTaskLines(state, panel)
  delete state.subTasks[panel.key]
}

/** Completion state (onCompress, LLM summary): "Compressed: N tokens freed →
 *  summary (Xs)" — N = pre-compression estimate − post-compression estimate,
 *  Xs = elapsed seconds. Block frozen + collapsible (T2). */
export function markCompressDone(state, info = {}) {
  const panel = liveCompressPanel(state)
  if (!panel) return
  const tokensFreed = Number.isFinite(info.tokensFreed) ? Math.max(0, Math.round(info.tokensFreed)) : 0
  const seconds = Number.isFinite(info.elapsedMs) ? Math.max(0, Math.round(info.elapsedMs / 1000)) : 0
  panel.done = true
  panel.doneAt = Date.now()
  panel.currentTool = null
  appendSubBlock(panel, "status", `Compressed: ${tokensFreed} tokens freed → summary (${seconds}s)\n`, { fresh: true })
  freezeCompressPanel(state, panel)
}

/** Fallback state (onCompress with mode:"fallback"): the 3-consecutive-failures
 *  degradation note "Compression failed — fallback: truncated to N messages"
 *  (N = tail messages retained). Frozen + collapsible (T3b). */
export function markCompressFallback(state, info = {}) {
  const panel = liveCompressPanel(state)
  if (!panel) return
  const tailMessages = Number.isFinite(info.tailMessages) ? Math.round(info.tailMessages) : "?"
  panel.done = true
  panel.doneAt = Date.now()
  panel.currentTool = null
  appendSubBlock(panel, "err", `Compression failed — fallback: truncated to ${tailMessages} messages\n`, { fresh: true })
  freezeCompressPanel(state, panel)
}
