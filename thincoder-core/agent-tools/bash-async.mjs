/**
 * bash-async.mjs — #9 `bash` 后台任务池（异步 ∥ 后台执行；设计 = 批档
 * `docs/batches/2026-09-29-tools-carryover.md` §2.1——口径同源 = consult ∥ escalate 族，
 * AGENT-LOOP-ASYNC-POOL.md §6.8 ∥ §6.10）。
 *
 * 本档 = 后台任务单点（池 ∥ 起跑 ∥ 结算 ∥ 杀）：
 * - 池：分域池 `_bgTasks`（模式照 `_asyncAdvisors`——独立池 + 载体吸收：写侧父字段、读侧
 *   `carrierField`——缺省借用/别名 `history` 侧，VSC 形跨 runAgent 存活）。
 * - 起跑：id 沿 `nextSubagentId` 共用命名空间（`bash#N` 前缀区分域）；帽 `BG_TASK_MAX = 4`
 *   （对齐 `ASYNC_POOL_LIMITS` 单域 4）——超限**显式拒**（零静默丢；无排队面）。
 * - 输出面：全量流式落盘 `configDir/tool-results/<ts>-bash-<id>.log`（轮转复用
 *   `cleanupOldToolResults`）；内存尾部环形缓冲（注入面取尾截：≤120 行 ∧ ≤8KB 双帽 +
 *   截尾注记；全量恒在 log——不经预算 offload）。
 * - 送达：进程退出/被杀 ⇒ 结算 ⇒ 停靠 pending 单容器（consult 族同式「恒出池」）⇒ 唤醒挂起
 *   驱动（`wakeAsyncWaiters`）⇒ 消化轮 run-start 注入（`injectBgResult`——子代理族注入器
 *   `injectAsyncResult` 按 role="bg" 分发到本档）。
 * - 超时：async **不收**同步径默认 120s（长任务 = 本形目的）；显式 `timeout` 到点杀树
 *   （结算状态 `killed: timeout`）。
 * - 收尾两档（D9-7）：回合中断（Ctrl+I）**不杀**——`bindChildController` interrupt 豁免，
 *   池保留（后续经 wait_for ∥ settle 消费）∥ 会话中止（Ctrl+C ∥ Stop）⇒ 条目控制器中止 ⇒
 *   `async-discard.mjs` 收尾面逐条杀树 + 出池 + 墓碑（单不变量「杀 ⟺ 控制器已中止」）。
 * - 边界（v1）：不做可见面板块 ∥ 状态行段；不做跨会话存活（会话结束即清——进程退出径无钩子）。
 *
 * 模块图：→ agent-tools/async-settle.mjs（池 accessor ∥ pending 停靠 ∥ 墓碑 ∥ 唤醒 ∥ 控制器
 * 链结）· subagent-scheduler.mjs（取号/令牌/入池键守卫）· tools/process-tree.mjs（树杀）·
 * tools/shared.mjs（解码/清洗——与同步径同源）· tools/bash.mjs（`buildBashEnv` 单源）·
 * agent/helpers.mjs（转义 ∥ 轮转清理）· config.mjs（configDir）· context.mjs（pushReal）
 * ——叶子向、无环。
 * 入径 = `tools/bash.mjs` / `tools/ops.mjs` **动态 import**（W8 契约②：本档静态链含
 * agent-tools 族 ⇒ 端壳静态闭包不得经工具档命中 node:sqlite）。
 */
import { createWriteStream } from "node:fs"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import { spawn } from "node:child_process"
import { configDir } from "../config.mjs"
import { cleanupOldToolResults, escapeXml } from "../agent/helpers.mjs"
import { pushReal } from "../context.mjs"
import { makeDecoder, sanitizeOutput } from "../tools/shared.mjs"
import { killProcessTree } from "../tools/process-tree.mjs"
import { buildBashEnv } from "../tools/bash.mjs"
import {
  bindChildController, buildChildSignal, carrierField, getAsyncPool, parkAsyncPending,
  tombstoneOf, wakeAsyncWaiters, writeTombstone,
} from "./async-settle.mjs"
import { assertPoolKeyFree, consumeSubagentToken, nextSubagentId } from "./subagent-scheduler.mjs"

/** 后台任务帽（对齐 `ASYNC_POOL_LIMITS` 单域 4——AGENT-LOOP-ASYNC-POOL.md §6.10）。超限显式拒。 */
export const BG_TASK_MAX = 4

