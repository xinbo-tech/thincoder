/**
 * browser-async.mjs — browser 后台动作任务桥（池 ∥ 起跑 ∥ 结算 ∥ 注入 ∥ 杀单点——复用 bg 族单点，D2）。
 * 设计权威 = `docs/core/design/BROWSER-TOOL.md` §2.11（异步通道——F-BT18）∥ §2.9（后台动作仍受动作
 * 预算——timeoutMs 可覆写）∥ §2.10（外部关闭在飞 ⇒ 同因由结算）；批档 = `docs/batches/2026-10-07-browser-async-fix.md` §2。
 *
 * - 形态：`async:true`（depth-0 专项——schema 删参 + 运行期第二道）⇒ ack
 *   `browser#<N> started (running) — <action> <subject>` 即返 ⇒ 后台同队执行（同一串行队列——单页
 *   不引入并发）⇒ 结算**恒停靠** `_pendingAsyncResults` + 唤醒挂起驱动（bg 同式——消化轮注入）。
 * - 池：`_browserTasks`（角色 "browser"；帽 `BROWSER_TASK_MAX = 4` 对齐单域 4，第 5 条显式拒——零静默丢）。
 * - 取消：`process action=kill id:N`（id 路由先 bg 后 browser）⇒ queued 丢队（从未运行）∥ running
 *   abort（动作展开）⇒ 结算 cancelled（墓碑 + 无摘要；重复幂等）；**不杀浏览器**（重置经 `close`）。
 *   取消柄 = 条目控制器信号（`browser/session.mjs` `runAction` 的 `{signal}` 缝——一条机制两个因由）。
 * - 收尾：Stop ∥ 会话中止 ⇒ `async-discard.mjs` `BROWSER_SPEC`（dispose = 条目控制器 abort）+ 墓碑
 *   `discarded` 出池 + 整批一次提醒（模型可见凭据）；回合中断（Ctrl+I）经 `bindChildController` 豁免
 *   （池保留——bg 同款）。竞态窗（条目先自行结算、收尾面未及见）⇒ 按 bg 族兜底：正常两态照常停靠
 *   （摘要必达——零静默丢失），**不**自落「仅墓碑」降级支（墓碑不是模型可见凭据）。
 * - 注入：`injectBrowserResult`（digest 单点族成员——`injectAsyncResult` 按 role="browser" 分发）；
 *   回执正文受动作面既有上限（≤20,000 字符）⇒ 无需 offload 径。
 * - 等待：`wait_for "browser id:N done"`（`browserTaskDone`——池内 done ∥ 出池即 done）。
 * 入径 = `tools/browser.mjs` ∥ `tools/ops.mjs` **动态 import**（W8 契约②）；模块图：→ browser/session.mjs
 * （入队面）· agent-tools/async-settle.mjs · subagent-scheduler.mjs（取号 / 令牌 / 键守卫）·
 * agent/helpers.mjs（escapeXml）· context.mjs（pushReal）——叶子向、无环。
 */
import { escapeXml } from "../agent/helpers.mjs"
import { pushReal } from "../context.mjs"
import { runAction } from "../browser/session.mjs"
import {
  bindChildController, buildChildSignal, carrierField, getAsyncPool, parkAsyncPending,
  tombstoneOf, wakeAsyncWaiters, writeTombstone,
} from "./async-settle.mjs"
import { assertPoolKeyFree, consumeSubagentToken, nextSubagentId } from "./subagent-scheduler.mjs"

/** 后台动作帽（对齐 `ASYNC_POOL_LIMITS` 单域 4——KD-22）。超限显式拒。 */
export const BROWSER_TASK_MAX = 4

/** 池写侧（绑定不变式：主容器落父字段；缺省借用 / 别名 `history` 侧——同 `bash-async.mjs` 同式）。 */
function ensureBrowserPool(parent) {
  if (parent._browserTasks instanceof Map) return parent._browserTasks
  const borrowed = carrierField(parent, "_browserTasks")
  if (borrowed instanceof Map) { parent._browserTasks = borrowed; return borrowed }
  parent._browserTasks = new Map()
  if (parent?.history && typeof parent.history === "object") parent.history._browserTasks = parent._browserTasks
  return parent._browserTasks
}

