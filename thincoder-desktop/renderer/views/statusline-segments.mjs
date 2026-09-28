/**
 * statusline-segments.mjs — 状态行**段构建器族**出档（R4 · 桌面功能对位批：`renderer/views/statusline.mjs` 届盘 295 ⇒
 * 越 300 顾问线（本批增量 + 状态文本支）⇒ 按在册拆点「段构建器族（`numOf` … `enterSegment`）出档」先拆后改 ——
 * `docs/batches/2026-09-28-desktop-feature-parity.md` §2 修正 2 越层档表）。原族**逐字搬运**（零语义改）＋ R4 增量：
 * `stateSegment` 增**状态文本支**（五 kind 取值表 `statusTextOf`）。
 *
 * 构树归主档（`renderer/views/statusline.mjs`：`STATUS_SEGMENTS` 闭集序 / 段装配 / `segNode` / 树 / 薄挂载）；
 * 本档只持**段构建器**（切片 → 段模型 ∥ `null`）。依赖单向：主档 → 本档（无环）；本档零 DOM / 零 `node:` / 零裸包。
 *
 * 段构建判据（逐段）与数据源 = 主档档头（不重述）；本档逐函数注释只记**该段自身**判据。
 * 承载段序（主档装配序）与本档函数一一对应：`attention` / `state`（含 R4 状态文本支）/ `tool` / `elapsed` /
 * `tasks` / `turn` / `tokens` / `context` / `ledger` / `timer` / `title` / `enter`。
 */
import { t } from "../i18n.mjs"

/** 读数警示阈（数值单源 = `docs/desktop/design/UI.md` §1 状态栏行「≥ 80% 转警示色」）。 */
const USAGE_WARN = 80

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
export function badgeCodes(badges, key) {
  const table = badges !== null && typeof badges === "object" ? badges : {}
  return key !== null && Array.isArray(table[key]) ? table[key] : []
}

/** 段 2 · 注意力提示（blocked —— 活动键位标含 `approval` 码；awaiting 旁置 = 完成位标 + 输入区可用同义判据）。 */
export function attentionSegment(codes) {
  if (!codes.includes("approval")) return null
  return { code: "attention", warn: true, parts: [{ text: t("status.attention.blocked") }] }
}

/** 段 3 · 挂起句（态机支① —— 挂起窗在场；N/M 映射与取词链单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1 表行 3 ·
 *  `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」）：N = `running + queued`（主体句 = `susp.running`）·
 *  M = `pending + done`（附句 = `susp.digesting`）；取词链 = N > 0 ⇒ `susp.running`〔M > 0 ⇒ 附 `susp.digesting`〕·
 *  N = 0 ∧ M > 0 ⇒ `susp.digesting` · N = 0 ∧ M = 0 ⇒ `susp.winding`（值 zh = CLI 逐字 ∥ en = VSC 逐字；
 *  ` · ` 分隔 = VSC `status-bar.js:58` 同式）。 */
function suspSegment(record) {
  const n = numOf(record.running) + numOf(record.queued)
  const m = numOf(record.pending) + numOf(record.done)
  const text = n > 0
    ? t("susp.running", { n }) + (m > 0 ? ` · ${t("susp.digesting", { n: m })}` : "")
    : m > 0 ? t("susp.digesting", { n: m }) : t("susp.winding")
  return { code: "state", parts: [{ text }] }
}

/** 状态文本 **kind 五值表**（R4 · 状态面 —— 五 kind 表单源 = VSC `webview/status-bar.js:101-112`；
 *  词面：四 kind（rateWait ∕ rateLimited ∕ overloaded ∕ quota）= 核 `provider/wait-status.mjs` `status.*` 键经核字典
 *  投影 `t()` 直取（**零自铸词**）· `index` 两形 = VSC locales 逐字（宿主表两键 `status.indexScan` ∕ `status.indexProgress`）；
 *  缺值回落 `?` / `""` 沿 VSC 同式；未知 kind / 非载体 ⇒ `null`（**不渲染** —— 禁假造）。 */
