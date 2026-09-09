/**
 * subagent-freeze.mjs — 子agent 区块完成/冻结族（2026-09-05 module-split：
 * subagent-blocks.mjs 625 > 500 硬限——§19.6 面板现算 computePanelBlocks + finish/
 * freeze 家族迁入；subagent-blocks.mjs import 回（routeSub* 与 compression panel
 * 调用点）+ re-export 保外部 import 面（index.mjs 等）。
 * CLI-ACTIVITY-DEBLOAT F-3（2026-09-10）：§19.6 面板**手工镜像退役**（镜像读写
 * 全删）——改读时现算 computePanelBlocks(state)：四字段 key/
 * role/status/startedAt 均为 state.subTasks 活值纯推导（评审 #2 确证），读时现算
 * 与 sync 时刻镜像等价——双账本结构性漂移根治（单账本）。完成/冻结族不再逐点刷镜
 * （无镜像可刷——调用点全清）。
 */

import { C } from "./ansi.mjs"
import { closeOpenSubChildren } from "./subagent-children.mjs"

// ─── §19.6 D-P1 面板视图（subagent panel 检查工具）───
// CLI-ACTIVITY-DEBLOAT F-3：面板区块列表由消费面**读时现算**（action:"panel" 经
// ctx.state = agent._tuiState（index.mjs startTUI 装配）取 TUI state——subTasks
// 活值纯推导——视图与用户所见一致（同一数据源单账本））。未挂载（headless/VSC/
// 子代理——agent._tuiState 缺省）→ 返 null = 无面板——消费面降级池视图/freeze 报
// 不可用（T-P5 语义不变）。status 三态映射（纯函数）：done+awaitingDigest →
// "awaitingDigest"；done → "done"；queued（waiting/等位未启动）→ "queued"；
// 其余 → "running"（§20 D-SD3b queued 态入镜口径保留）。

/** 现算面板块列表（state.subTasks 活值纯推导——无时点快照语义）。 */
export function computePanelBlocks(state) {
  const subs = state?.subTasks
  if (!subs) return null // 未挂载（headless/mock 无 TUI state）——无面板
  const blocks = []
  for (const sub of Object.values(subs)) {
    // §20 D-SD3b：waiting/等位块（sub.queued——未启动）以 queued 态入镜（视图与面板
    // 所见一致——action:'panel' 视图 + freeze 门控读此态）。
    const status = sub.done ? (sub.awaitingDigest ? "awaitingDigest" : "done") : (sub.queued ? "queued" : "running")
    blocks.push({ key: sub.key, role: sub.role ?? null, status, startedAt: sub.started ?? Date.now() })
  }
  return blocks
}

/** §7.2.3 完成冻结——CLI-ACTIVITY-DEBLOAT F-2（2026-09-10）收窄：本函数是历史启发式
 *  入口（"最早 started"角色匹配——§15 async 化后的 7.2.3.1 实测误冻源：async eng-coder
 *  先启动时 explore 完成会误冻其块）。评审 #4 路线定死：签名保留、函数体收窄为精确
 *  匹配校验——本签名无 key 参数，无从精确归属 → 恒 no-op 返 null，不再猜任何块
 *  （宁可 no-op 不误冻——被否决备选"保留兜底加告警日志"：冻错块是错动作，日志救不回）。
 *  finishSubTaskKey 为唯一完成路径；roles/lastError 仅签名兼容保留（老调用面 import
 *  不断——误冻面归零，无 key 窗口的块由回合尾 freezeAllSubTasks 兜底清场）。
 *  @returns {null} 恒 null（无精确 key 命中面——无从归属不归属）。 */
export function finishSubTask(state, roles, lastError = null) {
  void state; void roles; void lastError // 收窄后零副作用——参数仅签名兼容
  return null
}

/** §7.2.3 sync spawn 完成精确冻结（2026-09-03）：按 relay key 精确 settle。finishSubTask
 *  的"最早 started"启发式只在面板单 running 块时成立——§15 async 化后 async eng-coder
 *  （先启动）与 sync explore 并存时 explore 完成会误冻先启动的 eng-coder 块（7.2.3.1）。
 *  dispatch 沿 ctx._subagentKey（relayPrefix 去尾 = `role#N`）把 key 传进 onToolResult——
 *  有 key 即精确标 done（冻结载体进流 + 删条目由调用方 freezeDoneSubTasks 承接——与
 *  finishSubTask 同一契约）；无匹配块（已冻结 tombstone/不存在）返回 null——调用方不得
 *  落启发式兜底（精确 key 无匹配 = 无从归属——不误冻他块）。 */
export function finishSubTaskKey(state, key, lastError = null) {
  const sub = state.subTasks?.[key]
  if (!sub) return null
  sub.done = true
  sub.doneAt = Date.now()
  sub.currentTool = null
  sub.approval = null
  if (lastError) sub.lastError = lastError
  sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
  return sub
}

/** 冻结完成/中断区块进 state.lines（§7.2 D4——_frozenSubTask 载体行，渲染端
 *  render-conversation 识别；折叠交互 key = sub-${key} 与运行面板同源跨冻结延续）。
 *  §27 R23 D-R23c2 收尾语义（T-R23c.2a）：外层先冻结而内层子块未收尾（外层 abort/
 *  中断）→ 子块随外层冻结定格 stopped（closeOpenSubChildren——不悬空）。
 *  锚点插入（2026-09-03 修复轮）：settled 块带 _freezeAt（settle 时刻流位置）——
 *  splice 落位使挂起期补发冻结块位于其 digest 总览文本之前；无锚点尾推不变；
 *  多锚点批量冻结按降序（绝对位置 splice——先插小锚点会移走大锚点目标）。 */
