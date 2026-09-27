/**
 * statusline.mjs — 状态行族档（D17 · `docs/desktop/design/UI.md` §1 状态栏行 / §1「本批注（对齐重定位）」项 1 ·
 * `docs/desktop/design/PROJECT.md` §2 KD-25 / §6.1 D17）：**承载 12 段**构树单源（CLI 段集对位 =
 * `thincoder-cli/src/tui/render-frame.mjs:344` 起 `buildStatusLine`）；自 `renderer/views/chrome.mjs` 拆出
 * （300 行拆分层预案落形 —— `docs/desktop/design/PROJECT.md` §4.2 状态行族档），`chrome.mjs` 同名再出口（消费面零改）。
 *
 * 15 段逐项裁定（单源 = `docs/desktop/design/UI.md` §1 本批注项 1；**零静默省略**）：承载 12 = `STATUS_SEGMENTS`
 * （序同 CLI）· 旁置 2 = banner（AUTO / ENG 住会话头 · PLAN / ADVISOR 本端无该两态）· 滚动位（药丸 / 摘要块承载）·
 * 不适用 1 = 键位组（输入区 / 标签条自述）——**后三段在本档零字段 ⇒ 零节点**（不造空段）。
 * 承载段数据源（逐段）：`attention` = 活动键位标含 `approval` 码（审批 / 提问两门同码）· `busy` = 位标 `running` ·
 * `tool` = 块面末位 running 工具块的 `name` · `elapsed` = 回合起刻（`turnStarts[key]` → 现刻）· `tasks` = `tasks[key]` ·
 * `turn` = 归约槽 `turns[key]` `{ n, max }` · `tokens` = `tokens[key]`（`↑↓` / `✦` / `hit%`）· `context` = `usage[key]` ·
 * `ledger` = `projectInfo.thresholdReached`（**只承超阈警示位** —— 计数住左列信息行）· `timer` = `timers[key]` `{ count, expired }` ·
 * `title` = 活动会话行标题（与标签条 / 左列**同源** —— `sessions:list` 行）· `queue` = `pool.queue` 队长 + 忙态。
 * 判据（D17 · KD-25）：**未至 / 非正 / 缺片 ⇒ 该段零节点**（禁假造）；段锚 = `data-seg`（闭集 = `STATUS_SEGMENTS`）·
 * 段内件锚 = `data-part`（令牌三件）；跨会话告警位（非活动标签的待审批 / 运行提示）沿既有面（`data-alert` —— 非 15 段之一）。
 * 形态：纯构树（`statusModel` → 态对象 · `statusTree` → 结构描述符树）+ 薄挂载（`mountStatus` = clear + build + append ——
 * **单点重建 = 状态行唯一 writer**，`docs/desktop/design/UI.md` §1 状态栏行）；文案一律经 `t()`（零硬编码）。
 * 零 DOM（挂载一段除外）/ 零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { deriveTabBadge } from "../store.mjs"
import { BADGE_WORD } from "./sessions.mjs"

/** 承载 12 段（闭集 · 序 = CLI 序 —— 单源 = `docs/desktop/design/UI.md` §1 本批注项 1；旁置 2 / 不适用 1 不在本集）。 */
export const STATUS_SEGMENTS = Object.freeze([
  "attention", "busy", "tool", "elapsed", "tasks", "turn", "tokens", "context", "ledger", "timer", "title", "queue",
])

/** 读数警示阈（数值单源 = `docs/desktop/design/UI.md` §1 状态栏行「≥ 80% 转警示色」）。 */
const USAGE_WARN = 80

/** 告警码集（状态栏取值 = 三码中入告警的子集；`done` / `idle` 不入 —— 完成 / 空闲非跨会话告警面）。 */
const ALERT_CODES = Object.freeze(["approval", "running"])

