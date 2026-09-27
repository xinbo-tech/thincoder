/**
 * events.mjs — 渲染面事件归约核心（十二通道写切片 · 批档 §2.2(e) / §2.11⑧ · `docs/desktop/design/IPC.md` §1）：
 * 切片写者的**单源**——主进程只产事件 / 回执，值面落树全在本档；订阅接线面出档 `renderer/events-subscribe.mjs`
 * （十二通道表 · `attachEvents` · 回合尾标题刷新 —— 300 行拆分层落形，批档 §5 登记）；问题 / 任务切片面
 * 出档 `renderer/questions.mjs`、位标面出档 `renderer/badges.mjs`（桌面残余批拆档产物——本档 500 行硬限
 * 顶格，在册拆分预案执行；`clearQuestion` 本档 re-export 保导出名面）。
 *
 * 导出面七（`docs/desktop/design/RENDERER.md` §1.1 事件归约面条 —— 订阅接线一发已拆出同源档）：
 *   `reduce(state, ev, now)`   纯归约（零 DOM / 零 IPC ⇒ 平 node 直测）；无变化 ⇒ **原引用**
 *   `applyPage(state, receipt, { key, before })`  页回执 → 首屏 / 回填两径（失败径 = 清在途）
 *   `blockOfMessage(msg)`      核 message → 块（五型闭集 `user|assistant|reasoning|tool|error`，决策 D8-8）
 *   `openSession(state, key)`  `activeSession` 写者（置键 / `null` 关页 + 清本键 `done` 位标）
 *   `clearApproval(state, promptId)`  出站成功后摘项（写者表隐含 —— 见 §2.11⑦；调用面 = `renderer/mount-pool.mjs`）
 *   `clearQuestion(state, key)`  提问出场 ⇒ 摘本键项 + 清本键 `approval` 位（两调用面 = 出站 `ok` 真 ∥ `stopped` 终局；
 *                              住 `renderer/questions.mjs`——本档 re-export 保名面）
 *   `isTurnTail(ev)`           回合尾判据**单源**（**三径** = `ev:activity` 无 `fields` 的 `done` / `stopped` ∥ `ev:error` —— `onActivity` / `onError` 与订阅面 `events-subscribe.mjs` 同用）
 *
 * 纪律：块面写（`blocks`）须 `ev.key === state.activeSession`（否则原引用 —— 非活动会话的事件不落本会话流）；
 *   `tabBadges` 任意键可写 · `sessionMeta` / `usage` / 卡面两切片（`questions` / `tasks`）按 key 写（切片同键就地替换 · 首写自种 · 零键门 —— 切回即见，单源 = `docs/desktop/design/RENDERER.md` §1.1 事件归约面条）（§2.2(e) 值面写者表）· 状态行读数槽四（`turns` / `turnStarts` /
 *   `tokens` / `timers`）同判（R3a · D17 承载段数据源）· `subBlocks` 按会话键分槽（R3b · D20 —— 块面零内容回显：
 *   态机单源 = 核 `/rc/subblocks/state.mjs` `subBlocksReduce`）· 池切片 **摘工具行**（`pool.blocks` 不再在册 ——
 *   工具调用面 = 对话流工具卡；折叠头 `running` 读数改源于活动会话在飞子 agent 块数）· `pool.approvals` 无会话键维度
 *   （写者 = `ev:approval`，不按会话分池 —— 设计未给池的会话键口径，缺口随 §5 登记）；文案零硬编码（本档不出词）。
 * 活块 / 页块两面差异（决策 D8-8）：页块**不落** `status` / `durationMs`（活块有），键集一致性判据 = 五型闭集。
 */
import { appendBlock, endBackfill } from "./store.mjs"
// 问题 / 任务切片面（桌面残余批拆档产物）：两归约体归 `reduce` 分派；`clearQuestion` 两调用面同源。
import { clearQuestion, onQuestion, onTask } from "./questions.mjs"
export { clearQuestion }
// 位标面单源（同批拆出——`events.mjs` 500 行硬限顶格）；本档 `onApproval` / `onActivity` / `onError` /
// `openSession` / `clearApproval` 与 `renderer/questions.mjs` 同引。
import { badgeStamps } from "./badges.mjs"
// 子 agent 块态机（R3b · D20）：核共享件（单源 = `docs/render-core/design/RENDER-CORE.md` §5 状态机族）——桌面经 `app://desktop/rc/**` 第二根取（同源 URL，非裸包：`test/guard-closure.test.mjs` `/rc/` 白名单）。
import { subBlocksReduce } from "/rc/subblocks/state.mjs"

