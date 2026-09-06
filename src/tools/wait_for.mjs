/**
 * wait_for.mjs — wait_for tool (TOOLS.md §16, CLI ops.mjs waitForTool parity).
 *
 * Condition wait: polls a semantic condition every interval_ms and returns as soon
 * as it holds or the timeout_ms ceiling passes. Replaces the deleted sleep tool —
 * the model never needs a bare delay: it waits FOR something, and only when that
 * something is genuinely async (a background subagent/consult still settling, a
 * file appearing, a port opening). Synchronous tools return when done — waiting
 * after them is the exact misuse that got sleep deleted.
 *
 * ctx.agent reachability (评审 #1): dispatch (agent/execute-tools.mjs) puts the
 * agent instance on the tool ctx — the async-subagent pool (_asyncSubagents,
 * aliasing history._asyncSubagents at depth 0 — agent.mjs), the consult sessions
 * (_consultSessions) and _advisorSession are all reachable through ctx.agent, so
 * the internal conditions read real state with no architecture change. Polling is
 * async (await setTimeout) — the event loop keeps running, so background async
 * work settles between polls.
 */
import { existsSync } from "node:fs"
import net from "node:net"
import { resolvePath } from "./shared.mjs"

/** wait_for bounds: a BUILT-IN ceiling replaces the unbounded sleep-then-wait —
 *  timeout_ms defaults to 30s (config.json agent.waitForTimeoutMs overrides),
 *  capped at WAIT_FOR_MAX_TIMEOUT_MS (600s — the execute-tool timeout convention);
 *  interval_ms defaults to 1s with a 100ms floor so polling never busy-spins. */
export const WAIT_FOR_DEFAULT_TIMEOUT_MS = 30_000
export const WAIT_FOR_MAX_TIMEOUT_MS = 600_000
export const WAIT_FOR_DEFAULT_INTERVAL_MS = 1_000
export const WAIT_FOR_MIN_INTERVAL_MS = 100

// Condition-source seam (§16 评审 #4): production uses the real evaluator
// (evaluateWaitForCondition); tests inject a deterministic fake source via
// setWaitForConditionSource (default null — production path unchanged).
let injectedConditionSource = null
export function setWaitForConditionSource(source) {
  injectedConditionSource = typeof source === "function" ? source : null
}

/** Parse a wait_for condition into { kind, arg }. Unknown conditions are an
 *  EXPLICIT error enumerating the supported forms (评审 #2 — never a silent wait
 *  on a misspelled condition). */
export function parseWaitForCondition(condition) {
  const c = String(condition ?? "").trim()
  let m
  if (c === "advisor settled") return { kind: "advisor", arg: null }
  if (c === "consult done") return { kind: "consult", arg: null }
  if ((m = c.match(/^subagent id:\s*(\d+) done$/))) return { kind: "subagent", arg: String(Number(m[1])) }
  if ((m = c.match(/^file exists:\s*(.+)$/))) return { kind: "file", arg: m[1].trim() }
  if ((m = c.match(/^port open:\s*(\d+)$/))) return { kind: "port", arg: Number(m[1]) }
  throw new Error(
    `wait_for: unsupported condition "${c}" — supported: "advisor settled", "subagent id:N done", "consult done", "file exists:path", "port open:N"`,
  )
}

/** Async-subagent pool of an agent — depth 0 aliases history._asyncSubagents
 *  (agent.mjs); subagent-scheduler uses the same history-first fallback rule. */
function asyncPool(agent) {
  if (!agent) return new Map()
  if (agent._asyncSubagents instanceof Map) return agent._asyncSubagents
  return agent.history?._asyncSubagents instanceof Map ? agent.history._asyncSubagents : new Map()
}

/** "subagent id:N done" — the async entry for N settled (status done / done flag)
 *  or already left the pool (moved to pending results / digested / never spawned —
 *  nothing is left to wait on). Absent ids are done by vacuity: the model waits on
 *  ids its own spawn ack just returned, so an id no longer in the pool means done.
 *  Dual key lookup (2026-09-06 advisor #1): VS Code pool keys are the numeric
 *  spawn-time id (subagent-async spawnAsyncSubagent), the CLI keys them as
 *  String(id) — accept both so neither end silently no-ops. */
function asyncEntryDone(agent, id) {
  const pool = asyncPool(agent)
  const key = String(id)
  const entry = pool.get(key) ?? pool.get(Number(key)) ?? null
  if (!entry) return true
  return entry.done === true || entry.status === "done"
}

/** Any async entry matching pred that is still running/queued (not done). */
function hasRunningAsync(agent, pred) {
  for (const e of asyncPool(agent).values()) {
    if (pred(e) && !(e.done === true || e.status === "done")) return true
  }
  return false
}

/** "consult done" — every consult session has drained (pending 0, parked into the
 *  digest stream) or was explicitly stopped (its children were aborted). No sessions
 *  → true (vacuously). §25 R17: sessions ride history._consultSessions (cross-run
 *  carrier — the agent object is per-run); a settled session parks and leaves the map. */
function consultAllDone(agent) {
  const map = agent?.history?._consultSessions instanceof Map
    ? agent.history._consultSessions
    : (agent?._consultSessions ?? null)
  if (!map || map.size === 0) return true
  for (const s of map.values()) {
    if (!s.stopped && (s.pending ?? 0) > 0) return false
  }
  return true
}

