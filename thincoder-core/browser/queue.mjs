/**
 * browser/queue.mjs — 调度策略：串行队列 ∥ 动作预算表 ∥ 动作控制器（超时 / 取消单点）∥ 步名跟踪
 * （设计权威 = `docs/core/design/BROWSER-TOOL.md` §2.9——单时钟动作预算 + 三层帽；KD-18 ∥ KD-19）。
 *
 * 单时钟：预算 deadline 自**入队**起算（队列等待计入预算——有意）；到点 ⇒ 控制器 `abort`（超时因由）。
 * 排队期到点 ⇒ 动作从未起执行（回执步名 `queue wait`）；动作内到点 ⇒ 步名 = 在飞阶段 / CDP 方法名。
 * 控制器（超时 ∥ 取消共用——KD-19）：abort 后在飞操作以同一因由拒绝，其后一切调用**快速失败**
 * （清理路径不得再起命令——防僵尸命令与下一动作交错）。
 * 步名：`ctl.run(name, fn)` 压帧（栈顶 = `stuck in <步名>` 的读数源）；`h.call` 帧 = CDP 方法名（session 侧接线）。
 */
import { WAIT_TIMEOUT_DEFAULT, WAIT_TIMEOUT_MAX } from "./actions.mjs"

/** 动作预算表（§2.9——机检面）：动作 ⇒ 预算 ms。wait 无固定值（谓词帽 + 余量——`budgetFor` 解算）。 */
export const ACTION_BUDGETS = {
  navigate: 45_000, // 含会话自启（12s 启动帽内）+ 导航 + 就绪轮询 + 快照
  click: 30_000,
  evaluate: 30_000,
  screenshot: 30_000,
  close: 30_000,
  press: 30_000,
  hover: 30_000,
  wheel: 30_000,
  mouse: 30_000,
  drag: 30_000,
  touch: 30_000,
  insert: 30_000,
  clipboard: 30_000,
  type: 15_000, // 单页内快动作
  snapshot: 15_000,
  wait: 45_000, // = 谓词帽缺省 30s + 15s 余量（timeoutMs 给出时按帽 + 余量重解——§2.9 表）
}
export const BUDGET_FALLBACK_MS = 30_000 // 未在册动作的兜底预算（防御——全部在册动作已列）
export const BUDGET_MAX_MS = 120_000 // `timeoutMs` override 硬上限（§2.9）
export const WAIT_MARGIN_MS = 15_000 // wait 预算余量（谓词帽之上——§2.9 表）
export const QUEUE_WAIT_STEP = "queue wait"

/** 预算解算（§2.9）：`timeoutMs` = 动作预算 override（硬上限 120s）；wait = 谓词帽 + 15s 余量（语义零变）。 */
export function budgetFor(action, args = {}) {
  const wanted = Number(args?.timeoutMs)
  const given = Number.isFinite(wanted) && wanted > 0
  if (action === "wait") {
    return (given ? Math.min(wanted, WAIT_TIMEOUT_MAX) : WAIT_TIMEOUT_DEFAULT) + WAIT_MARGIN_MS
  }
  if (given) return Math.min(wanted, BUDGET_MAX_MS)
  return ACTION_BUDGETS[action] ?? BUDGET_FALLBACK_MS
}

/** 单动作控制器：超时 / 取消 / 会话丢失共用一个中止点（一个机制多个因由——KD-19）。 */
export class ActionController {
  constructor({ action, budgetMs }) {
    this.action = action
    this.budgetMs = budgetMs
    this.aborted = false
    this.reason = null
    this.error = null
    this._deadline = Date.now() + budgetMs
    this._steps = []
    this._abortHooks = []
    this._abortP = new Promise((resolve) => { this._resolveAbort = resolve })
    this._timer = setTimeout(() => this.abort("timeout"), budgetMs)
  }

  /** 剩余预算（ms）——动作内调用帽的下界参照（§2.9 层一：动作内调用随控制器）。 */
  remaining() {
    return Math.max(1, this._deadline - Date.now())
  }

