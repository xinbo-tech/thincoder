/**
 * suspension.mjs — §17 挂起回合会话驱动（AGENT-LOOP.md §7 D-S2/D-S9，VS Code 对齐）。
 * 挂起态是交互层状态：一个用户回合结束后后台 async 池仍 live（running/queued/未注入）
 * → 不阻塞回合，进入挂起会话——挂起空闲输入开放（新消息经 panel._chat 填单槽 + 唤醒）、
 * busy（running 含 digest）提交同入单槽（busy-extend 批 2026-09-22——routeUserTurn 两载体
 * 分流，见 `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）、settle 事件驱动 auto-turn 消化
 * （手动档 organize-only / AUTO 档全语义）、池空 + 无待处理输入 → 补发冻结自然退出。状态机行表见 AGENT-LOOP.md §7。
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
// W13（2026-09-15）：核单源接线——pending 单容器停靠 = 核 `parkAsyncPending`（动态 import，
// 停靠点见 sweepSettledToPending）；残余注入 = 核统一注入器（`injectAsyncResult` /
// `injectConsultResult`，注入点见 finally 残余段）；会诊会话清理 = 核单源
// （`@thincoder/core/agent-tools/consult.mjs`）——均动态 import（核链可达 node:sqlite，W8 契约②；
// 静态引会入端壳静态链）。原静态行（`../agent-tools/async-settle.mjs`）随 W13 镜像删旧退役。
import { logEvent } from "@thincoder/core/log.mjs"
// 任务可见性族投递通道（第 10 批 §5.1.4 第 3 条）：环 import（panel-callbacks ↔ 本模块——
// B2 panel-messages↔panel-session 同款）——postSubagentEvent 为函数声明（hoist）——只在
// 调用期读——环安全（两模块无顶层跨环读取）。
import { postSubagentEvent, queuedInfoOf } from "./panel-callbacks.mjs"

// INPUT-LOCK-ASYNC（C'——2026-09-09，设计 thincoder-cli/docs/design/INPUT-LOCK-ASYNC.md——双端）：
// R15 排队用户指令合并整批废弃（攒批取数/合并文案/上限常量全删）——busy（_turnState running 含
// digest）提交入单槽（busy-extend 批 2026-09-22——routeUserTurn 两载体分流；原「输入禁用」撤销）——
// 挂起空闲消息走 pendingInput 单槽（至多一条待交接——单消息逐发不攒批）。废弃记录见 AGENT-LOOP.md §7。
/** 后台池计数（LOGGING susp/digest 事件字段——pendingN/poolN，CLI agent-turn parity；
 *  §9 D-24b：两池合计——advisor 独立池同口径；D2 pending 单容器——四族停靠同一
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
 *  §9 D-24b：advisor 池同扫（同机制角色无关）；D2：两池统一扫入 pending 单容器
 *  （_pendingAsyncResults +role）。 */
