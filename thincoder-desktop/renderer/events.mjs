/**
 * events.mjs — 渲染面事件归约核心（事件通道 → 切片写者**单源** · 批档 §2.2(e) / §2.11⑧ · `docs/desktop/design/IPC.md` §1）：
 * 切片写者的**单源**——主进程只产事件 / 回执，值面落树全在本档；订阅接线面出档 `renderer/events-subscribe.mjs`
 *（二十三通道表 · `attachEvents` · 回合尾窄口携键 —— 300 行拆分层落形）；问题 / 任务切片面出档 `renderer/questions.mjs`、
 * **宿主唤醒面三切片**（挂起 ∕ 消化 ∕ 到期）= **出档 `renderer/events-wake.mjs`**（R5 先拆后改 —— 本档触 500
 * 硬限；三归约体 + 共件 `countOf` 迁入该档，本档引三件分派，无环）；
 * 位标面出档 `renderer/badges.mjs`（桌面残余批拆档产物 —— `clearQuestion` 本档 re-export 保导出名面）；
 * **页读径出档 `renderer/page-read.mjs`**（「对齐第二批」拆分产出 —— 硬限 500 顶格，在册预案本批执行：
 * `applyPage` / `blockOfMessage` 两消费面改引该档 = `renderer/session-wire.mjs` / 测试面；本档不引页读档，无环）；
 * **子 agent 归约径出档 `renderer/subagent-reduce.mjs`**（同批续拆 —— 子 agent 面（`ev:subagent` / `ev:subchunk`）
 * + 池读数两助手纯搬移；本档反向引该档两分派支 + 两助手，无环）；
 * **模式位归约径出档 `renderer/events-flags.mjs`**（输入面板上提批 · §2.4 Q8 ∕ §2.7「裁定②本批承接」——本档 498 行
 * 距 500 硬限余 2，`ev:flags` 归约须先出档：`applyFlags` ∕ `sameRecord` 迁入该档，`ev:flags` 归约体（`onFlags`）随迁；
 * 本档引两件 + re-export 两件保名面，无环）。
 * **状态面归约径出档 `renderer/events-status.mjs`**（R4：两切片先出档 —— 两归约体 + 活动恢复即清清点迁入该档；本档引三件分派 + 前置清点一行，无环）。
 * **块面归约径出档 `renderer/events-blocks.mjs`**（#510 留守拆档 · 2026-09-29：块面归约体五支 + 块面原语四件——
 * 键门 `forActive` / 游标 `clearCursor` / 工具块定位 / 中止扇扫——迁入该档；本档引八名分派 + 原语复用，无环）。
 * **读数与切片归约径出档 `renderer/events-slices.mjs`**（同批：读数槽族 + 目标 / 队列 / 台账切片迁入该档；
 * 本档引五名分派 + `withReading`（回合槽写），无环）。
 * **R5（子代理面）**：增 **`ev:goal` 目标切片**（宿主桥 goal 工具结果时点采样 —— 单源 = 核 `agent.goal`；
 * 值形对齐核卡渲染预期）+ 三处态机接线（函数住 `renderer/subagent-reduce.mjs`，本档只接 —— 零第二实现）：
 * 回合尾 `stopped` ∧ 本键非挂起 ⇒ **本键表复位**（`resetSubBlocks`）· `openSession` 键变 ⇒ 复位新键表 ·
 * `ev:susp` 出窗帧 ⇒ **退出兜底归档**（`freezeAllSubBlocks` —— 住 `events-wake.mjs`）。
 *
 * 导出面（`docs/desktop/design/RENDERER.md` §1.1 事件归约面条 —— 订阅接线一发已拆出同源档）：
 *   `reduce(state, ev, now)`   纯归约（零 DOM / 零 IPC ⇒ 平 node 直测）；无变化 ⇒ **原引用**
 *   `applyFlags(state, key, flags)`  模式位切片写（**纯动作** —— 状态栏对齐批：页读 / 出站回执 / `session:flags`
 *                              回执三径同点；`flags` 非载体 ⇒ 零写）——**re-export 自 `renderer/events-flags.mjs`**
 *   `sameRecord(a, b)`         读数同值判（浅比 —— 页读径与归约面读数槽共用 —— 单一实现零副本）——同上 re-export
 *   `openSession(state, key)`  `activeSession` 写者（置键 / `null` 关页 + 清本键 `done` 位标）
 *   `clearApproval(state, promptId)`  出站成功后摘项（写者表隐含 —— 见 §2.11⑦；调用面 = `renderer/mount-pool.mjs`；**清码判据 = 两族皆清**）
 *   `clearQuestion(state, key)`  提问出场 ⇒ 摘本键项 + 清本键 `approval` 位（两调用面 = 出站 `ok` 真 ∥ `stopped` 终局；
 *                              住 `renderer/questions.mjs`——本档 re-export 保名面）
 *   `isTurnTail(ev)`           回合尾判据**单源**（**三径** = `ev:activity` 无 `fields` 的 `done` / `stopped` ∥ `ev:error` —— `onActivity` / `onError` 与订阅面 `events-subscribe.mjs` 同用）
 *
 * 纪律：块面写（`blocks`）须 `ev.key === state.activeSession`（否则原引用 —— 非活动会话的事件不落本会话流）；
 *   `tabBadges` 任意键可写 · `sessionMeta` / `usage` / 卡面两切片（`questions` / `tasks`）· 挂起 / 消化两切片（`susp` / `digest` —— 空闲唤醒批）· 到期触发切片（`timerNotice` —— timer-wake 阶段 2）按 key 写（切片同键就地替换 · 首写自种 · 零键门 —— 活态切片「切回即见」；
 *   **行痕族例外**：`digest` 轮集随首屏页读五清（存量轮切回即失——未结末轮保），单源 = `docs/desktop/design/RENDERER.md` §1.1 事件归约面条）（§2.2(e) 值面写者表）· 状态行读数槽五（`turns` / `turnStarts` /
 *   `tokens` / `timers` / `lastOutputAt`〔停滞轻显形批 —— 写径 = `reduce` 可见输出通道集单点 + `onActivity` turn 起刻〕）同判（R3a · D17 承载段数据源）· `subBlocks` 按会话键分槽（R3b · D20 —— 归约径住
 *   `renderer/subagent-reduce.mjs`：块面内容回显 = 核件 tail-3 / 展开（「对齐第二批」项 3 收正：原「零内容回显」
 *   口径撤销）；态机单源 = 核 `/rc/subblocks/state.mjs` `subBlocksReduce`）· 池切片 **摘工具行**（`pool.blocks` 不再在册 —— 工具调用面 = 对话流工具卡；折叠头
 *   `running` 读数改源于活动会话在飞子 agent 块数）· `pool.approvals` 无会话键维度（写者 = `ev:approval`，不按会话
 *   分池 —— 设计未给池的会话键口径，缺口随 §5 登记）· `goal` 目标切片（R5 —— 按会话键；写者 = 本档 `ev:goal` 归约）；文案零硬编码（本档不出词）。
 * 活块 / 页块两面差异（决策 D8-8）：页块**不落** `status` / `durationMs`（活块有），键集一致性判据 = 五型闭集。
 */
