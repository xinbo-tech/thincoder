/**
 * events.mjs — 渲染面事件归约核心（七通道写切片 · 批档 §2.2(e) / §2.11⑧ · `docs/desktop/design/IPC.md` §1）：
 * 切片写者的**单源**——主进程只产事件 / 回执，值面落树全在本档；订阅接线面出档 `renderer/events-subscribe.mjs`
 * （九通道表 · `attachEvents` · 回合尾标题刷新 —— 300 行拆分层落形，批档 §5 登记）。
 *
 * 导出面六（`docs/desktop/design/RENDERER.md` §1.1 事件归约面条 —— 订阅接线一发已拆出同源档）：
 *   `reduce(state, ev, now)`   纯归约（零 DOM / 零 IPC ⇒ 平 node 直测）；无变化 ⇒ **原引用**
 *   `applyPage(state, receipt, { key, before })`  页回执 → 首屏 / 回填两径（失败径 = 清在途）
 *   `blockOfMessage(msg)`      核 message → 块（五型闭集 `user|assistant|reasoning|tool|error`，决策 D8-8）
 *   `openSession(state, key)`  `activeSession` 写者（置键 / `null` 关页 + 清本键 `done` 位标）
 *   `clearApproval(state, promptId)`  出站成功后摘项（写者表隐含 —— 见 §2.11⑦；调用面 = `renderer/mount-pool.mjs`）
 *   `isTurnTail(ev)`           回合尾判据**单源**（`onActivity` 与订阅面 `events-subscribe.mjs` 同用此判据）
 *
 * 纪律：块面写（`blocks` ∧ `pool.blocks`）须 `ev.key === state.activeSession`（否则原引用 —— 非活动会话的事件不落本会话流）；
 *   `tabBadges` 任意键可写 · `sessionMeta` 按 key 写（§2.2(e) 值面写者表）· `pool.approvals` 无会话键维度
 *   （写者 = `ev:approval`，不按会话分池 —— 设计未给池的会话键口径，缺口随 §5 登记）；文案零硬编码（本档不出词）。
 * 活块 / 页块两面差异（决策 D8-8）：页块**不落** `status` / `durationMs`（活块有），键集一致性判据 = 五型闭集。
 */
import { appendBlock, endBackfill } from "./store.mjs"

/** 活流块 id 派生前缀（页块 id 域 = 核给（工具 id）/ 缺省无 —— 两域不混）。 */
const LIVE_ID = "live-"
/** 位标码闭集（`running` / `approval` / `done` —— §2.2(e) 值面写者表）；闭集外码 = 内部误用 ⇒ fail-loud。 */
const BADGES = ["running", "approval", "done"]
/** 会话头字段白名单（`thincoder-desktop/renderer/views/chrome.mjs:8-9` 判据：非串 / 空串 ⇒ 零节点）。 */
const META_FIELDS = ["provider", "model", "effort", "engineering", "autoApprove"]
/** 审批池条目键白名单（零新键 —— 消费面 `views/approval.mjs` / `views/activity.mjs` 读取集）。 */
const APPROVAL_KEYS = ["promptId", "shape", "tool", "argsSummary", "changes", "batch"]
// ─── 内部读面 ────────────────────────────────────────────────────────────────

/** 池切片（缺省槽位 —— 防御读；不造键）。 */
function poolOf(state) {
  return state.pool ?? { running: 0, approval: 0, blocks: [], queue: [], approvals: [] }
}

/** 元数判据（`views/activity.mjs` `readingOf` 同形：非数 ⇒ 零节点）。 */
function countRunning(entries) {
  return entries.filter((entry) => entry?.status === "running").length
}

/** 池写（`blocks` / `approvals` 两支 —— 两读数随时重算，`queue` 本批零写者）。 */
function withPool(state, { blocks, approvals }) {
  const pool = poolOf(state)
  const nextBlocks = blocks ?? pool.blocks
  const nextApprovals = approvals ?? pool.approvals
  return {
    ...state,
    pool: { ...pool, blocks: nextBlocks, approvals: nextApprovals, running: countRunning(nextBlocks), approval: nextApprovals.length },
  }
}

