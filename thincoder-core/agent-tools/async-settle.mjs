/**
 * async-settle.mjs — async 结果容器统一共享 helper（ASYNC-RESULT-CONTAINER.md D1-D6，
 * 2026-09-08——CLI 端落地；VS Code 同名机制各自独立实现）。根治四族 settle 记账逐字
 * 重复（subagent/advisor/escalate/consult）+ pending 三族分叉（_pendingEscalateResults/
 * _pendingConsultResults 独立族废弃）+ done-in-pool 三表示 + _sessionSignal 兜底抄 3 处
 * （consult 无兜底）：
 * - D1 池 accessor：`getAsyncPool(parent, role)`——role "advisor" 返 `_asyncAdvisors`，
 *   其余返 `_asyncSubagents`——底层保留双池（advisor 无队列独立调度），accessor 吸收差异。
 * - D2 pending 单容器：全族统一 `_pendingAsyncResults`，条目带 role 字段（consult 升格
 *   完整 entry）；`parkAsyncPending` 统一停靠（`_inPending` 标记保留防重复移交——settle
 *   回调与 sweepSettledToPending 同一表示，done-in-pool 统一：留池 done:true + pending
 *   单容器）。
 * - D3 settle 共享 helper：`settleAsyncEntry(parent, entry, {pool, ctx, onAccounting})`——
 *   公共收尾单点（日志三连（ev:cancelled / child:done|error + ev:settled）→ cancelled /
 *   parentAborted / 挂起分流 → settleSeq/`_settle` 唤醒 waiter）。族特有段作 onAccounting
 *   hook 注入（advisor 陈旧判定/token D1 落盘记账；escalate 三分类 merge 决策 + 腾槽补位）。
 * - D4 守卫统一：`parentAborted`（= `ctx.signal?.aborted || entry.controller?.signal?.
 *   aborted`——escalate 严格版）——日志三连与挂起分流共用同一守卫。
 * - D6 buildChildSignal：`parent._sessionSignal ?? ctx.signal ?? null` 单点（原 3 处
 *   逐字抄；consult 补 _sessionSignal 兜底——D5）。
 * 模块图：单向 import subagent-scheduler.mjs（dependentLabels——cancelled 提醒依赖者
 * 列表）+ log/context/helpers/spawn-child——四族 settle 回调（subagent-run/advisor-async/
 * escalate-async/consult）单向 import 本模块；scheduler 反向 import 本模块（getAsyncPool）
 * 与既有 scheduler ↔ subagent-async 同款惰性环——无求值期依赖。
 *
 * S1 续轮第二批（2026-09-14——异步机械族 VSC 侧并入，AGENT-LOOP.md §2.3 载体口径）：
 * - #94 载体吸收：`carrierField`（父对象字段优先 / 回退 `history`——VSC 形跨 runAgent
 *   载体）+ 墓碑三函数单点（`writeTombstoneTo` / `writeTombstone` / `tombstoneOf`，
 *   原核内 3 处 inline 写全部收口）；`getAsyncPool` / `parkAsyncPending` 走吸收。
 * - #98 interrupt 豁免面：`parentAborted` 豁免 `reason.interrupt`（Ctrl+I 不是全停）；
 *   `bindChildController` = 链结单点（原 4 处逐字同构，interrupt 不逐链中止）。
 */
import { logEvent, errText } from "../log.mjs"
import { pushReal } from "../context.mjs"
import { escapeXml } from "../agent/helpers.mjs"
import { TURN_CAP_MARK } from "../agent/spawn-child.mjs"
import { dependentLabels, maybeRefillAsync, refreshQueuedTokens } from "./subagent-scheduler.mjs"
// ED-4（2026-09-16）：advisor 排队补位——同 scheduler ↔ 本模块惰性环（函数声明提升——无求值期依赖）
import { refillAdvisorQueue } from "./advisor-async.mjs"

// ─── #94 载体吸收（VSC 侧并入——AGENT-LOOP.md §2.3 载体五字段）───────────────

