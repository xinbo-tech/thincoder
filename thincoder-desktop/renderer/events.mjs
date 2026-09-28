/**
 * events.mjs — 渲染面事件归约核心（事件通道 → 切片写者**单源** · 批档 §2.2(e) / §2.11⑧ · `docs/desktop/design/IPC.md` §1）：
 * 切片写者的**单源**——主进程只产事件 / 回执，值面落树全在本档；订阅接线面出档 `renderer/events-subscribe.mjs`
 *（二十三通道表 · `attachEvents` · 回合尾窄口携键 —— 300 行拆分层落形）；问题 / 任务切片面出档 `renderer/questions.mjs`、
 * **宿主唤醒面三切片**（挂起 ∕ 消化 ∕ 到期）= **出档 `renderer/events-wake.mjs`**（R5 先拆后改 —— 本档触 500
 * 硬限；三归约体 + 共件 `countOf` 迁入该档，本档引三件分派，无环）；
 * 位标面出档 `renderer/badges.mjs`（桌面残余批拆档产物 —— `clearQuestion` 本档 re-export 保导出名面）；
 * **页读径出档 `renderer/page-read.mjs`**（「对齐第二批」拆分产出 —— 硬限 500 顶格，在册预案本批执行：
 * `applyPage` / `blockOfMessage` 两消费面改引该档 = `renderer/mount-sessions.mjs` / 测试面；本档不引页读档，无环）；
 * **子 agent 归约径出档 `renderer/subagent-reduce.mjs`**（同批续拆 —— 子 agent 面（`ev:subagent` / `ev:subchunk`）
 * + 池读数两助手纯搬移；本档反向引该档两分派支 + 两助手，无环）；
 * **模式位归约径出档 `renderer/events-flags.mjs`**（输入面板上提批 · §2.4 Q8 ∕ §2.7「裁定②本批承接」——本档 498 行
 * 距 500 硬限余 2，`ev:flags` 归约须先出档：`applyFlags` ∕ `sameRecord` 迁入该档，`ev:flags` 归约体（`onFlags`）随迁；
 * 本档引两件 + re-export 两件保名面，无环）。
 * **状态面归约径出档 `renderer/events-status.mjs`**（R4：两切片先出档 —— 两归约体 + 活动恢复即清清点迁入该档；本档引三件分派 + 前置清点一行，无环）。
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
 *   `clearApproval(state, promptId)`  出站成功后摘项（写者表隐含 —— 见 §2.11⑦；调用面 = `renderer/mount-pool.mjs`）
 *   `clearQuestion(state, key)`  提问出场 ⇒ 摘本键项 + 清本键 `approval` 位（两调用面 = 出站 `ok` 真 ∥ `stopped` 终局；
 *                              住 `renderer/questions.mjs`——本档 re-export 保名面）
 *   `isTurnTail(ev)`           回合尾判据**单源**（**三径** = `ev:activity` 无 `fields` 的 `done` / `stopped` ∥ `ev:error` —— `onActivity` / `onError` 与订阅面 `events-subscribe.mjs` 同用）
 *
 * 纪律：块面写（`blocks`）须 `ev.key === state.activeSession`（否则原引用 —— 非活动会话的事件不落本会话流）；
 *   `tabBadges` 任意键可写 · `sessionMeta` / `usage` / 卡面两切片（`questions` / `tasks`）· 挂起 / 消化两切片（`susp` / `digest` —— 空闲唤醒批）· 到期触发切片（`timerNotice` —— timer-wake 阶段 2）按 key 写（切片同键就地替换 · 首写自种 · 零键门 —— 切回即见，单源 = `docs/desktop/design/RENDERER.md` §1.1 事件归约面条）（§2.2(e) 值面写者表）· 状态行读数槽四（`turns` / `turnStarts` /
 *   `tokens` / `timers`）同判（R3a · D17 承载段数据源）· `subBlocks` 按会话键分槽（R3b · D20 —— 归约径住
 *   `renderer/subagent-reduce.mjs`：块面内容回显 = 核件 tail-3 / 展开（「对齐第二批」项 3 收正：原「零内容回显」
 *   口径撤销）；态机单源 = 核 `/rc/subblocks/state.mjs` `subBlocksReduce`）· 池切片 **摘工具行**（`pool.blocks` 不再在册 —— 工具调用面 = 对话流工具卡；折叠头
 *   `running` 读数改源于活动会话在飞子 agent 块数）· `pool.approvals` 无会话键维度（写者 = `ev:approval`，不按会话
 *   分池 —— 设计未给池的会话键口径，缺口随 §5 登记）· `goal` 目标切片（R5 —— 按会话键；写者 = 本档 `ev:goal` 归约）；文案零硬编码（本档不出词）。
 * 活块 / 页块两面差异（决策 D8-8）：页块**不落** `status` / `durationMs`（活块有），键集一致性判据 = 五型闭集。
 */
