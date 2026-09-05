/**
 * subagent-actions.mjs — §19/§19.5 subagent 工具动作执行器组（action:'check'/'status'/
 * 'cancel'——2026-09-05 模块拆分轮从 subagent-async.mjs verbatim 迁出——纯模块迁移零行为
 * 变化——只允许 import 调整与头部注释更新）。内容：subagentCheck（action:'check'——退役
 * subagent_check 语义 verbatim + n 计数/MAX 上限 + §20 depc 锁守卫/no-running 结构性守卫 +
 * purgePending 消费 × 挂起移交双向守卫）、status 组（statusEntryFields/summarizeTouched/
 * shortTouchedPath + subagentStatus——§19 D-M2 非阻塞查询 + §19.5.6 D-SF1/SF2 touched
 * 文件摘要）、cancel 组（injectCancelReminder/cancelSubagent/cancelSubagentAction——
 * §19.5 D-M6 定向中止 + 控制面 + UI ⏹ 共用核心 + 墓碑/依赖者注记/补位）、常量
 * MAX_ASYNC_CHECKS（action:'check' 单回合读次上限——随唯一使用者迁入）。依赖
 * subagent-scheduler.mjs 单向（describeBlockers/dependentLabels/queuePosition/refillPool/
 * refreshQueuedRows/writeTombstone）——模块图无环；subagent.mjs execute 按 action 派发。
 */
import { escapeXml } from "../agent/run-helpers.mjs"
import { relative, isAbsolute } from "node:path"
import { describeBlockers, detectStall, dependentLabels, queuePosition, refillPool, refreshQueuedRows, stallErrorText, writeTombstone } from "./subagent-scheduler.mjs"

/** action:'check' 单回合最多读取次数（consult_check 同款防循环，评审 #1 补定义）。 */
export const MAX_ASYNC_CHECKS = 3

/**
 * §19 action:'check' handler — the retired subagent_check semantics VERBATIM
 * (AGENT-LOOP.md §19 F3/T-M2..M4: arrival order / specified id / n counting /
 * MAX_ASYNC_CHECKS / consume-on-read). subagent.mjs execute dispatches here.
 * - n（必填）：1-based 递增读数——每回合首调 n=1，之后逐次 +1；乱序/重复 n 拒绝。
 * - 不带 id：按完成顺序（arrival order）返回下一个完成的 async 子代理——先完成先处理。
 * - 带 id：等该特定子代理（含 queued 项——先等它启动再等完成）。
 * - 全部已消费 → { done: true }（consult_check 同款终结语义）。
 * - 错误路径：未知/已消费 id → { id, status:"error", error:"unknown async subagent id: <id>" }。
 */