/** 位标写（码闭集按会话键维护；值等 ⇒ 原对象 —— `tabBadges` 引用不变 ⇒ 零通知）。 */
function badgeStamps(badges, key, code, present) {
  if (!BADGES.includes(code)) throw new Error(`[events] badge code outside closed set: ${code}`)
  const current = Array.isArray(badges[key]) ? badges[key] : []
  const next = present
    ? (current.includes(code) ? current : [...current, code])
    : current.filter((item) => item !== code)
  if (next === current) return { badges, changed: false }
  if (next.length === current.length && next.every((item, index) => item === current[index])) {
    return { badges, changed: false }
  }
  return { badges: { ...badges, [key]: next }, changed: true }
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

// ─── 纯归约（九通道 → 切片）──────────────────────────────────────────────────

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

/** `ev:tool-call`——工具块入（活块形 = 池条目形**同源异形**：活块 `{kind,id,name,argsSummary,status,startedAt}` ·
 *  池条目 `{id,tool,status}`（消费面 `views/activity.mjs` 读取集））。 */
function onToolCall(state, ev, now) {
  if (!forActive(state, ev)) return state
  const block = { kind: "tool", id: ev.id, name: ev.name, argsSummary: ev.argsSummary, status: "running", startedAt: now }
  const next = appendBlock(state, block)
  return withPool(next, { blocks: [...poolOf(state).blocks, { id: ev.id, tool: ev.name, status: "running" }] })
}

/** `ev:tool-output`——结果文本累积入该工具块 `result`（无匹配块 ⇒ 零写）。 */
function onToolOutput(state, ev) {
  if (!forActive(state, ev)) return state
  const blocks = state.blocks ?? []
  const index = indexOfTool(blocks, ev.id)
  if (index < 0) return state
  const chunk = typeof ev.chunk === "string" ? ev.chunk : ""
  if (chunk === "") return state
  const block = blocks[index]
  const result = typeof block.result === "string" ? block.result + chunk : chunk
  return { ...state, blocks: [...blocks.slice(0, index), { ...block, result }, ...blocks.slice(index + 1)] }
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
  const next = { ...state, blocks: [...blocks.slice(0, index), settled, ...blocks.slice(index + 1)] }
  const entries = poolOf(state).blocks.map((entry) =>
    (entry?.id === block.id ? { ...entry, status: settled.status } : entry))
  return withPool(next, { blocks: entries })
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

/** 回合尾判据**单源**（通道 `ev:activity` ∧ `fields` 键**不在场** ∧ `event ∈ {done, stopped}` —— §2.16②/④）：
 *  值面 `onActivity` 与订阅面（回合尾 ⇒ 标题刷新）同用此判据 —— 判据串不双写。
 *  判据按**键在场**判（设计字面 —— `IPC.md:31`「`fields` 键在场 ⇒ 内联形」），非按值：内联形的 `fields` 值可为
 *  `null`（核 ⟦ev⟧ 段无分隔符，`src/main/agent-host.mjs` 落 `?? null`）或串 —— 两者皆属内联形 ⇒ 零回合尾。 */
export function isTurnTail(ev) {
  if (ev?.channel !== "ev:activity" || "fields" in ev) return false
  return ev.event === "done" || ev.event === "stopped"
}

/** `ev:activity` 三形（§2.16② 写死）：
 *  ① `fields` 在场 ⇒ 内联形（核 token 流内 ⟦ev⟧ 段）⇒ **零写零重调**（内联 `done` ⇒ 不清位标）；
 *  ② 无 `fields` ∧ `event === "turn"`（`{ n, max }`）⇒ 置 `running`（`n` / `max` 无槽 ⇒ 不落，禁造键）；
 *  ③ 无 `fields` ∧ `isTurnTail` ⇒ **唯一回合尾**（去 `running` + 置 `done`）。 */
function onActivity(state, ev) {
  if ("fields" in ev) return state
  if (!isTurnTail(ev)) {
    if (ev.event !== "turn") return state
    const stamps = badgeStamps(state.tabBadges ?? {}, ev.key, "running", true)
    return stamps.changed ? { ...state, tabBadges: stamps.badges } : state
  }
  const cleared = badgeStamps(state.tabBadges ?? {}, ev.key, "running", false)
  const marked = badgeStamps(cleared.badges, ev.key, "done", true)
  if (!cleared.changed && !marked.changed) return state
  return { ...state, tabBadges: marked.badges }
}

/** `ev:error`——错误块入流（文本 = 载荷 `message` 原样；无槽位自造）。 */
function onError(state, ev) {
  if (!forActive(state, ev)) return state
  return appendBlock(state, { kind: "error", text: ev.message })
}

/** 纯归约出口：`ev` = `{ channel, ...载荷 }`（载荷携 `key`）。未知通道 / 形不合 ⇒ 原引用。 */
export function reduce(state, ev, now = Date.now()) {
  const channel = typeof ev?.channel === "string" ? ev.channel : null
  if (channel === null) return state
  switch (channel) {
    case "ev:token": return onToken(state, ev)
    case "ev:tool-call": return onToolCall(state, ev, now)
    case "ev:tool-output": return onToolOutput(state, ev)
    case "ev:tool-result": return onToolResult(state, ev, now)
    case "ev:approval": return onApproval(state, ev)
    case "ev:activity": return onActivity(state, ev)
    case "ev:error": return onError(state, ev)
    case "ev:question":
    case "ev:task": return state
    default: return state
  }
}

// ─── 页应用（回执 → 首屏 / 回填两径）────────────────────────────────────────

/** `meta` 五值**只落非空串**（名单与 `views/chrome.mjs` 同名 —— 数据面原样，非词表）；全缺 ⇒ `{}`。 */
function metaOf(meta) {
  const out = {}
  for (const field of META_FIELDS) {
    const value = meta?.[field]
    if (typeof value === "string" && value !== "") out[field] = value
  }
  return out
}

/** 页回执应用（`docs/desktop/design/IPC.md` §2 `history:page` 定形）：`{ ok, messages, hasOlder, next, meta }`。
 *  `ok !== true` ⇒ **清在途**（成败皆清 —— finally 语义）且不写其余切片；
 *  `key !== activeSession` ⇒ 跳块 / 历史写（`sessionMeta[key]` 仍写）；
 *  首屏（`before == null`）⇒ 块整置 + 回底（`following = true` / `pendingNew = 0`；空页同径）；
 *  回填 ⇒ 前插 + `history` 落态（`hasOlder === false ⇒ next = null`；高度补偿归 `settleFrame` 六步既有）。 */
export function applyPage(state, receipt, { key, before } = {}) {
  if (receipt?.ok !== true) return endBackfill(state)
  const meta = metaOf(receipt.meta)
  const sessionMeta = { ...(state.sessionMeta ?? {}), [key]: meta }
  if (key !== state.activeSession) return { ...state, sessionMeta }
  const hasOlder = receipt.hasOlder === true
  const next = hasOlder ? (receipt.next ?? null) : null
  const history = { hasOlder, inFlight: false, page: next }
  const messages = Array.isArray(receipt.messages) ? receipt.messages : []
  const page = messages.flatMap((msg) => blockOfMessage(msg))
  if (before == null) {
    return { ...state, blocks: page, sessionMeta, history, following: true, pendingNew: 0 }
  }
  return { ...state, blocks: [...page, ...(state.blocks ?? [])], sessionMeta, history }
}

// ─── 页 → 块归约（五型闭集）────────────────────────────────────────────────

/** 屏文本栏（核给 `string | null`；非串 ⇒ 空 —— 零节点判据归消费面）。 */
function textOf(value) {
  return typeof value === "string" ? value : null
}

/** 核 message / 内嵌 tool → 工具块（**不落** `status` / `durationMs` —— 决策 D8-8 两面差异）。 */
function toolBlock(tool) {
  const block = { kind: "tool", name: tool?.name ?? null }
  if (tool?.id !== undefined) block.id = tool.id
  block.argsSummary = textOf(tool?.args)
  block.result = tool?.result !== undefined ? textOf(tool.result) : textOf(tool?.text)
  return block
}

/** 核 message → 块数组（未知型 ⇒ `[]`；助手条目序 = `[assistant?, reasoning?, ...tools]`）。 */
export function blockOfMessage(msg) {
  const kind = msg?.kind
  if (kind === "user") return [{ kind: "user", text: textOf(msg.text) }]
  if (kind === "error") return [{ kind: "error", text: textOf(msg.text) }]
  if (kind === "tool") return [toolBlock(msg)]
  if (kind !== "assistant") return []
  const blocks = []
  const text = textOf(msg.text)
  if (text !== null && text !== "") blocks.push({ kind: "assistant", text })
  const reasoning = textOf(msg.reasoning)
  if (reasoning !== null && reasoning !== "") blocks.push({ kind: "reasoning", text: reasoning })
  const tools = Array.isArray(msg.tools) ? msg.tools : []
  for (const tool of tools) blocks.push(toolBlock(tool))
  return blocks
}

// ─── 会话键写者（`activeSession`）──────────────────────────────────────────

/** 开页 / 关页（§2.2(e) 值面写者行）：置 `activeSession` + 清本键 `done` 位标（激活即已读）；
 *  关页（`key == null`）⇒ `null`。**不清** `blocks` / `history`（页数据随 `history:page` 回执整置）。 */
export function openSession(state, key) {
  const next = key == null ? null : String(key)
  const cleared = next === null ? { badges: state.tabBadges ?? {}, changed: false } : badgeStamps(state.tabBadges ?? {}, next, "done", false)
  if (next === state.activeSession && !cleared.changed) return state
  return cleared.changed
    ? { ...state, activeSession: next, tabBadges: cleared.badges }
    : { ...state, activeSession: next }
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
