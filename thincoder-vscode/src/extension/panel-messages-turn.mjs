/**
 * panel-messages-turn.mjs — 回合交互族消息 handler（自 `panel-messages.mjs` 拆出——VSC 四档
 * 结构拆分批 2026-09-18 · 设计 `docs/vsc/design/VSC-DEBT.md` §12.2.2）。
 *
 * 迁出段（10 case · 逐字搬迁——既有注释一并随迁）：`abort` / `cancelSubagent` / `interrupt` /
 * `openFile` / `openDiff` / `questionResponse` / `setAutoApprove` / `atComplete` /
 * `permissionResponse` / `batchPermissionResponse`。
 * 手法 = `panel-messages-session.mjs` 既定先例：case 体逐字搬出为 `handleXxx(panel, msg)`
 * 导出；case 包裹大括号去除 · 中途 `break` → `return` · 尾 `break` 去除（分发续行由
 * `panel-messages.mjs` 分发表各 case 的 `break` 保持）。
 *
 * 缝保持：`panel-messages.mjs` 分发表仍按**同名 case 标签**分发（转发行；骨架与全部 case 标签
 * 留主档）——case 标签集合零变化（`protocol-coverage-reverse.test.mjs` 的 `HOST_DISPATCH` 扫
 * `panel-messages*.mjs` 顶级 case；本档零顶级 case 标签）。
 *
 * 依赖：`relaySubagentEventToken` 取自**定义档** `panel-subagent-relay.mjs`（cancelSubagent 的
 * 合成 callbacks 中继面）。本档零反向 import `panel-messages.mjs`（回合族零 `_cwd` 消费）
 * ⇒ 消息面**无环**（设计 §12.5 环清单「messages ↔ turn」处据实不成立——见批次档 §5 登记）。
 */
import * as vscode from "vscode"
import { openDiffPreview } from "./diff-preview.mjs"
// §18 C-5/C-6（2026-09-12）：permissionResponse 按 promptId 路由 + approve-all 连带释放（同一 release helper）
import { releasePermission } from "./permission-gate.mjs"
// W15：+ 事件中继面（⏹ queued 取消路径的核 ⟦ev⟧ 事件 → webview 协议消息）——定义档。
import { relaySubagentEventToken } from "./panel-subagent-relay.mjs"
import { traceStop } from "./stop-trace.mjs"

/** 迁出自 `panel-messages.mjs` 的 case "abort"。 */
export function handleAbort(panel) {
  panel._stopClickTs = Date.now()
  traceStop("click received — abort() called", panel._stopClickTs)
  // C1（SESSION-FLOW-C F-C1b——abort 启动闩——修 H-C）：Startup 窗口（回合起点后、本回合
  // controller 建立前的 await 段——prevDistill/provider 解析可达秒级）无活 controller 可
  // 交付——abort 只能命中上回合僵尸 controller（交付无效）。此时记闩——newTurnController
  // 消费（新建 controller 立即 abort + 复位闩）。有活 controller（运行中）→ 交付即生效——
  // 不置闩（置了会被中断续跑重建消费——误杀 Ctrl+I/Continue 续跑）。
  // F-6（SESSION-ACTIVITY-REVISED——2026-09-09 用户裁定——评审 #1——废除 D-S9 susp
  // 全停）：Stop 只在主会话 running（回合/digest）显示与生效——只停当前主会话 controller
  // （_abortController = newTurnController 每回合新建——digest 轮 controller 或用户回合
  // controller——池 children 持会话 signal 不受影响——susp 等待期本无 digest 可停）。
  // 挂起等待期（susp——纯后台池跑）陈旧/竞态 Stop 点击 no-op——不再 _susp.aborted /
  // _susp.abortControllers 全链 abort / _susp.abort / _suspWake 唤醒（全停路径删除——
  // 无全停按钮——池空自然消化完——CLI 对拍）；子代理停止靠活动区每块 ⏹
  // （cancelSubagent 定向 abort——running+pool 块挂停 ⏹——queued/waiting 等待头挂取消 ⏹
  // （F-2——QUEUED-VISIBILITY——2026-09-09——覆盖 F-6 旧“queued/waiting 不挂”定论）。
  if (panel._turnState === "running") {
    // A12（群 A 批）：降级窗（视觉读图 await 段）优先——窗 controller 活且未 aborted →
    // 定向 abort + return（交付有效——原 case 内 `break` 的本批译文）。
    // 否则旧两路皆静默无效：命中上回合僵尸 controller / 入口清闩丢失。
    if (panel._visionAbort && !panel._visionAbort.signal.aborted) {
      panel._visionAbort.abort()
      return
    }
    if (!panel._abortController || panel._abortController.signal.aborted) panel._abortRequested = true
    panel._abortController?.abort()
  }
}

