/**
 * subagent-actions.mjs — subagent 工具动作执行器组（§19/§19.5——2026-09-05 模块拆分轮
 * 从 subagent-async.mjs verbatim 迁出——纯模块迁移零行为变化——只允许 import 调整与头部
 * 注释更新；2026-09-06 §19.8：action:'check' 删除——subagentCheck/MAX_ASYNC_CHECKS/
 * wakeOnAsyncSettle/purgePending 随唯一使用者一并退役——结果仅自动通道（§17.5）。
 * 内容：status 组（statusEntryFields/summarizeTouched/shortTouchedPath + subagentStatus
 * ——§19 D-M2 非阻塞查询 + §19.5.6 D-SF1/SF2 touched 文件摘要）、cancel 组
 * （injectCancelReminder/cancelSubagent/cancelSubagentAction——§19.5 D-M6 定向中止 +
 * 控制面 + UI ⏹ 共用核心 + 墓碑/依赖者注记/补位）、observe/send 组
 * （subagentObserve/subagentSend——SUBAGENT-OBSERVE-SEND.md D1/D2——父侧观察/注入运行中
 * 异步子代理：最近 N=5 回合摘要 + 当前工具捕获 + 注入队列 + running-only 校验）。依赖 subagent-scheduler.mjs 单向
 * （describeBlockers/dependentLabels/queuePosition/refillPool/refreshQueuedRows/
 * writeTombstone）——模块图无环；subagent.mjs execute 按 action 派发。
 */
import { escapeXml } from "../agent/run-helpers.mjs"
import { relative, isAbsolute } from "node:path"
import { describeBlockers, detectStall, dependentLabels, getAsyncPool, queuePosition, refillPool, refreshQueuedRows, stallErrorText, tombstoneOf, writeTombstone } from "./subagent-scheduler.mjs"
// 第 10 批 ③（§18.3 #3——D-B3 本端原名）：评审取消路由（advisor id → cancelAdvisorReview）。
// W12（2026-09-15）：原 `./advisor-async.mjs` 的取消器随 advisor 镜像删旧退役——本端消费面
// （评审池兜底取消 + JSON 工具文案契约）为 VSC 特有形态，按「增量迁入端壳」就地收留——
// 见下方 cancelAdvisorReview（下走 cancelSubagent 的评审池兜底分支）。

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
 * - 终态回显（§12.3 C-5——两池未命中查墓碑）→ { id, role, status: "discarded"|"cancelled"|"done"|"failed", note }
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

/** §18.3 #1（第 10 批——双池并表）：评审池条目专属字段面——role 区分两池（子代理：
 *  turn/maxTurns/touched；评审：reviewType(design|code) / round / elapsedSec）。done 带
 *  "未取"注记（D-B5——不把已 settle 未消化当 running）。 */
function advisorStatusFields(entry) {
  const out = {
    id: entry.id, role: entry.role, reviewType: entry.reviewType ?? null,
    round: entry.round ?? entry.run?.round ?? null,
    model: entry.model ?? null,
    elapsedSec: entry.startedAt ? Math.max(0, Math.round((Date.now() - entry.startedAt) / 1000)) : null,
  }
  if (entry.done) return { ...out, status: "done", note: "settled this turn — unconsumed; the report reaches you automatically (next turn start / suspension digest)" }
  // cancel→settle 窗口（§18.3 #3）内**不另报 cancelled**——与 CLI 已交付形态一致（NFR-B1 同输入
  // 同判定；取消事实已由 cancel 动作返回值承载，settle 随后出池）；如需更丰状态，两端同改
  // 并在设计 §18.4 登记差异。
  return { ...out, status: entry.status ?? "running" }
}

/** C-5 终态回显表（墓碑 status → 返回 status + note；未列值不入表——不虚构语义）。
 *  文案要点逐条对应 §12.3 C-5 表（discarded/cancelled/consumed→done/failed）。 */
const TERMINAL_ECHO = {
  discarded: { status: "discarded", note: "discarded by the user's Stop — its report will NOT arrive (partial changes stay unmerged/unaudited; re-spawn if the work is still needed)" },
  cancelled: { status: "cancelled", note: "cancelled — its report will NOT arrive (its work was stopped; partial changes stay unmerged/unaudited)" },
  consumed: { status: "done", note: "delivered — the report was injected into the session" },
  failed: { status: "failed", note: "settled with an error — the error report was injected; nothing is pending" },
}