import { appendBlock, returnToBottom, setAttachDegraded } from "./store.mjs"
// 排队镜面（「回合中插入」批 —— 快照整置纯动作；本档 = 写者之一，另一写者 = `renderer/page-read.mjs` 首屏重建）。
import { applyQueue } from "./queue.mjs"
// 问题 / 任务切片面（桌面残余批拆档产物）：两归约体归 `reduce` 分派；`clearQuestion` 两调用面同源。
import { clearQuestion, onQuestion, onTask } from "./questions.mjs"
export { clearQuestion }
// 位标面单源（同批拆出——`events.mjs` 500 行硬限顶格）；本档 `onApproval` / `onActivity` / `onError` /
// `openSession` / `clearApproval` 与 `renderer/questions.mjs` 同引。
import { badgeStamps } from "./badges.mjs"
// 子 agent 归约径（「对齐第二批」续拆产出 —— 子 agent 面两分派支 + 池读数两助手）；本档 `reduce` 分派两通道，
// `withPool` / `openSession` / 待决两族引两助手（单一实现零副本）。
import { liveCount, onSubagent, onSubchunk, poolOf, freezeAllSubBlocks, resetSubBlocks } from "./subagent-reduce.mjs"
// 模式位归约径出档（本批拆分产出 —— 输入面板上提批 §2.4 Q8）：`ev:flags` 归约体 + 两共件居该档；本档引 `onFlags`
// 分派 + `sameRecord`（四读数槽用）并 re-export 两件（名面不变 —— 页读 / 出站两消费面零改）。
import { onFlags, sameRecord } from "./events-flags.mjs"
export { applyFlags, sameRecord } from "./events-flags.mjs"
// 状态面归约径出档（R4 —— 本批拆分产出）：两归约体 + 活动恢复即清清点居该档；本档引三件分派（见 `reduce`）。
import { expireStatusText, onCompress, onStatusText } from "./events-status.mjs"
// 宿主唤醒面三切片归约径出档（R5 —— 先拆后改：本档触 500 硬限；挂起 ∕ 消化 ∕ 到期三归约体 + 共件
// `countOf` 迁入该档；本档引三件分派 —— 无环）。
import { onDigest, onSusp, onTimer } from "./events-wake.mjs"

/** 活流块 id 派生前缀（页块 id 域 = 核给（工具 id）/ 缺省无 —— 两域不混）。 */
const LIVE_ID = "live-"
/** 审批池条目键白名单（零新键 —— 消费面 `views/approval.mjs` / `views/activity.mjs` 读取集）。
 *  **对齐第三批增两键**：`owner`（子代理门归属串 —— 核 `opts.owner.label` 原样）/ `diff`（核 `diffInfo` 原样）
 *  —— 载荷不携 ⇒ 键缺席（消费面按缺省零节点落形）。 */