export async function subagentCheck({ id, n }, ctx) {
  const parent = ctx.agent
  const map = parent._asyncSubagents
  // advisor fix #3：容错数值字符串 id（schema 声明 number，但 provider 不强制——模型可能
  // 把工具返回的 id 原样以字符串回传）——数字键查找前归一化；错误消息回显原值。
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id
  // 未知/已消费 id 优先报错（评审 #5：即使注册表已空也要明确错误，不悬挂不误报 done）
  if (idNum != null && (!map || !map.has(idNum))) {
    return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
  }
  if (!map || map.size === 0) return JSON.stringify({ done: true })
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) {
    return JSON.stringify({ status: "error", error: "invalid read counter — pass n = lastN+1" })
  }
  if (n > MAX_ASYNC_CHECKS) {
    return JSON.stringify({ status: "error", error: "check limit exceeded — use turn-end auto-wait for the rest" })
  }
  const lastN = parent._asyncCheckN ?? 0
  if (n !== lastN + 1) {
    return JSON.stringify({ status: "error", error: "invalid read counter — pass n = lastN+1" })
  }
  parent._asyncCheckN = n
  if (idNum != null) {
    const entry = map.get(idNum)
    if (!entry) return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
    // §20 depc 锁守卫（advisor code review 🟡——CLI 同款）：queued 且不可启动（depc
    // 锁定，或池内无 running = 无未来 settle/refill 事件 = 永不启动）→ 不阻塞（check
    // 同步工具调用——防模型回合无界悬挂）——立即返回 queued+原因（cancel 处置引导）。
    if (!entry.cancelled && entry.status === "queued") {
      const blk = describeBlockers(parent, entry, entry._auto?.() ?? false)
      if (blk.kind === "depc") {
        return JSON.stringify({
          id, status: "queued", waiting: "dependency-cancelled", reason: blk.detail,
          note: "check would block forever — this task is locked by a cancelled/failed dependency and will not start on its own; cancel it (action:'cancel') or run an AUTO session to release it (AGENT-LOOP.md §20 round2 #3)",
        })
      }
      // §21.1 P-SL2 停滞守卫（2026-09-05——CLI 镜像）：混合边环形等待（依赖边 × 文件域边
      // 成环——无 running、阻塞闭包无外逃）→ 机械检测明确报错（列阻塞链 + cancel 破环引导——
      // F-SL2 非静默）——替换本会落下的既有 no-running 泛化等待提示（新停滞路径——正常路径
      // 输出逐字不变）；检测自身含 running 锚点/depc/单 queued/不可达态收窄——零误报。
      const stall = detectStall(parent)
      if (stall) {
        return JSON.stringify({ id, status: "error", error: stallErrorText(stall.chains) })
      }
      if (![...map.values()].some((e) => e.status === "running")) {
        const out = { id, status: "queued", position: queuePosition(map, entry) }
        if (blk.detail) out.reason = blk.detail
        out.note = "check would block indefinitely — this queued task cannot start while the pool has no running task (starts are settle-driven); cancel it (action:'cancel') or make pool progress (AUTO session starts it on the next settle/refill)"
        return JSON.stringify(out)
      }
    }
    await entry.settled
    map.delete(idNum)
    // §20（advisor code review 🟡——CLI 同款）：check 消费与挂起期 settle 竞态——消费时
    // 若条目已被挂起分支移交 pending，反向清除（两消费点互斥——防 digest 下轮重复注入）。
    purgePending(parent, entry)
    // §20 D-SD5 终态墓碑（T-SD14）：消费即终态——dependsOn 引用该 id 的条目视其终态
    // 满足/标注（consumed = 已满足；failed/cancelled = 依赖取消/失败分支）。写于终态
    // 判定后——取消条目不误记 consumed（其墓碑已在 cancel 点写）。
    if (!entry.cancelled) writeTombstone(parent, idNum, entry.error != null ? "failed" : "consumed", entry.role)
    if (entry.cancelled) return JSON.stringify({ id, status: "cancelled", note: "cancelled before completion" })
    return entry.error != null
      ? JSON.stringify({ id, status: "error", error: entry.error })
      : JSON.stringify({ id, role: entry.role, status: "done", report: entry.report })
  }
  const pending = [...map.values()]
  if (pending.length === 0) return JSON.stringify({ done: true })
  // §20 守卫（arrival-order）：无 running **且无 done**（done 条目经已 resolve 的 settled
  // 立即被下方 race 消费——不在此列）且仍有条目 → 全为 queued 且永不启动（refill 由
  // settle 驱动——无 running = 无 settle）→ 明确错误。
  if (!pending.some((e) => e.status === "running" || e.done)) {
    // §21.1 P-SL2 停滞守卫（2026-09-05）：同 id-path——闭包型全 queued 池先报停滞（含链）——
    // 非停滞（depc 锚/不可达态）落既有泛化错误（逐字不变——零破坏）。
    const stall = detectStall(parent)
    if (stall) {
      return JSON.stringify({ status: "error", error: stallErrorText(stall.chains) })
    }
    const stuck = pending
      .map((e) => `${e.role}#${e.id}（${describeBlockers(parent, e, e._auto?.() ?? false).kind === "depc" ? "dependency-cancelled" : "blocked"}）`)
      .join(", ")
    return JSON.stringify({
      status: "error",
      error: `nothing will settle — the pool holds only queued task(s) that cannot start without a running task: ${stuck}; cancel them (action:'cancel') or make pool progress (AUTO session starts them on the next settle/refill)`,
    })
  }
  const entry = await Promise.race(pending.map((e) => e.settled))
  map.delete(entry.id)
  purgePending(parent, entry)
  if (!entry.cancelled) writeTombstone(parent, entry.id, entry.error != null ? "failed" : "consumed", entry.role)
  if (entry.cancelled) return JSON.stringify({ id: entry.id, status: "cancelled", note: "cancelled before completion" })
  return entry.error != null
    ? JSON.stringify({ id: entry.id, status: "error", error: entry.error })
    : JSON.stringify({ id: entry.id, role: entry.role, status: "done", report: entry.report })
}

