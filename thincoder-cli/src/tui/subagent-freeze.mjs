/**
 * subagent-freeze.mjs — 子agent 区块完成/冻结族（2026-09-05 module-split：
 * subagent-blocks.mjs 625 > 500 硬限——AGENT-LOOP-SUBAGENT.md §6.7.2 面板现算 computePanelBlocks + finish/
 * freeze 家族迁入；subagent-blocks.mjs import 回（routeSub* 与 compression panel
 * 调用点）+ re-export 保外部 import 面（index.mjs 等）。
 * CLI-ACTIVITY-DEBLOAT F-3（2026-09-10）：AGENT-LOOP-SUBAGENT.md §6.7.2 面板**手工镜像退役**（镜像读写
 * 全删）——改读时现算 computePanelBlocks(state)：四字段 key/
 * role/status/startedAt 均为 state.subTasks 活值纯推导（评审 #2 确证），读时现算
 * 与 sync 时刻镜像等价——双账本结构性漂移根治（单账本）。完成/冻结族不再逐点刷镜
 * （无镜像可刷——调用点全清）。
 */

import { C } from "./ansi.mjs"
import { closeOpenSubChildren } from "./subagent-children.mjs"
// TUI-OOM-ROOTCAUSE（TUI.md §15.3.3 落点表末行）：state.lines 总量账——splice 插入路径过账。
// zero-block 批（§6.8.3.2）：摘除路径负向出账——releaseLine（增删均须过账）。
import { accountLine, releaseLine } from "./display-budget.mjs"

// ─── AGENT-LOOP-SUBAGENT.md §6.7.2 D-P1 面板视图（subagent panel 检查工具）───
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
 *  中断）→ 子块随外层冻结定格 stopped（closeOpenSubChildren——不悬空）。SUBAGENT-TAIL：
 *  ② 语义照旧（防御性保留——无正读者、不设断言；显示契约 docs/design/TUI.md §6）。
 *  锚点插入（2026-09-03 修复轮）：settled 块带 _freezeAt（settle 时刻流位置）——
 *  splice 落位使挂起期补发冻结块位于其 digest 总览文本之前；无锚点尾推不变；
 *  多锚点批量冻结按降序（绝对位置 splice——先插小锚点会移走大锚点目标）。 */
export function freezeSubTaskLines(state, sub) {
  if (!sub) return
  closeOpenSubChildren(sub) // R23 D-R23c2——开子块随外层冻结定格 stopped（SUBAGENT-TAIL：② 防御性保留）
  state._frozenSubKeys ??= new Set()
  state._frozenSubKeys.add(sub.key)
  sub.done = true
  sub.doneAt = sub.doneAt ?? Date.now()
  const anchor = sub._freezeAt ?? state.lines.length
  const line = {
    text: `subagent activity: ${sub.key}`, color: C.dim, _frozenSubTask: sub,
  }
  state.lines.splice(Math.min(anchor, state.lines.length), 0, line)
  // TUI-OOM-ROOTCAUSE（TUI.md §15.3.3 落点表末行「冻结子代理 splice 插入——经
  // syncLineBudget 同款对账」）：冻结行进 state.lines 总量账（splice 插入路径）。
  accountLine(state, line)
}

/** 键级墓碑（af 批 c2——§6.8.3.3 墓碑写入单点同址）：key 计入 `_frozenSubKeys` ⇒ 后续 token
 *  经 `ensureSubTaskKey` 墓碑守卫直接丢弃（`⟦ev⟧cancelled` 移除块后的幻影冻结块路径封死）；
 *  只写键集、不写载体行；存活条目复活 ⇒ 闸门摘墓碑 + 重建块（不永久失明）。 */
export function tombstoneSubKey(state, key) {
  if (!state) return
  state._frozenSubKeys ??= new Set()
  state._frozenSubKeys.add(String(key))
}

/** 头裁锚点校正（index.mjs pushLine 调用）：裁 removedCount 补 1 标记行 = 净位移
 *  removedCount−1（code review round1 #3）；在途锚点前移，min 0 兜底。 */
export function shiftFreezeAnchors(state, removedCount) {
  const shift = removedCount - 1
  for (const sub of Object.values(state.subTasks ?? {})) {
    if (sub._freezeAt !== undefined) sub._freezeAt = Math.max(0, sub._freezeAt - shift)
  }
}

// ─── 墓碑存活闸（zero-block 批——docs/cli/design/TUI.md §6.8.3）─────────────────

/** 存活查询（P0-a/P0-b 共用单点——与墓碑写点 `freezeSubTaskLines` 同址：墓碑条件 /
 *  墓碑写入 / 载体行增删单一权威）。key 形 = `role#id`（`_frozenSubKeys` / `subTasks`
 *  同命名空间）；**存活判据（逐字 = §6.8.3.3）**：**条目在池 ∧ `entry.done !== true` ∧
 *  `entry.cancelled !== true`（running/queued）**（判据先例 = `thincoder-core/agent-tools/async-discard.mjs:55`
 *  ——零新谓词；仅「键在池内」会把 done-in-pool 误判为存活）。
 *  映射（写死 = §6.8.3.3）：最后 `#` 切分 → role + id；命中 = `pool.has(String(id))` ∧
 *  `entry.role === role`；非池键（`compress#N` 等）恒 false（维持既有丢弃语义）。
 *  降级（§6.8.3.2 末）：`state._agent` 缺省（headless / 子代理内 / 夹具）⇒ 无存活信息
 *  ⇒ false——与批前**逐字等价**（丢弃），零回归。
 *  @returns {boolean} 该 key 对应条目是否池内存活 */