export async function sweepSettledToPending(history) {
  // W13（2026-09-15）：pending 单容器停靠 = 核单源（`@thincoder/core/agent-tools/async-settle.mjs`
  // `parkAsyncPending`）。动态 import：核链经 subagent-scheduler→subagent-async→核 agent 栈可达
  // node:sqlite（W8 契约②——静态引会破端壳静态闭包机判）。载体形态：核 `parkAsyncPending(parent, entry)`
  // 写侧以「父对象字段优先、缺则借 history」落容器——此处传 history 本体（VSC 载体面 = history 数组；
  // 若传 `{history}` 包装，数组未建窗口会在包装对象上落错容器 ⇒ 直接以数组为 parent，两窗口同落 history）。
  const { parkAsyncPending } = await import("@thincoder/core/agent-tools/async-settle.mjs")
  for (const key of ["_asyncSubagents", "_asyncAdvisors"]) {
    const map = history?.[key]
    if (!map || map.size === 0) continue
    for (const e of [...map.values()]) {
      if (e.done && !e._inPending) {
        parkAsyncPending(history, e) // 统一表示：_inPending 标记 + 单容器 push（D2）
        map.delete(String(e.id)) // W13 键形单源：核池键恒 String(id)（数字键面随镜像删旧退役）
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
 *  通知 → webview 把 awaitingDigest 驻留块**归档落流**（WEBVIEW.md §14 C-3；不等池空——
 *  块回收与池空解耦；会话退出 freeze 仅兜底未消化残项）。归属：快照 = run 开跑时 pending——
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
 *  §9 D-24b：advisor 池条目同列（role=advisor 行——计数含两池）。
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

/** 存活投影 / 状态再断言（第 10 批 §5.1.4 第 3/4 条——WEBVIEW.md）——触发点 = webviewReady
 *  握手（就绪两拍之一）与 loadSession 清屏（historyPage）之后：读 panel._liveLines ??
 *  panel._susp?.lines 的 _asyncSubagents / _asyncAdvisors（与 panel-messages ⏹ 路由**同一
 *  来源**）——**只发 live**（running → started + pool:true；queued → queued——#118 R2：queued
 *  行四项与 live 中继面同形，取自 relay 面缓存；缓存缺省 ⇒ 降级仅 `position`）；两侧 role/id
 *  必带（webview 建块/接管守卫依赖——§5.1.4 第 3 条）。settled/已消化不在投影内（呈现面 =
 *  终态消息 / digest）；投影不含已终态者，故与 flush 不重复。投递经 postSubagentEvent
 *  （就绪直投 / 未就绪入队——同一族通道）。返回重发条数。 */
export function reassertLiveChildren(panel) {
  const lines = panel._liveLines ?? panel._susp?.lines
  const history = lines?.history
  if (!history) return 0
  let n = 0
  for (const key of ["_asyncSubagents", "_asyncAdvisors"]) {
    const map = history[key]
    if (!(map instanceof Map)) continue
    for (const e of map.values()) {
      if (e.status === "running") {
        // X10（显示面消差批 §2.2 · 同形面）：`syncLive` 随载荷——投影只枚举池条目（async）
        // ⇒ 恒 false（sync 子代理不在池内，无第二来源）；字段形态与 relay 出生面同形（D2 单表）。
        postSubagentEvent(panel, { type: "subagent", status: "started", role: e.role, id: e.id, pool: true, model: e.model ?? null, startedAt: e.startedAt, syncLive: false })
        n++
      } else if (e.status === "queued") {
        // #118 R2（2026-09-20 一致性同步批）：载荷与 live 中继面**同形**——四项（`position` /
        // `waiting` / `reason` / `kind`）取自 relay 面每面板缓存（`queuedInfoOf`；`kind` / detail
        // 只存在于一次性 token——池条目仅携 `position`）。缓存缺省（该键未消费过 queued token）
        // ⇒ 仅 `position` = **降级态**：webview 侧走 `kind !== "slot"` 支 ⇒ 状态词 `sub.waiting`
        // ∧ 状态区中性回落 `sub.queued`（WEBVIEW.md §5.2 降级形——非「槽满等位」）。
        const info = queuedInfoOf(panel, `${e.role}#${e.id}`)
        postSubagentEvent(panel, {
          type: "subagent", status: "queued", id: e.id, role: e.role,
          // 四项 = 单一来源：缓存在场 ⇒ 全取自缓存（与 relay 面逐字同形，含 `position` 为 null 的
          // 退化情形——显示面 `n: "?"` 与 CLI `queued.position ?? "?"` 同形）；缓存缺省 ⇒ 池条目位置。
          position: info ? (info.position ?? null) : (e.position ?? null),
          ...(info ? { waiting: info.waiting, reason: info.reason, kind: info.kind } : {}),
        })
        n++
      }
    }
  }
  return n
}

/** 等待下一次 settle（running 子代理完成）或用户唤醒（Enter 入队 / 会话 abort）。
 *  唤醒器经 panel._suspWake 单槽注入；abort 监听兜底。返回唤醒原因。 */
function waitForSettleOrWake(panel, susp) {
  return new Promise((resolve) => {
    let finished = false
    // W13（2026-09-15）挂起唤醒面收口：核 settle 尾部（`async-settle.mjs` 公共尾 ④）唤醒面
    // = `parent._asyncWaiters.splice(0)`（子 agent 的 settle 回调以 `ctx.agent` 为 parent——
    // 生产 = 面板会话单例 agent）；端侧旧 `onAsyncSettled` 回执面（panel-callbacks 仍有定义）
    // 在核 settle 路径无调用点 ⇒ 只等 `_suspWake` 会挂到下一用户输入/中止。双注册：
    // ① 核 waiter 数组（真唤醒——与核 CLI 同缝）；② `panel._suspWake`（端侧兼容面保留）。
    const carriers = [panel._agent, susp.lines?.history].filter((o) => o && typeof o === "object")
    const cleanup = () => {
      panel._suspWake = null
      for (const c of carriers) {
        const list = c._asyncWaiters
        if (!Array.isArray(list)) continue
        const i = list.indexOf(wake)
        if (i >= 0) list.splice(i, 1)
      }
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
    for (const c of carriers) (c._asyncWaiters ??= []).push(wake)
    panel._suspWake = wake
    if (susp.abort?.signal.aborted) { onAbort(); return }
    susp.abort?.signal.addEventListener("abort", onAbort, { once: true })
  })
}

/**
 * §17 挂起会话驱动（D-S9 行表；由 runPanelChat 回合尾进入，池空自然退出）：
 * - suspension：池项 settle → 入 pending → 开 auto-turn（合并消化近邻 settle）；
 *   挂起空闲用户消息、会话内 busy 消息 → pendingInput 单槽（busy-extend 批 2026-09-22 同判据）
 *   ——用户输入优先于 digest；
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
    // pendingInput = 挂起空闲 + 会话在飞 busy 消息单槽（INPUT-LOCK-ASYNC + busy-extend 批
    // 2026-09-22——routeUserTurn 两载体分流，会话在飞此项）：挂起空闲与会话内 busy 消息均
    // 经 panel._chat 直推本数组——driver 消费清槽（用户输入优先于 digest，D-S5）。
    // F16（busy-injection 2026-09-21）：入口装载缝——entry.pendingInput（普通回合 busy 期
    // 排队残项，由 `enterSuspensionTurn` 预填）优先；缺省空数组（原行为零变）。
    pendingInput: Array.isArray(entry.pendingInput) ? entry.pendingInput : [],
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
    // §6.27.12.12 ③ + §6.27.12.13 ②：开轮谓词 + ask 提示行携参取用一次（模块缓存 ⇒ 每会话一次代价）。
    // 动态 import = 零新增静态边（核链可达 node:sqlite ⇒ W8 契约②；同 `parkAsyncPending` 先例）。
    // 等待栓注册点零改（W1 复用）。住 try 内（while 之前）：import 失败也走 finally 清场
    // （_suspended / panel._susp 复位 + idle 广播）。
    const { upstreamWaiting, upstreamAskLabelVars } = await import("@thincoder/core/agent-tools/parent-channel.mjs")
    while (!susp.aborted && !susp.abort.signal.aborted) {
      await sweepSettledToPending(history)
      // 1. 用户输入优先（D-S5）：pendingInput 单槽——INPUT-LOCK-ASYNC（C'——2026-09-09）+
      //    busy-extend 批 2026-09-22：挂起空闲与会话内 busy 提交同入本槽（C-B2-6）——至多
      //    一条待交接——消费清槽即开新回合（消费后同推 `busyQueued` 实况，webview 守卫镜像）。
      //    R15 攒批已废弃（单消息逐发——无取数计划无合并）。
      if (susp.pendingInput.length > 0) {
        const q = susp.pendingInput.shift()
        // C-B2-6 细则①（消费即清——driver 步骤 1 支）：推槽内实况（webview 二次提交守卫镜像
        // 复位；动态 import = 零新增静态边——panel-messages ↔ 本档反向静态边不上岸）。
        const { pushBusyQueued } = await import("./panel-messages.mjs")
        pushBusyQueued(panel)
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
      // §6.27.12.12 ③（上行通道批）：+ 未 drain 的 ask（`upstreamWaiting`）——谓词**先于**第 3 步
      // 池空退出判（「池空 + 队列留 ask」仍须开一轮把它 drain 出来）；唤醒（核 ask 入队尾）与本
      // 谓词两件一组，缺一无效（§6.27.12.3）。note 不计（无时效义务——F13 语义零变）。
      const pendingN = history._pendingAsyncResults?.length ?? 0
      const upstream = upstreamWaiting(history)
      if (pendingN > 0 || upstream) {
        const before = pendingRowSnapshot(history)
        const d0 = Date.now()
        logEvent("digest:start", { pendingN, ...(upstream ? { upstream: true } : {}) })
        // B6（WEBVIEW（VSC 仓）§7.4）：消化轮起跑的可见指示——起跑到首 token 可静默数十秒~分钟，
        // CLI 有 `[auto-turn: …]` 零延迟行，本端此前只有文件日志。post 早于 runTurn
        // （可见时刻不晚于回合开跑）；起止两态 + ok 旗标（异常不留"仍在消化"假象，try/finally
        // 保 end 必发）；直投（同 compress 先例——不经任务可见性 outbox）。
        // M4（显示面消差批 §2.1 · 2026-09-20）：**起跑即发**（`n` 可 0）——ask-only 轮亦有可见面
        // （`AGENT-LOOP-SUBAGENT.md` §6.27.12.12 ⑥ 边界行随本批收正）。
        // F-UC8（§6.27.12.13 ①–② · 2026-09-21 信号提示行批）：`tier` **按因两档**（ask 因恒优先）
        // ——与 CLI 同源同式（`suspension-drive.mjs` `digestTurn`）：`ask` = 未 drain ask（核既有
        // 谓词）/ `digest` = 其余（AUTO 档同判——`auto` 泛句退场）；ask 档**携参** `from` / `msg`
        // （核单点 `upstreamAskLabelVars`——显示串跨端同源）；计数元素规则同转向 `n > 0`（webview 侧）。
        const tier = upstream ? "ask" : "digest"
        const ask = upstream ? upstreamAskLabelVars(history) : null
        panel._panel?.webview.postMessage({ type: "digest", status: "start", n: pendingN, tier, ...(ask ?? {}) })
        let ok = true
        try {
          await entry.runTurn({ autoTurn: true, text: "", upstreamTurn: upstream })
        } catch (e) {
          ok = false
          // C-8（AGENT-LOOP（VSC 仓）§12.3）：digest 轮被 Stop（回合级 abort——F-6）不是会话
          // 停止——不搁置：记 digest:stopped 重入循环（池空+无 pending 由步骤 3 自然退出）；
          // 非 AbortError 照旧上抛（digest-visibility T-D3 契约零变）。
          if (e?.name === "AbortError") { logEvent("digest:stopped", { pendingN }); continue }
          throw e
        } finally {
          panel._panel?.webview.postMessage({ type: "digest", status: "end", ok, ms: Date.now() - d0 })
        }
        const left = history._pendingAsyncResults?.length ?? 0 // D2 单容器
        logEvent("digest:end", { pendingN: left, ms: Date.now() - d0, ...(upstream ? { upstream: true } : {}) })
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
      // 2026-09-02 code review round2 #2-VS Code 偏差修复）。§9 D-24b：评审池同清。
      // §25 R17：会诊会话同清（abort 子代理——停 = 弃——T-R17c 取消语义）；会诊/飞刀
      // pending 单容器同清（中止清池不注入陈旧结果——四族同池语义——D2）。
      history._asyncSubagents?.clear()
      history._asyncAdvisors?.clear()
      // §25 R17：会诊会话中止清理（核单源——W12 改指；载体读 = history._consultSessions
      // 优先，回落 agent 字段面：核 consult 会话池挂 agent，端侧旧镜像挂 history）。
      {
        const { cleanupConsultSessions } = await import("@thincoder/core/agent-tools/consult.mjs")
        cleanupConsultSessions({ _consultSessions: history?._consultSessions ?? panel?._agent?._consultSessions })
      }
      history._pendingAsyncResults = [] // D2 pending 单容器——中止清容器不注入陈旧结果
    } else {
      // D-S3 ③ 兜底：退出前残余（极端竞态）直注入再退——结果零丢失（AC-S2）
      // D2 pending 单容器：四族残余同点分发注入（W13 起 = 核统一注入器按 role 分发——
      // subagent/advisor/escalate/consult 各族注入器文案各自保留）
      const residual = history._pendingAsyncResults
      if (residual?.length) {
        // W13（2026-09-15）：核统一注入器单源（原端侧 `injectPendingAsync` 适配器随镜像删旧退役）
        // ——consult 族按核 `agent.mjs` 同构分派（§25 D-R17a/b）。动态 import：核链可达 node:sqlite
        //（W8 契约②）。载体稳定化：同一 `{history, _fullHistory}` 对象跨本轮全部残余（核
        // `injectAsyncResult` 的 digest 轮预算按载体键累计——同轮多条累计面保持）。
        const injectCtx = { history, _fullHistory: lines.fullHistory }
        const { injectAsyncResult } = await import("@thincoder/core/agent-tools/subagent.mjs")
        const { injectConsultResult } = await import("@thincoder/core/agent-tools/consult.mjs")
        for (const e of residual.splice(0)) {
          if (e.role === "consult") await injectConsultResult(injectCtx, e)
          else await injectAsyncResult(injectCtx, e)
        }
      }
      // 残余注入落盘（在-memory 双线已改——防会话文件缺最后几条 reminder）
      try { if (lines.fullHistory.length) panel._saveLines(lines.fullHistory, history, {}, entry.turnSlot) } catch { /* non-fatal */ }
    }
    panel._susp = null
    panel._suspWake = null
    // 补发 done 冻结：区全体随会话退出归档落流（WEBVIEW.md §14 C-8——live 折叠、
    // awaitingDigest 归档；abort 同路径——CLI freezeAllSubTasks 中断语义：不留悬空块）。
    // X11：中止事实随载荷（`aborted` = 本 finally 判定——自然退出 false）。
    postSuspensionEnd(panel, { freeze: true, interrupted: aborted })
    panel._refreshStatus?.()
      // 排队输入兜底（2026-09-02 code review round2 #2-VS Code 偏差修复 + INPUT-LOCK 单槽化
      // 2026-09-09）：会话退出时 pendingInput 单槽残余不得静默丢弃——输入框已清空 + 用户气
      // 泡已上屏（webview send.js 先 addUser 再 postMessage——用户视为已发送）。中止路径以
      // 普通回合执行（零丢失 AC-S2——中止清的是后台池与消化轮，不撤销用户已发送的回合请
      // 求——气泡不得无响应悬挂）。面板已死（dispose）→ 无渲染目标，消息随会话终止。
      if (panel._panel) {
        while (susp.pendingInput.length > 0) {
          const q = susp.pendingInput.shift()
          try { await entry.runTurn(q) } catch { /* surfaced by the turn runner */ }
        }
      }
  }
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
 *  C2：先广播 idle（忙态收敛——Stop 派生/路由守卫以 idle 收尾）再发 suspension 终态。
 *  X11（显示面消差批 §2.2）：`interrupted` = 会话中止事实（真值源 = 本驱动 finally 的
 *  `aborted` 判定——与 CLI `subagent-freeze.mjs:220`「未 done ∧ 非 Ready ⇒ interrupted」
 *  同取向）⇒ webview 对**未冻结**块补 `— interrupted` 注记；自然退出 false（不伪造）。 */
function postSuspensionEnd(panel, { freeze, interrupted = false }) {
  panel._publishTurnState?.("idle")
  panel._panel?.webview.postMessage({ type: "suspension", active: false, freeze, interrupted: interrupted === true })
}
