/**
 * ops.mjs — operational tools: file_ops (move/copy/rename), process (list),
 * get_current_time, wait_for (condition wait). Each exists so the model reaches
 * for a dedicated tool instead of shelling out to `bash` for the same operation
 * (parity with thinworker).
 */
import { DESC, resolveInCwd, truncate } from "./shared.mjs"
// 单一写路径点（编辑器编辑径注入缝——CORE-UNIFICATION §2.13.5）：路径操作也经它落盘
// （默认径 = 既有 cp / rename / EXDEV 回退语义，零行为变）。
import { writeThroughPath } from "./write-path.mjs"
import { existsSync } from "node:fs"
import { execFileSync } from "node:child_process"
import net from "node:net"

// ─── file_ops ──────────────────────────────────────────────────

export const fileOpsTool = {
  name: "file_ops",
  description: DESC("file_ops"),
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["move", "copy", "rename"], description: "move | copy | rename" },
      source: { type: "string", description: "Source path, relative to cwd or absolute" },
      dest: { type: "string", description: "Destination path" },
    },
    required: ["action", "source", "dest"],
  },
  readonly: false,
  async execute({ action, source, dest }, ctx) {
    if (typeof source !== "string" || !source) return "Error: source is required"
    if (typeof dest !== "string" || !dest) return "Error: dest is required"
    if (!["move", "copy", "rename"].includes(action)) return `Error: action must be move | copy | rename (got "${action}")`
    const src = resolveInCwd(ctx, source)
    const dst = resolveInCwd(ctx, dest)
    if (src === dst) return "Error: source and dest resolve to the same path"

    // move & rename share the rename syscall; cross-device move falls back to copy+rm
    // （回退语义住写路径点——§2.13.5）。
    await writeThroughPath(src, null, { op: action, dest: dst })
    const verb = action === "copy" ? "Copied" : action === "rename" ? "Renamed" : "Moved"
    return `${verb} ${source} → ${dest}`
  },
}

// ─── process ───────────────────────────────────────────────────

export const processTool = {
  name: "process",
  description: DESC("process"),
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Optional name substring filter (case-insensitive)" },
    },
  },
  readonly: true,
  async execute({ name }, ctx) {
    const filter = typeof name === "string" && name.trim() ? name.trim().toLowerCase() : null
    let rows
    try {
      rows = process.platform === "win32" ? listWindows() : listPosix()
    } catch (e) {
      return `process listing failed: ${e?.message ?? String(e)}`
    }
    if (filter) rows = rows.filter((r) => r.name.toLowerCase().includes(filter))
    if (rows.length === 0) return filter ? `No running processes match "${name}"` : "(no processes)"
    return truncate(rows.map((r) => `${r.name}\tPID ${r.pid}${r.mem ? `\t${r.mem}` : ""}`).join("\n"))
  },
}