import { appendBlock } from "./store.mjs"
// 问题 / 任务切片面（桌面残余批拆档产物）：两归约体归 `reduce` 分派；`clearQuestion` 两调用面同源。
import { clearQuestion, onQuestion, onTask } from "./questions.mjs"
export { clearQuestion }
// 位标面单源（同批拆出——`events.mjs` 500 行硬限顶格）；本档 `onApproval` / `onActivity` / `onError` /
// `openSession` / `clearApproval` 与 `renderer/questions.mjs` 同引。
import { badgeStamps, hasPendingFor } from "./badges.mjs"
// 子 agent 归约径（「对齐第二批」续拆产出 —— 子 agent 面两分派支 + 池读数两助手）；本档 `reduce` 分派两通道，
// `withPool` / `openSession` / 待决两族引两助手（单一实现零副本）。
import { liveCount, onSubagent, onSubchunk, poolOf, freezeAllSubBlocks, resetSubBlocks } from "./subagent-reduce.mjs"
// 模式位归约径出档（本批拆分产出 —— 输入面板上提批 §2.4 Q8）：`ev:flags` 归约体 + 两共件居该档；本档引 `onFlags`
// 分派 + `sameRecord`（四读数槽用）并 re-export 两件（名面不变 —— 页读 / 出站两消费面零改）。
import { onFlags } from "./events-flags.mjs"
export { applyFlags, sameRecord } from "./events-flags.mjs"
// 状态面归约径出档（R4 —— 本批拆分产出）：两归约体 + 活动恢复即清清点居该档；本档引三件分派（见 `reduce`）。
import { expireStatusText, onCompress, onStatusText } from "./events-status.mjs"
// 宿主唤醒面三切片归约径出档（R5 —— 先拆后改：本档触 500 硬限；挂起 ∕ 消化 ∕ 到期三归约体 + 共件
// `countOf` 迁入该档；本档引三件分派 —— 无环）。
import { onDigest, onSusp, onTimer } from "./events-wake.mjs"
// 块面归约径出档（#510 留守拆档 · 2026-09-29）：块面五归约体 + 四原语（键门 / 游标 / 扇扫 / 工具块定位）——
// 本档 `reduce` 分派 + `onActivity` ∕ `onError` 复用原语（无环：该档零反向 import）。
import { clearCursor, forActive, onReasoning, onToken, onToolCall, onToolOutput, onToolResult, sweepRunningTools } from "./events-blocks.mjs"
// 读数与切片归约径出档（同批）：读数槽族 + 目标 / 队列 / 台账切片——本档分派 + `onActivity` 复用 `withReading`。
import { onGoal, onLedger, onQueue, onUsage, withReading } from "./events-slices.mjs"

