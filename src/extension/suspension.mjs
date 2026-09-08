/**
 * suspension.mjs — §17 挂起回合会话驱动（AGENT-LOOP.md §17 D-S2/D-S9，VS Code 对齐）。
 * 挂起态是交互层状态：一个用户回合结束后后台 async 池仍 live（running/queued/未注入）
 * → 不阻塞回合，进入挂起会话——输入放开（新消息经 panel._chat 排队 + 唤醒）、settle
 * 事件驱动 auto-turn 消化（手动档 organize-only / AUTO 档全语义）、池空 + 无待处理
 * 输入 → 补发冻结自然退出。状态机行表见 AGENT-LOOP.md §17 D-S9。
 *
 * 与 CLI 的结构差异（同语义移植）：CLI 的池/pending/_suspended 挂 agent 对象（跨 run
 * 存活）；VS Code 的 agent 对象 per-run 重建——池（_asyncSubagents）、pending
 * （_pendingAsyncResults）与挂起标志（_suspended）全部挂在**共享的 depth-0 history
 * 数组**上（与既有 §15 的 history._asyncSubagents 同一载体；JSON 序列化只走数组下标，
 * 附加属性不污染会话文件）。settle 回调（subagent.mjs）以读取时刻为准（确定性）。
 *
 * 驱动不 import runPanelChat（循环依赖）：回合执行器经 runTurn 注入（panel-chat.mjs
 * 装配真实实现，测试注入 mock——CLI agent-turn ctx.runAgent 同款手法）。
 */
import { injectPendingAsync, parkAsyncPending } from "../agent-tools/async-settle.mjs" // D2/D3 共享：pending 单容器注入分发 + 停靠统一表示
import { cleanupConsultSessions } from "../agent-tools/consult.mjs" // §25 R17：会诊会话中止清理（挂起活度见 poolLive 内联读）
import { logEvent } from "../log.mjs"

// ═══════════════════════════════════════════════════════════════════════════
// §24 D-24c（AGENT-LOOP.md §24——R15 排队用户指令合并——2026-09-06）
// ═══════════════════════════════════════════════════════════════════════════
// 常量逐字一致（双端同值——§22 D-Q3 先例）：单批 ≤8 条且合并注入 ≤2000 字符。
export const MAX_MERGE_ITEMS = 8 // 单批合并上限（条）
export const MAX_MERGE_CHARS = 2000 // 合并注入上限（字符——超限截批先行）

/** 队列消息形态：{ text, modelOverride, reasoning, providerName, images }（panel 排队项）。
 *  可合批判据：text 非空 ≤2000 字符且无图片附件（图片属于单条消息——合并会丢附件边界
 *  ——逐条直发；/cmd 即时命令本端不存在（webview 命令走 msg.type 按钮路由，text 队列零
 *  命令项）——无需排除类）。 */
function mergeable(q) {
  const t = q?.text
  return typeof t === "string" && t.length > 0 && t.length <= MAX_MERGE_CHARS
    && !(Array.isArray(q.images) && q.images.length > 0)
}

/**
 * §24 D-24c 合并注入文案（模型可见——编号列出逐条——形态同 T-S11 先例的编号列表）：
 *  "你排队了 N 条消息：1. … 2. …——一次处理" 的英文对应。单批数量/字符受上方常量约束。
 */
export function buildMergedMessage(items) {
  const n = items.length
  const body = items.map((q, i) => `${i + 1}. ${q.text}`).join("\n")
  return `[System reminder: you queued ${n} messages — handle them all in this one turn:\n${body}]`
}

/**
 * §24 D-24c 消费取数（纯函数——driver 与 panel-chat 兜底循环共用）：FIFO 队列取下一回合
 *  载荷。规则：
 *  - 队首不可合批（超长/带图/空）→ 直发单条（shift 返回 { item }）——保序；
 *  - 否则取**队首连续可合批段**：段长 ≥2 且合并注入 ≤2000 字符且 ≤8 条 → 合并
 *    （返回 { items }——调用方 shift 前 n 条后以合并文案开回合；余下留待下批——
 *    不丢不截断单条）；段长 1 → 直发单条；
 *  - 合并注入超 2000 → 截批到最长前缀（保序）；空队 → null。
 *  合并回合的传输参数（model/reasoning/provider）取段内最后一条（最近发送意图——
 *  面板输入框状态即最新）。
 */