/** 迁出自 `panel-messages.mjs` 的 case "cancelSubagent"。 */
export async function handleCancelSubagent(panel, msg) {
  // AGENT-LOOP-SUBAGENT.md §6.7.2 D-M7 UI 停止（VS Code ⏹——不经模型回合——直连 extension 层定向 abort）：
  // webview 子块标题行 ⏹ 点击 → cancelSubagent 消息 → 定位 live lines 的池条目 →
  // 条目级 abort（cancelSubagent——与工具 action:'cancel' 同实现路径——D-M6）。
  // live lines 锚点 = panel._liveLines（runPanelChat 每回合登记——挂起期与
  // susp.lines 同一数组）。未知 id（陈旧按钮/池已清）→ no-op（无虚构状态）。
  // §9 D-24b（R13）：role="advisor" 伪角色条目在独立评审池（_asyncAdvisors）——
  // ⏹ 路由到 cancelAdvisorReview（②-6b——controller abort——取消不入 pending/不签发 token）。
  const lines = panel._liveLines ?? panel._susp?.lines
  // W13 键形单源（评审 🔴 收口）：核池键恒 `String(id)`（核 spawn/launch 写侧 `set(String(id))`
  // ——`advisor-async.mjs:326` / `subagent-run.mjs`；旧端侧 `Number(msg.id)` 归一在生产恒 miss
  // ⇒ ⏹ 路由失效面）。读键 = String 归一，与核 `getAsyncPool`/`cancelAsyncSubagent` 同形。
  const id = String(msg.id)
  const entry = lines?.history?._asyncSubagents?.get(id) ?? lines?.history?._asyncAdvisors?.get(id)
  // advisor round 2 #6：role 交叉校验——陈旧按钮命中同 id 异 role 的极端情况防御
  // （webview ⏹ 携带 block 的 role——消息契约不设死参数）
  if (entry && entry.role !== msg.role) {
    console.warn(`[chat-panel] cancelSubagent: no live pool entry for id ${msg.id} role ${msg.role}`)
    return
  }
  // X10（显示面消差批 §2.2）：sync 子代理定向中止——池外目标，核 sync registry
  // `panel._agent._syncChildAborts`（写点 `subagent.mjs` `armSyncChildAbort`；键 = `role#id`）
  // **只读**消费 + 核单源执行器 `cancelSyncChild`（stopped 旗标 + 条目 ctrl.abort ⇒ childRun
  // opts.signal 覆写链——AbortError 解绕 ⇒ catch 折叠 stopped partial 报告 + 核发 ⟦ev⟧stopped
  // ⇒ 块冻结 stopped）。谓词与门控载荷产者（`panel-subagent-relay.mjs` `syncLiveOf`）同源。
  const syncKey = `${msg.role}#${id}`
  if (panel._agent?._syncChildAborts?.has(syncKey)) {
    const { cancelSyncChild } = await import("@thincoder/core/agent-tools/subagent-async.mjs")
    const r = cancelSyncChild(panel._agent, syncKey)
    if (r.status === "error") console.warn(`[chat-panel] cancelSubagent: ${r.error}`)
    return
  }
  if (!entry) {
    console.warn(`[chat-panel] cancelSubagent: no live pool entry for id ${msg.id} role ${msg.role}`)
    return
  }
  // W13（2026-09-15）：原端侧 `cancelSubagent`（subagent.mjs/subagent-actions.mjs）随镜像
  // 删旧退役——改指核 cancel 动作执行器 `executeCancelAction`（`@thincoder/core/agent-tools/subagent-async.mjs`
  // ——与工具 action:'cancel' 同实现路径：running 定向 abort（settle
  // cancelled 分支收尾）/ queued 出队 + 位置前移 + 补位；含 advisor 池 fallback）。
  // af 批（F-11 · 2026-09-17）：**advisor 目标并入本路径**（原 advisor 专用分支退役——
  // 其直调 `cancelAsyncAdvisor` 后 break，无 callbacks / 无刷新 ⇒ 评审等待头悬留）。
  // 取消收尾单源：advisor queued 命中的 `⟦ev⟧cancelled` 由核单点发射（本路径不另发）
  // → `relaySubagentEventToken` 中继 → webview `cancelled(was:"queued")`（等待头移除）
  // + `refreshAdvisorQueuedTokens` 余位刷新；不补位、不发 `⟦ev⟧stopped`。
  // 动态 import：核链可达 node:sqlite（W8 契约②）。合成 parent 携双池 + history + 队列
  //（`_asyncQueue` / `_asyncAdvisorQueue` 核侧载体——面板 agent 槽；缺则核内按空队处理）。
  // W15（R5——等待头回收 + W12/W13 遗留「合成 parent 三缺」收口）：
  //   ① config / autoApprove 由面板活 agent / 会话标志供给（核 `poolLimitsFor` 按生效值
  //      判定补位；AUTO 档依赖者自动启动判定按真值——不再回退默认 4/4 + 不启动）；
  //   ② callbacks 携事件中继——核 queued 取消路径的 `⟦ev⟧cancelled`（等待头移除）与
  //      `refreshQueuedTokens`（剩余排队位置前移）经 `relaySubagentEventToken` 转 webview
  //      协议消息（原 `callbacks: {}` = 两者 no-op——webview 等待头悬留）。
  const { executeCancelAction } = await import("@thincoder/core/agent-tools/subagent-async.mjs")
  executeCancelAction({ id }, {
    agent: {
      _asyncSubagents: lines.history._asyncSubagents,
      _asyncAdvisors: lines.history._asyncAdvisors,
      history: lines.history,
      _asyncQueue: lines.history._asyncQueue ?? panel._agent?._asyncQueue,
      config: panel._agent?.config,
      autoApprove: panel._autoApprove === true,
    },
    depth: 0,
    callbacks: { onToken: (tok) => { relaySubagentEventToken(panel, tok) } },
  })
}