export function subagentStatus({ id }, ctx) {
  const map = getAsyncPool(ctx.agent, "subagent") // D1 accessor——history 载体优先双查询吸收
  const advisors = getAsyncPool(ctx.agent, "advisor") // §18.3 #1：评审池同面（双池合并）
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // 容错归一（纯数字字符串 id——advisor fix #3）
  if (idNum != null) {
    // §18.3 #1：单查先子代理池，未命中落评审池（两池共用 nextSubagentId 命名空间——id 全局唯一）
    const entry = map?.get?.(idNum) ?? advisors?.get?.(idNum) ?? null
    if (!entry) {
      // C-5（AGENT-LOOP（VSC 仓）§12.3——终态回显）：两池未命中 → 查终态墓碑——已丢弃/已
      // 取消/已消费/已失败不再读成「从未存在」；无记录（含未列墓碑值）照旧 unknown。
      const t = tombstoneOf(ctx.agent, idNum)
      const echo = t ? TERMINAL_ECHO[t.status] : null
      if (echo) return JSON.stringify({ id, role: t.role, status: echo.status, note: echo.note })
      return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
    }
    return JSON.stringify(entry.role === "advisor"
      ? advisorStatusFields(entry)
      : statusEntryFields(entry, map, ctx.agent, ctx.cwd))
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
  // §18.3 #1：概览并表——评审池条目同列（role:"advisor" + reviewType/round/elapsedSec——
  // role 区分两池；done 行保 {id, role} 形态——T-B3 注记走单查 done 分支）。
  for (const entry of advisors?.values() ?? []) {
    if (entry.done) overview.done.push({ id: entry.id, role: entry.role })
    else if (entry.status === "queued") overview.queued.push({ id: entry.id, role: entry.role, position: queuePosition(advisors, entry) })
    else overview.running.push(advisorStatusFields(entry))
  }
  // §21.1 P-SL2 停滞可见性（2026-09-05）：概览挂 stall 字段（链 + 单点事实文案——cancel 破环
  // 引导）——模型查进度即见机械停滞结论；非停滞零影响（无字段——返回形状不变）。
  const stall = detectStall(ctx.agent)
  const out = { overview }
  if (stall) out.stall = { chains: stall.chains, note: stallErrorText(stall.chains) }
  return JSON.stringify(out)
}

// ─── §19.5 cancel 动作（AGENT-LOOP.md §19.5 D-M6——定向中止 + 控制面）───

/**
 * W12（2026-09-15）：评审池定向取消（原 advisor-async.mjs `cancelAdvisorReview` 迁入本档——
 * 唯一 src 消费点 = cancelSubagent 的评审池兜底分支）：running 评审置 `cancelled` + 条目
 * controller 定向 abort（与核 `cancelAsyncAdvisor` 同形）；取消事实/未签发 token 提醒由
 * **核 settle 的 cancelled 分支**注入（核 `settleAsyncEntry`——本处不重复注入），
 * cancelled settle 不入 pending、不签发 token。返回 JSON 字符串（工具面文案契约——与子代理
 * cancel 同形；核 `cancelAsyncAdvisor` 返对象直供 CLI 调用面）。
 */
function cancelAdvisorReview(parent, id) {
  const map = getAsyncPool(parent, "advisor")
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id
  if (idNum == null || !map || !map.has(idNum)) {
    return JSON.stringify({ id, status: "error", error: `unknown async advisor review id: ${id}` })
  }
  const entry = map.get(idNum)
  if (entry.done) {
    return JSON.stringify({ id, status: "error", error: `advisor review #${id} has already finished — nothing to cancel` })
  }
  if (!entry.cancelled) {
    entry.cancelled = true
    entry.controller?.abort?.({ abortTrigger: "cancel", abortDetail: "advisor-cancel" })
  }
  return JSON.stringify({ id, status: "cancelled" })
}

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
  const map = getAsyncPool(parent, "subagent") // D1 accessor
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // advisor fix #3（同 status）
  if (idNum == null) {
    return JSON.stringify({ status: "error", error: "cancel requires an id — pass the target subagent's id (no id = no-op; Ctrl+C / the Stop button stop everything)" })
  }
  if (!map || !map.has(idNum)) {
    // §18.3 #3（第 10 批——D-B3）：id 不落子代理池 → 落**评审池**（对象漂移时定向干掉旧评审；
    // 与面板 ⏹ 同源取消——cancelled settle 不入 pending、不签发 token；幂等；已完成/未知
    // 两池 → 各自既有错误文案）。
    if (getAsyncPool(parent, "advisor")?.has?.(idNum)) return cancelAdvisorReview(parent, idNum)
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

// ─── observe / send 动作（SUBAGENT-OBSERVE-SEND.md D1/D2——2026-09-08 父侧观察/注入运行中异步子代理）───

/** observe 摘要源统一取最近 N 条回合（评审 #1 采纳——N=5 单一常量）：从子代理**当前运行**的
 *  machine 历史（entry.childAgent.history——setup 把 agent.history = 该轮 history，与
 *  runChild 闭包 sink.history 同数组——对象引用实时读）尾部**截断抽取**（每回合取 assistant
 *  content 首行 / 工具名列表——非原始消息体——N2 隔离不破坏），跳过 user/system/tool 结果行
 *  （tool 结果不回显——无谓噪音）。返回顺序 = 子代理最近轨迹（最老在前、最新在后）。 */
export const SUBAGENT_OBSERVE_RECENT = 5
const _OBSERVE_LINE = 160
function recentTurnSummaries(history, n = SUBAGENT_OBSERVE_RECENT) {
  const arr = Array.isArray(history) ? history : []
  const out = []
  for (let i = arr.length - 1; i >= 0 && out.length < n; i--) {
    const m = arr[i]
    if (m?.role !== "assistant") continue // 只摘 assistant 回合（含 tool_calls 的步子）
    const tcs = m.tool_calls
    if (Array.isArray(tcs) && tcs.length > 0) {
      out.push("tools: " + tcs.map((t) => t?.function?.name ?? "?").join(", "))
    } else if (typeof m.content === "string" && m.content.trim()) {
      const first = m.content.trim().split("\n").find((l) => l.trim()) ?? ""
      out.push(first.length > _OBSERVE_LINE ? `${first.slice(0, _OBSERVE_LINE - 1)}…` : first)
    }
  }
  return out.reverse()
}

/** 从池条目取最近摘要源（queued = 未启动无 childAgent → null——占位由调用方处理）。 */
function observeHistory(entry) {
  return entry.childAgent?.history ?? null
}

/**
 * §19/§19.5 action:'observe' handler（SUBAGENT-OBSERVE-SEND.md F1/D1）——父查运行中异步
 * 子代理的 recent-activity 快照（判推进 vs 卡死）：最近 N=5 条回合摘要（截断抽取——首行/
 * 工具名——非全量——N2）+ 当前工具（onToolCall 捕获的 entry._currentTool）+ turn/touched +
 * status。深度门同 cancel（depth-0 才有异步池）。observe = readonly（isReadonlyAction）——
 * 零消耗（不动池/不写墓碑）；queued/done 可查（queued 占位；done = 未取终态 + 报告预览）。
 * 返回形态（JSON 字符串——工具结果契约）：
 * - running → { id, role, status:"running", model?, elapsedSec?, turn, maxTurns,
 *   touchedFiles?/touched?, currentTool: {name,args?}|null, recent: [≤5 摘要串] }
 * - queued  → { id, role, status:"queued", position?, touched:"—（未启动）", currentTool:null, recent: [] }
 * - done    → { id, role, status:"done", note, currentTool, recent, reportPreview? }
 * - 未知 id → { id, status:"error", error:"unknown async subagent id: <id>" }
 */
export function subagentObserve({ id }, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "observe is only available at the top level — subagent contexts have no async pool (SUBAGENT-OBSERVE-SEND.md D1)" })
  }
  const parent = ctx.agent
  const map = getAsyncPool(parent, "subagent") // D1 accessor
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // 同 status 容错归一
  if (idNum == null) {
    return JSON.stringify({ status: "error", error: "observe requires an id — pass the target subagent's id (from an async spawn return) to see its recent activity" })
  }
  if (!map || !map.has(idNum)) {
    // §18.3 #4（第 10 批）：advisor id 给**明确指引**（评审无逐回合观察面——不可 observe/send），
    // 不回含糊的 unknown（不报 unknown——AC-B4 机判）。
    if (getAsyncPool(parent, "advisor")?.has?.(idNum)) {
      return JSON.stringify({ id, status: "error", error: `id ${id} is a background ADVISOR review, not a subagent — observe has no per-turn view of a review; track it with action:'status' (role:"advisor" — reviewType/round/elapsedSec) or wait for its report to arrive automatically` })
    }
    return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
  }
  const entry = map.get(idNum)
  const base = statusEntryFields(entry, map, parent, ctx.cwd) // 复用 status 决策字段（status/turn/touched…）
  base.currentTool = entry._currentTool ?? null
  if (entry.status === "queued") {
    base.recent = [] // 未启动——占位（touched 已由 statusEntryFields 给 "—（未启动）"）
    return JSON.stringify(base)
  }
  const history = observeHistory(entry)
  base.recent = history ? recentTurnSummaries(history) : []
  // done 条目仍携终报预览（可查——终态虽未取但模型能看到子代理收尾说什么——短截断）。
  if (entry.done) {
    const report = String(entry.report ?? "")
    if (report) base.reportPreview = report.length > 300 ? `${report.slice(0, 299)}…` : report
  }
  return JSON.stringify(base)
}