/** 非数归一（核 ∥ 载荷缺键的兜底读数 = 0 —— 零抛；「非正 ⇒ 零节点」判据归各段）。 */
function numOf(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

/** 计数缩写（CLI 同形 = `thincoder-cli/src/tui/render-frame.mjs:384` `fmtK`：≥ 10k ⇒ 整数 k · ≥ 1k ⇒ 一位小数 k）。 */
function fmtK(n) {
  if (n >= 10000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${n}`
}

/** 位标码集（本键 · 非数组 ⇒ 空集 —— 与 `views/chrome.mjs` 告警面同判据）。 */
function badgeCodes(badges, key) {
  const table = badges !== null && typeof badges === "object" ? badges : {}
  return key !== null && Array.isArray(table[key]) ? table[key] : []
}

/** 段 2 · 注意力提示（blocked —— 活动键位标含 `approval` 码；awaiting 旁置 = 完成位标 + 输入区可用同义判据）。 */
function attentionSegment(codes) {
  if (!codes.includes("approval")) return null
  return { code: "attention", warn: true, parts: [{ text: t("status.attention.blocked") }] }
}

/** 段 3 · 状态词（活动会话忙态 —— 词出状态词闭枚举「运行中」，核 i18n 同源键 `sub.running`）。 */
function busySegment(codes) {
  if (!codes.includes("running")) return null
  return { code: "busy", parts: [{ text: t("sub.running") }] }
}

/** 段 4 · 当前工具（块面末位 `kind === "tool" ∧ status === "running"` 的 `name` —— 零新通道；无名块跳过，无命中 ⇒ 零节点）。 */
function toolSegment(blocks) {
  const list = Array.isArray(blocks) ? blocks : []
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const block = list[index]
    if (block?.kind !== "tool" || block.status !== "running") continue
    const name = typeof block.name === "string" && block.name !== "" ? block.name : null
    if (name === null) continue
    return { code: "tool", parts: [{ text: t("status.tool", { name }) }] }
  }
  return null
}

/** 段 5 · 耗时（回合起刻 → 现刻；忙态 ∧ 起刻有效才落 —— 未至 / 非数 ⇒ 零节点；负差夹 0）。 */
function elapsedSegment(codes, turnStarts, key, now) {
  if (!codes.includes("running")) return null
  const start = turnStarts !== null && typeof turnStarts === "object" ? turnStarts[key] : undefined
  if (typeof start !== "number" || !Number.isFinite(start)) return null
  const seconds = Math.max(0, Math.floor((now - start) / 1000))
  return { code: "elapsed", parts: [{ text: t("status.elapsed", { seconds }) }] }
}

/** 段 6 · 任务计数（`tasks[key]` 切片 —— 与计划卡同源；空列表 / 非数组 ⇒ 零节点；`done` 数按计划行状态词口径）。 */
function tasksSegment(tasks, key) {
  const list = tasks !== null && typeof tasks === "object" ? tasks[key] : undefined
  if (!Array.isArray(list) || list.length === 0) return null
  const done = list.filter((item) => item?.status === "done").length
  return { code: "tasks", parts: [{ text: t("status.tasks", { done, total: list.length }) }] }
}

/** 段 7 · 回合 N/M（归约槽 `turns[key]` —— `ev:activity` turn 载荷 `{ n, max }`；两值皆正整数才落，缺 / 非法 ⇒ 零节点）。
 *  入词**按核键占位名**（`thincoder-core/i18n.mjs` `status.turn` = `turn ${n}/${m}` —— 词形单源，桌面不另立同义键）。 */
function turnSegment(turns, key) {
  const row = turns !== null && typeof turns === "object" ? turns[key] : undefined
  if (!Number.isInteger(row?.n) || row.n <= 0 || !Number.isInteger(row?.max) || row.max <= 0) return null
  return { code: "turn", parts: [{ text: t("status.turn", { n: row.n, m: row.max }) }] }
}

/** 段 8 · 令牌（`tokens[key]` —— 会话累计；`prompt ≤ 0` ⇒ 整段零节点；✦ / hit 两件按各自非正判据缺席）。 */
function tokensSegment(tokens, key) {
  const row = tokens !== null && typeof tokens === "object" ? tokens[key] : undefined
  if (row === null || typeof row !== "object") return null
  const prompt = numOf(row.prompt)
  if (prompt <= 0) return null
  const parts = [{ anchor: "updown", text: t("status.tokens", { up: fmtK(prompt), down: fmtK(numOf(row.completion)) }) }]
  const reasoning = numOf(row.reasoningTokens)
  if (reasoning > 0) parts.push({ anchor: "reasoning", text: t("status.tokens.reasoning", { tokens: fmtK(reasoning) }) })
  const hit = numOf(row.cacheHit)
  const miss = numOf(row.cacheMiss)
  if (hit + miss > 0) parts.push({ anchor: "hit", text: t("status.tokens.hit", { percent: Math.round((hit / (hit + miss)) * 100) }) })
  return { code: "tokens", parts }
}

/** 段 9 · 上下文 %（`usage[key]` 切片 —— 数字 ∧ `> 0` ⇒ 读数节点；读数域 0–100 整数直传，端零重算 · 零上界判）。 */
function contextSegment(usage, key) {
  const slice = usage !== null && typeof usage === "object" ? usage : {}
  const value = slice[key]
  if (typeof value !== "number" || !(value > 0)) return null
  return {
    code: "context",
    class: "status-usage",
    warn: value >= USAGE_WARN,
    attrs: { "data-usage": String(value) },
    parts: [{ text: t("status.usage", { percent: value }) }],
  }
}

/** 段 11 · 台账标记（**只承超阈警示位** —— `projectInfo.thresholdReached` 严格真；计数住左列信息行，不重复读数）。 */
function ledgerSegment(projectInfo) {
  if (projectInfo?.thresholdReached !== true) return null
  return { code: "ledger", warn: true, parts: [{ text: t("info.threshold") }] }
}

/** 段 12 · 计时（`timers[key]` —— 核 `_pendingTimers` 活读投影；非正 / 非数 ⇒ 零节点；到期未送达 ⇒ 警示）。 */
function timerSegment(timers, key) {
  const row = timers !== null && typeof timers === "object" ? timers[key] : undefined
  if (row === null || typeof row !== "object") return null
  const count = row.count
  if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) return null
  return { code: "timer", warn: numOf(row.expired) > 0, parts: [{ text: t("status.timer", { count }) }] }
}

/** 段 13 · 会话标题（活动会话行 —— 与标签条 / 左列同源同投影：标题空 ⇒ 词表缺省词；无行 ⇒ 零节点）。 */
function titleSegment(sessions, key) {
  const list = Array.isArray(sessions) ? sessions : []
  const hit = list.find((row) => row !== null && typeof row === "object" && String(row.slot) === key)
  if (hit === undefined) return null
  const word = typeof hit.title === "string" && hit.title !== "" ? hit.title : t("rail.session.untitled")
  return { code: "title", parts: [{ text: word }] }
}

/** 段 14 · 排队句（`pool.queue` 队长 + 忙态）：忙态 / 有队 ⇒ 在场（队 ≥ 1 ⇒ 条数句，否则 Enter 排队句）；两无 ⇒ 零节点。 */
function queueSegment(pool, codes) {
  const queue = pool !== null && typeof pool === "object" && Array.isArray(pool.queue) ? pool.queue : []
  const busy = codes.includes("running")
  if (!busy && queue.length === 0) return null
  const text = queue.length > 0 ? t("status.queue.n", { n: queue.length }) : t("status.queue.enter")
  return { code: "queue", parts: [{ text }] }
}

/** 状态行模型：`segments` = 承载 12 段在场集（序 = CLI 序；缺段不占位）· `alerts` = 跨会话告警位（非活动标签两码，序 = 标签序）。
 *  入参 = 切片面（缺 / 非载体 ⇒ 该段零节点）；`now` 可注入（耗时段现刻 —— 测试缝）。 */
export function statusModel({
  tabs = [], activeTab = null, badges = {}, usage = {}, sessions = [], pool = {},
  blocks = [], tasks = {}, turns = {}, turnStarts = {}, tokens = {}, timers = {}, projectInfo = null, now = Date.now(),
} = {}) {
  const list = Array.isArray(tabs) ? tabs : []
  const active = activeTab == null ? null : String(activeTab)
  const codes = badgeCodes(badges, active)
  const segments = active === null ? [] : [
    attentionSegment(codes),
    busySegment(codes),
    toolSegment(blocks),
    elapsedSegment(codes, turnStarts, active, now),
    tasksSegment(tasks, active),
    turnSegment(turns, active),
    tokensSegment(tokens, active),
    contextSegment(usage, active),
    ledgerSegment(projectInfo),
    timerSegment(timers, active),
    titleSegment(sessions, active),
    queueSegment(pool, codes),
  ].filter((segment) => segment !== null)
  const alerts = []
  for (const key of list) {
    if (String(key) === active) continue
    const code = deriveTabBadge(badgeCodes(badges, String(key)))
    if (ALERT_CODES.includes(code) && typeof BADGE_WORD[code] === "string") alerts.push({ tab: String(key), code })
  }
  return { alerts, segments }
}

/** 段节点（锚 = `data-seg` 码；警示 class 两形 —— `status-usage-warn` 沿既有面，`status-seg-warn` 为余段单形）。 */
function segNode(segment) {
  const warnClass = segment.class === "status-usage" ? "status-usage-warn" : "status-seg-warn"
  const props = {
    class: segment.class === undefined ? "status-seg" : segment.class,
    "data-seg": segment.code,
    ...(segment.attrs ?? {}),
  }
  if (segment.warn) props.class = `${props.class} ${warnClass}`
  return {
    tag: "span",
    props,
    children: segment.parts.map((part) => (part.anchor === undefined
      ? part.text
      : { tag: "span", props: { class: "status-part", "data-part": part.anchor }, children: [part.text] })),
  }
}

/** 跨会话告警节点（既有面 —— 词面 = 位标码词键，与标签位同源同词）。 */
function alertNode(alert) {
  return {
    tag: "span",
    props: { class: "status-alert", "data-alert": alert.code, "data-tab": alert.tab },
    children: [t(BADGE_WORD[alert.code])],
  }
}

/** 结构描述符树（根 `data-alerts` = 告警数；子序 = 承载段序 → 告警序）。 */
export function statusTree(model) {
  return {
    tag: "div",
    props: { class: "status-bar", "data-alerts": model.alerts.length },
    children: [...model.segments.map(segNode), ...model.alerts.map(alertNode)],
  }
}

/** 薄挂载（状态树切片 ⇒ 状态行；单点重建 —— 清容器再建，零残留）；返回模型（读数 / 走查面）。 */
export function mountStatus(root, state) {
  if (!root || typeof root.append !== "function") return null
  const model = statusModel({
    tabs: state?.tabs ?? [],
    activeTab: state?.activeTab ?? null,
    badges: state?.tabBadges ?? {},
    usage: state?.usage ?? {},
    sessions: state?.sessions ?? [],
    pool: state?.pool ?? {},
    blocks: state?.blocks ?? [],
    tasks: state?.tasks ?? {},
    turns: state?.turns ?? {},
    turnStarts: state?.turnStarts ?? {},
    tokens: state?.tokens ?? {},
    timers: state?.timers ?? {},
    projectInfo: state?.projectInfo ?? null,
  })
  clear(root)
  root.append(build(statusTree(model)))
  return model
}
