/**
 * subagent-blocks.mjs — 子agent 活动区块缓冲（AGENT-LOOP.md §7.2 D4，消费端）。
 * state.subTasks[key] = { key, role, model, async（§19.5 D-M7b——⟦ev⟧async 标记——
 * undefined = sync）, started, done, doneAt, blocks:
 * [{kind,text}], currentTool, toolArgs, turn, maxTurns, approval, lastError,
 * dropped, blockEpoch, awaitingDigest（§17）, _freezeAt（冻结锚点）, stopped（§19.5）}。
 * 职责：前缀路由（parseRelayPath 嵌套段→子标）、事件 token 解析、kind 合并、
 * N2 环形上限、N1 渲染节流、完成冻结（freezeSubTaskLines 家族——锚点 splice）。
 */

import { C } from "./ansi.mjs"
import { describeToolArgs } from "./tool-args.mjs"

/** `role#id/` prefix router — hyphen included since the eng-coder fix (2026-08-21). */
export const SUB_PREFIX_RE = /^([\w-]+)#(\d+)\//
/** ⟦ev⟧ token parser：`⟦ev⟧<name>\x1e<n>\x1e<max>\x1e<phase>\x1e<detail>`。phase done
 *  = async 完成即冻结（settle 时发）；settled = 挂起期完成——冻结延迟至 digest 消化
 *  完成（§17.5.5 freezeReclaimDigestedBlocks 逐条回收——不等池空）或池空退出兜底补发；
 *  stopped（§19.5 D-M6）= cancel 中止——interrupted 语义立即冻结（标题 "stopped"）；
 *  queued（§20 D-SD3b）= 排队 spawn 返回即建 waiting 块（round2 #2 事件通道——
 *  `⟦ev⟧queued\x1e<kind>\x1e<position>\x1equeued\x1e<detail>`——kind slot/wait/depc）——
 *  启动后 ⟦ev⟧async 转 running（同 key 不重建）；cancelled（§20）= 出队/取消——**零字段**
 *  移除块（不冻结——无活动可冻结）——与 async 同型单独解析（不入本正则）；
 *  async（§19.5 D-M7b + 处置 #4）= **零字段**标记（`⟦ev⟧async\x1e`——无 n/max/phase/detail 段）——
 *  routeSubToken 单独解析设 sub.async = true（不入本正则——本正则要求 4 字段）；**缺失 key
 *  （块尚未创建）缓冲 `state._pendingAsyncKeys`——ensureSubTaskKey 块创建时应用（兜底）。 */
export const SUB_EVENT_RE = /^⟦ev⟧(turn|approval|done|settled|stopped|queued)\x1e([^\x1e]*)\x1e([^\x1e]*)\x1e([^\x1e]*)\x1e?([\s\S]*)$/

/** §19.5 D-M8 嵌套 relay 前缀通用解析（循环解析任意深度）：
 *  `eng-coder#2/explore#1/read` → { head（块路由）, inner[], label（子标）, rest }。
 *  单层 = inner[]/label ""——与既有单段匹配语义零改；无前缀 → null。 */
export function parseRelayPath(text) {
  const segments = []
  let rest = String(text)
  for (;;) {
    const m = rest.match(SUB_PREFIX_RE)
    if (!m) break
    segments.push(`${m[1]}#${m[2]}`)
    rest = rest.slice(m[0].length)
  }
  if (segments.length === 0) return null
  return {
    head: segments[0],
    inner: segments.slice(1),
    label: segments.slice(1).join("/"),
    rest,
  }
}

/** §19.5 D-M8 子标行首变换（文本/think）：parseRelayPath 已消费完整前缀段——此处只
 *  判行首（块首或上一内容以 \n 收尾——chunk 边界碎片在前缀段消费后自然无声剥除，
 *  防 explore#1/ 字样泄漏）；行首 → 前置字面子标 `explore#1 · `（渲染端套 dim）。 */
export function sublabelLine(sub, text, label) {
  if (!label) return String(text)
  const last = sub.blocks.at(-1)
  const atLineHead = !last || String(last.text).endsWith("\n")
  return atLineHead ? `${label} · ${text}` : String(text)
}
/** N2: per-child display-line ring buffer cap — oldest lines drop with a marker. */
export const SUB_BLOCK_LINE_LIMIT = 500
/** N1: render-layer throttle for child tool-output appends (generation relays verbatim). */
export const SUB_RELAY_THROTTLE_MS = 250
/** Roles a subagent tool child can take (finishSubTask matches the block's role). */
export const SUBAGENT_ROLES = ["sub", "explore", "plan", "coder", "eng-coder"]