/**
 * 载体字段读取吸收（#94——「VSC 的跨 runAgent 存活载体面按核内结构归一」）：
 * §2.3 载体口径 = `_asyncSubagents` · `_asyncAdvisors` · `_consultSessions` ·
 * `_pendingAsyncResults` · `_suspended`（AGENT-LOOP.md §2.3 seam 表）。
 * CLI 形：字段直接挂 agent（跨 run 存活）；VSC 形：字段挂 depth-0 `history`
 * （agent per-run 重建——run 起始把 history 容器绑到 agent 字段，绑定不变式）。
 * 本函数吸收两形为同一读取：父对象字段优先，缺字段回退 `parent.history`。
 * 写侧**不变**（仍以父对象字段为入口——绑定不变式下与 history 同一容器）。
 */
export function carrierField(parent, field) {
  const own = parent?.[field]
  if (own !== undefined && own !== null) return own
  return parent?.history?.[field] ?? undefined
}

/**
 * 终态墓碑写入单点（#94——VSC 侧并入：`writeTombstoneTo` / `writeTombstone` 单点收口；
 * 原核内 3 处 inline `(x._asyncTombstones ??= new Map()); .set(...)` 全数经此）。
 * holder 向 = 拥有载体的对象（agent / history 数组——跨 runAgent 存活口径同 getAsyncPool）。
 */
export function writeTombstoneTo(holder, id, status, role) {
  if (!holder) return
  if (!(holder._asyncTombstones instanceof Map)) holder._asyncTombstones = new Map()
  holder._asyncTombstones.set(String(id), { status, role })
}

/** parent 形态墓碑写入（载体吸收：父对象无 Map 而 history 有 ⇒ 借用同一 Map——不另建分叉）。
 *  #43-② 借用规则扩张（设计 §6.25 ③）：父无自有 Map 且载体无 ⇒ **主容器落父字段**（今日落点——
 *  CLI 零回归；`history` 数组会被整体替换、非稳定载体）+ **载体侧写同一容器**——合成 parent 形
 *  （VSC ⏹ 取消路径）跨调用存活。 */
export function writeTombstone(parent, id, status, role) {
  if (!(parent?._asyncTombstones instanceof Map)) {
    const existing = carrierField(parent, "_asyncTombstones")
    if (existing instanceof Map) parent._asyncTombstones = existing          // 借用（既有）
    else if (parent?.history && typeof parent.history === "object") {
      parent._asyncTombstones = new Map()                                    // 主容器（父字段——今日落点）
      parent.history._asyncTombstones = parent._asyncTombstones              // 载体别名（合成 parent 跨调用存活）
    }
  }
  writeTombstoneTo(parent, id, status, role)
}

/** 终态墓碑读取（parent 形态——载体吸收；无记录 ⇒ null）。 */
export function tombstoneOf(parent, id) {
  const m = carrierField(parent, "_asyncTombstones")
  return (m instanceof Map ? m.get(String(id)) : undefined) ?? null
}

/**
 * 条目 controller 链到基信号单点（#98 VSC 侧并入——interrupt 豁免面；原 subagent-run /
 * advisor-async / escalate-async / consult 四处逐字同构）：
 * - 基信号**已 aborted** 且非 interrupt ⇒ 立即 abort（reason 逐跳保留——§20.3 站点 #10）；
 * - interrupt aborted（Ctrl+I——中断消息注入后同回合续跑）⇒ **不逐链中止**（池保留；
 *   子代理 / 评审继续跑完，settle 照常注入——「Ctrl+I keeps the pool」意图对齐）；
 * - 未来 abort ⇒ 非 interrupt 才逐链传播（Stop / 会话中止全停语义不变）。
 */
export function bindChildController(ctrl, baseSignal) {
  if (!ctrl || !baseSignal) return
  if (baseSignal.aborted) {
    if (baseSignal.reason?.interrupt !== true) ctrl.abort(baseSignal.reason)
    return
  }
  baseSignal.addEventListener("abort", () => {
    if (baseSignal.reason?.interrupt === true) return
    ctrl.abort(baseSignal.reason)
  }, { once: true })
}

// ─── D1 池 accessor（吸收双池）────────────────────────────────────────────────

/** 池 accessor（D1）：role "advisor" → `_asyncAdvisors`（独立评审池——无队列独立调度）·
 *  role "consult" → `_consultSessions`（会话池）· 其余 → `_asyncSubagents`（子代理/飞刀
 *  共享槽位队列池）。载体经 `carrierField` 吸收（#94）；未初始化返 null——调用方以
 *  `?? new Map()` / 可选链处置。 */