/** 迁出自 `panel-messages.mjs` 的 case "interrupt"。 */
export function handleInterrupt(panel, msg) {
  // Ctrl+I inject (CLI parity): abort with an interrupt reason — the agent loop
  // commits partial output, injects the message, and resumes from the same context.
  panel._stopClickTs = Date.now(); traceStop("interrupt received", panel._stopClickTs)
  // C1（F-C1b）：同 abort——启动窗口 interrupt 无活 controller → 记闩（回合起点消费；
  // 窗口内 interrupt 无法注入续跑——降级为停止）。运行中 → 交付（interrupt 续跑重建消费
  // 点恒 no-op——不置闩）。
  if (!panel._abortController || panel._abortController.signal.aborted) panel._abortRequested = true
  panel._abortController?.abort({ interrupt: true, message: msg.message })
}

/** 迁出自 `panel-messages.mjs` 的 case "openFile"。 */
export async function handleOpenFile(panel, msg) {
  // Clickable file paths in tool cards — open in the editor, at the line if given.
  try {
    const doc = await vscode.workspace.openTextDocument(msg.path)
    const ed = await vscode.window.showTextDocument(doc, { preview: true })
    if (msg.line) {
      const pos = new vscode.Position(msg.line - 1, 0)
      ed.selection = new vscode.Selection(pos, pos)
      ed.revealRange(new vscode.Range(pos, pos), 2 /* InCenter */)
    }
  } catch (e) { console.error("[openFile] failed:", e.message) }
}