/** 活流块 id 派生前缀（页块 id 域 = 核给（工具 id）/ 缺省无 —— 两域不混）。 */
const LIVE_ID = "live-"
/** 会话头字段白名单（`thincoder-desktop/renderer/views/chrome.mjs:8-9` 判据：非串 / 空串 ⇒ 零节点）。 */
const META_FIELDS = ["provider", "model", "effort", "engineering", "autoApprove"]
/** 审批池条目键白名单（零新键 —— 消费面 `views/approval.mjs` / `views/activity.mjs` 读取集）。 */
const APPROVAL_KEYS = ["promptId", "shape", "tool", "argsSummary", "changes", "batch"]
/** 子 agent 状态闭集（**单源** = `docs/render-core/design/RENDER-CORE.md` §5 token → patch 全表：核 relay 谱
 *  `started` / `queued` / `turn` / `done` / `settled` / `cancelled` —— `⟦ev⟧stopped` ⇒ `cancelled` 先例兼容 ·
 *  `error` 有意不载）；表外码 ⇒ **零写**（禁假造 —— 沿池面「表外码零节点」纪律）。 */
const SUB_STATUS = ["started", "queued", "turn", "done", "settled", "cancelled"]
/** `ev:subagent` 载荷键白名单（零新键 —— 核 patch 全表字段集：身份三 + 随行九）。 */
const SUB_KEYS = [
  "status", "role", "id", "model", "pool", "syncLive", "startedAt", "turn", "maxTurns",
  "kind", "position", "waiting", "reason", "was",
]
// ─── 内部读面 ────────────────────────────────────────────────────────────────

/** 池切片（缺省槽位 —— 防御读；不造键）。 */
function poolOf(state) {
  return state.pool ?? { running: 0, approval: 0, queue: [], approvals: [] }
}

/** 在飞块数（折叠头 `running` 读数源 —— 已终态折叠块不计；非数组 ⇒ 0）。 */
function liveCount(list) {
  return (Array.isArray(list) ? list : []).filter((block) => block?.frozen !== true).length
}

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

// ─── 纯归约（十二通道 → 切片）────────────────────────────────────

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
 *  助手文本段收束 —— 清点先于追加，两事不同块）。**R3b 摘工具行**：不再写池条目（工具调用面 = 对话流工具卡）。 */