function statusTextOf(slice) {
  if (slice === null || typeof slice !== "object") return null
  switch (slice.kind) {
    case "rateWait": return t("status.rateWait", { s: slice.seconds ?? "?" })
    case "rateLimited": return t("status.rateLimited", { s: slice.seconds ?? "?" })
    case "overloaded": return t("status.overloaded", { s: slice.seconds ?? "?" })
    case "quota": return t("status.quota", { msg: slice.message ?? "" })
    case "index": return slice.phase === "index"
      ? t("status.indexProgress", { done: slice.done ?? "?", total: slice.total ?? "?" })
      : t("status.indexScan", { n: slice.total ?? "?" })
    default: return null
  }
}

/** 段 3 · 状态文本**态机**（优先序 ① > ② > 状态文本 > ③ > ④ —— 单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1 表行 3；
 *  **R4 增状态文本支**（五 kind —— 表 = `statusTextOf`；支自 `statusText[<会话键>]` 切片））：
 *  ① 挂起窗在场（`susp[<会话键>].active` 严格真）⇒ 挂起句；② 位标含 `approval` ∧ 位标不含 `running` ⇒ **段零节点**
 *  （承载 = 注意力 chip——不重复）；③ 状态文本切片在场 ∧ 表内 kind ⇒ 表文（比值③忙词更具体的活读数）；④ 忙（位标含 `running`）
 *  ⇒ 运行中（核 i18n 同源键 `sub.running`）；⑤ 其余 ⇒ 就绪（词键 `status.ready` —— 词形来源 = CLI 静息值 `Ready`）。
 *  **交叠角落**（`approval` ∧ ¬`running` ∧ 挂起窗在场）⇒ 取①（chip 照常承载审批——两事实不同面，零重复）；
 *  `active` 非严格真（缺 / 假 / 非布尔）⇒ 不落①（`active=false` ⇒ 回落两态词 —— 禁假造）。 */
export function stateSegment(codes, suspRecord, statusSlice) {
  if (suspRecord?.active === true) return suspSegment(suspRecord)
  if (codes.includes("approval") && !codes.includes("running")) return null
  const statusText = statusTextOf(statusSlice)
  if (statusText !== null) return { code: "state", parts: [{ text: statusText }] }
  if (codes.includes("running")) return { code: "state", parts: [{ text: t("sub.running") }] }
  return { code: "state", parts: [{ text: t("status.ready") }] }
}