/** 审批池条目键白名单（零新键 —— 消费面 `views/approval.mjs` / `views/activity.mjs` 读取集）。
 *  **对齐第三批增两键**：`owner`（子代理门归属串 —— 核 `opts.owner.label` 原样）/ `diff`（核 `diffInfo` 原样）
 *  —— 载荷不携 ⇒ 键缺席（消费面按缺省零节点落形）。 */
const APPROVAL_KEYS = ["promptId", "shape", "tool", "argsSummary", "changes", "batch", "owner", "diff"]
// ─── 内部读面 ────────────────────────────────────────────────────────────────

/** 停滞轻显形（UI.md §1 本批注「停滞轻显形 · 2026-09-29」项 2 · 语义单源 = `docs/cli/design/TUI.md` §7.7）：
 *  可见输出通道集（重置单点 —— 三类并集：流式 ∕ 工具面 ∕ 子代理面）。 */
const OUTPUT_CHANNELS = new Set([
  "ev:token", "ev:reasoning", "ev:subchunk", "ev:tool-call", "ev:tool-output", "ev:tool-result", "ev:subagent",
])

/** `lastOutputAt` 切片写（按会话键 —— 时间戳切片同 `turnStarts` 判）：键缺 ∕ 非串 ∕ 空串 ⇒ 零写（禁假造）。 */
function withOutputAt(state, key, now) {
  if (typeof key !== "string" || key === "") return state
  return { ...state, lastOutputAt: { ...(state.lastOutputAt ?? {}), [key]: now } }
}

/** 池写（`approvals` 一支 —— `approval` = 待决数；`running` 由子 agent 面写者归（未给 ⇒ 原值））。 */
function withPool(state, { approvals = null, running = null } = {}) {
  const pool = poolOf(state)
  const nextApprovals = approvals ?? pool.approvals
  const nextRunning = running === null ? pool.running : running
  return { ...state, pool: { ...pool, approvals: nextApprovals, approval: nextApprovals.length, running: nextRunning } }
}

// ─── 纯归约（二十二通道 → 切片；`ev:config` = 纯信号窄口不入归约）────────────