/**
 * §19/§19.5 action:'send' handler（SUBAGENT-OBSERVE-SEND.md F2/D2）——父向 running 异步子
 * 代理发消息，子代理**下回合边界**作普通 user 指令消费（给纠结/跑偏的子代理引导方向）。
 * send = control（isControlAction——只入队不落盘——免审批/planMode 放行，同 cancel）。
 * 校验（AC3）：仅 running 异步可 send——sync（无池条目→unknown）、settled(done)/queued/
 * 未知 id → 明确错误。注入延迟（评审 #3）：消息入队 entry._injected，子代理 mid-LLM-await
 * 不打断——当前工具/回合返回后下个回合头（agent.mjs 主循环头 opts.turnInput 消费）才入子
 * 历史作 user 回合。凭证纪律（AC4）：不读写 token/designId。send→settle 竞态 = settle 收尾
 * 未消费 _injected → settle 侧附"未投递"注记（settleAsyncEntry/settleEscalateEntry）。
 * 返回：{ id, status:"injected", note }——非即时送达（F2 语义——下回合边界才生效）。
 */
export function subagentSend({ id, message }, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "send is only available at the top level — subagent contexts have no async pool (SUBAGENT-OBSERVE-SEND.md D2)" })
  }
  const parent = ctx.agent
  const map = getAsyncPool(parent, "subagent") // D1 accessor
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id
  if (idNum == null) {
    return JSON.stringify({ status: "error", error: "send requires an id — pass the target subagent's id (from an async spawn return)" })
  }
  if (typeof message !== "string" || !message.trim()) {
    return JSON.stringify({ status: "error", error: "send requires a non-empty message — the guidance you want the running subagent to act on as an ordinary user instruction" })
  }
  if (!map || !map.has(idNum)) {
    // §18.3 #4（第 10 批）：advisor id 明确指引（评审不可注入方向——send 只面向 running
    // 异步子代理）；不报「unknown」（AC-B4）。
    if (getAsyncPool(parent, "advisor")?.has?.(idNum)) {
      return JSON.stringify({ id, status: "error", error: `id ${id} is a background ADVISOR review, not a subagent — you cannot inject direction into a running review; use action:'status' to track it (role:"advisor") or wait for its report to arrive automatically` })
    }
    return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id} — send targets a running async child from an async spawn return (a synchronous spawn returns no pool id)` })
  }
  const entry = map.get(idNum)
  if (entry.done) {
    return JSON.stringify({ id, status: "error", error: `async subagent id ${id} has already finished — nothing to send to; its report reaches you automatically (resend the guidance in a new spawn if it still matters)` })
  }
  // advisor fix: a send racing a concurrent cancel must fail clearly, not queue into a
  // child that is being aborted — the cancelled settle path drops any _injected silently
  // (no undelivered note on the cancel branch), so error here instead.
  if (entry.cancelled) {
    return JSON.stringify({ id, status: "error", error: `async subagent id ${id} is being cancelled — nothing to send to; its in-flight work is being stopped (partial changes stay unmerged/unaudited)` })
  }
  if (entry.status !== "running") {
    return JSON.stringify({ id, status: "error", error: `async subagent id ${id} is ${entry.status === "queued" ? "still queued (not yet started)" : entry.status} — send only reaches a RUNNING child; a message can be delivered once it starts` })
  }
  ;(entry._injected ??= []).push({ message, at: Date.now() })
  return JSON.stringify({
    id, status: "injected",
    note: `message queued for subagent ${entry.role}#${id} — delivered at its next turn boundary as an ordinary user instruction (NOT immediate — it takes effect when the child's current tool/turn returns). Do NOT resend unless you observe it is stuck (action:'observe').`,
  })
}

