/**
 * subagent-run.mjs — async spawn 执行器 executeAsyncSpawn（2026-09-05 module-split：
 * subagent.mjs 726 > 500 硬限——execute 的 async 分支 verbatim 迁入（闭包变量参数化：
 * parent/ctx/role/args + buildSpawnChild 产物），语义零变——subagent.mjs execute 调
 * 用（只此一处）；§20 补位/排队刷新仍来自 subagent-scheduler.mjs。
 */

import { ASYNC_SUBAGENT_LIMIT } from "./subagent-async.mjs"
import { runChildPipeline } from "./subagent-async.mjs"
import { TURN_CAP_MARK } from "../agent/spawn-child.mjs"
import { logEvent, errText } from "../log.mjs"
import { pushReal } from "../context.mjs"
import { escapeXml } from "../agent.mjs"
import {
  describeBlockers, dependentLabels, maybeRefillAsync, refreshQueuedTokens,
} from "./subagent-scheduler.mjs"

/**
 * Async branch (AGENT-LOOP.md §15 D-A1/D-A6): spawn without waiting.
 * The child runs the EXACT blocking pipeline (runChildPipeline — relay /
 * turn-cap / permission / MIN_REPORT_CHARS / mergeChildMutations all unchanged),
 * but the parent does not await it: the promise is parked in _asyncSubagents and
 * consumed via action:'check' or the turn-end auto-wait. Slot queue: running
 * count < ASYNC_SUBAGENT_LIMIT → start now; ≥ limit → enqueue (status "queued",
 * position = queue index) — never rejected, never requiring the model to batch.
 * @returns {string} JSON ack {id, role, status: running|queued[, position][, waiting][, reason]}
 */