/** `ev:approval`——待决项入池（载荷白名单 `APPROVAL_KEYS` + 去 `undefined` ⇒ 零新载荷键；条目另携**起源键**
 *  `item.key = ev.key ?? null` —— 内部簿记，消费面读取集零扩）· `pool.approval` = 待决数 ·
 *  `tabBadges[key] ⊇ {approval}`（位标任意键可写）。同 `promptId` 复现 ⇒ 就地替换（不叠条）。
 *  **不按会话分池**：`pool.approvals` 无会话键维度（不过键门 —— 设计未给池的会话键口径）；位标键源 =
 *  事件 `ev.key`（置 ∥ 清 —— 条目携起源键，见 `clearApproval`）——单源。 */
function onApproval(state, ev) {
  const item = {}
  for (const field of APPROVAL_KEYS) if (ev[field] !== undefined) item[field] = ev[field]
  item.key = ev.key ?? null // 起源键（清位判据源 —— 内部簿记，白名单零改）
  const list = poolOf(state).approvals
  const index = list.findIndex((entry) => entry?.promptId === item.promptId)
  const approvals = index < 0 ? [...list, item] : [...list.slice(0, index), item, ...list.slice(index + 1)]
  const withItem = withPool(state, { approvals })
  const stamps = badgeStamps(withItem.tabBadges ?? {}, ev.key, "approval", true)
  return stamps.changed ? { ...withItem, tabBadges: stamps.badges } : withItem
}

/** 回合尾判据**单源**（三径 = §2.16②/④ + 批 A 修正轮 —— `docs/desktop/design/RENDERER.md` §1.1「回合尾三径」条）：
 *  吃**两通道形**：`ev:activity` ∧ `fields` 键**不在场** ∧ `event ∈ {done, stopped}` ∥ `ev:error`（该通道**单义** = 宿主回合结算
 *  〔错误径〕—— 工具级错误不经本通道 ⇒ 全收）∥ 余 ⇒ 假；值面 `onActivity` / `onError` 与订阅面（回合尾 ⇒ 标题刷新 · 输入区 flush）同用。
 *  判据按**键在场**判（设计字面 = `IPC.md:31`「`fields` 键在场 ⇒ 内联形」）：内联形 `fields` 值可为 `null`（核 ⟦ev⟧ 段无分隔符）或串 ⇒ 零回合尾。 */
export function isTurnTail(ev) {
  const channel = ev?.channel
  if (channel === "ev:error") return true
  if (channel !== "ev:activity" || "fields" in ev) return false
  return ev.event === "done" || ev.event === "stopped"
}

/** 停止痕切片写（「对齐第三批」项 6）：`stopped` 终局 ⇒ `stopMark[key] = true`（运行期痕 —— **非落盘件**，
 *  页读整置即失：清点住 `renderer/page-read.mjs` `applyPage` 首屏径 + **回合起跑门** = `msg:send` 出站即清
 *  （`clearTurnTraces` —— `renderer/store.mjs`；单源 = `docs/desktop/design/RENDERER.md` §1.6 KD-74））；
 *  已在场 ⇒ 原引用（零重绘）；**晚到丢弃闩门**：`stopHold[key]` 闩开（本键回合首帧前——出站置闩窗内）⇒
 *  **只弃痕写**（闩不触其余结算——旧回合尾照常收束；开门摘闩住 `onActivity` turn 支，与 `turnStarts` 起刻同判）。 */
function withStopMark(state, key) {
  if (state.stopHold?.[key] === true) return state // 闩开窗内晚到 stopped ⇒ 痕零写（丢弃——KD-74 ④）
  const table = state.stopMark ?? {}
  if (table[key] === true) return state
  return { ...state, stopMark: { ...table, [key]: true } }
}