export function popQueuedTurn(queue) {
  if (!Array.isArray(queue) || queue.length === 0) return null
  const head = queue[0]
  if (!mergeable(head)) {
    queue.shift()
    return { item: head }
  }
  // 连续可合批段（遇不可合批即断段——保序：断点之后的不越前合并）
  const run = [head]
  for (let i = 1; i < queue.length; i++) {
    if (!mergeable(queue[i])) break
    run.push(queue[i])
    if (run.length >= MAX_MERGE_ITEMS) break // 8 条封顶——超出留待下批（截批先行）
  }
  if (run.length < 2) {
    queue.shift()
    return { item: head }
  }
  // 字符上限：取最长前缀（含标题/编号开销）≤2000——超限截批（余下留待下批）
  let take = run.length
  for (;;) {
    const merged = buildMergedMessage(run.slice(0, take))
    if (merged.length <= MAX_MERGE_CHARS || take <= 1) break
    take--
  }
  const items = run.slice(0, take)
  queue.splice(0, items.length)
  if (items.length === 1) return { item: items[0] }
  return { items }
}

/** 后台池计数（LOGGING susp/digest 事件字段——pendingN/poolN，CLI agent-turn parity；
 *  §24 D-24b：两池合计——advisor 独立池同口径；D2 pending 单容器——四族停靠同一
 *  _pendingAsyncResults——pendingN = 单容器长度） */
function poolCounts(history) {
  const maps = [history?._asyncSubagents, history?._asyncAdvisors].filter((m) => m instanceof Map)
  const consultSessions = history?._consultSessions instanceof Map ? history._consultSessions.size : 0
  return {
    poolN: maps.reduce((n, m) => n + m.size, 0) + consultSessions,
    pendingN: history?._pendingAsyncResults?.length ?? 0,
    runningN: maps.reduce((n, m) => n + [...m.values()].filter((e) => e.status === "running").length, 0) + consultSessions,
  }
}

/** 后台池存活判据（D-S2/F5 口径）：running/queued 子代理/评审，或已 settle 未注入结果
 *  （_pendingAsyncResults 非空 = D-S3 "未注入"——D2 pending 单容器 +role——
 *  四族统一停靠同一容器）。回合尾与每次轮末都用它评估退出。
 *  §25 R17（2026-09-06）：会诊/飞刀完全异步化——① running 会诊会话纳入挂起活度
 *  （history._consultSessions——会话跨 run 存活——会诊启动回合尾即入挂起态）；② pending
 *  单容器同口径（T-R17j 空闲 settle 也触发消化轮——单容器非空即活）。 */
export function poolLive(history) {
  const sub = history?._asyncSubagents
  const adv = history?._asyncAdvisors
  const consultSessions = history?._consultSessions
  return (sub && sub.size > 0) || (adv && adv.size > 0)
    || (consultSessions && consultSessions.size > 0)
    || (history?._pendingAsyncResults?.length ?? 0) > 0 // D2 pending 单容器——四族同口径
}

/** D-S3 ③ 记账清扫：回合边界竞态落下的已 settle 项（settle 回调未及移交——发生在
 *  回合刚结束、_suspended 尚未置位的窗口，或 ContinueError 停止的回合）补入 pending。
 *  幂等：回调已移交的条目已从 map 删除并带 _inPending 标记（settle/sweep 同一表示——
 *  D2 done-in-pool 统一），不会重复入列。
 *  §24 D-24b：advisor 池同扫（同机制角色无关）；D2：两池统一扫入 pending 单容器
 *  （_pendingAsyncResults +role）。 */
export function sweepSettledToPending(history) {
  for (const key of ["_asyncSubagents", "_asyncAdvisors"]) {
    const map = history?.[key]
    if (!map || map.size === 0) continue
    for (const e of [...map.values()]) {
      if (e.done && !e._inPending) {
        parkAsyncPending({ history }, e) // 统一表示：_inPending 标记 + 单容器 push（D2）
        map.delete(e.id) // map keys are the spawn-time id (number)
      }
    }
  }
}