function onToolCall(state, ev, now) {
  if (!forActive(state, ev)) return state
  const block = { kind: "tool", id: ev.id, name: ev.name, argsSummary: ev.argsSummary, status: "running", startedAt: now }
  return appendBlock(clearCursor(state), block)
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

// ─── 子 agent 块面（R3b · D20）─────────────────────────────────────────────

/** `ev:subagent` 载荷 → 核态机 patch（键白名单投影）；状态表外 / 身份缺 ⇒ `null` = **零写**（禁假造）。 */
function subPatchOf(ev) {
  if (typeof ev?.status !== "string" || !SUB_STATUS.includes(ev.status)) return null
  if (ev.role == null || ev.id == null) return null
  const patch = {}
  for (const field of SUB_KEYS) if (ev[field] !== undefined) patch[field] = ev[field]
  return patch
}

/** 归档面（D20 第三迁）：本会话块表清出**已终态**块（该会话下一次「回合起」—— 修既有池切片单调增长）；
 *  无可清 ⇒ **原表**（引用等值 ⇒ 零帧）。 */
function archiveFrozen(table, key) {
  const list = table?.[key]
  if (!Array.isArray(list)) return table
  const kept = list.filter((block) => block?.frozen !== true)
  return kept.length === list.length ? table : { ...table, [key]: kept }
}

/** 子 agent 面随动尾（subBlocks 写者共用）：块表 + 折叠头 `running` 读数（**活动会话**在飞块数 ——
 *  键非活动 ⇒ 读数不动；读数同值 ⇒ 池引用不动）。 */
function withSubBlocks(state, table, key) {
  const next = { ...state, subBlocks: table }
  if (key !== state.activeSession) return next
  const running = liveCount(table[key])
  const pool = poolOf(state)
  return pool.running === running ? next : { ...next, pool: { ...pool, running } }
}

/** `ev:subagent` —— 子 agent 块面（D20 单源 = `docs/desktop/design/UI.md` §1 本批注项 2）：按会话键写 `subBlocks`
 *  切片；态机**单源** = 核 `/rc/subblocks/state.mjs` `subBlocksReduce`（出生 / 接管 / 终态折叠三迁 —— 桌面端
 *  零 DOM：不注入 `connectedOf` / `regionOf`，效果表为零，本端全量重建）。块模型**原地变更**（核态机形）⇒
 *  每笔皆换切片数组引用（帧触发唯一判据 —— 同值短路在此不成立，随本件登记）。 */
function onSubagent(state, ev, now) {
  const key = typeof ev.key === "string" && ev.key !== "" ? ev.key : null
  const patch = key === null ? null : subPatchOf(ev)
  if (patch === null) return state
  const table = state.subBlocks ?? {}
  const list = [...(Array.isArray(table[key]) ? table[key] : [])]
  // 核态机 deps：`now` 为**读钟函数**（`state.mjs` 每迁现刻取值 —— 出生起刻 / 冻结 `doneAt`）。
  subBlocksReduce(list, patch, { now: () => now })
  return withSubBlocks(state, { ...table, [key]: list }, key)
}

/** 对象读数同值判（浅比 —— 键数 + 逐键 `Object.is`）：读数槽同值 ⇒ 原引用（零重绘）。 */
function sameRecord(a, b) {
  if (a === null || typeof a !== "object" || b === null || typeof b !== "object") return false
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((key) => Object.is(a[key], b[key]))
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

/** `ev:activity` 四形（§2.16② 写死）：① `fields` 在场 ⇒ 内联形（核 token 流内 ⟦ev⟧ 段）⇒ **零写零重调**（内联 `done` ⇒ 不清位标）；
 *  ② 无 `fields` ∧ `event === "turn"`（`{ n, max }`）⇒ 置 `running` + **回合槽**（`turns[key] = { n, max }`——D17 段 7，有意取代旧“不落”态）
 *  + **回合起刻**（`turnStarts[key] = now`——仅本键此前非 running 时落，即回合首帧；D17 段 5 耗时源）
 *  + **子 agent 块归档**（D20 第三迁：清本键已终态块 —— 修池切片单调增长）；
 *  ③ 无 `fields` ∧ `isTurnTail` ⇒ **唯一回合尾**（去 `running` + 置 `done`；`stopped` 兼摘本键提问项 + 清本键 `approval` 位 ——
 *  中断径各门按取消结算 ⇒ 卡随事件面出场；`done` 径不摘 —— `docs/desktop/design/RENDERER.md` §1.1）；
 *  **回合尾三径皆兼游标清点**（#459 ① 族 —— 尾块追加态结束 ⇒ 游标不得常驻；**键门同 `onError` / `onToolCall`** ——
 *  块面写须 `ev.key === state.activeSession`：非活动会话的回合尾只落位标，不动本会话块面）。 */
function onActivity(state, ev, now) {
  if ("fields" in ev) return state
  if (!isTurnTail(ev)) {
    if (ev.event !== "turn") return state
    // 归档（D20 第三迁）：该会话下一次「回合起」清出已终态块 + 折叠头 `running` 随动（基数 = 归档后表）。
    const archived = archiveFrozen(state.subBlocks, ev.key)
    const base = archived === state.subBlocks ? state : withSubBlocks(state, archived, ev.key)
    const badges = base.tabBadges ?? {}
    const wasRunning = Array.isArray(badges[ev.key]) && badges[ev.key].includes("running")
    const turnSlot = Number.isInteger(ev.n) && ev.n > 0 && Number.isInteger(ev.max) && ev.max > 0
      ? withReading(base.turns, ev.key, { n: ev.n, max: ev.max })
      : base.turns
    const starts = wasRunning ? base.turnStarts : { ...(base.turnStarts ?? {}), [ev.key]: now }
    const stamps = badgeStamps(badges, ev.key, "running", true)
    if (base === state && stamps.changed === false && turnSlot === base.turns && starts === base.turnStarts) return state
    return {
      ...base,
      ...(turnSlot === base.turns ? {} : { turns: turnSlot }),
      ...(starts === base.turnStarts ? {} : { turnStarts: starts }),
      ...(stamps.changed ? { tabBadges: stamps.badges } : {}),
    }
  }
  const tail = ev.event === "stopped" ? clearQuestion(state, ev.key) : state
  const cursor = forActive(state, ev) ? clearCursor(tail) : tail
  const cleared = badgeStamps(tail.tabBadges ?? {}, ev.key, "running", false)
  const marked = badgeStamps(cleared.badges, ev.key, "done", true)
  if (cursor === tail && tail === state && !cleared.changed && !marked.changed) return state
  return { ...cursor, tabBadges: marked.badges }
}

/** `ev:error`——错误块入流（文本 = 载荷 `message` 原样；无槽位自造）+ **错误径 = 回合结算**（三径同判据 —— `docs/desktop/design/RENDERER.md` §1.1）：
 *  本键 `running` 清 + 位落 `done`（错误终局后输入区不再判忙 · 队首可 flush —— `ok` 假 ∥ 抛 ⇒ 留队 + 下次回合尾重触发）+ **游标清点**（错误径 ∈ 三径）；位标键源 = `ev.key`（任意键可写），块面仍守键门。 */
function onError(state, ev) {
  const blocks = forActive(state, ev) ? clearCursor(appendBlock(state, { kind: "error", text: ev.message })) : state
  const cleared = badgeStamps(blocks.tabBadges ?? {}, ev.key, "running", false)
  const marked = badgeStamps(cleared.badges, ev.key, "done", true)
  if (!cleared.changed && !marked.changed) return blocks
  return { ...blocks, tabBadges: marked.badges }
}

/** 纯归约出口：`ev` = `{ channel, ...载荷 }`（载荷携 `key`）。未知通道 / 形不合 ⇒ 原引用。 */
export function reduce(state, ev, now = Date.now()) {
  const channel = typeof ev?.channel === "string" ? ev.channel : null
  if (channel === null) return state
  switch (channel) {
    case "ev:token": return onToken(state, ev)
    case "ev:reasoning": return onReasoning(state, ev)
    case "ev:tool-call": return onToolCall(state, ev, now)
    case "ev:tool-output": return onToolOutput(state, ev)
    case "ev:tool-result": return onToolResult(state, ev, now)
    case "ev:approval": return onApproval(state, ev)
    case "ev:activity": return onActivity(state, ev, now)
    case "ev:error": return onError(state, ev)
    case "ev:question": return onQuestion(state, ev)
    case "ev:task": return onTask(state, ev)
    case "ev:usage": return onUsage(state, ev)
    case "ev:subagent": return onSubagent(state, ev, now)
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

/** 页回执应用（`docs/desktop/design/IPC.md` §2 `history:page` 定形）：`{ ok, messages, hasOlder, next, meta, seed? }`。
 *  `ok !== true` ⇒ **清在途**（成败皆清 —— finally 语义）且不写其余切片；
 *  `key !== activeSession` ⇒ 跳块 / 历史写（`sessionMeta[key]` 仍写）；
 *  首屏（`before == null`）⇒ 块整置 + 回底（`following = true` / `pendingNew = 0`；空页同径）+ **打开态播种**
 *  （`seed` ⇒ `tasks[key]` / `usage[key]` 同笔——判据住 `seedPatch`）；
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
    return { ...state, ...seedPatch(state, key, receipt.seed), blocks: page, sessionMeta, history, following: true, pendingNew: 0 }
  }
  return { ...state, blocks: [...page, ...(state.blocks ?? [])], sessionMeta, history }
}

/** 首屏播种补丁（D17 · `docs/desktop/design/IPC.md` §2「打开态播种注」项 4）：`seed` 同笔写 `tasks[key]` /
 *  `usage[key]` 两切片（与 `meta` 同一写点）；**时序判据** = 本键在飞（回合未尾 ⇒ 位标含 `running`）
 *  ⇒ 种不落（**零写**——活切片为准）；`seed` 缺省 / 该槽形不合 ⇒ 该槽零写（禁假造）。 */
function seedPatch(state, key, seed) {
  if (seed === null || typeof seed !== "object") return {}
  if (Array.isArray(state.tabBadges?.[key]) && state.tabBadges[key].includes("running")) return {}
  const patch = {}
  if (Array.isArray(seed.tasks)) patch.tasks = { ...(state.tasks ?? {}), [key]: seed.tasks }
  if (typeof seed.usage === "number" && seed.usage > 0) patch.usage = { ...(state.usage ?? {}), [key]: seed.usage }
  return patch
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

/** 开页 / 关页（§2.2(e) 值面写者行）：置 `activeSession` + 清本键 `done` 位标（激活即已读）+ **折叠头 `running` 读数
 *  随活动键重算**（R3b：读数 = 本键在飞块数 —— 头（读数）与体（族）单源；键空 ⇒ 0；同值 ⇒ 池引用不动）。
 *  **不清** `blocks` / `history`（页数据随 `history:page` 回执整置）。 */
export function openSession(state, key) {
  const next = key == null ? null : String(key)
  const cleared = next === null ? { badges: state.tabBadges ?? {}, changed: false } : badgeStamps(state.tabBadges ?? {}, next, "done", false)
  if (next === state.activeSession && !cleared.changed) return state
  const base = cleared.changed
    ? { ...state, activeSession: next, tabBadges: cleared.badges }
    : { ...state, activeSession: next }
  const running = liveCount(next === null ? [] : state.subBlocks?.[next])
  const pool = poolOf(state)
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
