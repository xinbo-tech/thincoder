/**
 * subagent-blocks.mjs — 子agent 活动区块缓冲（AGENT-LOOP.md §7.2 D4，消费端）。
 * state.subTasks[key] = { key, role, model, async（§19.5 D-M7b——⟦ev⟧async 标记——
 * undefined = sync）, started, done, doneAt, blocks:
 * [{kind,text}], currentTool, toolArgs, turn, maxTurns, approval, lastError,
 * dropped, blockEpoch, awaitingDigest（§17）, _freezeAt（冻结锚点）, stopped（§19.5）,
 * children: []（SUBAGENT-TAIL：嵌套子代理**守护载体**——内容并入本块 blocks——见
 * subagent-children.mjs）}。
 * 职责：前缀路由（parseRelayPath——**SUBAGENT-TAIL（D-ST1）：嵌套段内容行并入外层
 * blocks——append 目标上移，子块载体只余守护元数据**）、
 * 事件 token 解析（**内层 ⟦ev⟧done/stopped 生成侧补发射（D-R23c1）路由到子块
 * 定格；F2：done 后完全定格——迟到 chunk 丢弃**）、kind 合并、N2 单环 500 显示行上限
 * （SUBAGENT-TAIL D-ST4——内层行同环计数、单载体最旧先行）、N1 渲染节流、
 * 完成冻结（freezeSubTaskLines 家族——锚点 splice）。显示契约 = docs/design/TUI.md §6。
 */

import { C } from "./ansi.mjs"
// 第 27 批 §12.3①/②：relay 前缀文法单一权威 = src/agent/relay-prefix.mjs——本文件
// 不再自持前缀正则/解析副本（防第二套平行正则再漂移）。
import { parseRelayPath } from "@thincoder/core/agent/relay-prefix.mjs"
// zero-block 批（TUI.md §6.8.3.2 P1）：墓碑存活闸复活分支留痕——日志面（零新增 UI 形态）。
import { logEvent } from "@thincoder/core/log.mjs"
import { describeToolArgs } from "./tool-args.mjs"
import {
  appendSubBlock, descendSubChild,
  closeSubChild,
} from "./subagent-children.mjs"
export { SUB_BLOCK_LINE_LIMIT, appendSubBlock } from "./subagent-children.mjs"
// 2026-09-05 module-split：finish/freeze 族 + §19.6 面板现算迁 subagent-freeze.mjs——
// routeSub*/compression panel 内部用本地 import；re-export 保外部 import 面（index.mjs 等）
// CLI-ACTIVITY-DEBLOAT F-3（2026-09-10）：面板手工镜像退役——re-export 面换现算导出
// computePanelBlocks（读时现算），本文件全部刷镜调用点删除（单账本——变更点不再手动同步）。
import { freezeSubTaskLines, finishSubTaskKey, finishSubTask, freezeDoneSubTasks, finishSubTasksByRole, freezeAllSubTasks, freezeReclaimDigestedBlocks, shiftFreezeAnchors, livePoolHas, removeFrozenSubTaskLine, tombstoneSubKey } from "./subagent-freeze.mjs"
export { computePanelBlocks, finishSubTask, finishSubTaskKey, freezeSubTaskLines, shiftFreezeAnchors, freezeDoneSubTasks, finishSubTasksByRole, freezeAllSubTasks, freezeReclaimDigestedBlocks } from "./subagent-freeze.mjs"

// 前缀文法/解析已迁 src/agent/relay-prefix.mjs（第 27 批 §12.3②）——本文件不自持副本。
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

// parseRelayPath 自 src/agent/relay-prefix.mjs import（第 27 批 §12.3①——文法单一权威，
// 语义与迁移前逐字一致；“嵌套解析任意深度/无前缀 → null”见该模块）。

/** N1: render-layer throttle for child tool-output appends (generation relays verbatim). */
export const SUB_RELAY_THROTTLE_MS = 250
/** Roles a subagent tool child can take（⏹ 门控/渲染角色判据；F-2 后角色匹配完成面 =
 *  finishSubTasksByRole——finishSubTask 已收窄 no-op）。 */
