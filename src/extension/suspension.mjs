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
import { injectAsyncResult } from "../agent-tools/subagent.mjs"
import { logEvent } from "../log.mjs"

/** 后台池计数（LOGGING susp/digest 事件字段——pendingN/poolN，CLI agent-turn parity） */
function poolCounts(history) {
  const map = history?._asyncSubagents
  return {
    poolN: map?.size ?? 0,
    pendingN: history?._pendingAsyncResults?.length ?? 0,
    runningN: map ? [...map.values()].filter((e) => e.status === "running").length : 0,
  }
}

/** 后台池存活判据（D-S2/F5 口径）：running/queued 子代理，或已 settle 未注入结果
 *  （_pendingAsyncResults 非空 = D-S3 "未注入"）。回合尾与每次轮末都用它评估退出。 */
export function poolLive(history) {
  const map = history?._asyncSubagents
  return (map && map.size > 0) || (history?._pendingAsyncResults?.length ?? 0) > 0
}

/** D-S3 ③ 记账清扫：回合边界竞态落下的已 settle 项（settle 回调未及移交——发生在
 *  回合刚结束、_suspended 尚未置位的窗口，或 ContinueError 停止的回合）补入 pending。
 *  幂等：回调已移交的条目已从 map 删除并带 _inPending 标记，不会重复入列。 */
export function sweepSettledToPending(history) {
  const map = history?._asyncSubagents
  if (!map || map.size === 0) return
  const pend = (history._pendingAsyncResults ??= [])
  for (const e of [...map.values()]) {
    if (e.done && !e._inPending) {
      e._inPending = true
      pend.push(e)
      map.delete(e.id) // map keys are the spawn-time id (number)
    }
  }
}

/** §17.5.5 消化完成逐条冻结回收（2026-09-03 实测修订——CLI freezeReclaimDigestedBlocks
 *  parity）：digest/会话内用户回合消化完 pending 条目（run 首行已注入）后调用——对该轮
 *  已消化条目（before 快照中已不在 pending 者）逐条补发 {type:"subagent", status:"done"}
 *  通知 → webview 把 "done · awaiting digestion" 驻留行折叠回收（不等池空——块回收与
 *  池空解耦；会话退出 freeze 仅兜底未消化残项）。归属：快照 = run 开跑时 pending——
 *  run 消费后不在 pending 者即本 run 消化者（settle 回调挂起分流先入 pending 再被注入，
 *  无重复）。已知边界：run 首行注入前数毫秒窗口内 settle 的条目（入 pending 后即被本
 *  run 消费、却不在快照内）由会话退出 freeze 兜底折叠——极窄窗口、可接受。 */
function reclaimDigestedBlocks(panel, history, before) {
  const pend = history._pendingAsyncResults ?? []
  for (const e of before) {
    if (pend.includes(e)) continue // 未消费——留驻等下轮消化
    panel._panel?.webview.postMessage({ type: "subagent", id: e.id, role: e.role, status: "done" })
  }
}

/** 后台模式状态行数据（D-S8；17.5.4 #6 顺手对齐）：{ running, queued, pending, done }
 *  —— webview 端按 locale 组合文案。"done" = §17.5 回合尾留池的 settled 未消费项
 *  （挂起会话首轮 sweep 前的可见窗口——纯 settled 池进挂起时首帧不误报 0）。 */
export function backgroundStatus(history) {
  const map = history?._asyncSubagents
  const entries = map ? [...map.values()] : []
  return {
    running: entries.filter((e) => e.status === "running").length,
    queued: entries.filter((e) => e.status === "queued").length,
    pending: history?._pendingAsyncResults?.length ?? 0,
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
 * entry = { turnSlot, distillSlot, lines: { history, fullHistory }, engState, runTurn,
 *           pendingInput? }。runTurn({ text, modelOverride, reasoning, providerName, images,
 * autoTurn }) 执行一个回合（digest: autoTurn=true 且 text=""）。susp.abort = 进入回合的
 * turn controller——池 children 持其 signal（pre-suspension spawn 同款）；会话内各回合用
 * 自己的 controller。susp.abortControllers = 进入回合期间全部 controller 的快照（取自
 * panel._turnControllers，2026-09-02 偏差修复 #3——Stop 统一 abort）；susp.pendingInput
 * 起始装载释放窗口入队消息（偏差修复 #2，见 runPanelChat 回合尾）。
 */
export async function suspensionSession(panel, entry) {
  const { lines } = entry
  const history = lines.history
  const susp = (panel._susp = {
    active: true,
    turnSlot: entry.turnSlot,
    distillSlot: entry.distillSlot,
    lines,
    engState: entry.engState,
    abort: panel._abortController ?? new AbortController(),
    // entry.pendingInput = 释放窗口入队的消息（panel-chat 回合尾移交——2026-09-02 偏差修复 #2：
    // finally → generateTitle await 窗口期用户消息经 panel._suspQueue 排队，会话入口在这里接管；
    // 与 _chat 直接入队的 susp.pendingInput 同队列同优先级——用户输入优先于 digest，D-S5）。
    pendingInput: [...(entry.pendingInput ?? [])],
    // abortControllers = 进入回合（含 Ctrl+I / ContinueError 续跑重建）的全部 controller 快照
    // ——Stop 统一 abort（2026-09-02 偏差修复 #3：会话句柄只取最后一个 controller 会让持旧
    // controller signal 的池 children 逃逸中止）。快照后清空：会话内回合（digest/用户回合）
    // 的 controller 与池无关（children 持会话 signal），由下个顶层回合起点重新登记。
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
      // 1. 用户输入优先（D-S5）：pendingInput 队列（digest 运行中排队的消息）
      if (susp.pendingInput.length > 0) {
        const q = susp.pendingInput.shift()
        // §17.5.5：run 首行会消费当时 pending——快照本轮消化者（用户回合同样注入）
        const before = [...(history._pendingAsyncResults ?? [])]
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
      // 2. pending 非空 → 合并消化轮（注入由 runAgent 首行统一完成——D-S3 单注入点）
      if ((history._pendingAsyncResults?.length ?? 0) > 0) {
        const before = [...history._pendingAsyncResults]
        const d0 = Date.now()
        logEvent("digest:start", { pendingN: history._pendingAsyncResults.length })
        await entry.runTurn({ autoTurn: true, text: "" })
        logEvent("digest:end", { pendingN: history._pendingAsyncResults?.length ?? 0, ms: Date.now() - d0 })
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
      // 2026-09-02 code review round2 #2-VS Code 偏差修复）。
      history._asyncSubagents?.clear()
      history._pendingAsyncResults = []
    } else {
      // D-S3 ③ 兜底：退出前残余（极端竞态）直注入再退——结果零丢失（AC-S2）
      const residual = history._pendingAsyncResults
      if (residual?.length) {
        for (const e of residual.splice(0)) {
          await injectAsyncResult(e, { history, fullHistory: lines.fullHistory, cwd: entry.cwd })
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
        const q = susp.pendingInput.shift()
        try { await entry.runTurn(q) } catch { /* surfaced by the turn runner */ }
      }
    }
  }
}

/** 挂起态通知（状态行文本由 webview 按 locale 组合——host 只发计数）。 */
function postSuspension(panel, susp) {
  panel._panel?.webview.postMessage({ type: "suspension", active: true, ...backgroundStatus(susp.lines.history) })
}

/** 挂起退出通知：freeze = 补发 done 冻结（驻留面板的 awaiting-digest 块折叠进流）。 */
function postSuspensionEnd(panel, { freeze }) {
  panel._panel?.webview.postMessage({ type: "suspension", active: false, freeze })
}