/** 消化轮快照（§17.5.5 回收判据——本 run 消费了谁）：有 webview 池行的 pending 条目
 *  （subagent/advisor/escalate 池行——会诊 per-model 行由活动流承载无会话级行——不进）。 */
function pendingRowSnapshot(history) {
  // D2 pending 单容器——role 过滤（consult 无 webview 行）
  return (history._pendingAsyncResults ?? []).filter((e) => e?.role !== "consult")
}

/** §17.5.5 消化完成逐条冻结回收（2026-09-03 实测修订——CLI freezeReclaimDigestedBlocks
 *  parity）：digest/会话内用户回合消化完 pending 条目（run 首行已注入）后调用——对该轮
 *  已消化条目（before 快照中已不在 pending 者）逐条补发 {type:"subagent", status:"done"}
 *  通知 → webview 把 "done · awaiting digestion" 驻留行折叠回收（不等池空——块回收与
 *  池空解耦；会话退出 freeze 仅兜底未消化残项）。归属：快照 = run 开跑时 pending——
 *  run 消费后不在 pending 者即本 run 消化者（settle 回调挂起分流先入 pending 再被注入，
 *  无重复）。已知边界：run 首行注入前数毫秒窗口内 settle 的条目（入 pending 后即被本
 *  run 消费、却不在快照内）由会话退出 freeze 兜底折叠——极窄窗口、可接受。
 *  D2：pending 单容器同快照回收（advisor/escalate 行同型——role 分发）；
 *  会诊条目（role=consult）无 webview 行（per-model consult 行由活动流承载）
 *  ——不进快照不回收。 */
function reclaimDigestedBlocks(panel, history, before) {
  const pend = history._pendingAsyncResults ?? [] // D2 pending 单容器
  for (const e of before) {
    if (pend.includes(e)) continue // 未消费——留驻等下轮消化
    panel._panel?.webview.postMessage({ type: "subagent", id: e.id, role: e.role, status: "done" })
  }
}

/** 后台模式状态行数据（D-S8；17.5.4 #6 顺手对齐）：{ running, queued, pending, done }
 *  —— webview 端按 locale 组合文案。"done" = §17.5 回合尾留池的 settled 未消费项
 *  （挂起会话首轮 sweep 前的可见窗口——纯 settled 池进挂起时首帧不误报 0）。
 *  §24 D-24b：advisor 池条目同列（role=advisor 行——计数含两池）。
 *  §25 R17：pending 单容器计入 pending（D2）；running 会诊会话计入 running
 *  （会话级计数——per-model 行已由 consult 活动流承载）。 */
export function backgroundStatus(history) {
  const entries = []
  for (const key of ["_asyncSubagents", "_asyncAdvisors"]) {
    const map = history?.[key]
    if (map instanceof Map) entries.push(...map.values())
  }
  const consultLive = history?._consultSessions instanceof Map ? [...history._consultSessions.values()] : []
  return {
    running: entries.filter((e) => e.status === "running").length + consultLive.length,
    queued: entries.filter((e) => e.status === "queued").length,
    pending: history?._pendingAsyncResults?.length ?? 0, // D2 pending 单容器
    done: entries.filter((e) => e.done).length, // §17.5 留池未消费（sweep 前窗口）
  }
}

/** 等待下一次 settle（running 子代理完成）或用户唤醒（Enter 入队 / 会话 abort）。
 *  唤醒器经 panel._suspWake 单槽注入；abort 监听兜底。返回唤醒原因。 */
function waitForSettleOrWake(panel, susp) {
  return new Promise((resolve) => {
    let finished = false
    const cleanup = () => {
      panel._suspWake = null
      susp.abort?.signal.removeEventListener("abort", onAbort)
    }
    const finish = (why) => {
      if (finished) return
      finished = true
      cleanup()
      resolve(why)
    }
    const wake = () => finish("wake")
    const onAbort = () => finish("aborted")
    panel._suspWake = wake
    if (susp.abort?.signal.aborted) { onAbort(); return }
    susp.abort?.signal.addEventListener("abort", onAbort, { once: true })
  })
}