const APPROVAL_KEYS = ["promptId", "shape", "tool", "argsSummary", "changes", "batch", "owner", "diff"]
// ─── 内部读面 ────────────────────────────────────────────────────────────────

/** 池写（`approvals` 一支 —— `approval` = 待决数；`running` 由子 agent 面写者归（未给 ⇒ 原值））。 */
function withPool(state, { approvals = null, running = null } = {}) {
  const pool = poolOf(state)
  const nextApprovals = approvals ?? pool.approvals
  const nextRunning = running === null ? pool.running : running
  return { ...state, pool: { ...pool, approvals: nextApprovals, approval: nextApprovals.length, running: nextRunning } }
}

/** 键过滤（块 / 池写者面）：非活动会话的事件 ⇒ 调用面原引用。 */
function forActive(state, ev) {
  return ev.key === state.activeSession
}

/** 尾块定位（同 `id` 活块；`id === undefined` ⇒ 只认尾块 —— 无 id 事件不外扩）。 */
function indexOfTool(blocks, id) {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index]
    if (block?.kind === "tool" && (id === undefined || block.id === id)) return index
  }
  return -1
}

/** 流式游标清点（#459 · KD-24 · `renderer/views/chat.mjs` 游标语义 = **末块追加态**）：命中带 `streaming` 真项者换
 *  **新块对象**（去游标 —— 位序与其余块引用不动）；无命中 ⇒ **原引用**（零通知）。清点须落块面引用 = 唯一刷新径（`blocks` 键变 ⇒ 帧触发 ⇒ 摘 `data-streaming` 锚）。 */
function clearCursor(state) {
  const list = Array.isArray(state.blocks) ? state.blocks : []
  let hit = false
  const next = list.map((block) => {
    if (block?.streaming !== true) return block
    hit = true
    return { ...block, streaming: false }
  })
  return hit ? { ...state, blocks: next } : state
}

// ─── 纯归约（二十二通道 → 切片；`ev:config` = 纯信号窄口不入归约）────────────

/** `ev:reasoning`——推理块增量（R3c · D19 · `docs/desktop/design/IPC.md` §1 该行）：续写判据 = **尾块 `kind === "reasoning"`**（与正文同形）；
 *  否则起新推理块；键门同 `onToken`（非活动会话零落）。 */
function onReasoning(state, ev) {
  if (!forActive(state, ev)) return state
  const text = typeof ev.text === "string" ? ev.text : ""
  if (text === "") return state
  const blocks = state.blocks ?? []
  const tail = blocks[blocks.length - 1]
  if (!tail || tail.kind !== "reasoning") return appendBlock(state, { kind: "reasoning", id: `${LIVE_ID}${blocks.length}`, text })
  const head = typeof tail.text === "string" ? tail.text : ""
  return { ...state, blocks: [...blocks.slice(0, -1), { ...tail, text: head + text }] }
}

/** `ev:token`——助手尾块续写（判据 = 尾块 `kind === "assistant"` ∧ `streaming === true`）；否则起活块。
 *  新块经 `appendBlock`（停跟期间只累 `pendingNew` —— `store.mjs` 纯动作，跨切片语义同源）。 */
function onToken(state, ev) {
  if (!forActive(state, ev)) return state
  const text = typeof ev.text === "string" ? ev.text : ""
  if (text === "") return state
  const blocks = state.blocks ?? []
  const tail = blocks[blocks.length - 1]
  if (tail && tail.kind === "assistant" && tail.streaming === true) {
    return { ...state, blocks: [...blocks.slice(0, -1), { ...tail, text: tail.text + text }] }
  }
  return appendBlock(state, { kind: "assistant", id: `${LIVE_ID}${blocks.length}`, text, streaming: true })
}