/** §20 消费点 pending 反向清除（check 消费 × 挂起移交竞态守卫——两消费点互斥）。 */
function purgePending(parent, entry) {
  const pend = parent.history?._pendingAsyncResults ?? parent._pendingAsyncResults
  if (!Array.isArray(pend)) return
  const i = pend.findIndex((x) => String(x.id) === String(entry.id))
  if (i >= 0) pend.splice(i, 1)
}

/**
 * §19 action:'status' handler — NON-BLOCKING pool query（AGENT-LOOP.md §19 D-M2：
 * 立即返回、不消费、不动 _asyncCheckN——主回合查进度不挂的根治工具）。
 * 事实源 = 池（_asyncSubagents）：挂起期 settle 项已移 history._pendingAsyncResults
 * （§17 D-S3 ②——注入即消）不在池中——不计入概览，按 id 查为 unknown（与 check 同语义，
 * T12）。池内 done 条目 = 本回合内 settle 未取——带"未取"注记（check 取回或回合尾自动
 * 注入——措辞对齐 §17 D-S1）。不消费：status 后接 check 无 n 冲突（不动 lastN）。
 * advisor fix #2：queued position 查询时实时计算（entry.position 是入队瞬间快照——
 * settle 腾槽补位后变陈旧；FIFO 队列顺序 == map 插入顺序）。
 * §19.5 D-M5 status 全览增强（决定中止谁时看得清）：running 条目从裸 id 改结构化对象
 * { id, role, model, elapsedSec, turn, maxTurns }——elapsedSec 计算于查询时
 * （(now - entry.startedAt)/1000——startedAt 记于实际启动时刻）；queued 条目补 role；
 * done 条目 { id, role }。单查（id）形态不变 + running 同字段。
 * 返回形态（JSON 字符串——工具结果契约）：
 * - 不带 id → { overview: { running: [{id, role, model, elapsedSec, turn, maxTurns, touchedFiles?/touched?}],
 *   queued: [{id, role, position, touched}], done: [{id, role}] } }
 * - 带 id   → { id, role, status: "running"|"queued"|"done", position?/note?, model?/elapsedSec?/turn?/maxTurns?, touchedFiles?/touchedMore?/touched? }
 * - 未知 id → { id, status: "error", error: "unknown async subagent id: <id>" }（与 check 同）
 * §19.5.6 D-SF2 (T-SF——CLI 同语义参考): running 条目带 touched files 摘要——有改动 =
 * touchedFiles（前 5 相对路径）+ touchedMore（仅 >5 时——超出计数）；0 改动 =
 * touched:"—（尚无改动）"（T-SF2a 区分占位）；queued = touched:"—（未启动）"（T-SF2b）；
 * done/error/取消不含摘要（D-SF2 明示本批只做 running/queued）。数据源 =
 * entry.childAgent._touchedFiles（对象引用实时读——D-SF1——绝对路径，查询方 cwd 相对化）。
 */
function statusEntryFields(entry, map, parent, cwd) {
  // §17.5: a driven turn end leaves the entry pooled → the suspension digest consumes it
  if (entry.done) return { id: entry.id, role: entry.role, status: "done", note: "settled this turn — unconsumed; fetch with action:'check' or the suspension digest injects it" }
  if (entry.status === "queued") {
    // §20 F-SD4/D-SD3b：queued 条目带 waiting/reason（依赖/冲突原因模型可见——纯槽满
    // 等位不带——position 已足够）；AUTO 档活读条目 spawn 上下文。
    const blk = describeBlockers(parent, entry, entry._auto?.() ?? false)
    const out = { id: entry.id, role: entry.role, status: "queued", position: queuePosition(map, entry) }
    if (blk.kind !== "slot") {
      out.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
      out.reason = blk.detail
    }
    // §19.5.6 T-SF2b：未启动——确定性占位（不崩；无对象可读）。
    out.touched = "—（未启动）"
    return out
  }
  const out = {
    id: entry.id, role: entry.role, status: "running",
    model: entry.model ?? null,
    elapsedSec: entry.startedAt ? Math.max(0, Math.round((Date.now() - entry.startedAt) / 1000)) : null,
    turn: entry.turn ?? 0,
    maxTurns: entry.maxTurns ?? 100,
  }
  Object.assign(out, summarizeTouched(entry.childAgent, cwd))
  return out
}