/** 段 4 · 当前工具（块面末位 `kind === "tool" ∧ status === "running"` 的 `name` —— 零新通道；无名块跳过，无命中 ⇒ 零节点）。 */
export function toolSegment(blocks) {
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
export function elapsedSegment(codes, turnStarts, key, now) {
  if (!codes.includes("running")) return null
  const start = turnStarts !== null && typeof turnStarts === "object" ? turnStarts[key] : undefined
  if (typeof start !== "number" || !Number.isFinite(start)) return null
  const seconds = Math.max(0, Math.floor((now - start) / 1000))
  return { code: "elapsed", parts: [{ text: t("status.elapsed", { seconds }) }] }
}

/** 段 6 · 任务计数（`tasks[key]` 切片 —— 与计划卡同源；空列表 / 非数组 ⇒ 零节点；`done` 数按计划行状态词口径）。 */
export function tasksSegment(tasks, key) {
  const list = tasks !== null && typeof tasks === "object" ? tasks[key] : undefined
  if (!Array.isArray(list) || list.length === 0) return null
  const done = list.filter((item) => item?.status === "done").length
  return { code: "tasks", parts: [{ text: t("status.tasks", { done, total: list.length }) }] }
}

/** 段 7 · 回合 N/M（归约槽 `turns[key]` —— `ev:activity` turn 载荷 `{ n, max }`；两值皆正整数才落，缺 / 非法 ⇒ 零节点）。
 *  入词**按核键占位名**（`thincoder-core/i18n.mjs` `status.turn` = `turn ${n}/${m}` —— 词形单源，桌面不另立同义键）。 */
export function turnSegment(turns, key) {
  const row = turns !== null && typeof turns === "object" ? turns[key] : undefined
  if (!Number.isInteger(row?.n) || row.n <= 0 || !Number.isInteger(row?.max) || row.max <= 0) return null
  return { code: "turn", parts: [{ text: t("status.turn", { n: row.n, m: row.max }) }] }
}

/** 段 8 · 令牌（`tokens[key]` —— 会话累计；`prompt ≤ 0` ⇒ 整段零节点；✦ / hit 两件按各自非正判据缺席）。 */
export function tokensSegment(tokens, key) {
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
export function contextSegment(usage, key) {
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

/** 段 11 · 台账标记（**只承超阈警示位** —— `projectInfo.thresholdReached` 严格真；R8 增 L2 明细行**载波** = 段
 *  `title`（tooltip 面 —— VSC `ledger-surface.mjs:69` 对位；行文本核产逐字 ∕ 端零行构造；空集 ⇒ 零 title）。 */
export function ledgerSegment(projectInfo, detailLines) {
  if (projectInfo?.thresholdReached !== true) return null
  const details = Array.isArray(detailLines) ? detailLines.filter((text) => typeof text === "string" && text !== "") : []
  return {
    code: "ledger",
    warn: true,
    ...(details.length > 0 ? { attrs: { title: details.join("\n") } } : {}),
    parts: [{ text: t("info.threshold") }],
  }
}

/** 段 12 · 计时（`timers[key]` —— 核 `_pendingTimers` 活读投影；非正 / 非数 ⇒ 零节点；到期未送达 ⇒ 警示）。 */
export function timerSegment(timers, key) {
  const row = timers !== null && typeof timers === "object" ? timers[key] : undefined
  if (row === null || typeof row !== "object") return null
  const count = row.count
  if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) return null
  return { code: "timer", warn: numOf(row.expired) > 0, parts: [{ text: t("status.timer", { count }) }] }
}

/** 段 13 · 会话标题（活动会话行 —— 与标签条 / 左列同源同投影：标题空 ⇒ 词表缺省词；无行 ⇒ 零节点）。 */
export function titleSegment(sessions, key) {
  const list = Array.isArray(sessions) ? sessions : []
  const hit = list.find((row) => row !== null && typeof row === "object" && String(row.slot) === key)
  if (hit === undefined) return null
  const word = typeof hit.title === "string" && hit.title !== "" ? hit.title : t("rail.session.untitled")
  return { code: "title", parts: [{ text: word }] }
}

/** 段 14 · 输入提示三态（表行 14 · 「对齐第二批」项 2 · **「回合中插入」批收正**：**源 = 本会话队快照镜面**
 *  —— `pending[活动会话键]`；权威 = 宿主，渲染面 = 镜面；右列队列族不再承载用户排队消息）：
 *  队 ≥ 1 ⇒ 条数句 · 忙 ∧ 队空 ⇒ Enter 排队句 · 静 ⇒ `Enter: send`（词键
 *  `status.enter.send` —— 对位 CLI enterHint 静息值；静息态恒在场 = 打开态可亮面）。 */
export function enterSegment(pending, key, codes) {
  const queue = key !== null && pending !== null && typeof pending === "object" && Array.isArray(pending[key]) ? pending[key] : []
  if (queue.length > 0) return { code: "enter", parts: [{ text: t("status.queue.n", { n: queue.length }) }] }
  if (codes.includes("running")) return { code: "enter", parts: [{ text: t("status.queue.enter") }] }
  return { code: "enter", parts: [{ text: t("status.enter.send") }] }
}