/** `ev:activity` 四形（§2.16② 写死）：① `fields` 在场 ⇒ 内联形（核 token 流内 ⟦ev⟧ 段）⇒ **零写零重调**（内联 `done` ⇒ 不清位标）；
 *  ② 无 `fields` ∧ `event === "turn"`（载荷 `{ turn, maxTurns }`）⇒ 置 `running` + **回合槽**（`turns[key] = { n, max }`——D17 段 7，有意取代旧“不落”态）
 *  + **回合起刻**（`turnStarts[key] = now`——仅本键此前非 running 时落，即回合首帧；D17 段 5 耗时源）；
 *  ③ 无 `fields` ∧ `isTurnTail` ⇒ **唯一回合尾**（去 `running` + 置 `done`；`stopped` 兼摘本键提问项 + 清本键 `approval` 位 ——
 *  中断径各门按取消结算 ⇒ 卡随事件面出场；`done` 径不摘 —— `docs/desktop/design/RENDERER.md` §1.1）；
 *  **`turnBreak` 形（「对齐第三批」项 7）** = 宿主接核 `onTurnEnd` 的子回合边界：**清游标**（尾块追加态收束 ⇒
 *  下片文本起新块 —— VSC `streaming.js:71-88` 复位语义）；**非回合尾**（三径判据不含本形）· 键门同块面诸写者；
 *  **`stopped` 兼两事（「对齐第三批」项 5 / 6）**：未结算工具块清扫（`interrupted`）+ 停止痕切片写（任意键 ——
 *  痕面非块面，不设键门）；
 *  **回合尾三径皆兼游标清点**（#459 ① 族 —— 尾块追加态结束 ⇒ 游标不得常驻；**键门同 `onError` / `onToolCall`** ——
 *  块面写须 `ev.key === state.activeSession`：非活动会话的回合尾只落位标，不动本会话块面）。
 *  **回合起不再清终态块**（「对齐第二批」项 5：原「下回合起清出」口径退场 —— 终态块留场为墓碑 + 已入流快照）。 */
function onActivity(state, ev, now) {
  if ("fields" in ev) return state
  // 子回合边界（项 7）：清游标即止 —— 不置位标 / 不动回合槽 / 不判回合尾（键门同块面）
  if (ev.event === "turnBreak") return forActive(state, ev) ? clearCursor(state) : state
  if (!isTurnTail(ev)) {
    if (ev.event !== "turn") return state
    const badges = state.tabBadges ?? {}
    const wasRunning = Array.isArray(badges[ev.key]) && badges[ev.key].includes("running")
    const turnSlot = Number.isInteger(ev.turn) && ev.turn > 0 && Number.isInteger(ev.maxTurns) && ev.maxTurns > 0
      ? withReading(state.turns, ev.key, { n: ev.turn, max: ev.maxTurns })
      : state.turns
    const starts = wasRunning ? state.turnStarts : { ...(state.turnStarts ?? {}), [ev.key]: now }
    // 停滞轻显形（UI.md §1 本批注项 2）：回合起刻 = 静默初始锚（`turnStarts` 邻位同置 —— 仅回合首帧）
    const outputStarts = wasRunning ? state.lastOutputAt : { ...(state.lastOutputAt ?? {}), [ev.key]: now }
    // 丢弃闩开门（行痕族消失时机批 · KD-74）：本键**回合首帧**（= `turnStarts` 起刻同判——此前非 running）⇒ 摘闩——
    // 闩开窗收束于新回合起跑；其后本键 `stopped` 属新回合 ⇒ 痕照写（晚到自愈面）。
    const holds = wasRunning ? state.stopHold : (() => { const next = { ...(state.stopHold ?? {}) }; delete next[ev.key]; return next })()
    const stamps = badgeStamps(badges, ev.key, "running", true)
    if (stamps.changed === false && turnSlot === state.turns && starts === state.turnStarts && outputStarts === state.lastOutputAt && holds === state.stopHold) return state
    return {
      ...state,
      ...(turnSlot === state.turns ? {} : { turns: turnSlot }),
      ...(starts === state.turnStarts ? {} : { turnStarts: starts }),
      ...(outputStarts === state.lastOutputAt ? {} : { lastOutputAt: outputStarts }),
      ...(holds === state.stopHold ? {} : { stopHold: holds }),
      ...(stamps.changed ? { tabBadges: stamps.badges } : {}),
    }
  }
  const tail = ev.event === "stopped" ? clearQuestion(state, ev.key) : state
  // R5（#522①）：会话中止 ⇒ **本键表复位**（VSC `streaming.js:156` 同义 —— `aborted && !suspended`）：
  // 回合尾 `stopped` ∧ 本键非挂起（挂起窗内回合尾不动池 —— children 持会话信号）⇒ 池子随回合死。
  const reset = ev.event === "stopped" && state.susp?.[ev.key]?.active !== true ? resetSubBlocks(tail, ev.key) : tail
  const swept = ev.event === "stopped" && forActive(state, ev) ? sweepRunningTools(reset) : reset
  const cursor = forActive(state, ev) ? clearCursor(swept) : swept
  const marked0 = ev.event === "stopped" ? withStopMark(cursor, ev.key) : cursor
  const cleared = badgeStamps(marked0.tabBadges ?? {}, ev.key, "running", false)
  const marked = badgeStamps(cleared.badges, ev.key, "done", true)
  if (marked0 === state && !cleared.changed && !marked.changed) return state
  return { ...marked0, tabBadges: marked.badges }
}