// ─── §19.6 D-P1 面板镜像（subagent panel 检查工具）───
// TUI 装配处（index.mjs startTUI）state._agent = agent——块级状态变更点经
// syncPanelSnapshot 刷新 agent._panelSnapshot（区块数组快照：{key, role,
// status: running|done|awaitingDigest, startedAt}——状态变更即刷——O(n) 小——
// 不逐 token——NF-P）。agent 层 subagent action:"panel" 读此镜像（视图与用户
// 所见一致）+ 冻结门控（D-P3）。未挂载（headless/mock——无 state._agent）=
// 无镜像——no-op（降级路径由 agent 侧判定）。

/** 刷新面板镜像（调用点 = 本模块全部 state.subTasks 块级变更点末尾——map 已稳定）。 */
function syncPanelSnapshot(state) {
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

let _subRenderLast = 0
let _subRenderTimer = null

/** N1 throttle: leading-edge render + one coalesced trailing flush (final chunk
 *  within a window is not lost). Data appends are NEVER throttled — rendering only. */
export function throttleSubRender(scheduleRender) {
  const now = performance.now()
  const wait = SUB_RELAY_THROTTLE_MS - (now - _subRenderLast)
  if (wait <= 0) {
    _subRenderLast = now
    scheduleRender()
    return
  }
  if (_subRenderTimer) return
  _subRenderTimer = setTimeout(() => {
    _subRenderTimer = null
    _subRenderLast = performance.now()
    scheduleRender()
  }, wait)
  _subRenderTimer.unref?.()
}

/** §19.5: key/role 分拆版核心（routeSub* 经 parseRelayPath；兼容 ensureSubTask(match)）。 */
export function ensureSubTaskKey(state, key, role) {
  // Tombstone guard：abort 子代理冻结后晚到 token 不得复活区块（2026-08-30 残项）
  state._frozenSubKeys ??= new Set()
  if (state._frozenSubKeys.has(key)) return null
  state.subTasks ??= {}
  if (!state.subTasks[key]) {
    state.subTasks[key] = {
      key, role, model: undefined, started: Date.now(), done: false, doneAt: null,
      blocks: [], currentTool: null, toolArgs: null, turn: 0, maxTurns: 0, approval: null,
      lastError: null, dropped: 0,
      stopped: false, // §19.5: ⟦ev⟧stopped 冻结标记（标题 "stopped"）
    }
    // §19.5 D-M7b ①（处置 #4 兜底——2026-09-03）：缺失 key 的 ⟦ev⟧async 事件已缓冲
    // pending 标志（routeSubToken——async 先于块创建到达：排队条目补位启动的时序窗口）
    // ——块创建（此处）即应用——sub.async 区块创建即知（⏹ 门控/头标判定源保真）。
    if (state._pendingAsyncKeys?.delete(key)) state.subTasks[key].async = true
    syncPanelSnapshot(state) // §19.6 D-P1: 块创建 → running 入镜
  }
  return state.subTasks[key]
}

export function ensureSubTask(state, subMatch) {
  return ensureSubTaskKey(state, `${subMatch[1]}#${subMatch[2]}`, subMatch[1])
}

const countBlockLines = (text) => text.split("\n").length

/** Append（kind 合并追加）+ N2 环形上限；fresh=true 强制新块（每工具调用）。 */
export function appendSubBlock(sub, kind, text, { fresh = false } = {}) {
  if (!text) return
  const last = sub.blocks.at(-1)
  if (!fresh && last && last.kind === kind) {
    // 合并只算净增行数（逐 chunk 全量 split 会把单行碎片虚计成 2 段——P1, 2026-08-30）
    const before = countBlockLines(last.text)
    last.text += text
    sub._lineCount = (sub._lineCount ?? 0) + countBlockLines(last.text) - before
  } else {
    sub.blocks.push({ kind, text })
    sub._lineCount = (sub._lineCount ?? 0) + countBlockLines(text)
  }
  sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
  trimSubBlocks(sub)
}

/** N2：超限丢最旧行 + 留一条累计省略标记行（done 块同受约束）。 */
export function trimSubBlocks(sub) {
  // 增量行记账（P1）：appendSubBlock 维护 _lineCount——旧实现每 chunk 全量 reduce
  sub._lineCount = (sub._lineCount ?? 0)
  let over = sub._lineCount - SUB_BLOCK_LINE_LIMIT
  if (over <= 0) return
  let droppedNow = 0
  while (over > 0 && sub.blocks.length > 0) {
    const first = sub.blocks[0]
    const lines = countBlockLines(first.text)
    const take = Math.min(lines, over)
    if (take >= lines) {
      sub.blocks.shift()
      droppedNow += lines
    } else {
      first.text = first.text.split("\n").slice(take).join("\n")
      droppedNow += take
    }
    over -= take
  }
  sub._lineCount -= droppedNow
  sub.dropped += droppedNow
  const marker = `…（已省略 ${sub.dropped} 行）`
  const first = sub.blocks[0]
  if (first && first.kind === "meta") first.text = marker
  else { sub.blocks.unshift({ kind: "meta", text: marker }); sub._lineCount += 1 }
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
 *  锚点插入（2026-09-03 修复轮）：settled 块带 _freezeAt（settle 时刻流位置）——
 *  splice 落位使挂起期补发冻结块位于其 digest 总览文本之前；无锚点尾推不变；
 *  多锚点批量冻结按降序（绝对位置 splice——先插小锚点会移走大锚点目标）。 */
export function freezeSubTaskLines(state, sub) {
  if (!sub) return
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

/** 按 [model] 记录的 model 精确 settle（consult_check 返回 provider:model——
 *  乱序 settle 时最早启发式冻错块）。比对尾段（bare ↔ provider:model）。 */
export function finishSubTaskByModel(state, role, model, lastError = null) {
  state.subTasks ??= {}
  const want = String(model ?? "").includes(":") ? String(model).split(":").pop() : String(model ?? "")
  for (const sub of Object.values(state.subTasks)) {
    const have = String(sub.model ?? "")
    const haveTail = have.includes(":") ? have.split(":").pop() : have
    if (!sub.done && sub.role === role && haveTail === want) {
      sub.done = true
      sub.doneAt = Date.now()
      sub.currentTool = null
      sub.approval = null
      if (lastError) sub.lastError = lastError
      sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
      syncPanelSnapshot(state) // §19.6 D-P1: done 状态变更刷镜
      return sub
    }
  }
  return null
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

/** 事件 token → 区块头部（turn/approval 更新 turn n/max + 等待态）。事件永不进
 *  blocks/主流——仅头部。@returns {boolean} 良构事件（已消费） */
export function applySubEvent(sub, payload) {
  const ev = payload.match(SUB_EVENT_RE)
  if (!ev) return false
  if (ev[1] === "turn") {
    sub.turn = Number(ev[2]) || sub.turn
    sub.maxTurns = Number(ev[3]) || sub.maxTurns
    sub.approval = null
  } else if (ev[1] === "approval") {
    sub.turn = Number(ev[2]) || sub.turn
    sub.maxTurns = Number(ev[3]) || sub.maxTurns
    sub.approval = ev[5] ? ev[5].slice(0, 40) : (ev[4] === "approval" ? "tool" : ev[4])
  }
  return true
}

// ─── Prefix routing（agent-turn callbacks 委派）：true = 带前缀已消费；false = 主路径

/** onToken 分支：子文本 / [model] 元数据 / ⟦ev⟧ 事件。§19.5 D-M8 嵌套：head 段路由块，
 *  内层内容走子标行首变换，内层 ⟦ev⟧/[model] 剥除不路由（防外层块头污染——round1 #4）。 */
export function routeSubToken(state, t, scheduleRender) {
  const path = parseRelayPath(t)
  if (!path) return false
  const payload = path.rest
  const nested = path.inner.length > 0
  // §19.5 D-M7b ① + 处置 #4（2026-09-03 评审 #4——兜底）：零字段 async 标记在
  // ensureSubTaskKey **之前**单独消费（async spawn 实际启动即发——sync 不发——精确
  // 匹配：async 后须 RS 或串尾——正文伪前缀形态不误吞；内容侧伪哨兵已由生成侧
  // stripEventToken 先行剥除——本分支只见真事件）。live 区块直接置位 sub.async；
  // **缺失 key（区块尚未创建——排队条目补位启动的时序窗口 / tombstone）→ 缓冲
  // pending 标志**（state._pendingAsyncKeys——ensureSubTaskKey 块创建时应用——async
  // 事件先于块存在到达不丢——queued→running ⏹ 可见性保真——⏹ 门控与头标 async 判定源）。
  // 内层（嵌套 explore#M/）async 剥除不路由（防污染外层块头）。
  // §20 D-SD3b：queued 等待块实际启动（补位/释放）→ **转 running——同 key 不重建**
  // ——清 waiting 标注（sub.queued）+ started 归零（elapsed 从实际启动计时——与池
  // startedAt 语义一致——排队等待不计 elapsed）。
  if (!nested && /^⟦ev⟧async(\x1e|$)/.test(payload)) {
    const live = state.subTasks?.[path.head]
    if (live) {
      live.async = true
      if (live.queued) {
        delete live.queued
        live.started = Date.now()
        syncPanelSnapshot(state) // §19.6 D-P1: queued → running 状态变更刷镜
      }
    }
    else {
      state._pendingAsyncKeys ??= new Set()
      state._pendingAsyncKeys.add(path.head)
    }
    scheduleRender()
    return true
  }
  // §20 D-SD3b（round2 #2——cancelled 事件）：取消/出队 → 移除等待块（**不冻结**——
  // 从未启动无活动可冻结；running 取消走 ⟦ev⟧stopped 冻结——两者通道分明）。守卫：
  // 仅 !async 块（waiting 块未启动——async 置位 = running——running 的取消以 stopped
  // 通道表达，cancelled 永不合法指向 running 块——迟到/失序事件不误删）。缺失块
  // （headless 竞态/已移除）→ no-op。零字段解析同 async（不入 SUB_EVENT_RE）。
  if (!nested && /^⟦ev⟧cancelled(\x1e|$)/.test(payload)) {
    const live = state.subTasks?.[path.head]
    if (live && !live.done && live.async !== true) {
      delete state.subTasks[path.head]
      syncPanelSnapshot(state) // §19.6 D-P1: 移除后刷镜（块出面板）
    }
    scheduleRender()
    return true
  }
  const sub = ensureSubTaskKey(state, path.head, path.head.slice(0, path.head.lastIndexOf("#")))
  if (!sub) return true // frozen tombstone — late token from an aborted child: drop
  // ⟦ev⟧：turn/approval 进度 → 仅头部（D1——不进 blocks/主流）；done（§15 D-A3）=
  // 完成即冻结（settle 时发）；settled（§17 D-S8）= 挂起期完成——驻留面板中间态
  // "done · awaiting digestion"，池空补发冻结；stopped（§19.5）= cancel——立即冻结；
  // queued（§20 D-SD3b）= 排队 spawn 等待块（spawn 返回即建/状态变迁刷新——覆盖式
  // 更新 sub.queued——块不可展开（无活动流）；启动后 async 事件清标转 running）。
  if (payload.startsWith("⟦ev⟧")) {
    if (nested) return true // 内层事件剥除不路由（防 explore 进度污染外层块头）
    const ev = payload.match(SUB_EVENT_RE)
    if (ev?.[1] === "queued") {
      // 防御：已启动块（async 标记已置）收到迟到的 queued 刷新 → 丢弃（事件序保证
      // queued 恒先于 async——迟到即陈旧——不复活 waiting 标注盖住 running 态）。
      if (sub.async === true) return true
      sub.queued = {
        kind: ev[2] === "wait" || ev[2] === "depc" ? ev[2] : "slot",
        position: Number(ev[3]) > 0 ? Number(ev[3]) : undefined,
        detail: ev[5] ?? "",
      }
      sub.currentTool = null
      sub.approval = null
      sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
      syncPanelSnapshot(state) // §19.6 D-P1: waiting 块建/刷新刷镜
      scheduleRender()
      return true
    }
    if (ev?.[1] === "settled") {
      sub.done = true
      sub.doneAt = Date.now()
      sub.awaitingDigest = true
      // 冻结锚点（2026-09-03 修复轮）：settle 时刻流位置——§17.5.5 digest 完成逐条回收
      // （freezeReclaimDigestedBlocks）与未消化残项的池空退出兜底（freezeAllSubTasks）
      // 都按它 splice 落位——digest 总览文本之前（round1 #1 裁定——T-S6/T-S14 同口径）。
      sub._freezeAt = state.lines?.length ?? 0
      sub.currentTool = null
      sub.approval = null
      sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
      syncPanelSnapshot(state) // §19.6 D-P1: settled → awaitingDigest 状态变更刷镜
      scheduleRender()
      return true
    }
    if (ev?.[1] === "done") {
      sub.done = true
      sub.doneAt = Date.now()
      sub.currentTool = null
      sub.approval = null
      sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
      freezeSubTaskLines(state, sub)
      delete state.subTasks[sub.key]
      syncPanelSnapshot(state) // §19.6 D-P1: 冻结删除后刷镜
      scheduleRender()
      return true
    }
    if (ev?.[1] === "stopped") {
      sub.done = true
      sub.doneAt = Date.now()
      sub.stopped = true
      sub.currentTool = null
      sub.approval = null
      sub.blockEpoch = (sub.blockEpoch ?? 0) + 1
      freezeSubTaskLines(state, sub)
      delete state.subTasks[sub.key]
      syncPanelSnapshot(state) // §19.6 D-P1: 冻结删除后刷镜
      scheduleRender()
      return true
    }
    applySubEvent(sub, payload)
    scheduleRender()
    return true
  }
  // `[model]<name>` metadata token: record the subagent's model (may differ from the
  // parent's) — shown in the block header, NOT appended to its content stream.
  // Only treat as metadata when the model isn't set yet (it's always the FIRST token);
  // a child content token that happens to start with "[model]" must not be swallowed.
  if (payload.startsWith("[model]") && (nested || sub.model === undefined)) {
    if (!nested) {
      sub.model = payload.slice(7)
      scheduleRender()
    } // 内层 [model] 剥除不路由（防嵌套块头污染）——单层 model 已设时 [model] 开头视为内容
    return true
  }
  // Child LLM text → text block (N2 cap inside appendSubBlock).
  appendSubBlock(sub, "text", nested ? sublabelLine(sub, payload, path.label) : payload)
  scheduleRender()
  return true
}

/** Child reasoning token → think block (F2: same treatment as main reasoning).
 *  §19.5 D-M8 nested think: 同文本行规则——行首 dim 子标后接思考行。 */
export function routeSubReasoning(state, t, scheduleRender) {
  const path = parseRelayPath(t)
  if (!path) return false
  const sub = ensureSubTaskKey(state, path.head, path.head.slice(0, path.head.lastIndexOf("#")))
  if (!sub) return true // frozen tombstone — drop late token
  const nested = path.inner.length > 0
  appendSubBlock(sub, "think", nested ? sublabelLine(sub, path.rest, path.label) : path.rest)
  scheduleRender()
  return true
}

/** Child tool call → fresh tool block + header currentTool。§19.5 D-M8 嵌套：
 *  `explore#1/read` → dim 子标 + 既有工具行形态；currentTool 存全路径
 *  （`explore#1/read`——输出归属判别 + 折叠头可辨嵌套）。 */
export function routeSubToolCall(state, name, args, scheduleRender) {
  const path = parseRelayPath(name)
  if (!path) return false
  const sub = ensureSubTaskKey(state, path.head, path.head.slice(0, path.head.lastIndexOf("#")))
  if (!sub) return true // frozen tombstone — drop late token
  const nested = path.inner.length > 0
  sub.currentTool = nested ? `${path.label}/${path.rest}` : path.rest
  sub.toolArgs = args
  sub.approval = null
  const argsDesc = describeToolArgs(path.rest, args)
  appendSubBlock(sub, "tool", `${nested ? `${path.label} · ` : ""}❯ ${path.rest}${argsDesc ? " " + argsDesc : ""}\n`, { fresh: true })
  scheduleRender()
  return true
}

/** Child tool output（D1 前缀 name relay）→ 追加当前 tool block。RAW 拼接（2026-09-03
 *  修复轮——relay chunk 是任意字节边界碎片，逐 chunk 补 \n 会把词拦腰断行 + 烧 N2
 *  配额；emit 端自带换行结构无损还原）。§19.5 D-M8 嵌套：输出跟随最近工具行（不重复
 *  前缀——块内顺序天然归属）；fresh 判别用全路径——防内外同名工具串块。 */
export function routeSubToolOutput(state, name, part, scheduleRender) {
  const path = parseRelayPath(name)
  if (!path) return false
  const sub = ensureSubTaskKey(state, path.head, path.head.slice(0, path.head.lastIndexOf("#")))
  if (!sub) return true // frozen tombstone — drop late token
  const toolName = path.inner.length > 0 ? `${path.label}/${path.rest}` : path.rest
  appendSubBlock(sub, "tool", part.text, { fresh: sub.currentTool !== toolName })
  if (sub.currentTool !== toolName) sub.currentTool = toolName
  throttleSubRender(scheduleRender)
  return true
}

// ─── Compression panel（CONTEXT-COMPACTION.md §7 D-C2）：压缩会话复用子agent 区块机制——
// 运行期 role "compress" 条目驻留面板（状态/阶段/耗时——正文永不进面板），完成/降级
// 后 freezeSubTaskLines 冻结进流。

let _compressSeq = 0

/** Live compression panel (role "compress", not done) or null. */
function liveCompressPanel(state) {
  return Object.values(state.subTasks ?? {}).find((s) => s.role === "compress" && !s.done) ?? null
}

/** 打开（或重试复位）压缩面板——onCompressStart 于摘要调用前触发。每次尝试重置
 *  started（elapsed 归零），失败行留在时间线（重试历史可见）。 */
export function ensureCompressPanel(state, info = {}) {
  state.subTasks ??= {}
  let panel = liveCompressPanel(state)
  if (!panel) {
    panel = {
      key: `compress#${++_compressSeq}`,
      role: "compress",
      model: undefined,
      started: Date.now(), done: false, doneAt: null,
      blocks: [], currentTool: null, toolArgs: null,
      turn: 0, maxTurns: 0, approval: null,
      lastError: null, dropped: 0,
    }
    state.subTasks[panel.key] = panel
  }
  panel.done = false
  panel.doneAt = null
  panel.lastError = null
  panel.started = Date.now()
  panel.currentTool = "compressing context…"
  const messages = Number.isInteger(info.messages) && info.messages >= 0 ? info.messages : "?"
  appendSubBlock(panel, "status", "Compressing context…\n", { fresh: true })
  appendSubBlock(panel, "meta", `summarizing ${messages} messages\n`, { fresh: true })
  syncPanelSnapshot(state) // §19.6 D-P1: 压缩面板建/重置刷镜
  return panel
}

/** 失败态（onCompressFail）：只记错误文本——降级说明与 3 连败绑定（D-C2）。 */
export function markCompressFailed(state, error) {
  const panel = liveCompressPanel(state)
  if (!panel) return
  const text = error?.message ? String(error.message) : String(error ?? "unknown error")
  panel.lastError = text
  appendSubBlock(panel, "err", `Compression failed: ${text}\n`, { fresh: true })
}

/** 冻结压缩面板进流（同完成子代理的载体/折叠 key）+ 释放 live 条目。 */
function freezeCompressPanel(state, panel) {
  freezeSubTaskLines(state, panel)
  delete state.subTasks[panel.key]
  syncPanelSnapshot(state) // §19.6 D-P1: 压缩面板冻结删除后刷镜
}

/** 完成态（onCompress）："Compressed: N tokens freed → summary (Xs)"——冻结可折叠。 */
export function markCompressDone(state, info = {}) {
  const panel = liveCompressPanel(state)
  if (!panel) return
  const tokensFreed = Number.isFinite(info.tokensFreed) ? Math.max(0, Math.round(info.tokensFreed)) : 0
  const seconds = Number.isFinite(info.elapsedMs) ? Math.max(0, Math.round(info.elapsedMs / 1000)) : 0
  panel.done = true
  panel.doneAt = Date.now()
  panel.currentTool = null
  appendSubBlock(panel, "status", `Compressed: ${tokensFreed} tokens freed → summary (${seconds}s)\n`, { fresh: true })
  freezeCompressPanel(state, panel)
}

/** 降级态（onCompress mode:"fallback"）——3 连败后 "truncated to N messages"。 */
export function markCompressFallback(state, info = {}) {
  const panel = liveCompressPanel(state)
  if (!panel) return
  const tailMessages = Number.isFinite(info.tailMessages) ? Math.round(info.tailMessages) : "?"
  panel.done = true
  panel.doneAt = Date.now()
  panel.currentTool = null
  appendSubBlock(panel, "err", `Compression failed — fallback: truncated to ${tailMessages} messages\n`, { fresh: true })
  freezeCompressPanel(state, panel)
}