/**
 * §17 挂起会话驱动（D-S9 行表；由 runPanelChat 回合尾进入，池空自然退出）：
 * - suspension：池项 settle → 入 pending → 开 auto-turn（合并消化近邻 settle）；
 *   用户消息 → pendingInput 队列（digest 运行中排队，D-S5）——用户输入优先于 digest；
 * - auto-turn：消化中 settle 不并发开新轮（单 runAgent 循环），轮末按 pending/池态
 *   续开合并消化轮或回挂起；pendingInput 非空 → 以该消息开新回合（不触发新 digest）；
 * - §17.5.5：每次消化/会话内用户回合消费 pending 后 → reclaimDigestedBlocks 对该
 *   轮已消化条目逐条补发 done（webview 折叠回收——不等池空；CLI freezeReclaim
 *   DigestedBlocks parity）；
 * - 退出：池空 + pending 空 + 无待处理输入 → 残余直注入（③）→ 补发冻结（freeze 仅
 *   兜底未消化残项——17.5.5 块回收与池空解耦）→ idle。
 * _suspended 翻转：会话期 true（settle 回调据此延迟冻结 + 移交 pending）；会话内
 * 用户回合执行期翻 false（普通回合语义：① 直注入 + settle 即冻结）。
 *
 * entry = { turnSlot, distillSlot, lines: { history, fullHistory }, runTurn,
 *          pendingInput? }。runTurn({ text, modelOverride, reasoning, providerName, images,
 * autoTurn }) 执行一个回合（digest: autoTurn=true 且 text=""）。susp.abort = 进入回合的
 * turn controller——池 children 持其 signal（pre-suspension spawn 同款）；会话内各回合用
 * 自己的 controller。
 * F-6（SESSION-ACTIVITY-REVISED——2026-09-09 用户裁定——评审 #1）：susp.abortControllers /
 * aborted 标记不再由 Stop 驱动（panel-messages abort 已收窄为只停 digest 轮 controller——
 * 全停路径废除——无全停按钮——子代理靠活动区每块 ⏹——池空自然消化完）；susp.abort 中止仅
 * 剩面板销毁/会话切换前守卫等生命周期路径（chat-panel dispose）。abortControllers 快照
 * （取自 panel._turnControllers）保留仅供该 dispose 统一中止（2026-09-02 偏差修复 #3 语义
 * 收窄——旧 controller signal 的池 children 随面板死一并停）。susp.pendingInput 起始装载
 * 释放窗口入队消息（偏差修复 #2，见 runPanelChat 回合尾）。
 * D3 (2026-09-08): 本驱动不再捕获/复用入场 engState 快照——会话内回合每轮从槽新读
 * （suspension.mjs 存过的 susp.engState 已删——settle 落盘后 digest 才能看到 token）。
 */