export function livePoolHas(state, key) {
  const agent = state?._agent
  if (!agent) return false
  const k = String(key ?? "")
  const i = k.lastIndexOf("#")
  if (i <= 0 || i === k.length - 1) return false // 非池键形态（无 `#` / 空 role / 空 id）
  const role = k.slice(0, i)
  const id = k.slice(i + 1)
  for (const pool of [agent._asyncSubagents, agent._asyncAdvisors]) {
    if (!(pool instanceof Map)) continue
    const entry = pool.get(id) // 池键 = String(id)（subagent-run.mjs:187 / advisor-async.mjs:410）
    if (!entry || entry.role !== role) continue
    if (entry.done === true || entry.cancelled === true) continue // 已终态（含 done-in-pool）
    return true
  }
  return false
}

/** 摘旧冻结载体行（P0-a ②——复活时摘该 key 全部 `_frozenSubTask` 载体行）：墓碑源已把
 *  载体行 splice 进 `state.lines`（`freezeSubTaskLines`）；不摘则一 key 两载体、折叠键
 *  `sub-${key}` 两处共用（render-segments.mjs / subagent-panel.mjs）⇒ 旧块永久留流。
 *  ① 逐行 `releaseLine` **负向出账**（增删均须过账——display-budget.mjs）；② 摘除位
 *  **之后**（严格大于该位）的 `_freezeAt` 在途锚点 −1（`shiftFreezeAnchors` 同款语义
 *  ——锚点 = 流位置；摘除位之前的锚点不动；**恰等摘除位者亦不动**——逐字照 §6.8.3.2
 *  「摘除位之后」；若需改判〔该位锚点原指被摘行槽位〕须先改设计）。
 *  @returns {number} 摘除的载体行数 */
export function removeFrozenSubTaskLine(state, key) {
  const lines = state?.lines
  if (!Array.isArray(lines)) return 0
  const k = String(key ?? "")
  let removed = 0
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i]
    if (l?._frozenSubTask?.key !== k) continue
    releaseLine(state, l)
    lines.splice(i, 1)
    removed++
    for (const sub of Object.values(state.subTasks ?? {})) {
      if (sub._freezeAt !== undefined && sub._freezeAt > i) sub._freezeAt = Math.max(0, sub._freezeAt - 1)
    }
  }
  return removed
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
 *  lastError="interrupted"（Ready 态跳过）。AGENT-LOOP-ASYNC-POOL.md §6.8：挂起自然退出时本函数只兜底
 *  **未消化残项**（已消化块由 freezeReclaimDigestedBlocks 逐条先行回收——块回收与
 *  池空解耦）。锚点降序同 freezeDoneSubTasks（挂起期 settle 锚点交错批次各按其
 *  settle 位置落位）。
 *  zero-block 批 P0-b（§6.8.3.2）：**墓碑存活闸——池内存活（在池 ∧ `done !== true` ∧
 *  `cancelled !== true`）条目跳过**（不置 done / 不写墓碑 / 不出 `subTasks`——保留 live
 *  驻留，待其自身 done/stopped/settled 通道收尾）；**已终态（含 done-in-pool）与池外
 *  条目照旧冻结**（中断 ghost 语义不变）。存活判据单点 = `livePoolHas`。 */
export function freezeAllSubTasks(state) {
  const subs = Object.values(state.subTasks ?? {})
    .sort((a, b) => (b._freezeAt ?? -1) - (a._freezeAt ?? -1))
  for (const sub of subs) {
    if (livePoolHas(state, sub.key)) continue // P0-b 存活跳过（墓碑只断言「此块已终」）
    if (!sub.done) {
      sub.done = true
      sub.doneAt = Date.now()
      if (!sub.lastError && state.status !== "Ready") sub.lastError = "interrupted"
    }
    freezeSubTaskLines(state, sub)
    delete state.subTasks[sub.key]
  }
}

/** 消化完成逐条冻结回收（2026-09-03 实测修订 + round1 #1 位置裁定）：digest/会话内
 *  用户回合消化完 pending 条目（run 首行已注入）后调用——把"已消化但仍驻留面板"的
 *  awaitingDigest 块立即冻结进流（不等池空——块回收与池空解耦；池空 freezeAllSubTasks
 *  仅兜底未消化残项）。归属不变式：会话内任何 run 开始前 pinned 块的条目必在 pending
 *  （settle 即移交）；run 消费后条目不在 pending 的 pinned 块 = 本 run 消化者——无需
 *  快照即精确归属。位置（round1 #1 裁定——与早版文本的矛盾已消解；digest 面 =
 *  AGENT-LOOP-ASYNC-POOL.md §6.8）：**settle 锚点 splice 落位——digest 总览文本之前**——同
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
