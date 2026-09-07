/**
 * subagent-blocks.mjs — 子agent 活动区块缓冲（AGENT-LOOP.md §7.2 D4，消费端）。
 * state.subTasks[key] = { key, role, model, async（§19.5 D-M7b——⟦ev⟧async 标记——
 * undefined = sync）, started, done, doneAt, blocks:
 * [{kind,text}], currentTool, toolArgs, turn, maxTurns, approval, lastError,
 * dropped, blockEpoch, awaitingDigest（§17）, _freezeAt（冻结锚点）, stopped（§19.5）,
 * children: []（R23——嵌套子代理子块载体——见 subagent-children.mjs）}。
 * 职责：前缀路由（parseRelayPath——**R23：嵌套段不再子标渲染——建子块载体归属**）、
 * 事件 token 解析（**R23：内层 ⟦ev⟧done/stopped 生成侧补发射（D-R23c1）路由到子块
 * 定格；§27.1 F2：done 后完全定格——迟到 chunk 丢弃**）、kind 合并、N2 树级环形上限（R23 NFR——子块计入外层配额）、N1 渲染节流、
 * 完成冻结（freezeSubTaskLines 家族——锚点 splice）。
 */

import { C } from "./ansi.mjs"
import { describeToolArgs } from "./tool-args.mjs"
import {
  SUB_BLOCK_LINE_LIMIT, appendSubBlock, appendSubChild, ensureSubChild, descendSubChild,
  closeSubChild,
} from "./subagent-children.mjs"
export { SUB_BLOCK_LINE_LIMIT, appendSubBlock } from "./subagent-children.mjs"
// 2026-09-05 module-split：finish/freeze 族 + §19.6 面板镜像迁 subagent-freeze.mjs——
// routeSub*/compression panel 内部用本地 import；re-export 保外部 import 面（index.mjs 等）
import { freezeSubTaskLines, syncPanelSnapshot, finishSubTaskKey, finishSubTask, freezeDoneSubTasks, finishSubTasksByRole, freezeAllSubTasks, freezeReclaimDigestedBlocks, shiftFreezeAnchors } from "./subagent-freeze.mjs"
export { syncPanelSnapshot, finishSubTask, finishSubTaskKey, freezeSubTaskLines, shiftFreezeAnchors, freezeDoneSubTasks, finishSubTasksByRole, freezeAllSubTasks, freezeReclaimDigestedBlocks } from "./subagent-freeze.mjs"

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

/** §19.5 D-M8 嵌套 relay 前缀通用解析（循环解析任意深度——R23 保持为路由源）：
 *  `eng-coder#2/explore#1/read` → { head（块路由）, inner[], label（inner 链——R23：
 *  子块折叠键/外层 currentTool 全路径用）, rest }。
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

/** N1: render-layer throttle for child tool-output appends (generation relays verbatim). */
export const SUB_RELAY_THROTTLE_MS = 250
/** Roles a subagent tool child can take (finishSubTask matches the block's role). */
export const SUBAGENT_ROLES = ["sub", "explore", "plan", "coder", "eng-coder"]

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
      children: [], // R23: 嵌套子代理子块载体（subagent-children.mjs——D-R23a）
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

/** Append（kind 合并追加）+ N2 树级环形上限；fresh=true 强制新块（每工具调用）。
 *  R23（2026-09-07）：appendSubBlock/trimSubBlocks 实现迁 subagent-children.mjs（树级
 *  配额——子块计入外层 500 行环）——本文件 import + re-export 保 import 面（压缩面板等）。 */
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