/** 注入面双帽（批档 §2.1.3 送达面）：≤120 行 ∧ ≤8KB；全量恒在 log。 */
const DIGEST_TAIL_MAX_LINES = 120
const DIGEST_TAIL_MAX_CHARS = 8 * 1024
/** 内存尾部环形缓冲保留量（缓冲仅需覆盖注入帽——多留一成余量）。 */
const TAIL_KEEP_CHARS = 32 * 1024
/** exit→close 宽限（同同步径后台注记面：孙进程握管道时 close 不来——`bash.mjs` 1500ms 同值）。 */
const EXIT_GRACE_MS = 1500

/** 测试缝：log 目录重定向（单测沙箱——生产从不调用；`_setDigestOffloadDirForTest` 同式）。 */
let _bgTaskLogDir = null
export function _setBgTaskLogDirForTest(dir) { _bgTaskLogDir = dir }
function bgTaskLogDir() { return _bgTaskLogDir ?? join(configDir, "tool-results") }

/** 池写侧（绑定不变式：主容器落父字段；缺省借用 `history` 侧 + 载体别名——`writeTombstone`
 *  借用法同式，VSC 形跨 runAgent 存活；CLI 形父字段恒在场——零差分）。 */
function ensureBgPool(parent) {
  if (parent._bgTasks instanceof Map) return parent._bgTasks
  const borrowed = carrierField(parent, "_bgTasks")
  if (borrowed instanceof Map) { parent._bgTasks = borrowed; return borrowed }
  parent._bgTasks = new Map()
  if (parent?.history && typeof parent.history === "object") parent.history._bgTasks = parent._bgTasks
  return parent._bgTasks
}

/** 条目读取（键形单源：写侧 `set(String(id))` ⇒ 读一律 String 归一；双形键兜底照子代理族）。 */
export function bgTaskEntry(parent, id) {
  const pool = getAsyncPool(parent, "bg")
  if (!(pool instanceof Map)) return null
  const key = String(id)
  return pool.get(key) ?? pool.get(Number(key)) ?? null
}

/** `wait_for` 条件 `bash id:N done` 判据（同式 `subagent id:N done`）：池内 done ∥ **出池即 done**
 *  （结算恒出池——pending 停靠/丢弃/消费皆已结束，无可等待物；未知 id 亦按 done-by-vacuity）。 */
export function bgTaskDone(parent, id) {
  const entry = bgTaskEntry(parent, id)
  if (!entry) return true
  return entry.done === true || entry.status === "done"
}

/** 杀单点：条目进程树（process kill ∥ discard 收尾面共用——树杀函数单源 = `tools/process-tree.mjs`）。 */
export function killBgTree(entry) {
  if (entry?.child) killProcessTree(entry.child)
}

/**
 * 起跑（ack 即返）。失败面 = 显式 `{ error }`（帽/深度/上下文——零静默丢）。
 * @returns {{ id: number, ack: string, entry: object } | { error: string }}
 */
