/**
 * tool-display.mjs — 工具块显示/计时/清扫 helper 族（2026-09-05 module-split：
 * tool-events.mjs 537 > 500 硬限——28-162 区（ticks/subActions maps、sweep/slim/
 * settle/async 探测/find）verbatim 迁入，语义零变；tool-events.mjs import 回
 * （buildToolCallbacks 调用点零改）+ re-export sweepToolBlocks（agent-turn 消费面）。
 * 注意：_subActions/_subActionQ/_toolTicks 为模块级**可变对象**导出——ESM 只读绑定
 * 不禁内容变更（.set/.delete/.push），调用方行为与同模块时代一致。
 */

// TUI-OOM-ROOTCAUSE（TUI.md §15.3.1）：显示层额度常量/工具行定位（display-budget 叶子）。
import { capLines, TOOL_RESULT_MAX_CHARS } from "./display-budget.mjs"

// Tool execution start timestamps (performance.now ms). Keyed by tool_call id
// when available (parallel same-name tools each get their own tick — the
// P0-3 fix, 2026-08-30), falling back to a per-name FIFO queue for callers
// without ids (subagent relay). FIFO shift assumes near-call-order completion;
// a parallel same-name batch finishing out of order swaps durations between
// siblings — same magnitude, both keep an elapsed (display-level, acceptable).

// Named caps (consult P2, 2026-08-30): inline 200/3/5 were magic numbers.
// CLI-ACTIVITY-DEBLOAT F-1 (2026-09-10): the report preview constants (former named caps)
// deleted with the conversation-stream preview (tool-events onToolResult) — the
// frozen block is the ONLY carrier of a child's report.
export const TOOL_OUTPUT_LINE_CAP = 200     // per-call streaming output ring buffer
export const REMINDER_CAP = 3               // max pending reminders shown on turn end
export const REMINDER_PERSIST_TURNS = 5     // persist reminders every N turns

export const _toolTicks = new Map()
// AGENT-LOOP-SUBAGENT.md §6.7 action registry: tool_call id → subagent action (non-spawn only — spawn is
// the default when no record exists). onToolCall sees the args, onToolResult only
// the name; without the record every subagent result would route as a spawn.
export const _subActions = new Map()
export const _subActionQ = [] // FIFO for subagent calls without a tool id (same fallback as tick queue)

export function tickStart(name, toolId) {
  const key = toolId ?? name
  if (toolId) { _toolTicks.set(key, performance.now()); return }
  const q = _toolTicks.get(key) ?? []
  q.push(performance.now())
  _toolTicks.set(key, q)
}

/** Settle one pending tick: by tool_call id, or per-name FIFO. Returns start or null. */
export function tickTake(name, toolId) {
  const key = toolId ?? name
  const v = _toolTicks.get(key)
  if (v === undefined) return null
  if (toolId) { _toolTicks.delete(key); return v }
  if (v.length === 0) { _toolTicks.delete(key); return null }
  const started = v.shift()
  if (v.length === 0) _toolTicks.delete(key)
  return started
}

/** P0-2 sweep (2026-08-30 consult): an interrupted turn (Ctrl+C / error) leaves
 *  running tool-block carriers without an onToolResult — their header would say
 *  "running" forever. runAgentTurn's finally calls this: mark them done with an
 *  "(interrupted)" status and clear the tick table so no stale start time leaks
 *  into the next turn. Mirrors freezeAllSubTasks for the tool-block family. */
export function sweepToolBlocks(state) {
  for (const l of state.lines ?? []) {
    const b = l._toolBlock
    if (b && !b.done) {
      b.done = true
      b.summary = "(interrupted)"
      b.interrupted = true
    }
  }
  _toolTicks.clear()
  _subActions.clear()
  _subActionQ.length = 0
}

/** Shared display guard for tool results — LIVE and RESTORE use the same
 *  function (P1, 2026-08-30 consult: restore lacked the live path's guards).
 *  1) Multimodal results (read_image) embed FULL base64 images in the JSON —
 *     the human needs only the text part (model gets images via the multimodal
 *     channel); 2) results beyond maxRows are truncated in the block (full
 *     text always lives in history for the model). Returns row array.
 *  TUI-OOM-ROOTCAUSE（§15.3.1 TOOL_RESULT_MAX_CHARS）：总量额度与 400 行双维
 *  （单行任意大——无 `\n` 巨 chunk/JSON 尾行），尾截断 + 标记。 */
export function slimToolResultForDisplay(result, maxRows = 400) {
  let displayResult = result
  try {
    const parsed = JSON.parse(result)
    if (parsed?.images?.length) displayResult = parsed.text ?? result
  } catch { /* not JSON — show as-is */ }
  const rows = String(displayResult).split("\n").filter((l) => l.trim())
  const capped = rows.length > maxRows
    ? [...rows.slice(0, maxRows), `… (result truncated at ${maxRows} rows — full text in history)`]
    : rows
  return capLines(capped, TOOL_RESULT_MAX_CHARS)
}

/** 按块定位其载体行（字符账 re-account 用——块对象唯一）。 */
export function findToolLine(state, name, toolId) {
  const block = findToolBlock(state, name, toolId)
  if (!block) return null
  for (const l of state.lines ?? []) if (l._toolBlock === block) return l
  return null
}
/** Mark the dispatch-level tool carrier done when its result is consumed by a
 *  dedicated branch (subagent/escalate/advisor blocks) — without this the turn
 *  sweep mislabels successful calls as "(interrupted)" (consult P1, 2026-08-30). */
export function settleToolBlock(state, name, toolId, summary) {
  const block = findToolBlock(state, name, toolId)
  if (block) {
    block.done = true
    block.summary = summary
    const started = tickTake(name, toolId)
    block.elapsed = started !== null ? Math.round(performance.now() - started) : null
  }
}

/** Async spawn detection (§15 D-A1): the subagent tool's async:true result is a
 *  status JSON ({id, role, status: running|queued}), NOT a report — the child
 *  keeps running, so its activity block must not be frozen at spawn time (it
 *  freezes via the ⟦ev⟧done event at settle — §15 D-A3). */
export function isAsyncSpawnResult(result) {
  try {
    const o = JSON.parse(result)
    return Boolean(o && typeof o === "object" && typeof o.id !== "undefined" && (o.status === "running" || o.status === "queued"))
  } catch {
    return false
  }
}

/** §7.2.3 spawn 门拒错误探测（T-F5）：subagent spawn 的机械拒绝以 {status:"error"}
 *  JSON 返回（例：manual auto-turn digest spawn 门——digest 语义 organize-only）——
 *  错误路径不得触发完成冻结（round1 #1——错误路径不冻结任何 running 块）。该形态只
 *  出现在无 subKey 的拒绝路径（成功路径恒带 dispatch 传的 ctx._subagentKey）。 */
export function isSpawnErrorResult(result) {
  try {
    const o = JSON.parse(result)
    return Boolean(o && typeof o === "object" && o.status === "error")
  } catch {
    return false
  }
}

/** Find the live tool-block carrier for a tool event: exact id match when the
 *  callback carries one (P0-3 — parallel same-name tools route to their own
 *  block); falls back to the last unfinished block of that name. */
export function findToolBlock(state, name, toolId) {
  const lines = state.lines ?? []
  if (toolId !== undefined && toolId !== null) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i]._toolBlock?.id === toolId) return lines[i]._toolBlock
    }
    return null
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    const b = lines[i]._toolBlock
    if (b && b.name === name && !b.done) return b
  }
  return null
}