/** onToken 分支：子文本 / [model] 元数据 / ⟦ev⟧ 事件。§27 R23（supersede §19.5 D-M8
 *  子标方案）：head 段路由块——inner 段**建子块载体归属内容**（D-R23a——subagent-children.mjs）；
 *  内层 [model] 记子块模型；内层 ⟦ev⟧ 除 done/stopped（生成侧补发射——D-R23c1——路由
 *  子块定格）外剥除不路由（防 explore 进度污染外层块头——round1 #4）。 */
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
    // R23（supersede D-M8"内层事件剥除不路由"——评审 #1 🅰）：done/stopped 完成信号 =
    // 生成侧补发射（D-R23c1——sync 同步收尾段带完整嵌套前缀）→ 路由到子块定格
    // （D-R23c2——closeSubChild——不冻结外层、不落 preview）；缺失子块（迟到事件/
    // 从未开块）→ 不建幻影（no-op）。其余内层事件（turn/approval/queued/settled/
    // async/cancelled）剥除不路由（防 explore 进度污染外层块头——round1 #4）。
    if (nested) {
      const innerEv = payload.match(SUB_EVENT_RE)
      if (innerEv && (innerEv[1] === "done" || innerEv[1] === "stopped")) {
        const leaf = descendSubChild(sub, path.inner, { create: false })
        // §27.1 F2: done 子块完全定格——迟到 done/stopped 丢弃（重复 done 不重放
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
  // R23：内层 [model] 记到子块（D-R23a 子块状态字段——不再剥除丢弃）；单层规则不变。
  if (payload.startsWith("[model]") && (nested || sub.model === undefined)) {
    if (nested) {
      const leaf = descendSubChild(sub, path.inner)
      // §27.1 F2: done 子块完全定格——迟到 [model] 不写定格块头
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
  // Child LLM text → text block (N2 cap inside appendSubBlock). R23：内层文本归属子块
  // （D-R23b——子块行——不再混外层 blocks/子标）。§27.1 F2：done 子块完全定格——
  // 迟到 chunk 丢弃（与 appendSubChild 数据层守卫同义——此处免无谓 render）。
  if (nested) {
    const leaf = descendSubChild(sub, path.inner)
    if (leaf.done) return true
    appendSubChild(sub, leaf, "text", payload)
  } else appendSubBlock(sub, "text", payload)
  scheduleRender()
  return true
}

/** Child reasoning token → think block (F2: same treatment as main reasoning).
 *  §27 R23 nested think：归属内层子块（supersede D-M8 子标渲染——D-R23a/b）。 */
export function routeSubReasoning(state, t, scheduleRender) {
  const path = parseRelayPath(t)
  if (!path) return false
  const sub = ensureSubTaskKey(state, path.head, path.head.slice(0, path.head.lastIndexOf("#")))
  if (!sub) return true // frozen tombstone — drop late token
  const nested = path.inner.length > 0
  if (nested) {
    const leaf = descendSubChild(sub, path.inner)
    if (leaf.done) return true // §27.1 F2: done 子块完全定格——迟到 think 丢弃
    appendSubChild(sub, leaf, "think", path.rest)
  } else appendSubBlock(sub, "think", path.rest)
  scheduleRender()
  return true
}

/** Child tool call → fresh tool block + header currentTool。§27 R23 嵌套（supersede
 *  D-M8 子标工具行）：工具行归属内层子块（子块内 `❯ tool`）；currentTool 外层存全路径
 *  （`explore#1/read`——评审 #8：外层块头状态区现状保持不缩改）+ 子块存工具名（子块内
 *  输出归属判别）。 */
export function routeSubToolCall(state, name, args, scheduleRender) {
  const path = parseRelayPath(name)
  if (!path) return false
  const sub = ensureSubTaskKey(state, path.head, path.head.slice(0, path.head.lastIndexOf("#")))
  if (!sub) return true // frozen tombstone — drop late token
  const nested = path.inner.length > 0
  // §27.1 F2: done 子块完全定格——迟到 tool call 丢弃（不复活外层 currentTool/子块状态）
  const leaf = nested ? descendSubChild(sub, path.inner) : null
  if (leaf?.done) return true
  sub.currentTool = nested ? `${path.label}/${path.rest}` : path.rest
  sub.toolArgs = args
  sub.approval = null
  const argsDesc = describeToolArgs(path.rest, args)
  if (nested) {
    leaf.currentTool = path.rest
    leaf.toolArgs = args
    leaf.approval = null
    appendSubChild(sub, leaf, "tool", `❯ ${path.rest}${argsDesc ? " " + argsDesc : ""}\n`, { fresh: true })
  } else {
    appendSubBlock(sub, "tool", `❯ ${path.rest}${argsDesc ? " " + argsDesc : ""}\n`, { fresh: true })
  }
  scheduleRender()
  return true
}

/** Child tool output（D1 前缀 name relay）→ 追加当前 tool block。RAW 拼接（2026-09-03
 *  修复轮——relay chunk 是任意字节边界碎片，逐 chunk 补 \n 会把词拦腰断行 + 烧 N2
 *  配额；emit 端自带换行结构无损还原）。§27 R23 嵌套：输出归属内层子块（T-R23a.2——
 *  输出全在子块——外层流无混入）；fresh 判别在子块层（子块 currentTool=工具名）——
 *  内外/同层同名工具互不串块。 */
export function routeSubToolOutput(state, name, part, scheduleRender) {
  const path = parseRelayPath(name)
  if (!path) return false
  const sub = ensureSubTaskKey(state, path.head, path.head.slice(0, path.head.lastIndexOf("#")))
  if (!sub) return true // frozen tombstone — drop late token
  if (path.inner.length > 0) {
    const leaf = descendSubChild(sub, path.inner)
    if (leaf.done) return true // §27.1 F2: done 子块完全定格——迟到输出丢弃（不复活 currentTool）
    const leafTool = path.rest
    appendSubChild(sub, leaf, "tool", part.text, { fresh: leaf.currentTool !== leafTool })
    if (leaf.currentTool !== leafTool) leaf.currentTool = leafTool
  } else {
    const toolName = path.rest
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