export function getAsyncPool(parent, role) {
  const field = role === "advisor" ? "_asyncAdvisors" : role === "consult" ? "_consultSessions" : "_asyncSubagents"
  return carrierField(parent, field) ?? null
}

// ─── D2 pending 单容器（+role）───────────────────────────────────────────────

/** pending 单容器停靠（settle 挂起分流 / sweep 补扫共用——统一表示：条目置 `_inPending`
 *  防重复移交（sweep 幂等判据），includes 去重兜底）。载体经 `carrierField` 吸收（#94——
 *  VSC 形 pending 挂 history）；写侧仍落父对象字段（无则借用 history 的数组）。 */
export function parkAsyncPending(parent, entry) {
  const existing = carrierField(parent, "_pendingAsyncResults")
  const pend = (parent._pendingAsyncResults ??= Array.isArray(existing) ? existing : [])
  if (pend.includes(entry)) return
  entry._inPending = true
  pend.push(entry)
}

// ─── D4 守卫统一（严格版）+ D6 信号兜底单点 ──────────────────────────────────

/** D4 settle 守卫统一（escalate 严格版）：父侧中止 = 回合 signal aborted（#98 VSC 侧
 *  并入——interrupt 豁免：Ctrl+I `reason.interrupt` 不是全停，回合续跑、池保留 ⇒ 不判
 *  父中止）或条目 controller aborted（取消先行——cancelled 分支在守卫之前分流，定向
 *  cancel 不算父中止）。日志三连与挂起分流共用本守卫。 */
export function parentAborted(ctx, entry) {
  const base = ctx?.signal
  if (base?.aborted === true && base?.reason?.interrupt !== true) return true
  return Boolean(entry?.controller?.signal?.aborted)
}

/** D6 child signal 构建单点（D5——consult 补 _sessionSignal 兜底）：挂起会话内的回合
 *  （digest/用户回合）子代理持会话 signal（`parent._sessionSignal`——会话 Stop 逐链中止，
 *  消化轮自身 Ctrl+I/Ctrl+C 不误伤）；回合级 `ctx.signal` 兜底。原 subagent/advisor/
 *  escalate 3 处逐字抄 + consult 补上统一入此。 */
export function buildChildSignal(parent, ctx) {
  return parent?._sessionSignal ?? ctx?.signal ?? null
}

// ─── D3 settle 共享 helper ───────────────────────────────────────────────────

/**
 * §23.3.1 消化窗口持有释放（TUI-OOM-ROOTCAUSE——D-SM2 表 2 候选 1）：注入完成后置空条目
 * 对子代理对象的引用（`childAgent`/`report`——条目前此从不显式释放，挂起期 = 分钟级驻留）。
 * 幂等（重入不抛）；池内/挂起未消化窗口语义零变（settle 时刻不释放——表 2 候选 2 否决：
 * status/observe 在窗口内仍读 child 摘要）。三消费点（回合尾收集 / run 起始 pending 注入 /
 * 挂起残差注入）在注入完成后调本 helper。
 */
export function releaseSettledEntry(entry) {
  if (!entry || typeof entry !== "object") return
  entry.childAgent = null
  entry.report = null
}