export async function launchBgTask(parent, ctx, { command, timeout = null, shell = null } = {}) {
  if (!parent) return { error: "no agent context — background tasks run in a depth-0 session only" }
  if ((ctx?.depth ?? 0) > 0) {
    return { error: "bash async is depth-0 only — a child agent has no background task pool (run the command synchronously)" }
  }
  const pool = ensureBgPool(parent)
  const running = [...pool.values()].filter((e) => e.done !== true)
  if (running.length >= BG_TASK_MAX) {
    return {
      error: `background task cap reached (${running.length}/${BG_TASK_MAX} running: ${running.map((e) => `bash#${e.id}`).join(", ")})` +
        ` — wait for one to settle (wait_for "bash id:N done") or kill one (process action='kill' id:N)`,
    }
  }
  const dir = bgTaskLogDir()
  await cleanupOldToolResults(dir)
  await mkdir(dir, { recursive: true })
  // ED-5：取号 → 消费同步配对（无 await 间隙）+ 入池键守卫（同 id 二次入池 = 静默覆写 ⇒ 抛）
  // ——守卫前置于 spawn：命中即抛时零副作用（无孤儿进程/无半开 log）。
  const id = nextSubagentId(parent)
  consumeSubagentToken(parent, id, "bash async launch", "bash")
  assertPoolKeyFree(pool, id, "bash")
  const logPath = join(dir, `${Date.now()}-bash-${id}.log`)
  const cwd = ctx?.cwd ?? parent.cwd ?? process.cwd()
  // UTF-8 码页前缀 = 同步径同款（win32 + 默认 shell）；解码走 `makeDecoder`（同源）。
  const effectiveCommand = process.platform === "win32" && !shell ? `chcp 65001 >nul && ${command}` : command
  const child = spawn(effectiveCommand, [], {
    cwd,
    shell: shell ?? true,
    windowsHide: true,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    env: buildBashEnv(),
  })
  const entry = {
    id, role: "bg", command, child, logPath,
    status: "running", done: false, cancelled: false, discarded: false,
    startedAt: Date.now(), endedAt: null, exit: null, killed: null, error: null,
    report: null, tail: "", tailDropped: false, bytes: 0,
    timeoutMs: null, timer: null, graceTimer: null, controller: null,
    logStream: null, _settle: null, promise: null,
  }
  entry.promise = new Promise((res) => { entry._settle = res })
  entry.logStream = createWriteStream(logPath, { flags: "a" })
  entry.logStream.on("error", () => { /* log 写失败不进结算语义——尽力面 */ })
  const outDecoder = makeDecoder()
  const errDecoder = makeDecoder()
  const appendChunk = (s) => {
    if (!s) return
    entry.bytes += s.length
    try { entry.logStream.write(s) } catch { /* 同上——尽力面 */ }
    entry.tail += s
    if (entry.tail.length > TAIL_KEEP_CHARS) {
      entry.tail = entry.tail.slice(entry.tail.length - TAIL_KEEP_CHARS)
      entry.tailDropped = true
    }
  }
  child.stdout.on("data", (d) => appendChunk(sanitizeOutput(outDecoder(d))))
  child.stderr.on("data", (d) => appendChunk(sanitizeOutput(errDecoder(d))))
  // 会话/回合信号链（#98 链结单点——interrupt 豁免内建）：非 interrupt 中止 ⇒ 控制器中止 ⇒
  // discard 收尾面（杀树 + 出池 + 墓碑）；回合中断（Ctrl+I）⇒ 不动（F2 同款豁免）。
  const ctrl = new AbortController()
  entry.controller = ctrl
  bindChildController(ctrl, buildChildSignal(parent, ctx))
  // 显式 timeout（async 缺省无超时——本形目的）：到点杀树，结算状态 `killed: timeout`。
  if (Number.isFinite(timeout) && timeout > 0) {
    entry.timeoutMs = timeout
    entry.timer = setTimeout(() => {
      entry.killed = "timeout"
      killBgTree(entry)
    }, timeout)
  }
  child.on("error", (error) => {
    entry.error = error?.message ?? String(error)
    finalizeBgEntry(parent, entry, { code: null, signal: null })
  })
  child.on("exit", (code, exitSignal) => {
    if (entry.done) return
    // 宽限窗（同步径同判据）：孙进程握管道 ⇒ close 不来——到点按「可能仍在跑」收尾。
    entry.graceTimer = setTimeout(() => {
      finalizeBgEntry(parent, entry, { code, signal: exitSignal, background: true })
    }, EXIT_GRACE_MS)
  })
  child.on("close", (code, exitSignal) => {
    finalizeBgEntry(parent, entry, { code, signal: exitSignal })
  })
  pool.set(String(id), entry)
  return { id, ack: `bash#${id} started (running) — log: ${logPath}`, entry }
}

/**
 * 结算单点（close ∥ exit 宽限 ∥ spawn error 三径合流；幂等：entry.done 即返）。
 * 杀/丢弃两态（报告不可达）⇒ 只落终态与唤醒；正常退出 ⇒ 停靠 pending + 唤醒挂起驱动。
 */