/** `ev:error`——错误块入流（文本 = 载荷 `text` 原样；无槽位自造）+ **错误径 = 回合结算**（三径同判据 —— `docs/desktop/design/RENDERER.md` §1.1）：
 *  本键 `running` 清 + 位落 `done`（错误终局后输入区不再判忙 · 队首可 flush —— `ok` 假 ∥ 抛 ⇒ 留队 + 下次回合尾重触发）+ **游标清点**（错误径 ∈ 三径）；位标键源 = `ev.key`（任意键可写），块面仍守键门。 */
function onError(state, ev) {
  // 「对齐第三批」项 9：载荷扩 `techInfo`（宿主 `err.stack`）—— 在场才落块键（缺 ⇒ 键缺席）；`details` 面归视图面
  const block = { kind: "error", text: ev.text }
  if (typeof ev.techInfo === "string" && ev.techInfo !== "") block.techInfo = ev.techInfo
  const blocks = forActive(state, ev) ? clearCursor(appendBlock(state, block)) : state
  const cleared = badgeStamps(blocks.tabBadges ?? {}, ev.key, "running", false)
  const marked = badgeStamps(cleared.badges, ev.key, "done", true)
  if (!cleared.changed && !marked.changed) return blocks
  return { ...blocks, tabBadges: marked.badges }
}

/** 纯归约出口：`ev` = `{ channel, ...载荷 }`（载荷携 `key`）。未知通道 / 形不合 ⇒ 原引用（逐通道一写者 —— 含 `ev:queue`）。 */
export function reduce(state, ev, now = Date.now()) {
  const channel = typeof ev?.channel === "string" ? ev.channel : null
  if (channel === null) return state
  // 活动恢复即清（statusText —— VSC 同清单七时点；判据单源 = `events-status.mjs` `expireStatusText` + 本档 `isTurnTail`）
  state = expireStatusText(state, channel, ev, isTurnTail(ev))
  // 停滞轻显形（UI.md §1 本批注项 2）：可见输出通道集 ⇒ `lastOutputAt[<会话键>]` 置现刻（重置单点 ——
  // 逐事件恒变：「无变化 ⇒ 原引用」对时间戳切片自然不适用）。
  if (OUTPUT_CHANNELS.has(channel)) state = withOutputAt(state, ev.key, now)
  switch (channel) {
    case "ev:token": return onToken(state, ev)
    case "ev:reasoning": return onReasoning(state, ev)
    case "ev:subchunk": return onSubchunk(state, ev, now)
    case "ev:tool-call": return onToolCall(state, ev, now)
    case "ev:tool-output": return onToolOutput(state, ev)
    case "ev:tool-result": return onToolResult(state, ev, now)
    case "ev:approval": return onApproval(state, ev)
    case "ev:activity": return onActivity(state, ev, now)
    case "ev:error": return onError(state, ev)
    case "ev:question": return onQuestion(state, ev)
    case "ev:task": return onTask(state, ev)
    case "ev:susp": return onSusp(state, ev, now)
    case "ev:digest": return onDigest(state, ev)
    case "ev:timer": return onTimer(state, ev)
    case "ev:queue": return onQueue(state, ev)
    case "ev:usage": return onUsage(state, ev)
    case "ev:ledger": return onLedger(state, ev)
    case "ev:subagent": return onSubagent(state, ev, now)
    // 目标面切片（R5 —— 产点 = 宿主桥 goal 工具结果时点采样；表外状态 ⇒ 零写）
    case "ev:goal": return onGoal(state, ev)
    // 模式位推送（本批承接 —— 归约体出档 `renderer/events-flags.mjs`；三径同点写之一）
    case "ev:flags": return onFlags(state, ev)
    case "ev:statusText": return onStatusText(state, ev)
    case "ev:compress": return onCompress(state, ev)
    default: return state
  }
}

