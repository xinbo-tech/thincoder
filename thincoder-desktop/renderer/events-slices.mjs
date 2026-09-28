/**
 * events-slices.mjs — 读数与切片归约径（自 `renderer/events.mjs` 拆出——#510 留守拆档 · 2026-09-29；
 * 该档越 300 层按面续拆）。迁入面 = 读数槽族（`withReading` / `tokenReading` / `timerReading` /
 * `onUsage`）+ 项目级与目标切片（`onGoal` / `GOAL_STATUS`）+ 队列镜面（`onQueue`）+ 台账两切片
 * （`onLedger`）。本档零反向 import（无环——`reduce` 分派面与余下通道归约体住 `events.mjs`）。
 * 纯结构搬移零语义（判据 / 注文逐字同源档）——形态单源 = `docs/desktop/design/RENDERER.md` §1.1
 * ∕ `docs/desktop/design/IPC.md` §1；切片纪律（「未至 / 非数 / 非正 ⇒ 零写 —— 禁假造」）见各归约体。
 */
import { appendBlock, returnToBottom, setAttachDegraded } from "./store.mjs"
import { applyQueue } from "./queue.mjs"
import { sameRecord } from "./events-flags.mjs"

/** 读数槽写（R3a 状态行读数槽通用形）：`value` 非 `null` ⇒ 首写自种 / 同键同值原引用 / 否就地替换；`value === null` ⇒ **清本键**（载荷缺省 / 形非法 ⇒ 该段零节点 —— `docs/desktop/design/IPC.md` §1「两键缺省 ⇒ 零节点」，禁假造）。 */
export function withReading(table, key, value) {
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
export function onUsage(state, ev) {
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
export function onGoal(state, ev) {
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
export function onQueue(state, ev) {
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

/** `ev:ledger`——台账两切片（「对齐第三批」项 12 · KD-38；**R8 增 `detailLines`**）：载荷 `{ key, lines?, detailLines? }`——
 *  `lines` = 核行产逐字 `{ text, warn }`（端侧零行构造）；行集过滤后非空才写（行文本非串 / 空 ⇒ 该行弃；空集 ⇒ 零写——禁假造）；
 *  同值（文本逐字 + `warn` 真值同）⇒ 原引用（零重绘）。`detailLines`（R8 · L2 明细行——状态行台账段 `title` 载波）= 核
 *  `detailScans` ∕ `formatDetailLine` 行集逐字（端零行构造）；**顶层切片 `ledgerDetail`**（项目级——与状态行台账段同锚，
 *  不按会话键）；空集照写（清 tooltip——禁假造）；同值 ⇒ 原引用。两键皆无 ⇒ 原引用。
 *  消费 = 流尾非块节点组 `[data-ledger-line]`（`renderer/views/chat.mjs`）+ 状态行台账段 tooltip（`views/statusline-segments.mjs`）；
 *  周期刷新（VSC `REFRESH_MS`）= R8 落（核拍面 —— `src/main/project-info.mjs`）。 */
export function onLedger(state, ev) {
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