export function executeAsyncSpawn(parent, ctx, role, args, child, input, childOpts, childRunOpts, relayPrefix, childProvider, files, dependsOn) {
  if ((ctx.depth ?? 0) > 0) {
    throw new Error("async spawn only available at the top level")
  }
  parent._asyncSubagents ??= new Map()
  parent._asyncQueue ??= []
  const running = [...parent._asyncSubagents.values()].filter((e) => e.status === "running").length
  const id = parent._subAgentCounter
  const entry = {
    id, role, relayPrefix,
    status: "queued", // 下面按等待态/槽位重定（避免两处判断漂移）
    position: undefined,
    report: null, error: null, done: false, cancelled: false,
    promise: null, _settle: null, _settleSeq: 0,
    // §19.5 D-M5 可决策字段（status 数据装配锚点）：model 在 spawn 时记录；
    // startedAt 在 ACTUAL start（queued 等待不计 elapsed）；turn/maxTurns 由
    // 下方 onToken 拦截层从子代理 ⟦ev⟧turn 事件镜像（T-M18 正确性断言）。
    model: childProvider?.model ?? null,
    startedAt: null,
    turn: 0, maxTurns: 0,
    // §19.5 D-M6 (round2 #2)：条目级 AbortController——cancel 定向 abort 本
    // 条目（runAgent signal 链）；Ctrl+C 全停语义不变（基信号 abort 逐链传播）。
    controller: null,
    // §20 D-SD2 域元数据（AGENT-LOOP.md §20）：running ∪ queued 条目全带——
    // _files（归一化绝对路径）/ _dependsOn（字符串 id）——冲突检测与补位判据
    // 的事实源；无调度参数 spawn 两字段皆空（legacy——不参与冲突检测——零改动）。
    _files: files,
    _dependsOn: dependsOn,
    _lastQueuedSig: null, // ⟦ev⟧queued 去重 sig（refreshQueuedTokens）
  }
  // §20 D-SD3 准入落点：等待态（依赖未满足/域冲突/depc）→ queued（waiting-deps——
  // 不占槽不启动——即使槽空）；纯槽满（kind slot）→ queued（等位）；否则立即启动。
  // 派生实时计算（describeBlockers——池状态在 spawn 同步段内不变——与前面准入一致）。
  const blockers = describeBlockers(parent, entry)
  if (blockers.kind === "slot") {
    entry.status = running >= ASYNC_SUBAGENT_LIMIT ? "queued" : "running"
  } else {
    entry.status = "queued" // waiting-deps / dependency-cancelled——slot 空也不启动
  }
  // The settle signal — resolves when the run chain settles (never rejects).
  entry.promise = new Promise((res) => { entry._settle = res })
  // §19.5 D-M6：条目 controller 链到会话/回合基信号（_sessionSignal 优先——
  // §17 挂起会话内 children 持会话 signal，digest 自身 Ctrl+C 不误伤）。
  const ctrl = new AbortController()
  entry.controller = ctrl
  const baseSignal = parent._sessionSignal ?? ctx.signal ?? null
  if (baseSignal) {
    if (baseSignal.aborted) ctrl.abort()
    else baseSignal.addEventListener("abort", () => ctrl.abort(), { once: true })
  }
  // §19.5 D-M5：turn 镜像拦截层（callbacks 包装层——选改动最小方案：在既有
  // wrapChildCallbacks 之外再包一层，只解析 ⟦ev⟧turn 更新条目，其余原样转发）。
  const trackOpts = { ...childOpts }
  const parentOnToken = trackOpts.onToken
  if (parentOnToken) {
    trackOpts.onToken = (t) => {
      const ev = String(t).match(/^⟦ev⟧turn\x1e(\d+)\x1e(\d+)\x1e/)
      if (ev) {
        entry.turn = Number(ev[1]) || 0
        entry.maxTurns = Number(ev[2]) || 0
      }
      return parentOnToken(t)
    }
  }
  entry.start = () => {
    entry.status = "running"
    entry.position = undefined
    entry.startedAt = Date.now()
    // §19.5.6 D-SF1（round3 #1）：绑定子代理对象引用——绑定时刻 = 实际启动时
    // （queued 条目 spawn-ack 时刻尚无子代理对象——§20 D-SD3b）；绑定对象 = 子代理
    // 对象（不是 _touchedFiles 数组引用——per-run 记账在 prepareRun 重置——数组
    // 引用会陈旧——对象引用保证 status 查询时实时读——杀前一刻最新）。
    entry.childAgent = child
    // §19.5 D-M7b ①: async 标记事件——零字段 ⟦ev⟧async token（sync 不发）。
    // 锚点 = 实际启动（与 [model] 同步——queued 入队不 paint，补位启动才发）；
    // 先于 [model] 发出——区块创建即知 sub.async（routeSubToken 解析——
    // ⏹ 门控与头标 async 的判定源）。父级直接 emit（depth-0 专属路径——
    // 不经子代理文本 strip 白名单——与 ⟦ev⟧stopped/settled 同族）。
    ctx.callbacks?.onToken?.(relayPrefix + "⟦ev⟧async\x1e")
    // Deferred [model] emit: the TUI block is created at ACTUAL start.
    ctx.callbacks?.onToken?.(relayPrefix + "[model]" + (childProvider.model ?? ""))
    // Turn-cap on background children NEVER pops the continue panel (D-A3):
    // §15 D-A3 exception (2026-09-02 unified rule, AGENT-LOOP.md §2): in an
    // engineering && AUTO session the child auto-resumes — the user authorized
    // unattended runs, no one is at the panel. Every other tier auto-declines
    // and the partial-work report carries the cap reason. §18 D-E2 relies on
    // this exception as the turn-cap fallback for the default-async eng-coder
    // delivery (the internal protocol does not raise the 100-turn cap).
    runChildPipeline(child, input, trackOpts, { ...childRunOpts, signal: entry.controller.signal }, {
      parent, role, args,
      askContinue: () => Promise.resolve(Boolean(parent.config?.agent?.engineering && parent.autoApprove)),
    })
      .then((report) => { entry.report = report })
      .catch((err) => { entry.error = err?.message ?? String(err) })
      .finally(() => {
        entry.status = "done" // running 数口径（D-A1/D-A2/T6）：已完成未消费不计入
        entry.done = true
        // LOGGING（LOGGING.md）：settle 分流事件——child:done/child:error（结果）+
        // ev:cancelled/ev:settled（settle 回调分流——取消/挂起移交；正常回合内 settle
        // 由 child:done 覆盖不另发 ev——ev:stopped 见中止清池点）
        const childLogId = `${entry.role}#${entry.id}`
        const childMs = entry.startedAt ? Date.now() - entry.startedAt : 0
        // 中止守卫（2026-09-03 code review #5）：Ctrl+C/会话中止时子代理以 error 形态
        // settle——不落 child:error/done/ev:settled（ev:stopped 已在中止清池点表达；
        // 同文件阻塞路径同款抑制——"用户停——不落错误事件"）。定向 cancel 走 ev:cancelled。
        const parentAborted = ctx.signal?.aborted || entry.controller?.signal?.aborted
        if (entry.cancelled) {
          logEvent("ev:cancelled", { id: childLogId })
        } else if (!parentAborted) {
          if (entry.error != null) logEvent("child:error", { role: entry.role, id: childLogId, ms: childMs, err: errText(entry.error, 200) })
          else logEvent("child:done", { role: entry.role, id: childLogId, ms: childMs, kind: String(entry.report ?? "").includes(TURN_CAP_MARK) ? "partial" : "ok" })
          if (parent._suspended) logEvent("ev:settled", { id: childLogId, kind: "suspended" })
        }
        // §19.5 cancelled settle 分支（D-M6 round1 #1 + round2 #3）：cancel 定向
        // 中止的条目——不入 _pendingAsyncResults、不参与 collectSettledAsync 直注入
        // （清池规则同 Ctrl+C 全停但只清该条目——陈旧错误零注入）；发 ⟦ev⟧stopped
        // 冻结事件（TUI 区块 interrupted 语义冻结——标题 "stopped"）；取消事实与半成品
        // 警示对模型可见（user-role 提醒——形态仿 injectAsyncResult、XML 转义——防基于
        // 半成品树继续：mergeChildMutations 不覆盖 abort 路径）。
        // §20 D-SD5：running 依赖取消的 settle 终态点——写终态墓碑（running 取消无
        // 出队事件——出池在 settle）；queued 依赖者随之标注 dependency cancelled
        // （refreshQueuedTokens——settle 后统一段）；提醒文本列出依赖者（供模型决策）。
        if (entry.cancelled) {
          parent._asyncSubagents?.delete(String(entry.id))
          const tombstones = (parent._asyncTombstones ??= new Map())
          tombstones.set(String(entry.id), { status: "cancelled", role: entry.role })
          ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`)
          const dependents = dependentLabels(parent, String(entry.id))
          const autoNote = parent.autoApprove
            ? " — AUTO session: they auto-start on slot availability (round2 #3)"
            : " — they stay queued until you cancel them or an AUTO session starts them"
          pushReal(parent, {
            role: "user",
            content: `[System reminder: subagent ${escapeXml(entry.role)}#${entry.id} cancelled by user — partial changes not merged/audited${dependents.length > 0 ? `; queued dependents ${dependents.join(", ")} marked "dependency cancelled"${autoNote}` : ""}]`,
          })
        } else if (!ctx.signal?.aborted) {
          // 完成信号按会话态分流（§17 D-S8 冻结门控 + D-S3 记账——以读取时刻为准，确定性）：
          // - 非挂起态（普通回合内 settle）：照发 ⟦ev⟧done —— TUI 立即冻结区块，冻结位置 =
          //   完成时刻的流位置（§15 D-A3 2026-09-02 用户实证修正：收尾统一发会把块堆在结论之后）。
          //   §17.5 supersede：回合尾 collectSettledAsync（suspDriven）不再直注入——条目留池
          //   由挂起会话首轮 sweep → digest 消化（17.5.2 方案 B——块已冻结不受影响）。
          // - 挂起态（_suspended：回合已结束或 auto-turn 消化中）：冻结延迟——改发 ⟦ev⟧settled
          //   （区块显示 "done · awaiting digestion" 驻留面板），条目移交 _pendingAsyncResults
          //   由下个回合 prepareRun 前注入（D-S3 ②；注入即从池/pending 移除，无重复）；
          //   §17.5.5：注入完成后 freezeReclaimDigestedBlocks 逐条回收冻结（不等池空）。
          // 父会话 abort 两种都不发：TUI 已按 interrupted 冻结，晚到 token 经 tombstone 丢弃。
          if (parent._suspended) {
            parent._pendingAsyncResults ??= []
            parent._pendingAsyncResults.push(entry)
            parent._asyncSubagents?.delete(String(entry.id))
            ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`)
          } else {
            ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
          }
        }
        entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
        entry._settle()
        for (const w of parent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
        // §20 D-SD4 释放点：settle 腾槽 + 依赖终态转移 → 补位（依赖满足者/域冲突
        // 解除者自动启动——槽 ≤4）→ 排队态面板刷新（等待块头标注随终态更新——
        // dependency cancelled / 位置前移）。
        maybeRefillAsync(parent)
        refreshQueuedTokens(parent, ctx.callbacks?.onToken)
      })
  }
  parent._asyncSubagents.set(String(id), entry)
  // LOGGING（LOGGING.md）：child:spawn（async——注册即事件；status 记 queued/running 分流；
  // 实际启动由补位 start() 触发——运行中由子内 llm/tool 事件可见）
  logEvent("child:spawn", { role, id: `${role}#${id}`, kind: "async", status: entry.status, ms: 0 })
  if (entry.status === "queued") {
    parent._asyncQueue.push(entry)
    entry.position = parent._asyncQueue.length
    // §20 D-SD3b：排队 spawn 返回即建面板 waiting 块（⟦ev⟧queued 事件——spawn 侧
    // 发——TUI routeSubToken 消费建块/更新头；启动后 ⟦ev⟧async 转 running——同 key
    // 不重建）。refreshQueuedTokens 同时校正既有排队条目的位置/等待态头。
    refreshQueuedTokens(parent, ctx.callbacks?.onToken)
    const blk = describeBlockers(parent, entry)
    const out = { id: String(id), role, status: "queued", position: entry.position }
    if (blk.kind !== "slot") {
      out.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
      out.reason = blk.detail
    }
    return JSON.stringify(out)
  }
  entry.start()
  return JSON.stringify({ id: String(id), role, status: "running" })
}