/** 迁出自 `panel-messages.mjs` 的 case "openDiff"（大 diff → 编辑器原生 diff 视图）。 */
export async function handleOpenDiff(panel, msg) { await openDiffPreview(msg.diff) }

/** 迁出自 `panel-messages.mjs` 的 case "questionResponse"。 */
export function handleQuestionResponse(panel, msg) {
  // C1（SESSION-FLOW-C F-C1d——修 H-D）：按 promptId 精确匹配队列条目——不再无条件 shift
  // （旧卡片/乱序响应会错 resolve 队头——新 question 被旧卡答案吞）。无 promptId（旧
  // webview）→ 回退队头（历史语义）；找不到 → no-op（陈旧卡——不虚构 resolve——不 resolve
  // 错队头）。
  const entry = msg.promptId != null
    ? panel._questionQueue.find((e) => e.id === msg.promptId) ?? null
    : (panel._questionQueue[0] ?? null)
  if (entry == null) return
  const i = panel._questionQueue.indexOf(entry)
  if (i >= 0) panel._questionQueue.splice(i, 1)
  entry.resolve(msg.answer ?? null)  // null → tool returns "(user cancelled)"
  panel._refreshStatus()
}

/** 迁出自 `panel-messages.mjs` 的 case "setAutoApprove"。 */
export async function handleSetAutoApprove(panel, msg) { await panel._setAutoApprove(!!msg.value) }

/** 迁出自 `panel-messages.mjs` 的 case "atComplete"。 */
export async function handleAtComplete(panel, msg) { await panel._atComplete(msg.query, msg.cwd, msg.seq) }

/** 迁出自 `panel-messages.mjs` 的 case "permissionResponse"。 */
export async function handlePermissionResponse(panel, msg) {
  // §18 C-5（child permission gate）：promptId 精确匹配（question F-C1d 同构）；无 id（旧 webview）
  // → 回退队头；未知 → no-op（陈旧卡不误 resolve）。
  const entry = msg.promptId != null
    ? panel._permissionQueue.find((e) => e.id === msg.promptId) ?? null
    : (panel._permissionQueue[0] ?? null)
  if (entry == null) return
  const pi = panel._permissionQueue.indexOf(entry)
  if (pi >= 0) panel._permissionQueue.splice(pi, 1)
  if (msg.approved === "approveAll") {
    entry.resolve(true)
    // §18 C-6 ③：approve-all 连带——其余 pending 逐个 release（permissionWithdrawn）；AUTO 置位（零改）
    for (const e of [...panel._permissionQueue]) releasePermission(panel, e, true)
    await panel._setAutoApprove(true)
    panel._panel?.webview.postMessage({ type: "autoApprove", value: true })
  } else {
    entry.resolve(!!msg.approved)
  }
  panel._refreshStatus()
}

/** 迁出自 `panel-messages.mjs` 的 case "batchPermissionResponse"。 */
export function handleBatchPermissionResponse(panel, msg) {
  // §16 D-B1 + §4.6（F-W13）：合并卡并入逐项卡族——id 精确匹配（非 `shift`）；无 promptId
  // （旧 webview）→ 回退队头；零命中 ⇒ 孤儿回写（可见处置——不改队列 ⇒ 零刷新）。
  const q = panel._batchPermissionQueue ?? []
  const entry = msg.promptId != null
    ? q.find((e) => e.id === msg.promptId) ?? null
    : (q[0] ?? null)
  if (entry == null) {
    if (msg.promptId != null) panel._panel?.webview.postMessage({ type: "permissionWithdrawn", promptId: msg.promptId })
    return
  }
  // 释放出口同点（出队 + resolve + permissionWithdrawn + 状态栏刷新）——单一释放通道
  releasePermission(panel, entry, msg.choice === "approveAll" ? "approveAll" : msg.choice === "oneByOne" ? "oneByOne" : "deny", q)
}
