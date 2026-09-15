/**
 * async-settle.mjs — async 结果容器统一共享 helper（ASYNC-RESULT-CONTAINER.md D1-D6，
 * 2026-09-08——VS Code 端落地；CLI 同名机制各自独立实现）。根治四族 settle 记账逐字
 * 重复（subagent/advisor/escalate/consult）+ pending 五族分叉（_pendingAdvisorResults/
 * _pendingEscalateResults/_pendingConsultResults 独立族废弃）+ done-in-pool 双表示 +
 * _sessionSignal 兜底抄 4 处：
 * - D2 pending 单容器：全族统一 `history._pendingAsyncResults`，条目带 role 字段
 *   （注入器按 role 分发——injectPendingAsync）；`_inPending` 标记保留（防重复移交——
 *   settle 回调与 sweepSettledToPending 同一表示，done-in-pool 统一：留池 done:true +
 *   pending 单容器）。
 * - D3 settle 共享 helper：settleAsyncEntry——公共收尾单点（落 report/error/done/
 *   status → 日志三连（ev:cancelled / {child|advisor}:done|:error + ev:settled）→
 *   cancelled / parentAborted / 挂起分流（pending 移交 + 出池）→ _resolve 唤醒 waiter
 *   → 腾槽补位 refill/refresh → notifySettle）。族特有段作 onAccounting hook 注入
 *   （advisor 陈旧判定/token 落盘记账——D1 落盘保留；escalate 三分类 merge 决策）。
 * - D4 守卫统一：parentAborted 严格版（session signal aborted 非 interrupt，或条目
 *   controller aborted 非 cancel）——日志三连与分流共用同一守卫。
 * - D6 buildChildSignal：`ctx.sessionSignal ?? ctx.agent?._sessionSignal ?? ctx.signal
 *   ?? null` 单点（原 4 处逐字抄；consult 补 _sessionSignal 兜底——D5）。
 * 模块图：单向 import subagent-scheduler.mjs（getAsyncPool/removeFromAsyncPools/
 * refillPool/refreshQueuedRows/writeTombstone）+ @thincoder/core/log.mjs——叶子级共享模块；四族 settle
 * 回调（subagent-async/advisor-async/subagent-escalate-async/consult）单向 import 本
 * 模块；注入器分发 injectPendingAsync 动态 import 各族注入器（防环）。
 */
import { logEvent, errText } from "@thincoder/core/log.mjs"
import { getAsyncPool, removeFromAsyncPools, refillPool, refreshQueuedRows, writeTombstone } from "./subagent-scheduler.mjs"

// ─── W9 端差适配：digest 预算键（2026-09-15）──────────────────────────────────
// 核 `agent-tools/digest-budget.mjs` 以传入对象（CLI 面 = agent）为预算键、经 `键.history.length`
// 判轮；VSC 四族注入器持有的载体 = history 数组（无 agent）——本 helper 以 history 为
// WeakMap 键合成稳定 agent 形（同 history ⇒ 同键；语义 = 本端原面「键 = history 对象」
// 逐字保持）。W11/W15 载体归一后退场。
const _digestKeys = new WeakMap()
export function digestBudgetKey(history) {
  let k = _digestKeys.get(history)
  if (!k) { k = { history }; _digestKeys.set(history, k) }
  return k
}

// ─── D2 pending 单容器（+role）───

/** pending 单容器键（评审 #3 定稿名——`_pendingAdvisorResults`/`_pendingEscalateResults`/
 *  `_pendingConsultResults` 独立族废弃；条目带 role 字段，注入器按 role 分发）。 */
export const PENDING_ASYNC_KEY = "_pendingAsyncResults"

/** pending 单容器读（history 载体优先——跨 runAgent 存活；直接 execute ctx 回落 agent）。 */
export function getPendingAsync(parent) {
  const holder = parent?.history ?? parent
  return Array.isArray(holder?.[PENDING_ASYNC_KEY]) ? holder[PENDING_ASYNC_KEY] : null
}

/** pending 单容器停靠（settle 挂起分流 / sweep 补扫共用——统一表示：条目置 `_inPending`
 *  防重复移交（sweep 幂等判据），includes 去重兜底。 */
export function parkAsyncPending(parent, entry) {
  const holder = parent?.history ?? parent
  if (!holder) return
  const pend = (holder[PENDING_ASYNC_KEY] ??= [])
  if (pend.includes(entry)) return
  entry._inPending = true
  pend.push(entry)
}