/**
 * D3 settle 共享 helper——四族 settle 回调公共收尾单点（ASYNC-RESULT-CONTAINER.md
 * AC1：settle 记账单点，无逐字重复）。流程：
 *   ① 落 done/status="done"（settle 即翻——不再占槽/持文件域；report/error 由各族
 *      在调用前落好——subagent 的未投递注记先于本调用附加）；
 *   ② 日志三连（统一守卫 !parentAborted——cancelled → ev:cancelled；非中止 →
 *      child:done|:error（族形态：advisor 合并单事件；escalate 撞 cap 归 partial）+
 *      挂起期 ev:settled；consult 族跳过——per-model 日志已在子代理 settle 时记录）；
 *   ③ 分流：cancelled（出池 + cancelled 墓碑 + ⟦ev⟧stopped + 族提醒——不入 pending）→
 *      parentAborted（守卫抑制——不落事件不入流——中止清池在回合尾/挂起中止统一做）→
 *      settled（族 onAccounting hook 记账 → 挂起期（或 consult 族恒停靠）移交 pending
 *      单容器 + 出池 + ⟦ev⟧settled；回合内 ⟦ev⟧done 留池 done:true）；
 *   ④ 公共尾部：settleSeq 递增 + `_settle` 唤醒 waiter + 腾槽补位（subagent/escalate 族
 *      恒补——settle/cancel 释放槽 → maybeRefillAsync + refreshQueuedTokens——AGENT-LOOP.md
 *      §10 "settle/cancel 释放槽后…启动到槽满"；advisor 经 refillAdvisorQueue 补位
 *      （ED-4——评审池有排队语义后不再豁免）；consult（会话池）豁免）。
 * opts（设计签名 `{pool, onAccounting}` + 实现参数 ctx）：
 * - pool：条目所在池 Map（出池 delete 目标；consult 传 null——会话池无条目）。
 * - ctx：回合上下文（守卫读 ctx.signal；⟦ev⟧ 事件经 ctx.callbacks.onToken；腾槽补位
 *   的 refreshQueuedTokens 也经 ctx.callbacks.onToken；consult 传 null——无 TUI 事件
 *   无守卫）。
 * - onAccounting(parent, entry)：族特有 hook——advisor 调 settleAdvisorRun 记账（D1
 *   落盘保留）；escalate 调 classifyEscalateSettle（三分类 merge 决策）。
 *   设计偏差注（advisor code review 发现——交付报告同步）：设计 D3 把 maybeRefillAsync
 *   归入 onAccounting hook（仅 settled 分支执行）——running 取消的 cancelled 分支将不再
 *   补位（槽释放但 queued 头停滞——挂起会话无回合尾补位覆盖），违背既有不变式
 *   （AGENT-LOOP.md §10 + subagent-scheduler maybeRefillAsync 文档 "called from every
 *   settle"）与 VSC 镜像（无条件 refill）。修正：腾槽补位移入公共尾部（subagent/escalate
 *   族恒补——旧行为零回归；advisor/consult 豁免——同 VSC refill!==false 语义）。
 */
