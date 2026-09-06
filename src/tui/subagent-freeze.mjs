/**
 * subagent-freeze.mjs — 子agent 区块完成/冻结族（2026-09-05 module-split：
 * subagent-blocks.mjs 625 > 500 硬限——§19.6 面板镜像 syncPanelSnapshot + finish/
 * freeze 家族 verbatim 迁入，语义零变；subagent-blocks.mjs import 回（routeSub* 与
 * compression panel 调用点）+ re-export 保外部 import 面（index.mjs 等）。
 */

import { C } from "./ansi.mjs"
import { closeOpenSubChildren } from "./subagent-children.mjs"

// ─── §19.6 D-P1 面板镜像（subagent panel 检查工具）───
// TUI 装配处（index.mjs startTUI）state._agent = agent——块级状态变更点经
// syncPanelSnapshot 刷新 agent._panelSnapshot（区块数组快照：{key, role,
// status: running|done|awaitingDigest, startedAt}——状态变更即刷——O(n) 小——
// 不逐 token——NF-P）。agent 层 subagent action:"panel" 读此镜像（视图与用户
// 所见一致）+ 冻结门控（D-P3）。未挂载（headless/mock——无 state._agent）=
// 无镜像——no-op（降级路径由 agent 侧判定）。

/** 刷新面板镜像（调用点 = 本模块全部 state.subTasks 块级变更点末尾——map 已稳定）。 */
export function syncPanelSnapshot(state) {
  const agent = state._agent
  if (!agent) return // 未挂载（headless/mock 无 TUI 装配）——无镜像
  const snap = []
  for (const sub of Object.values(state.subTasks ?? {})) {
    // §20 D-SD3b：waiting/等位块（sub.queued——未启动）以 queued 态入镜（镜像与面板
    // 所见一致——action:'panel' 视图 + freeze 门控读此态）。
    const status = sub.done ? (sub.awaitingDigest ? "awaitingDigest" : "done") : (sub.queued ? "queued" : "running")
    snap.push({ key: sub.key, role: sub.role ?? null, status, startedAt: sub.started ?? Date.now() })
  }
  agent._panelSnapshot = snap
}

/** Mark the earliest running child of the given role(s) as done (✓ header, frozen elapsed). */
export function finishSubTask(state, roles, lastError = null) {
  state.subTasks ??= {}
  const roleSet = new Set(Array.isArray(roles) ? roles : [roles])
  const running = Object.values(state.subTasks)
    .filter((s) => !s.done && roleSet.has(s.role))
    .sort((a, b) => a.started - b.started)
  if (running.length === 0) return
  const sub = running[0]
  sub.done = true
  sub.doneAt = Date.now()
  sub.currentTool = null
  sub.approval = null
  if (lastError) sub.lastError = lastError
  sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
  syncPanelSnapshot(state) // §19.6 D-P1: done 状态变更刷镜
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
  syncPanelSnapshot(state) // §19.6 D-P1: done 状态变更刷镜
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
  syncPanelSnapshot(state) // §19.6 D-P1: 删除后刷镜（块移出面板）
}

/** 按角色整组标记 done——consult N 并行 children 的会话级 settle（单发
 *  finishSubTask 只结最早一个——consult 残项 2026-08-30）。 */
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
  syncPanelSnapshot(state) // §19.6 D-P1: done 状态变更刷镜
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
  syncPanelSnapshot(state) // §19.6 D-P1: 冻结回收后刷镜（块移出面板）
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
  syncPanelSnapshot(state) // §19.6 D-P1: 逐条回收后刷镜（块移出面板）
  return targets.length
}