export function freezeSubTaskLines(state, sub) {
  if (!sub) return
  closeOpenSubChildren(sub) // R23 D-R23c2——开子块随外层冻结定格 stopped
  state._frozenSubKeys ??= new Set()
  state._frozenSubKeys.add(sub.key)
  sub.done = true
  sub.doneAt = sub.doneAt ?? Date.now()
  const anchor = sub._freezeAt ?? state.lines.length
  state.lines.splice(Math.min(anchor, state.lines.length), 0, {
    text: `subagent activity: ${sub.key}`, color: C.dim, _frozenSubTask: sub,
  })
}

/** 头裁锚点校正（index.mjs pushLine 调用）：裁 removedCount 补 1 标记行 = 净位移
 *  removedCount−1（code review round1 #3）；在途锚点前移，min 0 兜底。 */
export function shiftFreezeAnchors(state, removedCount) {
  const shift = removedCount - 1
  for (const sub of Object.values(state.subTasks ?? {})) {
    if (sub._freezeAt !== undefined) sub._freezeAt = Math.max(0, sub._freezeAt - shift)
  }
}

/** 冻结 + 释放全部已 done 块（工具结果清扫路径）。锚点降序（后 settle 先插——
 *  绝对位置 splice 语义）；无锚点（-1）排末尾推；sort 稳定。 */
export function freezeDoneSubTasks(state) {
  const subs = Object.values(state.subTasks ?? {})
    .filter((s) => s.done)
    .sort((a, b) => (b._freezeAt ?? -1) - (a._freezeAt ?? -1))
  for (const sub of subs) {
    freezeSubTaskLines(state, sub)
    delete state.subTasks[sub.key]
  }
}

/** 按角色整组标记 done——consult N 并行 children 的会话级 settle（2026-08-30；
 *  F-2 收窄后 finishSubTask 已退役 no-op——本函数为唯一按角色完成面）。 */
export function finishSubTasksByRole(state, roles, lastError = null) {
  state.subTasks ??= {}
  const roleSet = new Set(Array.isArray(roles) ? roles : [roles])
  for (const sub of Object.values(state.subTasks)) {
    if (!sub.done && roleSet.has(sub.role)) {
      sub.done = true
      sub.doneAt = Date.now()
      sub.currentTool = null
      sub.approval = null
      if (lastError) sub.lastError = lastError
      sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
    }
  }
}

/** 回合尾/挂起退出清扫（runAgentTurn finally / suspensionSession finally）：冻结全部
 *  剩余块——中断（Ctrl+C/错误）不留下钉住输入框的 ghost；未 done 者
 *  lastError="interrupted"（Ready 态跳过）。§17.5.5：挂起自然退出时本函数只兜底
 *  **未消化残项**（已消化块由 freezeReclaimDigestedBlocks 逐条先行回收——块回收与
 *  池空解耦）。锚点降序同 freezeDoneSubTasks（挂起期 settle 锚点交错批次各按其
 *  settle 位置落位）。 */
export function freezeAllSubTasks(state) {
  const subs = Object.values(state.subTasks ?? {})
    .sort((a, b) => (b._freezeAt ?? -1) - (a._freezeAt ?? -1))
  for (const sub of subs) {
    if (!sub.done) {
      sub.done = true
      sub.doneAt = Date.now()
      if (!sub.lastError && state.status !== "Ready") sub.lastError = "interrupted"
    }
    freezeSubTaskLines(state, sub)
    delete state.subTasks[sub.key]
  }
}

/** §17.5.5 消化完成逐条冻结回收（2026-09-03 实测修订 + round1 #1 位置裁定）：digest/会话内
 *  用户回合消化完 pending 条目（run 首行已注入）后调用——把"已消化但仍驻留面板"的
 *  awaitingDigest 块立即冻结进流（不等池空——块回收与池空解耦；池空 freezeAllSubTasks
 *  仅兜底未消化残项）。归属不变式：会话内任何 run 开始前 pinned 块的条目必在 pending
 *  （settle 即移交）；run 消费后条目不在 pending 的 pinned 块 = 本 run 消化者——无需
 *  快照即精确归属。位置（round1 #1 裁定——与 17.5.5 早版文本的矛盾已消解，见
 *  AGENT-LOOP.md §17.5.5）：**settle 锚点 splice 落位——digest 总览文本之前**——同
 *  §7.2 D4 修复轮/D-S8 锚点语义（T-S6/T-S14 位置断言同口径）——锚点降序逐块冻结
 *  （splice 绝对位互不位移）。@returns {number} 回收块数 */
export function freezeReclaimDigestedBlocks(state, pendingList) {
  const pend = pendingList ?? []
  const targets = Object.values(state.subTasks ?? {})
    .filter((s) => s.awaitingDigest && !pend.some((e) => `${e.role}#${e.id}` === s.key))
    .sort((a, b) => (b._freezeAt ?? -1) - (a._freezeAt ?? -1)) // 锚点降序（同 freezeAllSubTasks）
  for (const sub of targets) {
    freezeSubTaskLines(state, sub) // splice 落 settle 锚点（digest 总览文本之前）
    delete state.subTasks[sub.key]
  }
  return targets.length
}