export const SUBAGENT_ROLES = ["sub", "explore", "plan", "coder", "eng-coder", "eng-designer"]

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
  if (state._frozenSubKeys.has(key)) {
    // 墓碑存活闸 P0-a（§6.8.3.2——zero-block 批）：**墓碑只能断言「此块已终」，不得对
    // 「仍在池中存活」的条目生效**——存活判据（逐字）见 livePoolHas（条目在池 ∧
    // done !== true ∧ cancelled !== true）。存活 ⇒ ① 摘墓碑；② 摘旧冻结载体行
    // （免一 key 两载体——折叠键共用）；③ 照常建块（model / async 由后续 token 重填）
    // + 留痕（**每次复活记一条（无去重状态）**）。不存活（池外 / done / cancelled
    // ——含 done-in-pool）⇒ 维持丢弃（迟到 chunk 正常高频面——不留痕，D-ZB5）。
    if (!livePoolHas(state, key)) return null
    state._frozenSubKeys.delete(key)
    removeFrozenSubTaskLine(state, key)
    logEvent("ev:subagent-block-revived", { id: key })
  }
  state.subTasks ??= {}
  if (!state.subTasks[key]) {
    state.subTasks[key] = {
      key, role, model: undefined, started: Date.now(), done: false, doneAt: null,
      blocks: [], currentTool: null, toolArgs: null, turn: 0, maxTurns: 0, approval: null,
      lastError: null, dropped: 0,
      _lineCount: 0, _charCount: 0, // 双维记账（TUI.md §15.3.4——行数维 + 字符维，subagent-children.mjs）
      stopped: false, // §19.5: ⟦ev⟧stopped 冻结标记（标题 "stopped"）
      children: [], // SUBAGENT-TAIL: 嵌套子代理守护载体（内容并入本块——subagent-children.mjs）
    }
    // §19.5 D-M7b ①（处置 #4 兜底——2026-09-03）：缺失 key 的 ⟦ev⟧async 事件已缓冲
    // pending 标志（routeSubToken——async 先于块创建到达：排队条目补位启动的时序窗口）
    // ——块创建（此处）即应用——sub.async 区块创建即知（⏹ 门控/头标判定源保真）。
    if (state._pendingAsyncKeys?.delete(key)) state.subTasks[key].async = true
  }
  return state.subTasks[key]
}

export function ensureSubTask(state, subMatch) {
  return ensureSubTaskKey(state, `${subMatch[1]}#${subMatch[2]}`, subMatch[1])
}

/** Append（kind 合并追加）+ N2 单环 500 显示行上限；fresh=true 强制新块（每工具调用）。
 *  R23（2026-09-07）：appendSubBlock/trimSubBlocks 实现迁 subagent-children.mjs——
 *  SUBAGENT-TAIL（D-ST4）后为单载体最旧先行（内层并入行同环计数）；本文件 import +
 *  re-export 保 import 面（压缩面板等）。 */
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

/** onToken 分支：子文本 / [model] 元数据 / ⟦ev⟧ 事件。SUBAGENT-TAIL（D-ST1——supersede
 *  R23 子块段方案，显示契约 docs/design/TUI.md §6）：head 段路由块——inner 段**内容行
 *  并入外层块 blocks**（append 目标上移），子块载体只余守护元数据（done 守卫——F2
 *  迟到丢弃；currentTool——fresh 判别）；内层 [model] 记子块模型；内层 ⟦ev⟧ 除
 *  done/stopped（生成侧补发射——D-R23c1——路由子块定格）外剥除不路由（防 explore
 *  进度污染外层块头——round1 #4）。 */
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
      // c2（af 批——§6.8.2「已移除块不复建」）：**与移除同一守卫**（命中移除才写）落键级墓碑
      // ⇒ 后续 ⟦ev⟧stopped 经 ensureSubTaskKey 直接丢弃（零幻影冻结块——探针实证的
      // state.lines 0 → 1 路径封死）；no-block 面不写（无可防之幻影——语义零扩）。
      tombstoneSubKey(state, path.head)
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
    // 内层完成信号（沿革：D-M8 子标 → R23 子块段 → SUBAGENT-TAIL 并入——显示契约
    // docs/design/TUI.md §6）：done/stopped = 生成侧补发射（D-R23c1——sync 同步收尾段带
    // 完整嵌套前缀）→ 路由到子块定格（closeSubChild——不冻结外层、不落 preview）；
    // 缺失子块（迟到事件/
    // 从未开块）→ 不建幻影（no-op）。其余内层事件（turn/approval/queued/settled/
    // async/cancelled）剥除不路由（防 explore 进度污染外层块头——round1 #4）。
    if (nested) {
      const innerEv = payload.match(SUB_EVENT_RE)
      if (innerEv && (innerEv[1] === "done" || innerEv[1] === "stopped")) {
        const leaf = descendSubChild(sub, path.inner, { create: false })
        // F2 保全：done 子块完全定格——迟到 done/stopped 丢弃（重复 done 不重放
        // 定格；stopped 不打回 done 定格块）
        if (leaf && !leaf.done) closeSubChild(sub, leaf, innerEv[1] === "stopped", path.label)
        scheduleRender()
      }
      return true
    }
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
  // SUBAGENT-TAIL：内层 [model] 记到守护载体（类目 B 字面量——不渲染、无正读者；
  // docs/design/TUI.md §6）；单层规则不变。
  if (payload.startsWith("[model]") && (nested || sub.model === undefined)) {
    if (nested) {
      const leaf = descendSubChild(sub, path.inner)
      // F2: done 子块完全定格——迟到 [model] 不写定格块头
      if (!leaf.done && leaf.model === undefined) {
        leaf.model = payload.slice(7)
        scheduleRender()
      }
    } else if (sub.model === undefined) {
      sub.model = payload.slice(7)
      scheduleRender()
    }
    return true
  }
  // Child LLM text → text block (N2 cap inside appendSubBlock). SUBAGENT-TAIL（D-ST1）：
  // 内层文本**并入外层 blocks**（append 目标上移——子块不再承载内容行，取代小节）。
  // F2：done 子块完全定格——迟到 chunk 丢弃（leaf.done 守卫——免无谓 render）。
  const leaf = nested ? descendSubChild(sub, path.inner) : null
  if (leaf?.done) return true
  appendSubBlock(sub, "text", payload)
  scheduleRender()
  return true
}