/** 条目读取（键形单源：写侧 `set(String(id))` ⇒ 读一律 String 归一；双形键兜底照 bg 族）。 */
export function browserTaskEntry(parent, id) {
  const pool = getAsyncPool(parent, "browser")
  if (!(pool instanceof Map)) return null
  const key = String(id)
  return pool.get(key) ?? pool.get(Number(key)) ?? null
}

/** `wait_for` 条件 `browser id:N done` 判据（同式 bg）：池内 done ∥ **出池即 done**（结算恒出池——
 *  pending 停靠 / 杀 / 丢弃皆已结束）；未知 id 亦按 done-by-vacuity。 */
export function browserTaskDone(parent, id) {
  const entry = browserTaskEntry(parent, id)
  if (!entry) return true
  return entry.done === true || entry.status === "done"
}

/** 条目中止（同一机制两处调用：kill 径 `killBrowserTask` ∥ discard 收尾面 `BROWSER_SPEC.dispose`）：
 *  条目控制器 abort ⇒ `runAction` 信号径传导（queued 丢队 ∥ running 动作展开）；重复幂等
 *  （`AbortController.abort` 幂等）。 */
function abortBrowserEntry(entry) {
  try { entry?.controller?.abort?.({ abortTrigger: "browser-kill" }) } catch { /* 已中止 */ }
}

/** subject 标签（ack ∥ 摘要共用）：动作对象头——navigate = url ∥ ref / selector / url / key / op /
 *  from / networkIdle ∥ 坐标 ∥ expression 头 ∥ text 头；全空 ⇒ 空串。 */
export function browserSubject(action, args = {}) {
  const pick = action === "navigate" ? (args.url ?? null)
    : (args.ref ?? args.selector ?? args.url ?? args.key ?? args.op ?? args.from
      ?? (args.networkIdle === true ? "networkIdle" : null))
  if (pick != null && String(pick) !== "") return String(pick)
  if (String(args.x ?? "") !== "" && String(args.y ?? "") !== "" && Number.isFinite(Number(args.x)) && Number.isFinite(Number(args.y))) {
    return `${args.x},${args.y}`
  }
  if (typeof args.expression === "string" && args.expression) return args.expression.slice(0, 60)
  if (typeof args.text === "string" && args.text) return args.text.slice(0, 40)
  return ""
}

/**
 * 起跑（ack 即返——调用方不被动作阻塞）。失败面 = 显式 `{ error }`（帽 / 深度 / 上下文——零静默丢）。
 * @returns {{ id: number, ack: string, entry: object } | { error: string }}
 */
export async function launchBrowserTask(parent, ctx, args = {}) {
  if (!parent) return { error: "no agent context — background browser tasks run in a depth-0 session only" }
  if ((ctx?.depth ?? 0) > 0) {
    return { error: "browser async is depth-0 only — a child agent has no background task pool (run the action synchronously)" }
  }
  const action = String(args.action ?? "")
  const pool = ensureBrowserPool(parent)
  const running = [...pool.values()].filter((e) => e.done !== true)
  if (running.length >= BROWSER_TASK_MAX) {
    return {
      error: `browser task cap reached (${running.length}/${BROWSER_TASK_MAX} running: ${running.map((e) => `browser#${e.id}`).join(", ")})` +
        ` — wait for one to settle (wait_for "browser id:N done") or kill one (process action='kill' id:N)`,
    }
  }
  // ED-5：取号 → 消费同步配对（无 await 间隙）+ 入池键守卫（同 bash-async 同式——守卫前置于起跑，命中即抛零副作用）。
  const id = nextSubagentId(parent)
  consumeSubagentToken(parent, id, "browser async launch", "browser")
  assertPoolKeyFree(pool, id, "browser")
  const { async: _asyncFlag, ...actionArgs } = args // `async` 不入动作参数面（零语义泄漏）
  const subject = browserSubject(action, actionArgs)
  const ctrl = new AbortController()
  const entry = {
    id, role: "browser", action, args: actionArgs, subject,
    status: "running", done: false, cancelled: false, discarded: false,
    controller: ctrl, startedAt: Date.now(), endedAt: null,
    receipt: null, error: null, failed: null, _settle: null, promise: null,
  }
  entry.promise = new Promise((res) => { entry._settle = res })
  // 会话 / 回合信号链（同 bg）：非 interrupt 中止 ⇒ 控制器中止 ⇒ 动作展开 + discard 收尾面；
  // 回合中断（Ctrl+I）⇒ 不动（池保留）。
  bindChildController(ctrl, buildChildSignal(parent, ctx))
  entry.promiseRun = Promise.resolve()
    .then(() => runAction(action, actionArgs, ctx, { signal: ctrl.signal }))
    .then(
      (receipt) => { entry.receipt = String(receipt) },
      (e) => { entry.error = e?.message ?? String(e) },
    )
    .finally(() => finalizeBrowserEntry(parent, entry))
  pool.set(String(id), entry)
  return { id, ack: `browser#${id} started (running) — ${action}${subject ? ` ${subject}` : ""}`, entry }
}