export async function suspensionSession(panel, entry) {
  const { lines } = entry
  const history = lines.history
  const susp = (panel._susp = {
    active: true,
    turnSlot: entry.turnSlot,
    distillSlot: entry.distillSlot,
    lines,
    abort: panel._abortController ?? new AbortController(),
    // entry.pendingInput = 释放窗口入队的消息（panel-chat 回合尾移交——2026-09-02 偏差修复 #2；
    // 2026-09-09 A2：标题已上移 finally 归位前——标题期（running）消息经 routeUserTurn 直入
    // panel._suspQueue——此处一并接管；与 _chat 直接入队的 susp.pendingInput 同队列同优先级
    // ——用户输入优先于 digest，D-S5）。
    pendingInput: [...(entry.pendingInput ?? [])],
    // abortControllers = 进入回合（含 Ctrl+I / ContinueError 续跑重建）的全部 controller 快照
    // ——面板销毁统一中止（dispose 路径——2026-09-02 偏差修复 #3：会话句柄只取最后一个
    // controller 会让持旧 controller signal 的池 children 逃逸中止）。快照后清空：会话内回合
    // （digest/用户回合）的 controller 与池无关（children 持会话 signal），由下个顶层回合
    // 起点重新登记。F-6（SESSION-ACTIVITY-REVISED）：本快照不再被 Stop 消费（全停废除——
    // 只停 digest 轮 controller 见 panel-messages abort case）。
    abortControllers: [...(panel._turnControllers ?? [])],
    aborted: false,
  })
  panel._turnControllers = []
  history._suspended = true
  postSuspension(panel, susp)
  // LOGGING（LOGGING.md——CLI agent-turn.mjs parity）：susp:*（挂起态进入/退出）+
  // digest:*（消化轮边界）。挂起期输入事件 v1 不记（refinement #1）。
  const s0 = Date.now()
  logEvent("susp:enter", poolCounts(history))
  try {
    while (!susp.aborted && !susp.abort.signal.aborted) {
      sweepSettledToPending(history)
      // 1. 用户输入优先（D-S5）：pendingInput 队列（digest 运行中排队的消息）。
      // §24 D-24c（R15——2026-09-06）：消费点攒批合并——长度 ≥2 的可合批段合成一条
      // 注入（编号列出逐条——模型单回合处理全部）；超长/带图单条直发保序；截批余量
      // 留队由下轮接走（不丢不截断单条）。
      if (susp.pendingInput.length > 0) {
        const next = popQueuedTurn(susp.pendingInput)
        const q = next.items
          ? { text: buildMergedMessage(next.items), ...mergeTransportFor(next.items) }
          : next.item
        // §17.5.5：run 首行会消费当时 pending——快照本轮消化者（用户回合同样注入）。
        // D2 pending 单容器同快照（role 分发——漏快照会让 advisor 行的 digest-done 回收
        // 延迟到会话退出冻结——review fix）；会诊条目无 webview 行——不进。
        const before = pendingRowSnapshot(history)
        history._suspended = false // 用户回合 = 普通回合语义（① 直注入 + settle 即冻结）
        try {
          await entry.runTurn(q)
        } finally {
          history._suspended = true
        }
        // §17.5.5：该回合消化完 pending → 逐条补发 done（webview 折叠回收——不等池空）
        reclaimDigestedBlocks(panel, history, before)
        postSuspension(panel, susp)
        continue
      }
      // 2. pending 非空 → 合并消化轮（注入由 runAgent 首行统一完成——D-S3 单注入点）。
      // D2 pending 单容器（_pendingAsyncResults +role——四族统一）——非空即触发消化轮
      // （T-R17j——空闲 settle 不悬置到用户下次输入）。
      const pendingN = history._pendingAsyncResults?.length ?? 0
      if (pendingN > 0) {
        const before = pendingRowSnapshot(history)
        const d0 = Date.now()
        logEvent("digest:start", { pendingN })
        await entry.runTurn({ autoTurn: true, text: "" })
        const left = history._pendingAsyncResults?.length ?? 0 // D2 单容器
        logEvent("digest:end", { pendingN: left, ms: Date.now() - d0 })
        // §17.5.5 实测修订（2026-09-03）：digest 消化完成（pending 条目已注入）→ 对该轮
        // 已消化条目逐条补发 done（webview 折叠回收——不等池空；块回收与池空解耦——
        // CLI freezeReclaimDigestedBlocks parity——池空 freeze 仅兜底未消化残项）
        reclaimDigestedBlocks(panel, history, before)
        postSuspension(panel, susp)
        continue
      }
      // 3. 池空（无 running/queued/未注入）→ 自然退出回 idle（补发冻结在 finally）
      if (!poolLive(history)) break
      // 4. 等下一 settle / 用户唤醒（Enter 入队、会话 abort）
      await waitForSettleOrWake(panel, susp)
    }
  } finally {
    const aborted = susp.aborted || susp.abort.signal.aborted
    if (aborted && (history?._asyncSubagents?.size ?? 0) > 0) logEvent("ev:stopped", { poolN: history?._asyncSubagents?.size ?? 0, where: "suspension-abort" })
    logEvent("susp:exit", { ...poolCounts(history), ms: Date.now() - s0, reason: aborted ? "aborted" : "idle" })
    history._suspended = false
    if (aborted) {
      // §15 abort 语义：清池不注入（用户显式停——不注入陈旧错误）。
      // 排队中的用户消息不是池产物——由下方兜底以普通回合消费（不静默丢，
      // 2026-09-02 code review round2 #2-VS Code 偏差修复）。§24 D-24b：评审池同清。
      // §25 R17：会诊会话同清（abort 子代理——停 = 弃——T-R17c 取消语义）；会诊/飞刀
      // pending 单容器同清（中止清池不注入陈旧结果——四族同池语义——D2）。
      history._asyncSubagents?.clear()
      history._asyncAdvisors?.clear()
      cleanupConsultSessions({ history })
      history._pendingAsyncResults = [] // D2 pending 单容器——中止清容器不注入陈旧结果
    } else {
      // D-S3 ③ 兜底：退出前残余（极端竞态）直注入再退——结果零丢失（AC-S2）
      // D2 pending 单容器：四族残余同点分发注入（injectPendingAsync 按 role 分发——
      // subagent/advisor/escalate/consult 各族注入器文案各自保留）
      const residual = history._pendingAsyncResults
      if (residual?.length) {
        for (const e of residual.splice(0)) {
          await injectPendingAsync(e, { history, fullHistory: lines.fullHistory, cwd: entry.cwd })
        }
      }
      // 残余注入落盘（在-memory 双线已改——防会话文件缺最后几条 reminder）
      try { if (lines.fullHistory.length) panel._saveLines(lines.fullHistory, history, {}, entry.turnSlot) } catch { /* non-fatal */ }
    }
    panel._susp = null
    panel._suspWake = null
    // 补发 done 冻结：驻留面板的 awaiting-digest 块随会话退出折叠进流（abort 同样
    // 折叠——CLI freezeAllSubTasks 的中断语义：无 digest 消费、不留悬空 live 块）。
    postSuspensionEnd(panel, { freeze: true })
    panel._refreshStatus?.()
    // 排队输入兜底（2026-09-02 code review round2 #2-VS Code 偏差修复）：会话退出时
    // pendingInput 残余不得静默丢弃——输入框已清空 + 用户气泡已上屏（webview send.js
    // 先 addUser 再 postMessage——用户视为已发送）。两条路径同样以普通回合执行：
    // - 自然退出竞态：池空退出的瞬间 _chat 入队（loop 检查后入队）——池已空直接执行；
    // - 中止：digest 运行期排队、abort 前未被 loop 消费的消息——abort 分支已清池 →
    //   以普通回合执行（与释放窗口队列的中止兜底同语义——panel-chat「Stop 已中止 →
    //   队列消息普通回合兜底执行」，入队消息零丢失 AC-S2；Stop 中止的是后台池与消化轮，
    //   不撤销用户已发送的回合请求——气泡不得无响应悬挂）。
    // 面板已死（dispose）→ 无渲染目标，消息随会话终止。
    if (panel._panel) {
      while (susp.pendingInput.length > 0) {
        const next = popQueuedTurn(susp.pendingInput)
        const q = next.items
          ? { text: buildMergedMessage(next.items), ...mergeTransportFor(next.items) }
          : next.item
        try { await entry.runTurn(q) } catch { /* surfaced by the turn runner */ }
      }
    }
  }
}