/** §19.5.6 N-SF1/D-SF2 touched-files 摘要（CLI touchedSummary 同语义）：running 0 改动 →
 *  touched "—（尚无改动）"（T-SF2a）；有改动 → touchedFiles 前 5 个（相对查询方 cwd
 *  缩短——cwd 之外保留绝对形态 + "../" 前缀）+ touchedMore（仅 >5 时——超出计数——
 *  不混入数组）；单路径 >80 字符截尾（79 + … = 80 总长——不超行）。数据源 =
 *  child._touchedFiles（绝对路径——对象引用实时读——D-SF1——queued/未绑对象 = 空）。 */
function summarizeTouched(child, cwd) {
  const touched = child?._touchedFiles ?? []
  if (touched.length === 0) return { touched: "—（尚无改动）" }
  const out = { touchedFiles: touched.slice(0, 5).map((f) => shortTouchedPath(f, cwd)) }
  if (touched.length > 5) out.touchedMore = touched.length - 5
  return out
}

/** N-SF1 单路径显示形态：cwd 内 → 相对路径；cwd 外 → "../" + 绝对路径；>80 截尾（79+…）。 */
function shortTouchedPath(f, cwd) {
  const r = relative(cwd ?? process.cwd(), f)
  const p = r && !r.startsWith("..") && !isAbsolute(r) ? r : "../" + f
  return p.length > 80 ? `${p.slice(0, 79)}…` : p
}
export function subagentStatus({ id }, ctx) {
  const map = ctx.agent._asyncSubagents
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // advisor fix #3（同 check）
  if (idNum != null) {
    if (!map || !map.has(idNum)) {
      return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
    }
    return JSON.stringify(statusEntryFields(map.get(idNum), map, ctx.agent, ctx.cwd))
  }
  const overview = { running: [], queued: [], done: [] }
  for (const entry of map?.values() ?? []) {
    if (entry.done) overview.done.push({ id: entry.id, role: entry.role })
    else if (entry.status === "queued") {
      // §20：概览 queued 行保既有形态 {id, role, position}（无 status 字段——与 CLI
      // 概览同形）+ 等待态 waiting/reason（纯槽满等位不带——position 已足够）。
      const blk = describeBlockers(ctx.agent, entry, entry._auto?.() ?? false)
      const row = { id: entry.id, role: entry.role, position: queuePosition(map, entry), touched: "—（未启动）" }
      if (blk.kind !== "slot") {
        row.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
        row.reason = blk.detail
      }
      overview.queued.push(row)
    }
    else overview.running.push(statusEntryFields(entry, map, ctx.agent, ctx.cwd))
  }
  // §21.1 P-SL2 停滞可见性（2026-09-05）：概览挂 stall 字段（链 + 单点事实文案——cancel 破环
  // 引导）——模型查进度即见机械停滞结论；非停滞零影响（无字段——返回形状不变）。
  const stall = detectStall(ctx.agent)
  const out = { overview }
  if (stall) out.stall = { chains: stall.chains, note: stallErrorText(stall.chains) }
  return JSON.stringify(out)
}

// ─── §19.5 cancel 动作（AGENT-LOOP.md §19.5 D-M6——定向中止 + 控制面）───

/** §19.5 模型可见取消提醒（D-M6 round2 #3——形态仿 injectAsyncResult：短 user-role
 *  提醒、XML 转义；cancelled settle 不入 pending/不直注入（无错误报告）——取消事实与
 *  半成品警示靠这条注入对模型可见）。注入点 = 机读线（模型通道）；人读线由 UI 冻结相位
 *  （区块 stopped + 面板行）承载。§20 D-SD5：取消目标带 queued 依赖者时提醒扩展注记
 *  （依赖者留 queued 标 dependency cancelled——供模型决策——round1 #4）。AUTO 档文案
 *  与实况一致（依赖者将自动启动——round2 #3——code review 🔵）。 */
function injectCancelReminder(parent, entry, wasQueued) {
  if (!parent?.history) return
  const dependents = dependentLabels(parent, entry.id)
  const auto = entry._auto?.() ?? false
  const depNote = dependents.length > 0
    ? (auto
      ? `; queued dependents ${dependents.join(", ")} marked "dependency cancelled" — AUTO session: they auto-start on slot availability (round2 #3)`
      : `; queued dependents ${dependents.join(", ")} marked "dependency cancelled" — they stay queued until you cancel them or an AUTO session starts them`)
    : ""
  const body = wasQueued
    ? `[System reminder: subagent ${entry.role}#${entry.id} cancelled by user (was queued — never started)${depNote}]`
    : `[System reminder: subagent ${entry.role}#${entry.id} cancelled by user — partial changes not merged/audited${depNote}]`
  parent.history.push({ role: "user", content: escapeXml(body) })
}

