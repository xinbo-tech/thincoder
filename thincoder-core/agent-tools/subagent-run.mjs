/**
 * subagent-run.mjs — async spawn 执行器 executeAsyncSpawn（2026-09-05 module-split：
 * subagent.mjs 726 > 500 硬限——execute 的 async 分支 verbatim 迁入（闭包变量参数化：
 * parent/ctx/role/args + buildSpawnChild 产物），语义零变——subagent.mjs execute 调
 * 用（只此一处）；§20 补位/排队刷新仍来自 subagent-scheduler.mjs。
 */

import { createHash } from "node:crypto"
import { basename } from "node:path"
import { ASYNC_POOL_LIMITS, poolDomainOf, poolLimitsFor, runningPoolCount } from "./subagent-async.mjs"
import { runChildPipeline } from "./subagent-async.mjs"
import { logEvent } from "../log.mjs"
import { deathLine } from "../abort-provenance.mjs"
import { pushReal } from "../context.mjs"
import {
  describeBlockers, refreshQueuedTokens, consumeSubagentToken, assertPoolKeyFree,
} from "./subagent-scheduler.mjs"
// ASYNC-RESULT-CONTAINER.md D3/D6：settle 公共收尾单点 + child signal 构建单点
import { bindChildController, buildChildSignal, settleAsyncEntry } from "./async-settle.mjs"

/** #309 任务书文本摘要（12 hex——**不留全文**，NF-L3 同族）：条目自携与双点留痕的标识面。 */
function taskSeal(text) {
  return createHash("sha256").update(String(text ?? "")).digest("hex").slice(0, 12)
}

/**
 * SUBAGENT-OBSERVE-SEND D2：注入队列回合边界消费核心——把 entry._injected 全部消息按普通
 * user 回合推入子代理历史（pushReal → 下轮 chat 即含该指令）并清空队列。独立导出供测试
 * 直接锁该接缝（AC2——"子下回合边界收到并作普通 user 指令"的历史落点）。consumeInjected
 * 闭包即调用本函数。N2：不打断在跑工具——本函数只在回合边界（agent.mjs 循环头）被调。
 * @returns {number} 本次投递条数（空队列 0）
 */
export function drainInjectedQueue(entry, agent) {
  const q = entry?._injected
  if (!Array.isArray(q) || q.length === 0) return 0
  const msgs = q.splice(0)
  for (const m of msgs) pushReal(agent, { role: "user", content: String(m) })
  return msgs.length
}

/**
 * Async branch (AGENT-LOOP-SUBAGENT.md §6.7.3 D-A1/D-A6): spawn without waiting.
 * The child runs the EXACT blocking pipeline (runChildPipeline — relay /
 * turn-cap / permission / MIN_REPORT_CHARS / mergeChildMutations all unchanged),
 * but the parent does not await it: the promise is parked in _asyncSubagents and
 * consumed by the auto channel (AGENT-LOOP-SUBAGENT.md §6.7.5 — turn-end collection / suspension digest;
 * the check action is gone). Slot queue (AGENT-LOOP-ASYNC-POOL.md §6.10 — D-24a/R14 分域): the entry carries a
 * pool domain (_pool = poolDomainOf(role)); running count < limit[its domain]
 * (agent.poolLimits — default engCoder 4 / other 4) → start now; ≥ → enqueue
 * (status "queued", position = queue index) — never rejected, never requiring the
 * model to batch. Domains never block each other (engCoder pool full ≠ explore queued).
 * @returns {string} JSON ack {id, role, status: running|queued[, position][, waiting][, reason]}
 */