/**
 * 结算单点（回执 / 拒绝两径合流；幂等：entry.done 即返）。取消 / 丢弃两态 ⇒ 只落终态与唤醒（无摘要——
 * 凭据 = 杀点确认 ∥ 收尾整批提醒）；其余（含会话中止竞态窗——收尾面未及见）⇒ 恒停靠 pending + 唤醒
 * 挂起驱动（消化轮注入——零静默丢失；同 `bash-async.mjs` finalize 同式，**不**自落「仅墓碑」支）。
 */
function finalizeBrowserEntry(parent, entry) {
  if (entry.done) return
  entry.done = true
  entry.status = "done"
  entry.endedAt = Date.now()
  getAsyncPool(parent, "browser")?.delete(String(entry.id))
  if (entry.cancelled === true || entry.discarded === true) {
    entry._settle?.() // 定向杀 ∥ 会话中止收尾——不注入（墓碑已由杀点 / 收尾面落定）
    return
  }
  const receipt = entry.receipt ?? ""
  if (entry.error == null && receipt.startsWith("Error:")) {
    entry.failed = receipt.split("\n")[0].replace(/^Error:\s*/, "")
  }
  parkAsyncPending(parent, entry)
  entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
  entry._settle?.()
  wakeAsyncWaiters(parent)
}

/** 状态词截断（摘要首行单行可读——超长因由截 200 字符）。 */
function clip(text, max = 200) {
  const s = String(text)
  return s.length > max ? `${s.slice(0, max)}…` : s
}

/** 注入器（digest 单点族成员——`injectAsyncResult` 按 role="browser" 分发；消费即墓碑）。 */
export async function injectBrowserResult(parent, entry) {
  const seconds = (Math.max(0, (entry.endedAt ?? Date.now()) - entry.startedAt) / 1000).toFixed(1)
  const label = `${entry.action}${entry.subject ? ` ${entry.subject}` : ""}`
  const status = entry.error != null ? `failed: ${clip(entry.error)}`
    : entry.failed != null ? `failed: ${clip(entry.failed)}`
    : "ok"
  const head = `[System reminder: background browser#${entry.id} finished — ${label} (${status}, ${seconds}s)]`
  const body = escapeXml(String(entry.receipt ?? entry.error ?? "(no result)"))
  pushReal(parent, { role: "user", content: `${head}\n${body}` })
  writeTombstone(parent, entry.id, entry.error != null || entry.failed != null ? "failed" : "consumed", "browser")
}

/**
 * 杀单点（id 靶——`process` action='kill'）：queued ⇒ 丢队（从未运行）∥ running ⇒ abort（动作展开）
 * ⇒ 结算 cancelled（墓碑 + 无摘要）；**不杀浏览器**；重复 = 幂等（经终态墓碑返回同一确认——bg 同式）。
 * @returns {{ id: string, status: "cancelled" | "error", error?: string }}
 */
export function killBrowserTask(parent, id) {
  const key = String(id)
  if (!key || key === "undefined" || key === "null") {
    return { id: key, status: "error", error: "process kill id: requires a background browser task id (browser#N from the async ack)" }
  }
  const pool = getAsyncPool(parent, "browser")
  const entry = browserTaskEntry(parent, key)
  if (!entry) {
    const tomb = tombstoneOf(parent, key)
    if (tomb?.status === "cancelled" && tomb.role === "browser") return { id: key, status: "cancelled" } // 幂等确认
    return { id: key, status: "error", error: `unknown background browser task id: ${key} — it has finished, was killed, or was never started` }
  }
  if (entry.done) return { id: key, status: "error", error: `browser#${key} has already finished — nothing to kill` }
  if (entry.cancelled) return { id: key, status: "cancelled" } // 杀已在途——幂等
  entry.cancelled = true
  abortBrowserEntry(entry)
  pool?.delete(key)
  writeTombstone(parent, key, "cancelled", "browser")
  return { id: key, status: "cancelled" }
}