/** `ev:tool-call`——工具块入（活块形：`{kind,id,name,argsSummary,status,startedAt}`）；**段界游标清点**（#459 ② 族：入场 ⇒ 前序
 *  助手文本段收束 —— 清点先于追加，两事不同块）。**R3b 摘工具行**：不再写池条目（工具调用面 = 对话流工具卡）。
 *  **「对齐第三批」项 14 载波**：载荷 `round` / `model`（仅 `advisor` 名）在场才落块键（缺 ⇒ 键缺席 —— 禁假造）；
 *  段文成形归视图面（`renderer/views/chat-tool.mjs`）。 */
function onToolCall(state, ev, now) {
  if (!forActive(state, ev)) return state
  const block = { kind: "tool", id: ev.id, name: ev.name, argsSummary: ev.argsSummary, status: "running", startedAt: now }
  if (typeof ev.round === "number" && Number.isFinite(ev.round) && ev.round > 0) block.round = ev.round
  if (typeof ev.model === "string" && ev.model !== "") block.model = ev.model
  return appendBlock(clearCursor(state), block)
}

/** `ev:tool-output`——结果文本累积入该工具块 `result`（无匹配块 ⇒ 零写）。
 *  **「对齐第三批」项 3**：chunk 到达 ⇒ **清显式折叠旗**（`expanded` 键摘除 —— 运行期展开由增量驱动，与 VSC 同径；
 *  体落判据归视图面 `isExpanded`：显式旗 ∨ `running` / `error` 缺省展开）。 */
function onToolOutput(state, ev) {
  if (!forActive(state, ev)) return state
  const blocks = state.blocks ?? []
  const index = indexOfTool(blocks, ev.id)
  if (index < 0) return state
  const chunk = typeof ev.chunk === "string" ? ev.chunk : ""
  if (chunk === "") return state
  const block = blocks[index]
  const result = typeof block.result === "string" ? block.result + chunk : chunk
  const next = { ...block, result }
  delete next.expanded
  return { ...state, blocks: [...blocks.slice(0, index), next, ...blocks.slice(index + 1)] }
}

/** `ev:tool-result`——按 `id` 定位后**重建**（`status` 收束 · `durationMs` = 现刻 − 起刻 · 丢 `startedAt`）；
 *  `status` 由载荷 `ok` 定（`ok === true` ⇒ `done`，否则 `error`）——判据串归宿主侧单源
 *  （`docs/desktop/design/IPC.md:34` 载荷定形 · 批档 §2.16⑪：本端不另立判据、不解析正文）；载荷缺该键 ⇒ 不判成功。 */
function onToolResult(state, ev, now) {
  if (!forActive(state, ev)) return state
  const blocks = state.blocks ?? []
  const index = indexOfTool(blocks, ev.id)
  if (index < 0) return state
  const block = blocks[index]
  const result = ev.result ?? null
  const ok = ev.ok === true
  const settled = {
    kind: "tool", id: block.id, name: block.name, argsSummary: block.argsSummary,
    status: ok ? "done" : "error", durationMs: now - (block.startedAt ?? now), result,
  }
  // 「对齐第三批」项 14：轮次载波**过收束**（`round` / `model` 原样承接 —— 收束 = 同块换态非重建；
  //   丢两键 ⇒ 具名 advisor 卡头轮次段在结果到达后消失）；只承接在块键（缺 ⇒ 仍缺席 —— 禁假造）
  if (block.round !== undefined) settled.round = block.round
  if (block.model !== undefined) settled.model = block.model
  // 「对齐第三批」相抵② 载波：验存文件链接非空行集才落（缺 / 空 ⇒ 键缺席 —— 禁假造）；着装 / 出口归视图面
  if (Array.isArray(ev.links) && ev.links.length > 0) settled.links = ev.links
  const next = { ...state, blocks: [...blocks.slice(0, index), settled, ...blocks.slice(index + 1)] }
  return next // R3b 摘工具行：池条目随动面已摘（工具调用面 = 对话流工具卡）
}