function finalizeBgEntry(parent, entry, { code = null, signal = null, background = false } = {}) {
  if (entry.done) return
  entry.done = true
  entry.status = "done"
  entry.endedAt = Date.now()
  entry.exit = { code, signal, background }
  if (entry.graceTimer) { clearTimeout(entry.graceTimer); entry.graceTimer = null }
  if (entry.timer) { clearTimeout(entry.timer); entry.timer = null }
  try { entry.logStream?.end() } catch { /* 尽力面 */ }
  getAsyncPool(parent, "bg")?.delete(String(entry.id))
  if (entry.cancelled === true || entry.discarded === true) {
    entry._settle?.() // 定向杀 ∥ 会话中止收尾——不注入（状态/墓碑已由杀点落定）
    return
  }
  entry.report = renderTail(entry).text
  parkAsyncPending(parent, entry)
  entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
  entry._settle?.()
  wakeAsyncWaiters(parent)
}

/** 注入面尾截（双帽 + 截尾判据：行帽/字符帽/环形缓冲丢头三径合一）。 */
function renderTail(entry) {
  let text = String(entry.tail ?? "")
  let truncated = entry.tailDropped === true
  const lines = text.split("\n")
  if (lines.length > DIGEST_TAIL_MAX_LINES) {
    text = lines.slice(-DIGEST_TAIL_MAX_LINES).join("\n")
    truncated = true
  }
  if (text.length > DIGEST_TAIL_MAX_CHARS) {
    text = text.slice(-DIGEST_TAIL_MAX_CHARS)
    truncated = true
  }
  return { text, truncated }
}

/** 注入器（digest 单点族成员——`injectAsyncResult` 按 role="bg" 分发；消费即墓碑）。 */
export async function injectBgResult(parent, entry) {
  const exit = entry.exit ?? {}
  const status = entry.killed === "timeout"
    ? "killed: timeout"
    : entry.error != null ? `spawn failed: ${entry.error}`
    : exit.background ? `exit code ${exit.code} (a child process still holds the output pipe — output may be incomplete; it may still be running)`
    : exit.signal ? `killed: ${exit.signal}`
    : `exit code ${exit.code}`
  const seconds = (Math.max(0, (entry.endedAt ?? Date.now()) - entry.startedAt) / 1000).toFixed(1)
  const head = `[System reminder: background bash#${entry.id} finished — \`${entry.command}\` (${status}, ${seconds}s) — full log: ${entry.logPath}]`
  const { text, truncated } = renderTail(entry)
  const body = text.trim() ? escapeXml(text) : "(no output)"
  const note = truncated ? `\n[... tail truncated — the full output is in the log: ${entry.logPath}]` : ""
  pushReal(parent, { role: "user", content: `${head}\n${body}${note}` })
  writeTombstone(parent, entry.id, entry.error != null ? "failed" : "consumed", "bg")
}

/**
 * 杀单点（id 靶——`process` action='kill'）：杀树 + 出池 + 墓碑（cancelled）；重复 = 幂等
 * （经终态墓碑返回同一确认——`cancelAsyncAdvisor` 同式）。
 * @returns {{ id: string, status: "cancelled" | "error", error?: string, logPath?: string }}
 */
export function killBgTask(parent, id) {
  const key = String(id)
  if (!key || key === "undefined" || key === "null") {
    return { id: key, status: "error", error: "process kill id: requires a background bash task id (bash#N from the async ack)" }
  }
  const pool = getAsyncPool(parent, "bg")
  const entry = bgTaskEntry(parent, key)
  if (!entry) {
    const tomb = tombstoneOf(parent, key)
    if (tomb?.status === "cancelled" && tomb.role === "bg") return { id: key, status: "cancelled" } // 幂等确认
    return { id: key, status: "error", error: `unknown background bash task id: ${key} — it has finished, was killed, or was never started` }
  }
  if (entry.done) return { id: key, status: "error", error: `bash#${key} has already finished — nothing to kill` }
  if (entry.cancelled) return { id: key, status: "cancelled", logPath: entry.logPath } // 杀已在途——幂等
  entry.cancelled = true
  killBgTree(entry)
  pool?.delete(key)
  writeTombstone(parent, key, "cancelled", "bg")
  return { id: key, status: "cancelled", logPath: entry.logPath }
}

/** 杀单点（pid 靶——`process` action='kill'）：`killProcessTree` 同款（win32 `taskkill /T /F` ∥
 *  POSIX 组杀 + 直杀兜底）；pid 形态非法 ⇒ false（调用方给显式错误）。 */
export function killBgPid(pid) {
  const n = Number(pid)
  if (!Number.isInteger(n) || n <= 0) return false
  killProcessTree({ pid: n, kill: (sig) => process.kill(n, sig) })
  return true
}