export function executeAsyncSpawn(parent, ctx, role, args, child, input, childOpts, childRunOpts, relayPrefix, childProvider, files, dependsOn) {
  if ((ctx.depth ?? 0) > 0) {
    throw new Error("async spawn only available at the top level")
  }
  parent._asyncSubagents ??= new Map()
  parent._asyncQueue ??= []
  const id = parent._subAgentCounter
  // ED-5（AGENT-LOOP-SUBAGENT.md §6.21）一次性取号令牌消费：取号（subagent-spawn.mjs async
  // 分支 nextSubagentId）与本消费点同步配对、无 await 间隙；漏调分配器 = 直读陈旧 counter
  // ⇒ 抛错（防 map.set 覆写旧条目 = 静默丢报告）。断言通过即置 undefined（一次性）。
  consumeSubagentToken(parent, id, "async spawn", role)
  const entry = {
    id, role, relayPrefix,
    // §11.1 D-24a/R14：池域字段（域判定单一事实源——poolDomainOf——role 枚举见
    // subagent.mjs ROLES；未知角色归 other）——running 计数/补位按域过滤。
    _pool: poolDomainOf(role),
    status: "queued", // 下面按等待态/槽位重定（避免两处判断漂移）
    position: undefined,
    report: null, error: null, done: false, cancelled: false,
    promise: null, _settle: null, _settleSeq: 0,
    // AGENT-LOOP-SUBAGENT.md §6.7.2 D-M5 可决策字段（status 数据装配锚点）：model 在 spawn 时记录；
    // startedAt 在 ACTUAL start（queued 等待不计 elapsed）；turn/maxTurns 由
    // 下方 onToken 拦截层从子代理 ⟦ev⟧turn 事件镜像（T-M18 正确性断言）。
    model: childProvider?.model ?? null,
    startedAt: null,
    turn: 0, maxTurns: 0,
    // AGENT-LOOP-SUBAGENT.md §6.7.2 D-M6 (round2 #2)：条目级 AbortController——cancel 定向 abort 本
    // 条目（runAgent signal 链）；Ctrl+C 全停语义不变（基信号 abort 逐链传播）。
    controller: null,
    // D-SD2 域元数据（AGENT-LOOP-SUBAGENT.md §6.9）：running ∪ queued 条目全带——
    // _files（归一化绝对路径）/ _dependsOn（字符串 id）——冲突检测与补位判据
    // 的事实源；无调度参数 spawn 两字段皆空（legacy——不参与冲突检测——零改动）。
    _files: files,
    _dependsOn: dependsOn,
    // #309（AGENT-LOOP-SUBAGENT.md §6.29.2——可诊断性）：条目**自携**绑定档与任务书摘要
    // （启动路径按条目闭包取值——入队/补位不再有第二个取值面）；`child:spawn` / `child:start`
    // 双点同键面留痕（基名 + 摘要，零内容）——事后可对账「哪条任务书在哪个 id 下起跑」。
    _batchDoc: child?._batchDoc ?? null,
    _taskSeal: taskSeal(input),
    _lastQueuedSig: null, // ⟦ev⟧queued 去重 sig（refreshQueuedTokens）
    // SUBAGENT-OBSERVE-SEND D2：父侧 send 注入队列——父 action:'send' push 消息，子
    // 回合边界经 consumeInjected 回调消费（drain + pushReal 成 user 回合）；settle 收尾
    // 时仍残留 = 未投递（消息入队后子在下一回合边界前 settle）→ 附 settle 报告提示。
    _injected: [],
  }
  // 留痕面基名（零内容——§6.29.2）：绑定档绝对路径 → 基名；无绑定（非工程族）⇒ null（字段不落）。
  const batchDocBase = entry._batchDoc ? basename(entry._batchDoc) : null

  // §20 D-SD3 准入落点：等待态（依赖未满足/域冲突/depc）→ queued（waiting-deps——
  // 不占槽不启动——即使槽空）；纯槽满（kind slot）→ 按域计数判定（§11.1 D-24a：
  // runningIn(domain) < limit(domain)——跨域互不阻塞——每次入池判定时读配置）。
  const blockers = describeBlockers(parent, entry)
  if (blockers.kind === "slot") {
    const limits = poolLimitsFor(parent) // 运行期读 + 校验（非法键回退默认——T-24a4）
    entry.status = runningPoolCount(parent, entry._pool) >= (limits[entry._pool] ?? ASYNC_POOL_LIMITS[entry._pool])
      ? "queued" : "running"
  } else {
    entry.status = "queued" // waiting-deps / dependency-cancelled——slot 空也不启动
  }
  // The settle signal — resolves when the run chain settles (never rejects).
  entry.promise = new Promise((res) => { entry._settle = res })
  // AGENT-LOOP-SUBAGENT.md §6.7.2 D-M6：条目 controller 链到会话/回合基信号（_sessionSignal 优先——
  // AGENT-LOOP-ASYNC-POOL.md §6.8 挂起会话内 children 持会话 signal，digest 自身 Ctrl+C 不误伤）。
  // D6 buildChildSignal 单点（ASYNC-RESULT-CONTAINER.md）。
  const ctrl = new AbortController()
  entry.controller = ctrl
  // §20.3 站点 #10（第 24 批）：hop 逐跳保 reason；#98 链结单点（interrupt 豁免面——
  // Ctrl+I 不逐链中止池内子代理）。
  bindChildController(ctrl, buildChildSignal(parent, ctx))
  // AGENT-LOOP-SUBAGENT.md §6.7.2 D-M5：turn 镜像拦截层（callbacks 包装层——在既有
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
    // §27 R23 D-R23c1：嵌套 wrapper 标记随镜像层透传（wrapChildCallbacks 产物带
    // _relayPrefix——本层重包后丢失会让异步子代理（默认 async——depth-0）内嵌 spawn
    // 的生成侧补发射失效（emitNestedChildEvent 判据）——同步复制标记保语义）。
    trackOpts.onToken._relayPrefix = parentOnToken._relayPrefix ?? null
  }
  entry.start = () => {
    entry.status = "running"
    entry.position = undefined
    entry.startedAt = Date.now()
    // AGENT-LOOP-SUBAGENT.md §6.7.2 D-SF1（round3 #1）：绑定子代理对象引用——绑定时刻 = 实际启动时
    // （queued 条目 spawn-ack 时刻尚无子代理对象——§20 D-SD3b）；绑定对象 = 子代理
    // 对象（不是 _touchedFiles 数组引用——per-run 记账在 prepareRun 重置——数组
    // 引用会陈旧——对象引用保证 status 查询时实时读——杀前一刻最新）。
    entry.childAgent = child
    // SUBAGENT-OBSERVE-SEND D2：子侧输入源贯通（设计"硬缺口"闭合）——把"注入队列消费
    // 回调"经 childRunOpts 塞进 runAgent opts（runChildPipeline → runWithContinue →
    // runAgent），子回合边界（agent.mjs 每轮开头的 consumeInjected?.() 点）消费
    // entry._injected → pushReal 成 user 回合进子历史——当作普通用户指令处理。回调闭包
    // 持 entry + child；空队列 no-op（每轮尝试——零开销）。N2：不打断在跑工具——入队
    // 消息只在下一回合边界（当前工具完成后的下轮 chat 前）进上下文。
    const consumeInjected = (ag) => { drainInjectedQueue(entry, ag ?? child) }
    // AGENT-LOOP-SUBAGENT.md §6.7.2 D-M7b ①: async 标记事件——零字段 ⟦ev⟧async token（sync 不发）。
    // 锚点 = 实际启动（与 [model] 同步——queued 入队不 paint，补位启动才发）；
    // 先于 [model] 发出——区块创建即知 sub.async（routeSubToken 解析——
    // ⏹ 门控与头标 async 的判定源）。父级直接 emit（depth-0 专属路径——
    // 不经子代理文本 strip 白名单——与 ⟦ev⟧stopped/settled 同族）。
    ctx.callbacks?.onToken?.(relayPrefix + "⟦ev⟧async\x1e")
    // Deferred [model] emit: the TUI block is created at ACTUAL start.
    ctx.callbacks?.onToken?.(relayPrefix + "[model]" + (childProvider.model ?? ""))
    // #309 §6.29.2 双点留痕第二点（条目**实际启动点**——与 child:spawn 同键面）：哪条任务书在哪个 id 下起跑。
    logEvent("child:start", { role, id: `${role}#${id}`, batchDocBase, taskSeal: entry._taskSeal })
    // Turn-cap on background children NEVER pops the continue panel (D-A3):
    // §15 D-A3 exception (2026-09-02 unified rule, AGENT-LOOP.md §2): in an
    // engineering && AUTO session the child auto-resumes — the user authorized
    // unattended runs, no one is at the panel. Every other tier auto-declines
    // and the partial-work report carries the cap reason. §18 D-E2 relies on
    // this exception as the turn-cap fallback for the default-async eng-coder
    // delivery (the internal protocol does not raise the 100-turn cap).
    runChildPipeline(child, input, trackOpts, { ...childRunOpts, signal: entry.controller.signal, consumeInjected }, {
      parent, role, args,
      askContinue: () => Promise.resolve(Boolean(parent.config?.agent?.engineering && parent.autoApprove)),
    })
      .then((report) => { entry.report = report })
      // §20.3 第 3 条合成器（第 24 批）：原 message 前缀逐字保留 + 来源后缀
      .catch((err) => { entry.error = deathLine(err, entry.controller?.signal) })
      .finally(() => {
        // SUBAGENT-OBSERVE-SEND D3（send→settle 竞态）：settle 收尾时 _injected 仍残留
        // = 消息入队后子代理在下一回合边界前 settle——未投递——附 settle 报告/错误提示
        // （防父误以为引导已落地）。error 路径附 error；报告路径附 report 尾。
        const undelivered = Array.isArray(entry._injected) ? entry._injected.length : 0
        if (undelivered > 0) {
          const note = `\n[note: ${undelivered} message(s) queued via subagent action:'send' were NOT delivered — the subagent settled before its next turn boundary; re-spawn with the direction if it still applies.]`
          if (entry.error != null) entry.error += note
          else entry.report = `${entry.report ?? ""}${note}`
          entry._injected = [] // 子已 settle——消费面终——清空防重复提示（提示已随报告携带）
        }
        // settle 公共收尾单点（ASYNC-RESULT-CONTAINER.md D3——settleAsyncEntry）：日志三连
        // （ev:cancelled/child:done|error/ev:settled）/cancelled 分支（出池+墓碑+⟦ev⟧stopped
        // +提醒）/挂起分流（pending 单容器+出池——统一守卫 !parentAborted——D4）/公共尾部
        // （settleSeq/_settle/唤醒 waiter + 腾槽补位——helper 尾部恒补——见 async-settle.mjs）。
        settleAsyncEntry(parent, entry, {
          pool: parent._asyncSubagents,
          ctx,
        })
      })
  }
  // ED-5（§6.21）入池键守卫：同 id 二次入池 = 覆写（静默丢报告 + status/cancel 错址）⇒ 抛错。
  assertPoolKeyFree(parent._asyncSubagents, id, role)
  parent._asyncSubagents.set(String(id), entry)
  // LOGGING（LOGGING.md）：child:spawn（async——注册即事件；status 记 queued/running 分流；
  // 实际启动由补位 start() 触发——运行中由子内 llm/tool 事件可见）
  logEvent("child:spawn", { role, id: `${role}#${id}`, kind: "async", status: entry.status, ms: 0, batchDocBase, taskSeal: entry._taskSeal })
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