/** `ev:approval`——待决项入池（键白名单 + 去 `undefined` ⇒ 零新键）· `pool.approval` = 待决数 ·
 *  `tabBadges[key] ⊇ {approval}`（位标任意键可写）。同 `promptId` 复现 ⇒ 就地替换（不叠条）。
 *  **不按会话分池**：`pool.approvals` 无会话键维度（不过键门 —— 设计未给池的会话键口径）；位标键源 =
 *  事件 `ev.key`（置）/ `activeSession`（清，见 `clearApproval`）——两源不一处，缺口随 §5 登记。 */
function onApproval(state, ev) {
  const item = {}
  for (const field of APPROVAL_KEYS) if (ev[field] !== undefined) item[field] = ev[field]
  const list = poolOf(state).approvals
  const index = list.findIndex((entry) => entry?.promptId === item.promptId)
  const approvals = index < 0 ? [...list, item] : [...list.slice(0, index), item, ...list.slice(index + 1)]
  const withItem = withPool(state, { approvals })
  const stamps = badgeStamps(withItem.tabBadges ?? {}, ev.key, "approval", true)
  return stamps.changed ? { ...withItem, tabBadges: stamps.badges } : withItem
}

/** 读数槽写（R3a 状态行读数槽通用形）：`value` 非 `null` ⇒ 首写自种 / 同键同值原引用 / 否就地替换；`value === null` ⇒ **清本键**（载荷缺省 / 形非法 ⇒ 该段零节点 —— `docs/desktop/design/IPC.md` §1「两键缺省 ⇒ 零节点」，禁假造）。 */
function withReading(table, key, value) {
  const source = table ?? {}
  const has = Object.hasOwn(source, key)
  if (value === null) {
    if (!has) return table
    const next = { ...source }
    delete next[key]
    return next
  }
  if (has && sameRecord(source[key], value)) return table
  return { ...source, [key]: value }
}

/** 令牌读数归一（载荷扩 `tokens` —— 五键数值；非载体 / 缺省 ⇒ `null`（清槽 ⇒ 零节点）；非数归一 0（核 `?? 0` 同形））。 */
function tokenReading(value) {
  if (value === null || typeof value !== "object") return null
  const num = (raw) => (typeof raw === "number" && Number.isFinite(raw) ? raw : 0)
  return {
    prompt: num(value.prompt), completion: num(value.completion), reasoningTokens: num(value.reasoningTokens),
    cacheHit: num(value.cacheHit), cacheMiss: num(value.cacheMiss),
  }
}

/** 计时读数归一（载荷扩 `timers` —— `{ count, expired }`；`count` 非数 ⇒ `null`；`expired` 缺 / 非数 ⇒ 0）。 */
function timerReading(value) {
  if (value === null || typeof value !== "object") return null
  if (typeof value.count !== "number" || !Number.isFinite(value.count)) return null
  const expired = typeof value.expired === "number" && Number.isFinite(value.expired) ? value.expired : 0
  return { count: value.count, expired }
}

/** `ev:usage`——本会话读数面（按 `key` 写切片 · 同键就地替换 · 首写自种 · **零键门** —— 与 `sessionMeta` 同形；读面单源 = `docs/desktop/design/UI.md` §1 状态栏行）。
 *  三槽同笔：`usage[key]` = 占用读数（**有效读数门** = 数字 ∧ `> 0`——`IPC.md` §1：有效读数⇒发 · 否则不发；未至 / 零 / 负 / 非数 ⇒ **原引用**，禁假造）· `tokens[key]` / `timers[key]` = 载荷扩两键（R3a · 状态行令牌 / 计时段——缺省 ⇒ 清槽；非数归一 / 非正 ⇒ 显示面零节点）。
 *  读数域 0–100 整数由核 `historyPercent` 直传 ⇒ 本档**零重算 · 零上界判**；三槽皆同值 ⇒ 原引用（同值重发零重绘）。 */