/** Child reasoning token → think block (F2: same treatment as main reasoning).
 *  SUBAGENT-TAIL：内层 think 并入外层 blocks（append 目标上移——显示契约 TUI.md §6）。 */
export function routeSubReasoning(state, t, scheduleRender) {
  const path = parseRelayPath(t)
  if (!path) return false
  const sub = ensureSubTaskKey(state, path.head, path.head.slice(0, path.head.lastIndexOf("#")))
  if (!sub) return true // frozen tombstone — drop late token
  const nested = path.inner.length > 0
  const leaf = nested ? descendSubChild(sub, path.inner) : null
  if (leaf?.done) return true // F2: done 子块完全定格——迟到 think 丢弃
  appendSubBlock(sub, "think", path.rest)
  scheduleRender()
  return true
}

/** Child tool call → fresh tool block + header currentTool。SUBAGENT-TAIL（D-ST1）：内层
 *  工具行并入外层 blocks（同款 `❯ tool` 行——取代小节）；currentTool 外层存全路径
 *  （`explore#1/read`——评审 #8：外层块头状态区现状保持不缩改）+ 子块存工具名（守护
 *  元数据——fresh 判别源，routeSubToolOutput 读）。 */
export function routeSubToolCall(state, name, args, scheduleRender) {
  const path = parseRelayPath(name)
  if (!path) return false
  const sub = ensureSubTaskKey(state, path.head, path.head.slice(0, path.head.lastIndexOf("#")))
  if (!sub) return true // frozen tombstone — drop late token
  const nested = path.inner.length > 0
  // F2: done 子块完全定格——迟到 tool call 丢弃（不复活外层 currentTool/子块状态）
  const leaf = nested ? descendSubChild(sub, path.inner) : null
  if (leaf?.done) return true
  sub.currentTool = nested ? `${path.label}/${path.rest}` : path.rest
  sub.toolArgs = args
  sub.approval = null
  const argsDesc = describeToolArgs(path.rest, args)
  if (leaf) {
    leaf.currentTool = path.rest
    leaf.toolArgs = args
    leaf.approval = null
  }
  appendSubBlock(sub, "tool", `❯ ${path.rest}${argsDesc ? " " + argsDesc : ""}\n`, { fresh: true })
  scheduleRender()
  return true
}

/** Child tool output（D1 前缀 name relay）→ 追加当前 tool block。RAW 拼接（2026-09-03
 *  修复轮——relay chunk 是任意字节边界碎片，逐 chunk 补 \n 会把词拦腰断行 + 烧 N2
 *  配额；emit 端自带换行结构无损还原）。SUBAGENT-TAIL（D-ST1）：内层输出并入外层
 *  blocks（append 目标上移）；fresh 判别照旧在子块层（守护元数据 leaf.currentTool=
 *  工具名）——内外/同层同名工具互不串块。 */
export function routeSubToolOutput(state, name, part, scheduleRender) {
  const path = parseRelayPath(name)
  if (!path) return false
  const sub = ensureSubTaskKey(state, path.head, path.head.slice(0, path.head.lastIndexOf("#")))
  if (!sub) return true // frozen tombstone — drop late token
  const nested = path.inner.length > 0
  const leaf = nested ? descendSubChild(sub, path.inner) : null
  if (leaf?.done) return true // F2: done 子块完全定格——迟到输出丢弃（不复活 currentTool）
  const toolName = path.rest
  if (leaf) {
    appendSubBlock(sub, "tool", part.text, { fresh: leaf.currentTool !== toolName })
    if (leaf.currentTool !== toolName) leaf.currentTool = toolName
  } else {
    appendSubBlock(sub, "tool", part.text, { fresh: sub.currentTool !== toolName })
    if (sub.currentTool !== toolName) sub.currentTool = toolName
  }
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