/** "port open:N" — 127.0.0.1 probe with a short connect timeout (never hangs a poll). */
function portOpenProbe(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port, timeout: 400 })
    let settled = false
    const finish = (v) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(v)
    }
    socket.once("connect", () => finish(true))
    socket.once("error", () => finish(false))
    socket.once("timeout", () => finish(false))
  })
}

/** Real condition evaluator (production path) — returns a boolean; throws on an
 *  unsupported condition string. */
export async function evaluateWaitForCondition(condition, ctx) {
  const parsed = parseWaitForCondition(condition)
  const agent = ctx?.agent
  switch (parsed.kind) {
    case "advisor":
      // Advisor reviews run as blocking tool calls (runAdvisorReview) or as
      // advisor-role async children — "settled" = no advisor-role entry still
      // running/queued in the async pool.
      return !hasRunningAsync(agent, (e) => e.role === "advisor")
    case "subagent":
      return asyncEntryDone(agent, parsed.arg)
    case "consult":
      return consultAllDone(agent)
    case "file":
      return existsSync(resolvePath(parsed.arg, ctx?.cwd ?? process.cwd()))
    case "port":
      return await portOpenProbe(parsed.arg)
    default:
      return false
  }
}

async function evalConditionSource(condition, ctx) {
  if (injectedConditionSource) return injectedConditionSource(condition, ctx)
  return evaluateWaitForCondition(condition, ctx)
}

export const waitForTool = {
  name: "wait_for",
  readonly: true,
  description:
    "Wait until a condition becomes true — polls the condition every interval_ms and returns as soon as it holds or the timeout_ms ceiling passes. Use it ONLY for genuinely asynchronous waits: an async subagent/consult still settling, a file appearing, a port opening. Synchronous tools (advisor, blocking subagent spawn) return when done — waiting after them is NOT needed and wastes time.\n" +
    "Parameters:\n" +
    '- condition (required): "advisor settled" (an in-flight advisor review finished) | "subagent id:N done" (async subagent N settled) | "consult done" (every consult_start session drained) | "file exists:path" | "port open:N". The agent-internal conditions apply to ASYNC sessions only — a synchronous call already completed before it returned. An unknown condition is an explicit error (`wait_for: unsupported condition "..."` — the supported forms are listed above), never a silent wait.\n' +
    "- interval_ms: poll interval (default 1000, floor 100)\n" +
    "- timeout_ms: overall ceiling (default 30000; config.json agent.waitForTimeoutMs overrides the default; hard cap 600000 like the execute tool)\n" +
    "Returns `wait_for: condition satisfied after Nms (N checks): \"<condition>\"` on success, `wait_for: timed out after Nms ...` when the ceiling passes with the condition still false (never burns beyond the ceiling); interrupts exit immediately.\n" +
    "Notes: read-only and non-destructive — it only observes (agent pools, the filesystem, a local port probe). Blocking by design — call it ALONE in a turn, not batched with calls that depend on its result.",
  parameters: {
    type: "object",
    properties: {
      condition: { type: "string", description: 'Condition expression — "advisor settled", "subagent id:N done", "consult done", "file exists:path", "port open:N"' },
      interval_ms: { type: "integer", description: "Poll interval in ms (default 1000, floor 100)" },
      timeout_ms: { type: "integer", description: "Overall timeout in ms (default 30000, cap 600000; config.json agent.waitForTimeoutMs overrides the default)" },
    },
    required: ["condition"],
  },
  async execute(args, ctx = {}) {
    const condition = typeof args?.condition === "string" ? args.condition.trim() : ""
    if (!condition) return "Error: condition is required"
    const intervalMs = Math.max(WAIT_FOR_MIN_INTERVAL_MS, Math.floor(args?.interval_ms ?? WAIT_FOR_DEFAULT_INTERVAL_MS))
    const cfgTimeout = ctx?.agent?.config?.agent?.waitForTimeoutMs
    const base = Number.isFinite(args?.timeout_ms)
      ? args.timeout_ms
      : Number.isFinite(cfgTimeout) && cfgTimeout > 0 ? cfgTimeout : WAIT_FOR_DEFAULT_TIMEOUT_MS
    const timeoutMs = Math.min(Math.max(1, Math.floor(base)), WAIT_FOR_MAX_TIMEOUT_MS)
    const started = Date.now()
    let polls = 0
    for (;;) {
      // Cancel/interrupt-safe exit（T-W7）：Ctrl+C / 定向 abort 传播——不吞信号、
      // 不把用户停变成工具错误。
      if (ctx.signal?.aborted) throw new Error("wait_for: interrupted by abort signal")
      polls++
      const ok = await evalConditionSource(condition, ctx)
      if (ok === true) {
        return `wait_for: condition satisfied after ${Date.now() - started}ms (${polls} check${polls === 1 ? "" : "s"}): "${condition}"`
      }
      const remaining = started + timeoutMs - Date.now()
      if (remaining <= 0) {
        return `wait_for: timed out after ${timeoutMs}ms waiting for "${condition}" (${polls} checks — condition never became true)`
      }
      await new Promise((r) => setTimeout(r, Math.min(intervalMs, remaining)))
    }
  },
}