/** 合并回合的传输参数（模型/推理档/provider）取段内最后一条（最近发送意图）。
 *  导出——panel-chat 兜底循环同用（driver 与普通回合间消费点共享）。 */
export function mergeTransportFor(items) {
  const last = items[items.length - 1] ?? {}
  const out = {}
  for (const k of ["modelOverride", "reasoning", "providerName"]) {
    if (last[k] !== undefined && last[k] !== null && last[k] !== "") out[k] = last[k]
  }
  return out
}

/** 挂起态通知（状态行文本由 webview 按 locale 组合——host 只发计数）。
 *  C2（F-C2b/F-C2e——单一广播同点）：suspension 消息（既有族——S._suspended/freeze 语义
 *  不变）之外，忙态单广播 _publishTurnState 同点重发 susp + counts——282/300 重发时机的
 *  counts 走上 turnState 通道（webview reducer 以 counts 刷新 _suspCounts——digest 间
 *  计数不陈旧）。两通道同源（backgroundStatus）——幂等一致。 */
function postSuspension(panel, susp) {
  const counts = backgroundStatus(susp.lines.history)
  panel._panel?.webview.postMessage({ type: "suspension", active: true, ...counts })
  panel._publishTurnState?.("susp", counts)
}

/** 挂起退出通知：freeze = 补发 done 冻结（驻留面板的 awaiting-digest 块折叠进流）。
 *  C2：先广播 idle（忙态收敛——Stop 派生/路由守卫以 idle 收尾）再发 suspension 终态。 */
function postSuspensionEnd(panel, { freeze }) {
  panel._publishTurnState?.("idle")
  panel._panel?.webview.postMessage({ type: "suspension", active: false, freeze })
}