/**
 * §19.5 action:'cancel' handler + UI ⏹ 共用核心（D-M6）——定向中止单个后台 async 子代理：
 * - id 必填（防误全停——省略/未知/已完成 → error JSON——全停走 Ctrl+C / Stop）；
 * - queued 目标（未启动——无 abort）：**出队移除 + position 释放**（queuePosition 实时
 *   计算——后续条目自动前移）+ 返回 {id, status:"cancelled", was:"queued"}——无 abort；
 * - running 目标：置 entry.cancelled + abort 条目级 controller（entry.controller——
 *   round2 #2 定稿）→ 子代理 runAgent signal → settle 回调的 cancelled 分支完成出池
 *   清理 + 停止冻结通知（_onCancelled）+ 槽位补位（settle 公共段——T-M21）——其余
 *   子代理/挂起会话不受影响（只动本条目）；
 * - 取消事实 + 半成品警示 = 机读线 user-role 提醒注入（injectCancelReminder——模型可见）。
 * 调用面：subagent.mjs execute（action:"cancel"——ctx.agent 即 parent）与 extension 层
 * UI ⏹ 路由（panel-messages.mjs——以 live lines 的池 map + history 构造 parent）。
 */
export function cancelSubagent(parent, id) {
  const map = parent._asyncSubagents
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // advisor fix #3（同 check/status）
  if (idNum == null) {
    return JSON.stringify({ status: "error", error: "cancel requires an id — pass the target subagent's id (no id = no-op; Ctrl+C / the Stop button stop everything)" })
  }
  if (!map || !map.has(idNum)) {
    return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
  }
  const entry = map.get(idNum)
  if (entry.done) {
    return JSON.stringify({ id, status: "error", error: `async subagent id ${id} has already finished — nothing to cancel; fetch its report with action:'check'` })
  }
  if (entry.status === "queued") {
    entry.cancelled = true
    const hadDependents = dependentLabels(parent, idNum).length > 0
    map.delete(idNum)
    // §20 D-SD5：queued 取消（无 settle 事件）→ 出队即终态——写墓碑（cancelled——依赖者
    // 经它查得取消分支）+ 依赖者重估/行刷新（depc 标注——AUTO 自动启动由补位放行——
    // 模型可见 = 提醒（依赖者注记）+ 工具结果 dependents/note——round1 #4 工具结果内）。
    writeTombstone(parent, idNum, "cancelled", entry.role)
    injectCancelReminder(parent, entry, true)
    entry._resolve?.(entry) // 释放可能的并发等待者（check 挂起——不悬挂）
    entry._onCancelled?.(true)
    refillPool(parent, (e) => e._auto?.() ?? false)
    refreshQueuedRows(parent)
    const out = { id, status: "cancelled", was: "queued" }
    if (hadDependents) {
      // refill 后重算——AUTO 下已自动启动的依赖者不再列（文案与实况一致——code review 🔵）
      const dependents = dependentLabels(parent, idNum)
      if (dependents.length > 0) {
        out.dependents = dependents
        out.note = `queued dependents ${dependents.join(", ")} marked "dependency cancelled" — they stay queued until you cancel them (this action again with their id) or an AUTO session starts them (AGENT-LOOP.md §20 D-SD5)`
      } else if (entry._auto?.()) {
        out.note = `dependents of the cancelled task auto-started (AUTO session — round2 #3: an AUTO session starts dependency-cancelled dependents on slot availability)`
      }
    }
    return JSON.stringify(out)
  }
  // running 目标：幂等（审计 F2——settle 前重复 cancel/UI ⏹ 双击不重复注入提醒——
  // abort 本身幂等——二次取消仅返回确认）。
  if (!entry.cancelled) {
    entry.cancelled = true
    entry.controller?.abort()
    injectCancelReminder(parent, entry, false)
  }
  return JSON.stringify({ id, status: "cancelled" })
}

/**
 * §19.5 action:'cancel' execute 分支——depth-0 only（子代理上下文无 async 池——
 * cancel 无意义；受限 eng-coder 变体已被 §19 的 spawn-only 门先行拒绝）。
 */
export function cancelSubagentAction({ id }, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "cancel is only available at the top level — subagent contexts have no async pool (AGENT-LOOP.md §19.5 D-M6)" })
  }
  return cancelSubagent(ctx.agent, id)
}