function listWindows() {
  // tasklist /FO CSV /NH → lines: "name.exe","1234","Console","1","12,345 K"
  const out = execFileSync("tasklist", ["/FO", "CSV", "/NH"], { encoding: "utf8", timeout: 10000 })
  const rows = []
  for (const line of out.split("\n")) {
    const parts = line.split('","')
    if (parts.length < 2) continue
    const name = parts[0].replace(/^"/, "").trim()
    const pid = parts[1].replace(/"/, "").trim()
    const mem = parts[4] ? parts[4].replace(/"/, "").trim() : ""
    if (!name || !pid) continue
    rows.push({ name, pid, mem })
  }
  return rows
}

function listPosix() {
  const out = execFileSync("ps", ["-eo", "pid=,comm="], { encoding: "utf8", timeout: 10000 })
  const rows = []
  for (const line of out.split("\n")) {
    const m = line.trim().match(/^(\d+)\s+(.+)$/)
    if (m) rows.push({ name: m[2], pid: m[1], mem: "" })
  }
  return rows
}

// ─── get_current_time ──────────────────────────────────────────

export const getCurrentTimeTool = {
  name: "get_current_time",
  description: DESC("get_current_time"),
  parameters: { type: "object", properties: {} },
  readonly: true,
  async execute() {
    const now = new Date()
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown"
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return `Date: ${now.toISOString()} (UTC)\nTimezone: ${tz}\nWeekday: ${days[now.getDay()]}\nLocal: ${now.toLocaleString()}`
  },
}

// ─── wait_for ───────────────────────────────────────────────────

/** wait_for bounds (TOOLS.md §16): a BUILT-IN ceiling replaces the unbounded
 *  sleep-then-wait — timeout_ms defaults to 30s (config.json agent.waitForTimeoutMs
 *  overrides), capped at WAIT_FOR_MAX_TIMEOUT_MS (600s — the execute-tool timeout
 *  convention, Math.min(t, 600_000)); interval_ms defaults to 1s with a 100ms
 *  floor so polling never busy-spins. */
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
 *  EXPLICIT error enumerating the supported forms (评审 #2 — never a silent
 *  wait on a misspelled condition). */
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

/** Async-subagent pool of an agent — ctx.agent 可达性（评审 #1）：dispatch 把
 *  agent 实例放进工具 ctx（agent/dispatch.mjs toolCtx.agent），池挂在 agent 上
 *  （深度 0 的 VS Code 侧 agent._asyncSubagents 与 history._asyncSubagents 同
 *  一 Map——见 agent.mjs；CLI 侧直接是 agent._asyncSubagents）。 */
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
 *  spawn-time id, the CLI keys them as String(id) — accept both. */
function asyncEntryDone(agent, id) {
  const pool = asyncPool(agent)
  const key = String(id)
  const entry = pool.get(key) ?? pool.get(Number(key)) ?? null
  if (!entry) return true
  return entry.done === true || entry.status === "done"
}

/** 评审池双载体（第 10 批 §18.3 #2）：agent ∪ history——未初始化的载体不进集合。 */
function advisorPools(agent) {
  return [agent?._asyncAdvisors, agent?.history?._asyncAdvisors].filter((m) => m instanceof Map)
}

/** Any entry matching pred that is still running/queued (not done) — in the given pool. */
function hasRunningIn(pool, pred) {
  for (const e of pool?.values() ?? []) {
    if (pred(e) && !(e.done === true || e.status === "done")) return true
  }
  return false
}

/** "advisor settled" 真判据（第 10 批 §18.3 #2 修正）：**评审池真实态**——双载体
 *  （agent._asyncAdvisors ∪ history._asyncAdvisors）无 running/queued 条目（与 §11.2 的
 *  未决评审判定 advisorReviewPending 同源语义）。修前读**子代理池**的 role==="advisor"
 *  条目——评审条目只在 _asyncAdvisors → 恒无命中 → 恒真 0ms 秒过（用户实证）。 */
function advisorSettled(agent) {
  return !advisorPools(agent).some((pool) => hasRunningIn(pool, (e) => e.status === "running" || e.status === "queued"))
}

/** "consult done" — every consult session has drained (pending 0) or was
 *  explicitly stopped (its children were aborted). No sessions → true (vacuously). */
function consultAllDone(agent) {
  const sessions = agent?._consultSessions
  if (!sessions || sessions.size === 0) return true
  for (const s of sessions.values()) {
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
 *  unsupported condition string. Polling is async (await setTimeout) — the event
 *  loop keeps running so background async work (subagents/consult) can settle
 *  between polls (评审 #1 — no blocking spin). */
export async function evaluateWaitForCondition(condition, ctx) {
  const parsed = parseWaitForCondition(condition)
  const agent = ctx?.agent
  switch (parsed.kind) {
    case "advisor":
      // 第 10 批修正（§18.3 #2——修前恒真 0ms 秒过）：判据 = 评审池真实态（双载体）——
      // 不再读子代理池的 role==="advisor" 条目（该池永无此类条目）；语义与 §11.2 未决
      // 评审判定同源（advisorReviewPending）。
      return advisorSettled(agent)
    case "subagent":
      return asyncEntryDone(agent, parsed.arg)
    case "consult":
      return consultAllDone(agent)
    case "file":
      return existsSync(resolveInCwd(ctx, parsed.arg))
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
  description: DESC("wait_for"),
  parameters: {
    type: "object",
    properties: {
      condition: { type: "string", description: 'Condition expression — "advisor settled", "subagent id:N done", "consult done", "file exists:path", "port open:N"' },
      interval_ms: { type: "integer", description: "Poll interval in ms (default 1000, floor 100)" },
      timeout_ms: { type: "integer", description: "Overall timeout in ms (default 30000, cap 600000; config.json agent.waitForTimeoutMs overrides the default)" },
    },
    required: ["condition"],
  },
  readonly: true,
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
      // 不把用户停变成工具错误（dispatch 对 aborted signal 原样再抛）。
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