// ─── 会话键写者（`activeSession`）──────────────────────────────────────────

/** 开页 / 关页（§2.2(e) 值面写者行）：置 `activeSession` + 清本键 `done` 位标（激活即已读）+ **折叠头 `running` 读数
 *  随活动键重算**（R3b：读数 = 本键在飞块数 —— 头（读数）与体（族）单源；键空 ⇒ 0；同值 ⇒ 池引用不动）。
 *  **不清** `blocks` / `history`（页数据随 `history:page` 回执整置）。 */
export function openSession(state, key) {
  const next = key == null ? null : String(key)
  const cleared = next === null ? { badges: state.tabBadges ?? {}, changed: false } : badgeStamps(state.tabBadges ?? {}, next, "done", false)
  if (next === state.activeSession && !cleared.changed) return state
  // R5（#522① · 清屏径）：键变 ⇒ **复位新键表**（VSC `clearMessages` ⇒ `resetActivity` 同义 —— `chat-messages.js:120`）：
  // 历史会话重现不留旧代行账（活块由 2s 存活投影自愈重投）；同键重开（零键变）不复位。
  const swapped = next !== null && next !== state.activeSession ? resetSubBlocks(state, next) : state
  const base = cleared.changed
    ? { ...swapped, activeSession: next, tabBadges: cleared.badges }
    : { ...swapped, activeSession: next }
  const running = liveCount(next === null ? [] : swapped.subBlocks?.[next])
  const pool = poolOf(swapped)
  return pool.running === running ? base : { ...base, pool: { ...pool, running } }
}

/** 出站回执**成功** ⇒ 摘项（§2.11⑦：失败零摘除 —— 调用面以回执 `ok === true` 为唯一判据，禁乐观摘除）：
 *  `pool.approval` 随摘项重算；**清位按条目起源键** —— 被摘条目的起源键在**剩余两族**（审批池起源键 ∥ 提问切片）皆无项
 *  ⇒ 清该键位标（有项才亮 ∥ 跨会话零误清 ∥ **跨族零误清** —— #780 共享判据，两清径同引 `renderer/badges.mjs`；
 *  与置位标源同源 = `ev.key`——见 `onApproval` 注）。
 *  未命中 `promptId` ⇒ 原引用（幂等 —— 重复回执不二次摘除）。 */
export function clearApproval(state, promptId) {
  const approvals = poolOf(state).approvals
  const hit = approvals.find((entry) => entry?.promptId === promptId)
  if (hit === undefined) return state
  const remaining = approvals.filter((entry) => entry !== hit)
  const next = withPool(state, { approvals: remaining })
  const key = hit.key ?? null
  if (key === null) return next // 无起源键 ⇒ 零位标写（保位）
  if (hasPendingFor(next, key)) return next // 本键任一族尚有项 ⇒ 零位标写（#780：清码 = 两族皆清）
  const cleared = badgeStamps(next.tabBadges ?? {}, key, "approval", false)
  return cleared.changed ? { ...next, tabBadges: cleared.badges } : next
}