/** pending 注入器分发（W12 起 = 核统一注入器单源）：`@thincoder/core/agent-tools/subagent.mjs`
 *  的 `injectAsyncResult` 按 `entry.role` 自分发（advisor / escalate / consult / subagent 四族
 *  标签分支同源）——原端侧四族注入器（advisor-async / subagent-escalate-async / consult /
 *  subagent-async 的 `injectXResult`）随 advisor 镜像删旧退役。动态 import：核链可达
 *  `node:sqlite`（W8 契约②——静态引会入端壳静态链）。注入即消费（调用方 splice）。
 *  载体适配：核 `pushReal` 消费 `{ history, _fullHistory }` 形态（VSC ctx 给双线数组）——
 *  稳定载体 = 同 ctx 对象复用（核 digest 轮预算按载体键累计——同轮多条累计面保持）。 */
export async function injectPendingAsync(entry, ctx) {
  ctx._coreCarrier ??= { history: ctx.history, _fullHistory: ctx.fullHistory }
  const carrier = ctx._coreCarrier
  // consult 族分支与核 `agent.mjs` 同构（§25 D-R17a/b）：核统一注入器不含 consult 标签分支。
  if (entry?.role === "consult") {
    const { injectConsultResult } = await import("@thincoder/core/agent-tools/consult.mjs")
    return injectConsultResult(carrier, entry)
  }
  const { injectAsyncResult } = await import("@thincoder/core/agent-tools/subagent.mjs")
  return injectAsyncResult(carrier, entry)
}

// ─── D4 守卫统一（严格版）+ D6 信号兜底单点 ───

/** D4 settle 守卫统一（严格版）：父侧中止 = 会话 signal aborted 且非 interrupt
 *  （Ctrl+I 不是全停——F2 豁免），或条目 controller aborted 且非定向 cancel
 *  （cancelled 分支先行——cancel 不算父中止）。日志三连与出池分流共用本守卫。 */
export function parentAborted(entry) {
  if (entry?.signal?.aborted === true && entry.signal?.reason?.interrupt !== true) return true
  if (entry?.controller?.signal?.aborted === true && entry?.cancelled !== true) return true
  return false
}

/** D6 child signal 构建单点（D5——consult 补 _sessionSignal 兜底）：挂起会话内的回合
 *  （digest/用户回合）子代理持会话 signal（ctx.sessionSignal；per-run agent 镜像
 *  agent._sessionSignal 兜底——agent.mjs 装配）——会话 Stop 逐链中止；回合级 ctx.signal
 *  兜底。原 subagent/advisor/escalate/consult 4 处逐字抄统一入此。 */
export function buildChildSignal(ctx) {
  return ctx?.sessionSignal ?? ctx?.agent?._sessionSignal ?? ctx?.signal ?? null
}

// ─── D3 settle 共享 helper ───

/**
 * D3 settle 共享 helper——四族 settle 回调公共收尾单点（ASYNC-RESULT-CONTAINER.md
 * AC1：settle 记账单点，无逐字重复）。流程：
 *   ① 落 report/error/done/status="done"（settle 即翻——不再占槽/持文件域）；
 *   ② 日志三连（统一守卫 !parentAborted——cancelled → ev:cancelled；非中止 →
 *      {child|advisor}:done|:error + 挂起期 ev:settled；log:null 族跳过——consult 的
 *      per-model 日志已在子代理 settle 时记录）；
 *   ③ 分流：cancelled（出池 + 可选 cancelled 墓碑 + _onCancelled 停止冻结通知——不入
 *      pending）→ parentAborted（出池丢弃——中止清池不注入陈旧错误）→ settled（族
 *      onAccounting hook 记账 → _onTerminal → 挂起期（或 park:"always" 族）移交
 *      pending 单容器 + 出池）；
 *   ④ _resolve 唤醒 waiter → 腾槽补位（refill !== false 时 refillPool + 行刷新）→
 *      notifySettle（唤醒挂起驱动）。
 * opts：
 * - pool：族角色（"subagent"|"advisor"|"escalate"|"consult"——缺省 entry.role）——
 *   出池经 getAsyncPool/removeFromAsyncPools（D1 accessor 吸收双查询）。
 * - report/error：settle 结果（escalate 由包装层从 outcome 翻译）。
 * - notifySettle：onAsyncSettled 回调（挂起驱动唤醒）。
 * - log：日志族名（"child"|"advisor"|null——null 跳过日志三连）。
 * - refill：缺省 true（subagent/escalate 腾槽补位）；advisor/consult 传 false（独立
 *   容量/会话池——不占 subagent 槽位）。
 * - park："suspended"（缺省——仅挂起期移交）| "always"（escalate/consult park-ALWAYS——
 *   settle 即出池，报告全量入 pending 待 digest）。
 * - tombstoneCancel / tombstonePark：cancelled 出池 / park-ALWAYS 停靠时写终态墓碑
 *   （subagent/escalate true——dependsOn 终态查询；advisor/consult false——record/stopped
 *   各自表达；consult id 命名空间独立——park 墓碑不写，防命名空间污染）。
 * - aborted：调用方强制中止判定（escalate outcome.kind==="aborted"——引擎 AbortError
 *   分类）；缺省走 parentAborted 统一守卫。
 * - onAccounting(parent, entry, { phase, aborted })：族特有 hook——phase "settled"
 *   时执行记账（advisor 陈旧判定/token D1 落盘/轮次记录；escalate merge 决策 +
 *   injectBody 装配）；phase "cancelled"/"aborted" 时执行族清理（advisor record
 *   state="cancelled"）。
 */