function onUsage(state, ev) {
  const percent = ev.percent
  if (typeof percent !== "number" || !(percent > 0)) return state
  const usage = state.usage?.[ev.key] === percent ? state.usage : { ...(state.usage ?? {}), [ev.key]: percent }
  const tokens = withReading(state.tokens, ev.key, tokenReading(ev.tokens))
  const timers = withReading(state.timers, ev.key, timerReading(ev.timers))
  if (usage === state.usage && tokens === state.tokens && timers === state.timers) return state
  return {
    ...state,
    ...(usage === state.usage ? {} : { usage }),
    ...(tokens === state.tokens ? {} : { tokens }),
    ...(timers === state.timers ? {} : { timers }),
  }
}

/** `ev:goal`——目标面切片（R5 · B10；按会话键 · 同键就地替换 · 首写自种）：载荷 = 宿主桥按核 `agent.goal`
 *  单源投影（`{ status, objective, criteria }` —— 值形对齐核卡 `cards/panel.mjs` 渲染预期）。`status` 闭集 =
 *  VSC 产点四支（`active` / `done` / `blocked` / `cancelled`）——表外 ⇒ **零写**（禁假造）；同键同值 ⇒
 *  **原引用**（零重绘）。消费 = 目标卡（`renderer/views/goal.mjs`）∥ 状态行 🎯 非段位元素（`statusline.mjs`）。 */
function onGoal(state, ev) {
  const status = typeof ev?.status === "string" && GOAL_STATUS.includes(ev.status) ? ev.status : null
  if (status === null || typeof ev.key !== "string" || ev.key === "") return state
  const text = (value) => (typeof value === "string" && value !== "" ? value : null)
  const record = { status, objective: text(ev.objective), criteria: text(ev.criteria) }
  const table = state.goal ?? {}
  if (sameRecord(table[ev.key], record)) return state
  return { ...state, goal: { ...table, [ev.key]: record } }
}

/** 目标状态闭集（单源 = 核 `agent-tools/goal.mjs` 状态词经宿主桥投影：`active` / `complete⇒done` /
 *  `blocked` / 缺席⇒`cancelled`；表外 ⇒ 零写）。 */
const GOAL_STATUS = Object.freeze(["active", "done", "blocked", "cancelled"])

/** `ev:queue` —— 排队面镜面两形（「回合中插入」批 · 单源 = `docs/desktop/design/PROJECT.md` §2 KD-40 ④）：
 *  ① **状态形**（`{ key, items }`）⇒ 本键镜面整置（快照整置 · 幂等 —— 权威 = 宿主，渲染面零本地队）；
 *  ② **消费回执形**（+ `delivered`）⇒ 镜面整置 ∧ 降级码切片随动（在场 ⇒ 置位 ∕ 缺 ⇒ 清）∧ **用户块入流**
 *  （键门 = 活动会话；块形与回放同形 · 文本 = `delivered.text` 逐字）∧ **并笔回底**（直发 ∕ 回执两径同判）——
 *  **消费前流内零块**（收正轮 B12 新口径：待发送件住输入区带，消费时刻才入流 ⇒ 本径恒追加恰一枚）。
 *  非串 `key` / 非数组 `items` ⇒ 原引用（形不合零写）；空快照（消费殆尽 ∕ 会话中止清队）⇒ 镜面落空。 */