export function settleAsyncEntry(parent, entry, opts = {}) {
  const { pool = null, ctx = null, onAccounting = null } = opts
  const role = entry.role ?? "subagent"
  entry.done = true
  entry.status = "done"
  const childLogId = `${role}#${entry.id}`
  const childMs = entry.startedAt ? Date.now() - entry.startedAt : 0
  const aborted = parentAborted(ctx, entry)
  // 挂起分流判定单点（#94 载体吸收——VSC 形 `_suspended` 挂 history）。
  const suspended = carrierField(parent, "_suspended") === true
  // ② 日志三连（D4 统一守卫——中止不落错误事件——ev:stopped 已在中止清池点表达；
  // 定向 cancel 走 ev:cancelled）。族形态差异（LOGGING.md）：
  // - advisor：合并单 child:done（kind error/ok）；
  // - escalate：撞 cap 归 child:done partial（error 且非 capPartial 才 child:error）；
  // - 其余（subagent 族）：error → child:error；done kind 按报告撞 cap 判 partial。
  if (role !== "consult") {
    if (entry.cancelled) {
      logEvent("ev:cancelled", { id: childLogId })
    } else if (!aborted) {
      if (role === "advisor") {
        const err = entry.error != null ? errText(entry.error, 200) : null
        logEvent("child:done", { role, id: childLogId, ms: childMs, kind: err ? "error" : "ok" })
      } else if (role === "escalate") {
        const capPartial = String(entry.error ?? entry.report ?? "").includes(TURN_CAP_MARK)
        if (entry.error != null && !capPartial) logEvent("child:error", { role, id: childLogId, ms: childMs, err: errText(entry.error, 200) })
        else logEvent("child:done", { role, id: childLogId, ms: childMs, kind: capPartial ? "partial" : "ok" })
      } else {
        if (entry.error != null) logEvent("child:error", { role, id: childLogId, ms: childMs, err: errText(entry.error, 200) })
        else logEvent("child:done", { role, id: childLogId, ms: childMs, kind: String(entry.report ?? "").includes(TURN_CAP_MARK) ? "partial" : "ok" })
      }
      if (suspended) logEvent("ev:settled", { id: childLogId, kind: "suspended" })
    }
  }
  // ③ 分流
  if (entry.cancelled) {
    // §19.5 cancelled settle 分支（D-M6）：不入 pending、不参与回合尾直注入——清池 +
    // 终态墓碑（dependsOn 取消语义）+ ⟦ev⟧stopped 冻结 + 族提醒（半成品警示对模型可见）。
    pool?.delete(String(entry.id))
    writeTombstone(parent, entry.id, "cancelled", role) // §20 D-SD5：单点写入（#94 载体吸收）
    ctx?.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`)
    if (role === "advisor") {
      // ②-6b：评审取消——token 未签发提醒（settleAdvisorRun 不消费预算）。
      pushReal(parent, {
        role: "user",
        content: `[System reminder: async advisor review #${escapeXml(String(entry.id))} cancelled — the review did not settle; token not issued (评审已取消——token 未签发)]`,
      })
    } else if (role === "escalate") {
      pushReal(parent, {
        role: "user",
        content: `[System reminder: async escalate #${entry.id} (${entry.tag}) cancelled by user — partial changes not merged/audited]`,
      })
    } else {
      // §20 D-SD5：running 依赖取消——提醒列出依赖者（供模型决策）。
      const dependents = dependentLabels(parent, String(entry.id))
      const autoNote = parent.autoApprove
        ? " — AUTO session: they auto-start on slot availability (round2 #3)"
        : " — they stay queued until you cancel them or an AUTO session starts them"
      pushReal(parent, {
        role: "user",
        content: `[System reminder: subagent ${escapeXml(role)}#${entry.id} cancelled by user — partial changes not merged/audited${dependents.length > 0 ? `; queued dependents ${dependents.join(", ")} marked "dependency cancelled"${autoNote}` : ""}]`,
      })
    }
  } else if (!aborted) {
    // 族记账 hook（advisor 陈旧判定/token D1 落盘；escalate 三分类 merge 决策；subagent/
    // escalate 腾槽补位）——可改写 entry.report（settle 分支输出——digest 原样进）。
    onAccounting?.(parent, entry)
    // 挂起分流（§17 D-S8 + D-S3 记账——以读取时刻为准）：挂起期 settle → 移交 pending
    // 单容器（digest 注入）+ 出池 + ⟦ev⟧settled 驻留；回合内 → ⟦ev⟧done 立即冻结
    // （条目留池——done-in-pool 统一表示——回合尾 collectSettledAsync 注入）。
    // consult 族恒停靠（settle 即出会话池入 pending——无 TUI 冻结事件——子块各自冻结）。
    if (suspended || role === "consult") {
      parkAsyncPending(parent, entry)
      pool?.delete(String(entry.id))
      ctx?.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`)
    } else {
      ctx?.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
    }
  }
  // ④ 公共尾部：settleSeq 递增 + _settle 唤醒（never rejects）+ 唤醒挂起驱动 waiter
  entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
  entry._settle?.()
  wakeAsyncWaiters(parent) // §6.27.12.4 ①：挂起驱动唤醒单点（settle 尾 / 上行 ask 入队尾两处调用）
  // §20 D-SD4 释放点：settle/cancel 释放槽 + 依赖终态转移 → 补位（依赖满足者/域冲突
  // 解除者自动启动——槽 ≤4）→ 排队态面板刷新（等待块头标注随终态更新——dependency
  // cancelled / 位置前移）。subagent/escalate 族恒补（旧行为零回归——cancelled 分支
  // 同样补位）；advisor（ED-4——独立评审池的排队语义）经 refillAdvisorQueue 补位；
  // consult（会话池）豁免。
  if (role === "advisor") {
    refillAdvisorQueue(parent, ctx?.callbacks?.onToken)
  } else if (role !== "consult") {
    maybeRefillAsync(parent)
    refreshQueuedTokens(parent, ctx?.callbacks?.onToken)
  }
}
/** 唤醒挂起驱动单点（§6.27.12.4 ①——settle 尾 / 上行 ask 入队尾两处调用）：循环体逐字自 settle 公共尾
 *  抽入（唯一差分 = 读径经 `carrierField` 吸收——父字段在场路径零差分 = 严格超集）；缺省 / 空 ⇒ no-op。 */
export function wakeAsyncWaiters(parent) {
  const list = carrierField(parent, "_asyncWaiters")
  for (const w of list?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
}
