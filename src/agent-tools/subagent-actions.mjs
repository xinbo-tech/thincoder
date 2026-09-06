/**
 * subagent-actions.mjs — subagent 工具动作执行器组（§19/§19.5——2026-09-05 模块拆分轮
 * 从 subagent-async.mjs verbatim 迁出——纯模块迁移零行为变化——只允许 import 调整与头部
 * 注释更新；2026-09-06 §19.8：action:'check' 删除——subagentCheck/MAX_ASYNC_CHECKS/
 * wakeOnAsyncSettle/purgePending 随唯一使用者一并退役——结果仅自动通道（§17.5）。
 * 内容：status 组（statusEntryFields/summarizeTouched/shortTouchedPath + subagentStatus
 * ——§19 D-M2 非阻塞查询 + §19.5.6 D-SF1/SF2 touched 文件摘要）、cancel 组
 * （injectCancelReminder/cancelSubagent/cancelSubagentAction——§19.5 D-M6 定向中止 +
 * 控制面 + UI ⏹ 共用核心 + 墓碑/依赖者注记/补位）。依赖 subagent-scheduler.mjs 单向
 * （describeBlockers/dependentLabels/queuePosition/refillPool/refreshQueuedRows/
 * writeTombstone）——模块图无环；subagent.mjs execute 按 action 派发。
 */
import { escapeXml } from "../agent/run-helpers.mjs"
import { relative, isAbsolute } from "node:path"
import { describeBlockers, detectStall, dependentLabels, queuePosition, refillPool, refreshQueuedRows, stallErrorText, writeTombstone } from "./subagent-scheduler.mjs"

/**
 * §19 action:'status' handler — NON-BLOCKING pool query（AGENT-LOOP.md §19 D-M2：
 * 立即返回、不消费——主回合查进度不挂的根治工具）。
 * 事实源 = 池（_asyncSubagents）：挂起期 settle 项已移 history._pendingAsyncResults
 * （§17 D-S3 ②——注入即消）不在池中——不计入概览，按 id 查为 unknown（T12 同语义）。
 * 池内 done 条目 = 本回合内 settle 未取——带"未取"注记（报告经自动通道送达——回合尾
 * 注入/挂起消化——措辞对齐 §17 D-S1）。不消费：查询零消耗（不动池/不写墓碑）。
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
 * - 未知 id → { id, status: "error", error: "unknown async subagent id: <id>" }（T12 同语义）
 * §19.5.6 D-SF2 (T-SF——CLI 同语义参考): running 条目带 touched files 摘要——有改动 =
 * touchedFiles（前 5 相对路径）+ touchedMore（仅 >5 时——超出计数）；0 改动 =
 * touched:"—（尚无改动）"（T-SF2a 区分占位）；queued = touched:"—（未启动）"（T-SF2b）；
 * done/error/取消不含摘要（D-SF2 明示本批只做 running/queued）。数据源 =
 * entry.childAgent._touchedFiles（对象引用实时读——D-SF1——绝对路径，查询方 cwd 相对化）。
 */
function statusEntryFields(entry, map, parent, cwd) {
  // §17.5: a driven turn end leaves the entry pooled → the suspension digest consumes it
  if (entry.done) return { id: entry.id, role: entry.role, status: "done", note: "settled this turn — unconsumed; the report reaches you automatically (next turn start / suspension digest)" }
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
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // 容错归一（纯数字字符串 id——advisor fix #3）
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
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // advisor fix #3（同 status）
  if (idNum == null) {
    return JSON.stringify({ status: "error", error: "cancel requires an id — pass the target subagent's id (no id = no-op; Ctrl+C / the Stop button stop everything)" })
  }
  if (!map || !map.has(idNum)) {
    return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
  }
  const entry = map.get(idNum)
  if (entry.done) {
    return JSON.stringify({ id, status: "error", error: `async subagent id ${id} has already finished — nothing to cancel; its report reaches you automatically` })
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
    entry._resolve?.(entry) // 条目终态——resolve entry.settled（等待者不悬挂；check 已删——自动通道唯一消费方）
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