  /** 快速失败（§2.9）：abort 之后一切后续调用即刻拒绝（清理路径不得再起命令）。 */
  failIfAborted() {
    if (this.aborted) throw this.error
  }

  /** 步名帧 + 中止守卫：帧存活期栈顶 = `stuck in <name>` 读数源；work 随中止以同一因由拒绝。 */
  run(name, work) {
    this.failIfAborted()
    this._steps.push(name)
    let out
    try { out = work() } catch (e) { this._pop(name); throw e }
    return this.guard(Promise.resolve(out)).finally(() => this._pop(name))
  }

  /** 中止守卫：在飞工作与中止竞速（未中止 ⇒ 原样返回）。 */
  guard(work) {
    if (this.aborted) return Promise.reject(this.error)
    return Promise.race([work, this._abortP.then(() => Promise.reject(this.error))])
  }

  /** 受控等待（§2.9 层一：轮询 sleep 同受控）。 */
  async sleep(ms) {
    let timer = null
    try {
      await this.guard(new Promise((resolve) => { timer = setTimeout(resolve, ms) }))
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  /** 订阅一次中止（发出即退订）；返回退订函数。 */
  onAbort(fn) {
    if (this.aborted) { fn(); return () => {} }
    this._abortHooks.push(fn)
    return () => { this._abortHooks = this._abortHooks.filter((hook) => hook !== fn) }
  }

  /** 中止单点：因由 = timeout ∥ cancelled ∥ session-lost（错误句分形——§2.9 / §2.10）。 */
  abort(reason, error = null) {
    if (this.aborted) return this.error
    this.aborted = true
    this.reason = reason
    this.error = error ?? this._makeError(reason)
    if (this._timer) { clearTimeout(this._timer); this._timer = null }
    this._resolveAbort()
    for (const hook of this._abortHooks.splice(0)) { try { hook() } catch { /* 订阅者自担 */ } }
    return this.error
  }

  /** 取消（§2.11 kill 单点——与超时共用控制器）。 */
  cancel() {
    return this.abort("cancelled")
  }

  /** 动作结束（清钟——不中止）。 */
  finish() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null }
  }

  _pop(name) {
    const at = this._steps.lastIndexOf(name)
    if (at >= 0) this._steps.splice(at, 1)
  }

  _makeError(reason) {
    const step = this._steps.at(-1) ?? QUEUE_WAIT_STEP
    const message = reason === "cancelled"
      ? `${this.action} cancelled (stuck in ${step})`
      : `${this.action} timed out after ${this.budgetMs}ms (stuck in ${step}) — retry the action, or run \`close\` to reset the session`
    const error = new Error(message)
    error.browserAbort = true
    error.abortReason = reason
    return error
  }
}

/** 串行队列（§2.4：批并行调用按调用序排队——单页不引入并发）。 */
export function createActionQueue() {
  let tail = Promise.resolve()
  const chain = (task) => {
    const next = tail.then(task)
    tail = next.then(() => { /* 保持链活 */ }, () => { /* 失败不断链 */ })
    return next
  }
  return {
    /** 入队动作：`run(ctl)` 起执行；返回终态（回执 ∥ 拒绝）。排队中到点 ⇒ 即时以同失败形拒绝
     *  （`queue wait`——动作从未起执行）；起执行后由任务自身守卫裁决 —— 回执/拒绝晚于动作收尾
     *  （调用方拿到终态时会话侧清理已完成，不留残余控制器）。 */
    enqueue(action, args, run) {
      const ctl = new ActionController({ action, budgetMs: budgetFor(action, args) })
      let started = false
      const task = chain(() => { started = true; return run(ctl) }).finally(() => ctl.finish())
      return new Promise((resolve, reject) => {
        task.then(resolve, reject)
        ctl.onAbort(() => { if (!started) reject(ctl.error) })
      })
    },
    /** 队列直通（无预算语义——空闲关等动作外路径）。 */
    chain,
  }
}