export function settleAsyncEntry(parent, entry, opts = {}) {
  const role = opts.pool ?? entry.role ?? "subagent"
  const notifySettle = opts.notifySettle ?? null
  const logName = opts.log === undefined ? (role === "advisor" ? "advisor" : role === "consult" ? null : "child") : opts.log
  entry.report = opts.report ?? null
  entry.error = opts.error ?? null
  entry.done = true
  entry.status = "done"
  const childLogId = opts.logId ?? `${role}#${entry.id}`
  const childMs = entry.startedAt ? Date.now() - entry.startedAt : 0
  const aborted = opts.aborted === true || parentAborted(entry)
  // ② 日志三连（D4 统一守卫 !parentAborted——中止不落落错误事件——ev:stopped 已在中止
  // 清池点表达；定向 cancel 走 ev:cancelled）。挂起期 settle 补 ev:settled（分流事件）。
  if (logName) {
    if (entry.cancelled) {
      logEvent("ev:cancelled", { id: childLogId })
    } else if (!aborted) {
      if (entry.error != null) logEvent(`${logName}:error`, { role, id: childLogId, ms: childMs, err: errText(entry.error, 200) })
      else logEvent(`${logName}:done`, { role, id: childLogId, ms: childMs, kind: String(entry.report ?? "").includes("turn cap reached") ? "partial" : "ok", round: entry.round })
      if (parent.history?._suspended === true) logEvent("ev:settled", { id: childLogId, kind: "suspended" })
    }
  }
  // ③ 分流
  if (entry.cancelled) {
    opts.onAccounting?.(parent, entry, { phase: "cancelled", aborted })
    removeFromAsyncPools(parent, role, entry.id)
    if (opts.tombstoneCancel === true) writeTombstone(parent, entry.id, "cancelled", role)
    entry._onCancelled?.()
  } else if (aborted) {
    // 会话/回合全停——出池清理（中途停——无结果注入；interrupt 豁免见 parentAborted）
    opts.onAccounting?.(parent, entry, { phase: "aborted", aborted })
    removeFromAsyncPools(parent, role, entry.id)
  } else {
    // 族记账 hook（advisor 陈旧判定/token 落盘；escalate merge 决策）——可改写 entry.report
    opts.onAccounting?.(parent, entry, { phase: "settled", aborted })
    const suspended = parent.history?._suspended === true
    entry._onTerminal?.(suspended)
    if (suspended || opts.park === "always") {
      parkAsyncPending(parent, entry)
      removeFromAsyncPools(parent, role, entry.id)
      // park-ALWAYS 族（escalate）：settle 即出池——终态墓碑（dependsOn 语义——
      // tombstonePark；consult id 命名空间独立（非 nextSubagentId 分配）——不写墓碑防
      // 墓碑命名空间污染）
      if (opts.park === "always" && opts.tombstonePark === true) {
        writeTombstone(parent, entry.id, entry.error != null ? "failed" : "consumed", role)
      }
    }
    // 正常回合内 settle 行为不变：留池 done:true（done-in-pool 统一表示——回合尾
    // collectSettledAsync 直注入 / 挂起会话 sweep → digest）
  }
  // ④ 唤醒 waiter + 腾槽补位 + 挂起驱动唤醒
  entry._resolve?.(entry)
  if (opts.refill !== false) {
    refillPool(parent, (e) => e._auto?.() ?? false)
    refreshQueuedRows(parent)
  }
  notifySettle?.()
}