function onQueue(state, ev) {
  const key = typeof ev.key === "string" && ev.key !== "" ? ev.key : null
  if (key === null || !Array.isArray(ev.items)) return state
  const delivered = ev.delivered !== null && typeof ev.delivered === "object" ? ev.delivered : null
  const mirror = applyQueue(state, key, ev.items)
  if (delivered === null) return mirror
  const withCode = setAttachDegraded(mirror, key, delivered.degraded)
  const text = typeof delivered.text === "string" ? delivered.text : ""
  if (text === "" || key !== withCode.activeSession) return withCode
  const block = { kind: "user", text }
  if (typeof delivered.ts === "number" && Number.isFinite(delivered.ts)) block.ts = delivered.ts
  return returnToBottom(appendBlock(withCode, block))
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

/** 中止清扫（「对齐第三批」项 5）：`stopped` 终局 ⇒ 未结算工具块（`status === "running"`）就地改
 *  `status: "interrupted"`（体 / 折叠态不动 —— VSC 同；**已中断** = 状态词闭枚举增词（7 ⇒ 8 词——单源 = `docs/desktop/design/UI.md` §1），词键 `tool.interrupted`）；
 *  命中才换新数组（无命中 ⇒ 原引用）。 */
function sweepRunningTools(state) {
  const list = Array.isArray(state.blocks) ? state.blocks : []
  let hit = false
  const next = list.map((block) => {
    if (block?.kind !== "tool" || block.status !== "running") return block
    hit = true
    return { ...block, status: "interrupted" }
  })
  return hit ? { ...state, blocks: next } : state
}

/** 停止痕切片写（「对齐第三批」项 6）：`stopped` 终局 ⇒ `stopMark[key] = true`（运行期痕 —— **非落盘件**，
 *  页读整置即失：清点住 `renderer/page-read.mjs` `applyPage` 首屏径）；已在场 ⇒ 原引用（零重绘）。 */
function withStopMark(state, key) {
  const table = state.stopMark ?? {}
  if (table[key] === true) return state
  return { ...state, stopMark: { ...table, [key]: true } }
}

/** `ev:activity` 四形（§2.16② 写死）：① `fields` 在场 ⇒ 内联形（核 token 流内 ⟦ev⟧ 段）⇒ **零写零重调**（内联 `done` ⇒ 不清位标）；
 *  ② 无 `fields` ∧ `event === "turn"`（`{ n, max }`）⇒ 置 `running` + **回合槽**（`turns[key] = { n, max }`——D17 段 7，有意取代旧“不落”态）
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
    const turnSlot = Number.isInteger(ev.n) && ev.n > 0 && Number.isInteger(ev.max) && ev.max > 0
      ? withReading(state.turns, ev.key, { n: ev.n, max: ev.max })
      : state.turns
    const starts = wasRunning ? state.turnStarts : { ...(state.turnStarts ?? {}), [ev.key]: now }
    const stamps = badgeStamps(badges, ev.key, "running", true)
    if (stamps.changed === false && turnSlot === state.turns && starts === state.turnStarts) return state
    return {
      ...state,
      ...(turnSlot === state.turns ? {} : { turns: turnSlot }),
      ...(starts === state.turnStarts ? {} : { turnStarts: starts }),
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

/** `ev:error`——错误块入流（文本 = 载荷 `message` 原样；无槽位自造）+ **错误径 = 回合结算**（三径同判据 —— `docs/desktop/design/RENDERER.md` §1.1）：
 *  本键 `running` 清 + 位落 `done`（错误终局后输入区不再判忙 · 队首可 flush —— `ok` 假 ∥ 抛 ⇒ 留队 + 下次回合尾重触发）+ **游标清点**（错误径 ∈ 三径）；位标键源 = `ev.key`（任意键可写），块面仍守键门。 */
function onError(state, ev) {
  // 「对齐第三批」项 9：载荷扩 `techInfo`（宿主 `err.stack`）—— 在场才落块键（缺 ⇒ 键缺席）；`details` 面归视图面
  const block = { kind: "error", text: ev.message }
  if (typeof ev.techInfo === "string" && ev.techInfo !== "") block.techInfo = ev.techInfo
  const blocks = forActive(state, ev) ? clearCursor(appendBlock(state, block)) : state
  const cleared = badgeStamps(blocks.tabBadges ?? {}, ev.key, "running", false)
  const marked = badgeStamps(cleared.badges, ev.key, "done", true)
  if (!cleared.changed && !marked.changed) return blocks
  return { ...blocks, tabBadges: marked.badges }
}

/** `ev:ledger`——台账两切片（「对齐第三批」项 12 · KD-38；**R8 增 `detailLines`**）：载荷 `{ key, lines?, detailLines? }`——
 *  `lines` = 核行产逐字 `{ text, warn }`（端侧零行构造）；行集过滤后非空才写（行文本非串 / 空 ⇒ 该行弃；空集 ⇒ 零写——禁假造）；
 *  同值（文本逐字 + `warn` 真值同）⇒ 原引用（零重绘）。`detailLines`（R8 · L2 明细行——状态行台账段 `title` 载波）= 核
 *  `detailScans` ∕ `formatDetailLine` 行集逐字（端零行构造）；**顶层切片 `ledgerDetail`**（项目级——与状态行台账段同锚，
 *  不按会话键）；空集照写（清 tooltip——禁假造）；同值 ⇒ 原引用。两键皆无 ⇒ 原引用。
 *  消费 = 流尾非块节点组 `[data-ledger-line]`（`renderer/views/chat.mjs`）+ 状态行台账段 tooltip（`views/statusline-segments.mjs`）；
 *  周期刷新（VSC `REFRESH_MS`）= R8 落（核拍面 —— `src/main/project-info.mjs`）。 */
function onLedger(state, ev) {
  const lines = (Array.isArray(ev.lines) ? ev.lines : [])
    .filter((line) => typeof line?.text === "string" && line.text !== "")
    .map((line) => ({ text: line.text, warn: line.warn === true }))
  const detailLines = Array.isArray(ev.detailLines)
    ? ev.detailLines.filter((text) => typeof text === "string" && text !== "")
    : null
  let next = state
  if (lines.length > 0) {
    const table = next.ledgerLines ?? {}
    const prev = table[ev.key]
    const same = Array.isArray(prev) && prev.length === lines.length
      && prev.every((line, index) => line.text === lines[index].text && line.warn === lines[index].warn)
    if (!same) next = { ...next, ledgerLines: { ...table, [ev.key]: lines } }
  }
  if (detailLines !== null) {
    const prev = Array.isArray(next.ledgerDetail) ? next.ledgerDetail : null
    const same = prev !== null && prev.length === detailLines.length
      && prev.every((text, index) => text === detailLines[index])
    if (!same) next = { ...next, ledgerDetail: detailLines }
  }
  return next
}

/** 纯归约出口：`ev` = `{ channel, ...载荷 }`（载荷携 `key`）。未知通道 / 形不合 ⇒ 原引用（逐通道一写者 —— 含 `ev:queue`）。 */
export function reduce(state, ev, now = Date.now()) {
  const channel = typeof ev?.channel === "string" ? ev.channel : null
  if (channel === null) return state
  // 活动恢复即清（statusText —— VSC 同清单七时点；判据单源 = `events-status.mjs` `expireStatusText` + 本档 `isTurnTail`）
  state = expireStatusText(state, channel, ev, isTurnTail(ev))
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
 *  `pool.approval` 随摘项重算；列表清空 ⇒ 顺带清本会话 `approval` 位标（待审批位标 = 有项才亮）。
 *  位标键源 = `activeSession`（与置位标源 `ev.key` 不同源 —— 见 `onApproval` 注 · 缺口随 §5 登记）。
 *  未命中 `promptId` ⇒ 原引用（幂等 —— 重复回执不二次摘除）。 */
export function clearApproval(state, promptId) {
  const approvals = poolOf(state).approvals
  const remaining = approvals.filter((entry) => entry?.promptId !== promptId)
  if (remaining.length === approvals.length) return state
  const next = withPool(state, { approvals: remaining })
  if (remaining.length > 0) return next
  const cleared = badgeStamps(next.tabBadges ?? {}, next.activeSession, "approval", false)
  return cleared.changed ? { ...next, tabBadges: cleared.badges } : next
}
